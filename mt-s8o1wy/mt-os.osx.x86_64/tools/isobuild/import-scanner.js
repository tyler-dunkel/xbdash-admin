var _typeof;module.import("babel-runtime/helpers/typeof",{"default":function(v){_typeof=v}});var _classCallCheck;module.import("babel-runtime/helpers/classCallCheck",{"default":function(v){_classCallCheck=v}});var assert;module.import("assert",{"default":function(v){assert=v}});var inspect;module.import("util",{"inspect":function(v){inspect=v}});var Script;module.import("vm",{"Script":function(v){Script=v}});var isString,isEmpty,has,keys,each,map,omit;module.import("underscore",{"isString":function(v){isString=v},"isEmpty":function(v){isEmpty=v},"has":function(v){has=v},"keys":function(v){keys=v},"each":function(v){each=v},"map":function(v){map=v},"omit":function(v){omit=v}});var sha1;module.import("../fs/watch.js",{"sha1":function(v){sha1=v}});var archMatches;module.import("../utils/archinfo.js",{"matches":function(v){archMatches=v}});var findImportedModuleIdentifiers;module.import("./js-analyze.js",{"findImportedModuleIdentifiers":function(v){findImportedModuleIdentifiers=v}});var cssToCommonJS;module.import("./css-modules.js",{"cssToCommonJS":function(v){cssToCommonJS=v}});var buildmessage;module.import("../utils/buildmessage.js",{"default":function(v){buildmessage=v}});var LRU;module.import("lru-cache",{"default":function(v){LRU=v}});var Profile;module.import("../tool-env/profile.js",{"Profile":function(v){Profile=v}});var SourceNode,SourceMapConsumer;module.import("source-map",{"SourceNode":function(v){SourceNode=v},"SourceMapConsumer":function(v){SourceMapConsumer=v}});var pathJoin,pathRelative,pathNormalize,pathDirname,pathBasename,pathExtname,pathIsAbsolute,convertToOSPath,convertToPosixPath;module.import("../fs/files.js",{"pathJoin":function(v){pathJoin=v},"pathRelative":function(v){pathRelative=v},"pathNormalize":function(v){pathNormalize=v},"pathDirname":function(v){pathDirname=v},"pathBasename":function(v){pathBasename=v},"pathExtname":function(v){pathExtname=v},"pathIsAbsolute":function(v){pathIsAbsolute=v},"convertToOSPath":function(v){convertToOSPath=v},"convertToPosixPath":function(v){convertToPosixPath=v}});var optimisticReadFile,optimisticStatOrNull,optimisticHashOrNull;module.import("../fs/optimistic.js",{"optimisticReadFile":function(v){optimisticReadFile=v},"optimisticStatOrNull":function(v){optimisticStatOrNull=v},"optimisticHashOrNull":function(v){optimisticHashOrNull=v}});var Resolver;module.import("./resolver.js",{"default":function(v){Resolver=v}});



















var fakeFileStat = {
  isFile: function isFile() {
    return true;
  },
  isDirectory: function isDirectory() {
    return false;
  }
};

