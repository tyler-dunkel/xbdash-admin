var _classCallCheck;module.import("babel-runtime/helpers/classCallCheck",{"default":function(v){_classCallCheck=v}});var isString,isFunction,each,has;module.import("underscore",{"isString":function(v){isString=v},"isFunction":function(v){isFunction=v},"each":function(v){each=v},"has":function(v){has=v}});var sha1;module.import("../fs/watch.js",{"sha1":function(v){sha1=v}});var archMatches;module.import("../utils/archinfo.js",{"matches":function(v){archMatches=v}});var pathJoin,pathRelative,pathNormalize,pathDirname,convertToOSPath,convertToPosixPath;module.import("../fs/files.js",{"pathJoin":function(v){pathJoin=v},"pathRelative":function(v){pathRelative=v},"pathNormalize":function(v){pathNormalize=v},"pathDirname":function(v){pathDirname=v},"convertToOSPath":function(v){convertToOSPath=v},"convertToPosixPath":function(v){convertToPosixPath=v}});var LRU;module.import("lru-cache",{"default":function(v){LRU=v}});var wrap;module.import("optimism",{"wrap":function(v){wrap=v}});var optimisticStatOrNull,optimisticReadJsonOrNull;module.import("../fs/optimistic.js",{"optimisticStatOrNull":function(v){optimisticStatOrNull=v},"optimisticReadJsonOrNull":function(v){optimisticReadJsonOrNull=v}});var Profile;module.import("../tool-env/profile.js",{"Profile":function(v){Profile=v}});











var nativeModulesMap = Object.create(null);
var nativeNames = Object.keys(process.binding("natives"));

// Node 0.10 does not include process as a built-in module, but later
// versions of Node do, and we provide a stub for it on the client.
nativeNames.push("process");

nativeNames.forEach(function (id) {
  if (id === "freelist" || id.startsWith("internal/")) {
    return;
  }

  // When a native Node module is imported, we register a dependency on a
  // meteor-node-stubs/deps/* module of the same name, so that the
  // necessary stub modules will be included in the bundle. This alternate
  // identifier will not be imported at runtime, but the modules it
  // depends on are necessary for the original import to succeed.
  nativeModulesMap[id] = "meteor-node-stubs/deps/" + id;
});

var resolverCache = new LRU({
  max: Math.pow(2, 12)
});

var Resolver = function () {
  Resolver.getOrCreate = function getOrCreate(options) {
    var key = JSON.stringify(options);
    var resolver = resolverCache.get(key);
    if (!resolver) {
      resolverCache.set(key, resolver = new Resolver(options));
    }
    return resolver;
  };

  function Resolver(_ref) {
    var _this = this;

    var sourceRoot = _ref.sourceRoot;
    var targetArch = _ref.targetArch;
    var _ref$extensions = _ref.extensions;
    var extensions = _ref$extensions === undefined ? [".js", ".json"] : _ref$extensions;
    var _ref$nodeModulesPaths = _ref.nodeModulesPaths;
    var nodeModulesPaths = _ref$nodeModulesPaths === undefined ? [] : _ref$nodeModulesPaths;
    var _ref$statOrNull = _ref.statOrNull;
    var statOrNull = _ref$statOrNull === undefined ? optimisticStatOrNull : _ref$statOrNull;

    _classCallCheck(this, Resolver);

    this.sourceRoot = sourceRoot;
    this.extensions = extensions;
    this.targetArch = targetArch;
    this.nodeModulesPaths = nodeModulesPaths;
    this.statOrNull = statOrNull;

    this.resolve = wrap(function (id, absParentPath) {
      return _this._resolve(id, absParentPath);
    }, {
      makeCacheKey: function makeCacheKey(id, absParentPath) {
        // Only the directory of the absParentPath matters for caching.
        return JSON.stringify([id, pathDirname(absParentPath)]);
      }
    });
  }

  Resolver.isTopLevel = function isTopLevel(id) {
    return "./".indexOf(id.charAt(0)) < 0;
  };

  Resolver.isNative = function isNative(id) {
    return has(nativeModulesMap, id);
  };

  Resolver.getNativeStubId = function getNativeStubId(id) {
    return nativeModulesMap[id] || null;
  };

  // Resolve the given module identifier to an object { path, stat } or
  // null, relative to an absolute parent path. The _seenDirPaths
  // parameter is for internal use only and should be ommitted.


  Resolver.prototype._resolve = function _resolve(id, absParentPath, _seenDirPaths) {
    var resolved = this._resolveAbsolute(id, absParentPath) || this._resolveRelative(id, absParentPath) || this._resolveNodeModule(id, absParentPath);

    if (typeof resolved === "string") {
      // The _resolveNodeModule method can return "missing" to indicate
      // that the ImportScanner should look elsewhere for this module,
      // such as in the app node_modules directory.
      return resolved;
    }

    var packageJsonMap = null;

    while (resolved && resolved.stat.isDirectory()) {
      var dirPath = resolved.path;
      _seenDirPaths = _seenDirPaths || new Set();

      // If the "main" field of a package.json file resolves to a
      // directory we've already considered, then we should not attempt to
      // read the same package.json file again.
      if (!_seenDirPaths.has(dirPath)) {
        _seenDirPaths.add(dirPath);
        resolved = this._resolvePkgJsonMain(dirPath, _seenDirPaths);
        if (resolved) {
          // The _resolvePkgJsonMain call above may have returned a
          // directory, so first merge resolved.packageJsonMap into
          // packageJsonMap so that we don't forget the package.json we
          // just resolved, then continue the loop to make sure we fully
          // resolve the "main" module identifier to a non-directory.
          // Technically this could involve even more package.json files,
          // but in practice the "main" property will almost always name a
          // directory containing an index.js file.
          Object.assign(packageJsonMap || (packageJsonMap = Object.create(null)), resolved.packageJsonMap);
          continue;
        }
      }

      // If we didn't find a `package.json` file, or it didn't have a
      // resolvable `.main` property, the only possibility left to
      // consider is that this directory contains an `index.js` module.
      // This assignment almost always terminates the while loop, because
      // there's very little chance an `index.js` file will be a
      // directory. However, in principle it is remotely possible that a
      // file called `index.js` could be a directory instead of a file.
      resolved = this._joinAndStat(dirPath, "index.js");
    }

    if (resolved) {
      if (packageJsonMap) {
        resolved.packageJsonMap = packageJsonMap;
      }

      resolved.id = convertToPosixPath(convertToOSPath(resolved.path), true);
    }

    return resolved;
  };

  Resolver.prototype._joinAndStat = function _joinAndStat() {
    var _this2 = this;

    var joined = pathJoin.apply(undefined, arguments);
    var path = pathNormalize(joined);
    var exactStat = this.statOrNull(path);
    var exactResult = exactStat && { path: path, stat: exactStat };
    var result = null;
    if (exactResult && exactStat.isFile()) {
      result = exactResult;
    }

    if (!result) {
      this.extensions.some(function (ext) {
        var pathWithExt = path + ext;
        var stat = _this2.statOrNull(pathWithExt);
        if (stat) {
          return result = { path: pathWithExt, stat: stat };
        }
      });
    }

    if (!result && exactResult && exactStat.isDirectory()) {
      // After trying all available file extensions, fall back to the
      // original result if it was a directory.
      result = exactResult;
    }

    return result;
  };

  Resolver.prototype._resolveAbsolute = function _resolveAbsolute(id, absParentPath) {
    return id.charAt(0) === "/" && this._joinAndStat(this.sourceRoot, id.slice(1));
  };

  Resolver.prototype._resolveRelative = function _resolveRelative(id, absParentPath) {
    if (id.charAt(0) === ".") {
      return this._joinAndStat(absParentPath, "..", id);
    }
  };

  Resolver.prototype._resolveNodeModule = function _resolveNodeModule(id, absParentPath) {
    var _this3 = this;

    if (!Resolver.isTopLevel(id)) {
      return null;
    }

    if (Resolver.isNative(id) && archMatches(this.targetArch, "os")) {
      // Forbid installing any server module with the same name as a
      // native Node module.
      return null;
    }

    var sourceRoot = void 0;
    var relParentPath = pathRelative(this.sourceRoot, absParentPath);
    if (!relParentPath.startsWith("..")) {
      // If the file is contained by this.sourceRoot, then it's safe to
      // use this.sourceRoot as the limiting ancestor directory in the
      // while loop below, but we're still going to check whether the file
      // resides in an external node_modules directory, since "external"
      // .npm/package/node_modules directories are technically contained
      // within the root directory of their packages.
      sourceRoot = this.sourceRoot;
    }

    this.nodeModulesPaths.some(function (path) {
      if (!pathRelative(path, absParentPath).startsWith("..")) {
        // If the file is inside an external node_modules directory,
        // consider the rootDir to be the parent directory of that
        // node_modules directory, rather than this.sourceRoot.
        return sourceRoot = pathDirname(path);
      }
    });

    var resolved = null;

    if (sourceRoot) {
      var dir = absParentPath; // It's ok for absParentPath to be a directory!
      var info = this._joinAndStat(dir);
      if (!info || !info.stat.isDirectory()) {
        dir = pathDirname(dir);
      }

      while (!(resolved = this._joinAndStat(dir, "node_modules", id))) {
        if (dir === sourceRoot) {
          break;
        }

        var parentDir = pathDirname(dir);
        if (dir === parentDir) {
          // We've reached the root of the file system??
          break;
        }

        dir = parentDir;
      }
    }

    if (!resolved) {
      // After checking any local node_modules directories, fall back to
      // the package NPM directory, if one was specified.
      this.nodeModulesPaths.some(function (path) {
        return resolved = _this3._joinAndStat(path, id);
      });
    }

    // If the dependency is still not resolved, it might be handled by the
    // fallback function defined in meteor/packages/modules/modules.js, or
    // it might be imported in code that will never run on this platform,
    // so there is always the possibility that its absence is not actually
    // a problem. As much as we might like to issue warnings about missing
    // dependencies here, we just don't have enough information to make
    // that determination until the code actually runs.

    return resolved || "missing";
  };

  Resolver.prototype._resolvePkgJsonMain = function _resolvePkgJsonMain(dirPath, _seenDirPaths) {
    var pkgJsonPath = pathJoin(dirPath, "package.json");
    var pkg = optimisticReadJsonOrNull(pkgJsonPath);
    if (!pkg) {
      return null;
    }

    var main = pkg.main;

    if (archMatches(this.targetArch, "web") && isString(pkg.browser)) {
      main = pkg.browser;
    }

    // Output a JS module that exports just the "name", "version", and
    // "main" properties defined in the package.json file.
    var pkgSubset = {
      name: pkg.name
    };

    if (has(pkg, "version")) {
      pkgSubset.version = pkg.version;
    }

    if (isString(main)) {
      pkgSubset.main = main;

      // The "main" field of package.json does not have to begin with ./
      // to be considered relative, so first we try simply appending it to
      // the directory path before falling back to a full resolve, which
      // might return a package from a node_modules directory.
      var resolved = this._joinAndStat(dirPath, main) || this._resolve(main, pkgJsonPath, _seenDirPaths);

      if (resolved) {
        if (!resolved.packageJsonMap) {
          resolved.packageJsonMap = Object.create(null);
        }

        resolved.packageJsonMap[pkgJsonPath] = pkgSubset;

        return resolved;
      }
    }

    return null;
  };

  return Resolver;
}();

module.export("default",exports.default=(Resolver));
;


each(Resolver.prototype, function (value, key) {
  if (key === "constructor") return;
  Resolver.prototype[key] = Profile("Resolver#" + key, Resolver.prototype[key]);
});
//# sourceMappingURL=resolver.js.map