// Default handlers for well-known file extensions.
// Note that these function expect strings, not Buffer objects.
var defaultExtensionHandlers = {
  ".js": function js(dataString) {
    // Strip any #! line from the beginning of the file.
    return dataString.replace(/^#![^\n]*/, "");
  },
  ".json": function json(dataString) {
    return "module.exports = " + JSON.stringify(JSON.parse(dataString), null, 2) + ";\n";
  },
  ".css": function css(dataString, hash) {
    return cssToCommonJS(dataString, hash);
  }
};

// This is just a map from hashes to booleans, so it doesn't need full LRU
// eviction logic.
var scriptParseCache = Object.create(null);

function canBeParsedAsPlainJS(dataString, hash) {
  if (hash && has(scriptParseCache, hash)) {
    return scriptParseCache[hash];
  }

  try {
    var result = !!new Script(dataString);
  } catch (e) {
    result = false;
  }

  if (hash) {
    scriptParseCache[hash] = result;
  }

  return result;
}

// Map from SHA (which is already calculated, so free for us)
// to the results of calling findImportedModuleIdentifiers.
// Each entry is an array of strings, and this is a case where
// the computation is expensive but the output is very small.
// The cache can be global because findImportedModuleIdentifiers
// is a pure function, and that way it applies across instances
// of ImportScanner (which do not persist across builds).
var IMPORT_SCANNER_CACHE = new LRU({
  max: 1024 * 1024,
  length: function length(ids) {
    var total = 40; // size of key
    each(ids, function (info, id) {
      total += id.length;
    });
    return total;
  }
});

var ImportScanner = function () {
  function ImportScanner(_ref) {
    var name = _ref.name;
    var bundleArch = _ref.bundleArch;
    var extensions = _ref.extensions;
    var sourceRoot = _ref.sourceRoot;
    var _ref$nodeModulesPaths = _ref.nodeModulesPaths;
    var nodeModulesPaths = _ref$nodeModulesPaths === undefined ? [] : _ref$nodeModulesPaths;
    var watchSet = _ref.watchSet;

    _classCallCheck(this, ImportScanner);

    var scanner = this;
    assert.ok(isString(sourceRoot));

    this.name = name;
    this.bundleArch = bundleArch;
    this.sourceRoot = sourceRoot;
    this.nodeModulesPaths = nodeModulesPaths;
    this.watchSet = watchSet;
    this.absPathToOutputIndex = Object.create(null);
    this.allMissingNodeModules = Object.create(null);
    this.outputFiles = [];

    this.resolver = Resolver.getOrCreate({
      caller: "ImportScanner#constructor",

      sourceRoot: sourceRoot,
      targetArch: bundleArch,
      extensions: extensions,
      nodeModulesPaths: nodeModulesPaths,

      statOrNull: function statOrNull(absPath) {
        var file = scanner._getFile(absPath);
        if (file) {
          return fakeFileStat;
        }

        return optimisticStatOrNull(absPath);
      }
    });
  }

  ImportScanner.prototype._getFile = function _getFile(absPath) {
    absPath = absPath.toLowerCase();
    if (has(this.absPathToOutputIndex, absPath)) {
      return this.outputFiles[this.absPathToOutputIndex[absPath]];
    }
  };

  ImportScanner.prototype._addFile = function _addFile(absPath, file) {
    absPath = absPath.toLowerCase();
    var old = this.absPathToOutputIndex[absPath];

    if (old) {
      // If the old file is just an empty stub, let the new file take
      // precedence over it.
      if (old.emptyStub === true) {
        return this.absPathToOutputIndex[absPath] = file;
      }

      // If the new file is just an empty stub, pretend the _addFile
      // succeeded by returning the old file, so that we won't try to call
      // _combineFiles needlessly.
      if (file.emptyStub === true) {
        return old;
      }
    } else {
      this.absPathToOutputIndex[absPath] = this.outputFiles.push(file) - 1;

      return file;
    }
  };

  ImportScanner.prototype.addInputFiles = function addInputFiles(files) {
    var _this = this;

    files.forEach(function (file) {
      _this._checkSourceAndTargetPaths(file);

      // Note: this absolute path may not necessarily exist on the file
      // system, but any import statements or require calls in file.data
      // will be interpreted relative to this path, so it needs to be
      // something plausible. #6411 #6383
      var absPath = pathJoin(_this.sourceRoot, file.sourcePath);

      var dotExt = "." + file.type;
      var dataString = file.data.toString("utf8");
      file.dataString = defaultExtensionHandlers[dotExt](dataString, file.hash);

      if (!(file.data instanceof Buffer) || file.dataString !== dataString) {
        file.data = new Buffer(file.dataString, "utf8");
      }

      // Files that are not eagerly evaluated (lazy) will only be included
      // in the bundle if they are actually imported. Files that are
      // eagerly evaluated are effectively "imported" as entry points.
      file.imported = !file.lazy;

      file.installPath = file.installPath || _this._getInstallPath(absPath);

      if (!_this._addFile(absPath, file)) {
        // Collisions can happen if a compiler plugin calls addJavaScript
        // multiple times with the same sourcePath. #6422
        _this._combineFiles(_this._getFile(absPath), file);
      }
    });

    return this;
  };

  // Make sure file.sourcePath is defined, and handle the possibility that
  // file.targetPath differs from file.sourcePath.


  ImportScanner.prototype._checkSourceAndTargetPaths = function _checkSourceAndTargetPaths(file) {
    file.sourcePath = this._getSourcePath(file);

    if (!isString(file.targetPath)) {
      return;
    }

    file.targetPath = pathNormalize(pathJoin(".", file.targetPath));

    if (file.targetPath !== file.sourcePath) {
      var absSourcePath = pathJoin(this.sourceRoot, file.sourcePath);
      var absTargetPath = pathJoin(this.sourceRoot, file.targetPath);

      // If file.targetPath differs from file.sourcePath, generate a new
      // file object with that .sourcePath that imports the original file.
      // This allows either the .sourcePath or the .targetPath to be used
      // when importing the original file, and also allows multiple files
      // to have the same .sourcePath but different .targetPaths.
      var sourceFile = this._getFile(absSourcePath);
      if (!sourceFile) {
        var installPath = this._getInstallPath(absSourcePath);
        sourceFile = this._addFile(absSourcePath, {
          type: file.type,
          sourcePath: file.sourcePath,
          servePath: installPath,
          installPath: installPath,
          dataString: "",
          deps: {},
          lazy: true
        });
      }

      // Make sure the original file gets installed at the target path
      // instead of the source path.
      file.installPath = this._getInstallPath(absTargetPath);
      file.sourcePath = file.targetPath;

      var relativeId = convertToPosixPath(pathRelative(pathDirname(absSourcePath), absTargetPath));

      // If the result of pathRelative does not already start with a "."
      // or a "/", prepend a "./" to make it a valid relative identifier
      // according to CommonJS syntax.
      if ("./".indexOf(relativeId.charAt(0)) < 0) {
        relativeId = "./" + relativeId;
      }

      // Set the contents of the source module to import the target
      // module(s). Note that module.exports will be set to the exports of
      // the last target module. This is not perfect, but (1) it's better
      // than trying to merge exports, (2) it does the right thing when
      // there's only one target module, (3) the plugin author can easily
      // control which file comes last, and (4) it's always possible to
      // import the target modules individually.
      sourceFile.dataString += "module.exports = require(" + JSON.stringify(relativeId) + ");\n";
      sourceFile.data = new Buffer(sourceFile.dataString, "utf8");
      sourceFile.hash = sha1(sourceFile.data);
      sourceFile.deps[relativeId] = {};
    }
  };

  // Concatenate the contents of oldFile and newFile, combining source
  // maps and updating all other properties appropriately. Once this
  // combination is done, oldFile should be kept and newFile discarded.


  ImportScanner.prototype._combineFiles = function _combineFiles(oldFile, newFile) {
    function checkProperty(name) {
      if (has(oldFile, name)) {
        if (!has(newFile, name)) {
          newFile[name] = oldFile[name];
        }
      } else if (has(newFile, name)) {
        oldFile[name] = newFile[name];
      }

      if (oldFile[name] !== newFile[name]) {
        throw new Error("Attempting to combine different files:\n" + inspect(omit(oldFile, "dataString")) + "\n" + inspect(omit(newFile, "dataString")) + "\n");
      }
    }

    // Since we're concatenating the files together, they must be either
    // both lazy or both eager. Same for bareness.
    checkProperty("lazy");
    checkProperty("bare");

    function getChunk(file) {
      var consumer = file.sourceMap && new SourceMapConsumer(file.sourceMap);
      var node = consumer && SourceNode.fromStringWithSourceMap(file.dataString, consumer);
      return node || file.dataString;
    }

    var _toStringWithSourceMa = new SourceNode(null, null, null, [getChunk(oldFile), "\n\n", getChunk(newFile)]).toStringWithSourceMap({
      file: oldFile.servePath || newFile.servePath
    });

    var combinedDataString = _toStringWithSourceMa.code;
    var combinedSourceMap = _toStringWithSourceMa.map;


    oldFile.dataString = combinedDataString;
    oldFile.data = new Buffer(oldFile.dataString, "utf8");
    oldFile.hash = sha1(oldFile.data);
    oldFile.imported = oldFile.imported || newFile.imported;
    oldFile.sourceMap = combinedSourceMap.toJSON();
    if (!oldFile.sourceMap.mappings) {
      oldFile.sourceMap = null;
    }
  };

  ImportScanner.prototype.scanImports = function scanImports() {
    var _this2 = this;

    this.outputFiles.forEach(function (file) {
      if (!file.lazy || file.imported) {
        _this2._scanFile(file);
      }
    });

    return this;
  };

  ImportScanner.prototype.addNodeModules = function addNodeModules(identifiers) {
    var _this3 = this;

    assert.ok(identifiers);
    assert.ok((typeof identifiers === "undefined" ? "undefined" : _typeof(identifiers)) === "object");
    assert.ok(!Array.isArray(identifiers));

    var newlyMissing = Object.create(null);
    var newlyAdded = Object.create(null);

    if (!isEmpty(identifiers)) {
      (function () {
        var previousAllMissingNodeModules = _this3.allMissingNodeModules;
        _this3.allMissingNodeModules = newlyMissing;

        try {
          _this3._scanFile({
            sourcePath: "fake.js",
            // By specifying the .deps property of this fake file ahead of
            // time, we can avoid calling findImportedModuleIdentifiers in the
            // _scanFile method.
            deps: identifiers
          });
        } finally {
          _this3.allMissingNodeModules = previousAllMissingNodeModules;

          each(identifiers, function (info, id) {
            if (!has(newlyMissing, id)) {
              newlyAdded[id] = info;
            }
          });

          // Remove previously seen missing module identifiers from
          // newlyMissing and merge the new identifiers back into
          // this.allMissingNodeModules.
          each(keys(newlyMissing), function (key) {
            if (has(previousAllMissingNodeModules, key)) {
              delete newlyMissing[key];
            } else {
              previousAllMissingNodeModules[key] = newlyMissing[key];
            }
          });
        }
      })();
    }

    return {
      newlyAdded: newlyAdded,
      newlyMissing: newlyMissing
    };
  };

  ImportScanner.prototype.getOutputFiles = function getOutputFiles(options) {
    // Return all installable output files that are either eager or
    // imported by another module.
    return this.outputFiles.filter(function (file) {
      return file.installPath && (!file.lazy || file.imported);
    });
  };

  ImportScanner.prototype._getSourcePath = function _getSourcePath(file) {
    var sourcePath = file.sourcePath;
    if (sourcePath) {
      if (pathIsAbsolute(sourcePath)) {
        try {
          var relPath = pathRelative(this.sourceRoot, sourcePath);
        } finally {
          if (!relPath || relPath.startsWith("..")) {
            if (this.resolver._joinAndStat(this.sourceRoot, sourcePath)) {
              // If sourcePath exists as a path relative to this.sourceRoot,
              // strip away the leading / that made it look absolute.
              return pathNormalize(pathJoin(".", sourcePath));
            }

            if (relPath) {
              throw new Error("sourcePath outside sourceRoot: " + sourcePath);
            }

            // If pathRelative threw an exception above, and we were not
            // able to handle the problem, it will continue propagating
            // from this finally block.
          }
        }

        sourcePath = relPath;
      }
    } else if (file.servePath) {
      sourcePath = convertToOSPath(file.servePath.replace(/^\//, ""));
    } else if (file.path) {
      sourcePath = file.path;
    }

    return pathNormalize(pathJoin(".", sourcePath));
  };

  ImportScanner.prototype._findImportedModuleIdentifiers = function _findImportedModuleIdentifiers(file) {
    if (IMPORT_SCANNER_CACHE.has(file.hash)) {
      return IMPORT_SCANNER_CACHE.get(file.hash);
    }

    var result = findImportedModuleIdentifiers(file.dataString, file.hash);

    // there should always be file.hash, but better safe than sorry
    if (file.hash) {
      IMPORT_SCANNER_CACHE.set(file.hash, result);
    }

    return result;
  };

  ImportScanner.prototype._resolve = function _resolve(id, absPath) {
    var _this4 = this;

    var resolved = this.resolver.resolve(id, absPath);

    if (resolved === "missing") {
      return this._onMissing(id, absPath);
    }

    if (resolved && resolved.packageJsonMap) {
      each(resolved.packageJsonMap, function (pkg, path) {
        _this4._addPkgJsonToOutput(path, pkg);
      });
    }

    return resolved;
  };

  ImportScanner.prototype._scanFile = function _scanFile(file) {
    var _this5 = this;

    var absPath = pathJoin(this.sourceRoot, file.sourcePath);

    try {
      file.deps = file.deps || this._findImportedModuleIdentifiers(file);
    } catch (e) {
      if (e.$ParseError) {
        buildmessage.error(e.message, {
          file: file.sourcePath,
          line: e.loc.line,
          column: e.loc.column
        });
        return;
      }
      throw e;
    }

    each(file.deps, function (info, id) {
      var resolved = _this5._resolve(id, absPath);
      if (!resolved) {
        return;
      }

      var absImportedPath = resolved.path;

      var depFile = _this5._getFile(absImportedPath);
      if (depFile) {
        // Avoid scanning files that we've scanned before, but mark them
        // as imported so we know to include them in the bundle if they
        // are lazy. Eager files and files that we have imported before do
        // not need to be scanned again. Lazy files that we have not
        // imported before still need to be scanned, however.
        var alreadyScanned = !depFile.lazy || depFile.imported;

        // Whether the file is eager or lazy, mark it as imported. For
        // lazy files, this makes the difference between being included in
        // or omitted from the bundle. For eager files, this just ensures
        // we won't scan them again.
        depFile.imported = true;

        if (!alreadyScanned) {
          if (depFile.error) {
            // Since this file is lazy, it might never have been imported,
            // so any errors reported to InputFile#error were saved but
            // not reported at compilation time. Now that we know the file
            // has been imported, it's time to report those errors.
            buildmessage.error(depFile.error.message, depFile.error.info);
          } else {
            _this5._scanFile(depFile);
          }
        }

        return;
      }

      var installPath = _this5._getInstallPath(absImportedPath);
      if (!installPath) {
        // The given path cannot be installed on this architecture.
        return;
      }

      // If the module is not readable, _readModule may return
      // null. Otherwise it will return an object with .data, .dataString,
      // and .hash properties.
      depFile = _this5._readModule(absImportedPath);
      if (!depFile) {
        return;
      }

      depFile.type = "js"; // TODO Is this correct?
      depFile.sourcePath = pathRelative(_this5.sourceRoot, absImportedPath);
      depFile.installPath = installPath;
      depFile.servePath = installPath;
      depFile.lazy = true;
      depFile.imported = true;

      // Append this file to the output array and record its index.
      _this5._addFile(absImportedPath, depFile);

      if (!_this5.isWeb() && depFile.installPath.startsWith("node_modules/")) {
        // On the server, modules in node_modules directories will be
        // handled natively by Node, so we don't need to build a
        // meteorInstall-style bundle beyond the entry-point module.
        return;
      }

      _this5._scanFile(depFile);
    });
  };

  ImportScanner.prototype.isWeb = function isWeb() {
    return archMatches(this.bundleArch, "web");
  };

  ImportScanner.prototype._readFile = function _readFile(absPath) {
    var contents = optimisticReadFile(absPath);
    var hash = optimisticHashOrNull(absPath);

    this.watchSet.addFile(absPath, hash);

    return {
      data: contents,
      dataString: contents.toString("utf8"),
      hash: hash
    };
  };

  ImportScanner.prototype._readModule = function _readModule(absPath) {
    var ext = pathExtname(absPath).toLowerCase();

    if (ext === ".node") {
      var _dataString = "throw new Error(" + JSON.stringify(this.isWeb() ? "cannot load native .node modules on the client" : "module.useNode() must succeed for native .node modules") + ");\n";

      var data = new Buffer(_dataString, "utf8");
      var hash = sha1(data);

      return { data: data, dataString: _dataString, hash: hash };
    }

    try {
      var info = this._readFile(absPath);
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
      return null;
    }

    var dataString = info.dataString;

    // Same logic/comment as stripBOM in node/lib/module.js:
    // Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
    // because the buffer-to-string conversion in `fs.readFileSync()`
    // translates it to FEFF, the UTF-16 BOM.
    if (info.dataString.charCodeAt(0) === 0xfeff) {
      info.dataString = info.dataString.slice(1);
    }

    if (!has(defaultExtensionHandlers, ext)) {
      if (canBeParsedAsPlainJS(dataString)) {
        ext = ".js";
      } else {
        return null;
      }
    }

    info.dataString = defaultExtensionHandlers[ext](info.dataString, info.hash);

    if (info.dataString !== dataString) {
      info.data = new Buffer(info.dataString, "utf8");
    }

    return info;
  };

  // Returns a relative path indicating where to install the given file
  // via meteorInstall. May return undefined if the file should not be
  // installed on the current architecture.


  ImportScanner.prototype._getInstallPath = function _getInstallPath(absPath) {
    var path = this._getNodeModulesInstallPath(absPath) || this._getSourceRootInstallPath(absPath);

    if (!path) {
      return;
    }

    if (this.name) {
      // If we're bundling a package, prefix path with
      // node_modules/<package name>/.
      path = pathJoin("node_modules", "meteor", this.name, path);
    }

    // Install paths should always be delimited by /.
    return convertToPosixPath(path);
  };

  ImportScanner.prototype._getNodeModulesInstallPath = function _getNodeModulesInstallPath(absPath) {
    var installPath = void 0;

    this.nodeModulesPaths.some(function (path) {
      var relPathWithinNodeModules = pathRelative(path, absPath);

      if (relPathWithinNodeModules.startsWith("..")) {
        // absPath is not a subdirectory of path.
        return;
      }

      // Install the module into the local node_modules directory within
      // this app or package.
      return installPath = pathJoin("node_modules", relPathWithinNodeModules);
    });

    return installPath;
  };

  ImportScanner.prototype._getSourceRootInstallPath = function _getSourceRootInstallPath(absPath) {
    var installPath = pathRelative(this.sourceRoot, absPath);

    if (installPath.startsWith("..")) {
      // absPath is not a subdirectory of this.sourceRoot.
      return;
    }

    var dirs = this._splitPath(pathDirname(installPath));
    var isApp = !this.name;
    var bundlingForWeb = this.isWeb();

    var topLevelDir = dirs[0];
    if (topLevelDir === "private" || topLevelDir === "packages" || topLevelDir === "programs" || topLevelDir === "cordova-build-override") {
      // Don't load anything from these special top-level directories
      return;
    }

    for (var _iterator = dirs, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref2;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref2 = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref2 = _i.value;
      }

      var dir = _ref2;

      if (dir.charAt(0) === ".") {
        // Files/directories whose names start with a dot are never loaded
        return;
      }

      if (isApp) {
        if (bundlingForWeb) {
          if (dir === "server") {
            // If we're bundling an app for a client architecture, any files
            // contained by a server-only directory that is not contained by
            // a node_modules directory must be ignored.
            return;
          }
        } else if (dir === "client") {
          // If we're bundling an app for a server architecture, any files
          // contained by a client-only directory that is not contained by
          // a node_modules directory must be ignored.
          return;
        }
      }

      if (dir === "node_modules") {
        // Accept any file within a node_modules directory.
        return installPath;
      }
    }

    return installPath;
  };

  ImportScanner.prototype._splitPath = function _splitPath(path) {
    var partsInReverse = [];
    for (var dir; (dir = pathDirname(path)) !== path; path = dir) {
      partsInReverse.push(pathBasename(path));
    }
    return partsInReverse.reverse();
  };

  // Called by this.resolver when a module identifier cannot be resolved.


  ImportScanner.prototype._onMissing = function _onMissing(id, absParentPath) {
    var isApp = !this.name;
    var parentFile = this._getFile(absParentPath);

    if (isApp && Resolver.isNative(id) && this.isWeb()) {
      // To ensure the native module can be evaluated at runtime, register
      // a dependency on meteor-node-stubs/deps/<id>.js.
      var stubId = Resolver.getNativeStubId(id);
      if (isString(stubId) && stubId !== id) {
        if (parentFile && parentFile.deps) {
          parentFile.deps[stubId] = parentFile.deps[id];
        }
        return this._resolve(stubId, absParentPath);
      }
    }

    var possiblySpurious = parentFile && parentFile.deps && has(parentFile.deps, id) && parentFile.deps[id].possiblySpurious;

    var info = {
      packageName: this.name,
      parentPath: absParentPath,
      bundleArch: this.bundleArch,
      possiblySpurious: possiblySpurious
    };

    // If the imported identifier is neither absolute nor relative, but
    // top-level, then it might be satisfied by a package installed in
    // the top-level node_modules directory, and we should record the
    // missing dependency so that we can include it in the app bundle.
    if (parentFile) {
      var missing = parentFile.missingNodeModules || Object.create(null);
      missing[id] = info;
      parentFile.missingNodeModules = missing;
    }

    if (!has(this.allMissingNodeModules, id) || !info.possiblySpurious) {
      // Allow any non-spurious identifier to replace an existing
      // possibly spurious identifier.
      this.allMissingNodeModules[id] = info;
    }
  };

  ImportScanner.prototype._addPkgJsonToOutput = function _addPkgJsonToOutput(pkgJsonPath, pkg) {
    if (!this._getFile(pkgJsonPath)) {
      var data = new Buffer(map(pkg, function (value, key) {
        return "exports." + key + " = " + JSON.stringify(value) + ";\n";
      }).join(""));

      var relPkgJsonPath = pathRelative(this.sourceRoot, pkgJsonPath);

      var pkgFile = {
        type: "js", // We represent the JSON module with JS.
        data: data,
        deps: {}, // Avoid accidentally re-scanning this file.
        sourcePath: relPkgJsonPath,
        installPath: this._getInstallPath(pkgJsonPath),
        servePath: relPkgJsonPath,
        hash: sha1(data),
        lazy: true,
        imported: true
      };

      this._addFile(pkgJsonPath, pkgFile);

      var hash = optimisticHashOrNull(pkgJsonPath);
      if (hash) {
        this.watchSet.addFile(pkgJsonPath, hash);
      }
    }
  };

  return ImportScanner;
}();

module.export("default",exports.default=(ImportScanner));


each(["_readFile", "_findImportedModuleIdentifiers", "_getInstallPath"], function (funcName) {
  ImportScanner.prototype[funcName] = Profile("ImportScanner#" + funcName, ImportScanner.prototype[funcName]);
});
//# sourceMappingURL=import-scanner.js.map