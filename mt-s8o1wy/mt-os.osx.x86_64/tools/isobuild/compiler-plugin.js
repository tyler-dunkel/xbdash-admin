module.export({CompilerPluginProcessor:function(){return CompilerPluginProcessor},PackageSourceBatch:function(){return PackageSourceBatch}});var _toConsumableArray;module.import('babel-runtime/helpers/toConsumableArray',{"default":function(v){_toConsumableArray=v}});var _extends;module.import('babel-runtime/helpers/extends',{"default":function(v){_extends=v}});var _possibleConstructorReturn;module.import('babel-runtime/helpers/possibleConstructorReturn',{"default":function(v){_possibleConstructorReturn=v}});var _inherits;module.import('babel-runtime/helpers/inherits',{"default":function(v){_inherits=v}});var _classCallCheck;module.import('babel-runtime/helpers/classCallCheck',{"default":function(v){_classCallCheck=v}});var sha1,_readAndWatchFileWithHash;module.import('../fs/watch.js',{"sha1":function(v){sha1=v},"readAndWatchFileWithHash":function(v){_readAndWatchFileWithHash=v}});var LRU;module.import('lru-cache',{"default":function(v){LRU=v}});var Fiber;module.import('fibers',{"default":function(v){Fiber=v}});var sourceMapLength;module.import('../utils/utils.js',{"sourceMapLength":function(v){sourceMapLength=v}});var Console;module.import('../console/console.js',{"Console":function(v){Console=v}});var ImportScanner;module.import('./import-scanner.js',{"default":function(v){ImportScanner=v}});var cssToCommonJS;module.import("./css-modules.js",{"cssToCommonJS":function(v){cssToCommonJS=v}});var Resolver;module.import("./resolver.js",{"default":function(v){Resolver=v}});var optimisticStatOrNull;module.import("../fs/optimistic.js",{"optimisticStatOrNull":function(v){optimisticStatOrNull=v}});var isTestFilePath;module.import('./test-files.js',{"isTestFilePath":function(v){isTestFilePath=v}});




var archinfo = require('../utils/archinfo.js');
var buildmessage = require('../utils/buildmessage.js');
var buildPluginModule = require('./build-plugin.js');
var colonConverter = require('../utils/colon-converter.js');
var files = require('../fs/files.js');
var compiler = require('./compiler.js');
var linker = require('./linker.js');
var util = require('util');
var _ = require('underscore');
var Profile = require('../tool-env/profile.js').Profile;












// This file implements the new compiler plugins added in Meteor 1.2, which are
// registered with the Plugin.registerCompiler API.
//
// Unlike legacy source handlers (Plugin.registerSourceHandler), compilers run
// in the context of an entire app. That is to say, they don't run when you run
// `meteor publish`; whenever they run, they have access to all the files of
// their type across all packages as well as the app. This allows them to
// implement cross-file and cross-package inclusion, or config files in the app
// that affect how packages are processed, among other possibilities.
//
// Compilers can specify which extensions or filenames they process. They only
// process files in packages (or the app) that directly use the plugin's package
// (or that use it indirectly via the "imply" directive); just because compiler
// plugins act on multiple packages at a time doesn't mean they automatically
// act on all packages in your app.
//
// The CompilerPluginProcessor is the main entry point to this file; it is used
// by the bundler to run all plugins on a target. It doesn't have much
// interesting state and perhaps could have just been a function.
//
// It receives an ordered list of unibuilds (essentially, packages) from the
// bundler. It turns them into an ordered list of PackageSourceBatch objects,
// each of which represents the source files in a single package. Each
// PackageSourceBatch consists of an ordered list of ResourceSlots representing
// the resources in that package. The idea here is that, because Meteor executes
// all JS files in the order produced by the bundler, we need to make sure to
// maintain the order of packages from the bundler and the order of source files
// within a package. Each ResourceSlot represents a resource (either a 'source'
// resource which will be processed by a compiler plugin, or something else like
// a static asset or some JavaScript produced by a legacy source handler), and
// when the compiler plugin calls something like `inputFile.addJavaScript` on a
// file, we replace that source file with the resource produced by the plugin.
//
// InputFile is a wrapper around ResourceSlot that is the object presented to
// the compiler in the plugin. It is part of the documented registerCompiler
// API.

// Cache the (slightly post-processed) results of linker.fullLink.
var CACHE_SIZE = process.env.METEOR_LINKER_CACHE_SIZE || 1024 * 1024 * 100;
var CACHE_DEBUG = !!process.env.METEOR_TEST_PRINT_LINKER_CACHE_DEBUG;
var LINKER_CACHE_SALT = 11; // Increment this number to force relinking.
var LINKER_CACHE = new LRU({
  max: CACHE_SIZE,
  // Cache is measured in bytes. We don't care about servePath.
  // Key is JSONification of all options plus all hashes.
  length: function length(files) {
    return files.reduce(function (soFar, current) {
      return soFar + current.data.length + sourceMapLength(current.sourceMap);
    }, 0);
  }
});

var serverLibPackages = {
  // Make sure fibers is defined, if nothing else.
  fibers: true
};

function populateServerLibPackages() {
  var devBundlePath = files.getDevBundle();
  var nodeModulesPath = files.pathJoin(devBundlePath, "server-lib", "node_modules");

  files.readdir(nodeModulesPath).forEach(function (packageName) {
    var packagePath = files.pathJoin(nodeModulesPath, packageName);
    var packageStat = files.statOrNull(packagePath);
    if (packageStat && packageStat.isDirectory()) {
      serverLibPackages[packageName] = true;
    }
  });
}

try {
  populateServerLibPackages();
} catch (e) {
  // At least we tried!
}

var CompilerPluginProcessor = function () {
  function CompilerPluginProcessor(_ref) {
    var unibuilds = _ref.unibuilds;
    var arch = _ref.arch;
    var sourceRoot = _ref.sourceRoot;
    var isopackCache = _ref.isopackCache;
    var linkerCacheDir = _ref.linkerCacheDir;

    _classCallCheck(this, CompilerPluginProcessor);

    var self = this;

    self.unibuilds = unibuilds;
    self.arch = arch;
    self.sourceRoot = sourceRoot;
    self.isopackCache = isopackCache;

    self.linkerCacheDir = linkerCacheDir;
    if (self.linkerCacheDir) {
      files.mkdir_p(self.linkerCacheDir);
    }
  }

  CompilerPluginProcessor.prototype.runCompilerPlugins = function runCompilerPlugins() {
    var self = this;
    buildmessage.assertInJob();

    // plugin id -> {sourceProcessor, resourceSlots}
    var sourceProcessorsWithSlots = {};

    var sourceBatches = _.map(self.unibuilds, function (unibuild) {
      var name = unibuild.pkg.name;
      var arch = unibuild.arch;

      var sourceRoot = name && self.isopackCache.getSourceRoot(name, arch) || self.sourceRoot;

      return new PackageSourceBatch(unibuild, self, {
        sourceRoot: sourceRoot,
        linkerCacheDir: self.linkerCacheDir
      });
    });

    // If we failed to match sources with processors, we're done.
    if (buildmessage.jobHasMessages()) {
      return [];
    }

    // Find out which files go with which CompilerPlugins.
    _.each(sourceBatches, function (sourceBatch) {
      _.each(sourceBatch.resourceSlots, function (resourceSlot) {
        var sourceProcessor = resourceSlot.sourceProcessor;
        // Skip non-sources.
        if (!sourceProcessor) {
          return;
        }

        if (!_.has(sourceProcessorsWithSlots, sourceProcessor.id)) {
          sourceProcessorsWithSlots[sourceProcessor.id] = {
            sourceProcessor: sourceProcessor,
            resourceSlots: []
          };
        }
        sourceProcessorsWithSlots[sourceProcessor.id].resourceSlots.push(resourceSlot);
      });
    });

    // Now actually run the handlers.
    _.each(sourceProcessorsWithSlots, function (data, id) {
      var sourceProcessor = data.sourceProcessor;
      var resourceSlots = data.resourceSlots;

      var jobTitle = ["processing files with ", sourceProcessor.isopack.name, " (for target ", self.arch, ")"].join('');

      Profile.time("plugin " + sourceProcessor.isopack.name, function () {
        buildmessage.enterJob({
          title: jobTitle
        }, function () {
          var inputFiles = _.map(resourceSlots, function (resourceSlot) {
            return new InputFile(resourceSlot);
          });

          var markedMethod = buildmessage.markBoundary(sourceProcessor.userPlugin.processFilesForTarget.bind(sourceProcessor.userPlugin));
          try {
            markedMethod(inputFiles);
          } catch (e) {
            buildmessage.exception(e);
          }
        });
      });
    });

    return sourceBatches;
  };

  return CompilerPluginProcessor;
}();

var InputFile = function (_buildPluginModule$In) {
  _inherits(InputFile, _buildPluginModule$In);

  function InputFile(resourceSlot) {
    _classCallCheck(this, InputFile);

    // We use underscored attributes here because this is user-visible
    // code and we don't want users to be accessing anything that we don't
    // document.
    var _this = _possibleConstructorReturn(this, _buildPluginModule$In.call(this));

    _this._resourceSlot = resourceSlot;

    // Map from absolute paths to stat objects (or null if the file does
    // not exist).
    _this._statCache = Object.create(null);

    // Map from control file names (e.g. package.json, .babelrc) to
    // absolute paths, or null to indicate absence.
    _this._controlFileCache = Object.create(null);

    // Map from imported module identifier strings (possibly relative) to
    // fully require.resolve'd module identifiers.
    _this._resolveCache = Object.create(null);
    return _this;
  }

  InputFile.prototype.getContentsAsBuffer = function getContentsAsBuffer() {
    var self = this;
    return self._resourceSlot.inputResource.data;
  };

  InputFile.prototype.getPackageName = function getPackageName() {
    var self = this;
    return self._resourceSlot.packageSourceBatch.unibuild.pkg.name;
  };

  InputFile.prototype.isPackageFile = function isPackageFile() {
    return !!this.getPackageName();
  };

  InputFile.prototype.isApplicationFile = function isApplicationFile() {
    return !this.getPackageName();
  };

  InputFile.prototype.getSourceRoot = function getSourceRoot() {
    var sourceRoot = this._resourceSlot.packageSourceBatch.sourceRoot;

    if (!_.isString(sourceRoot)) {
      var name = this.getPackageName();
      throw new Error("Unknown source root for " + (name ? "package " + name : "app"));
    }

    return sourceRoot;
  };

  InputFile.prototype.getPathInPackage = function getPathInPackage() {
    var self = this;
    return self._resourceSlot.inputResource.path;
  };

  InputFile.prototype.getFileOptions = function getFileOptions() {
    var self = this;
    // XXX fileOptions only exists on some resources (of type "source"). The JS
    // resources might not have this property.
    return self._resourceSlot.inputResource.fileOptions || {};
  };

  InputFile.prototype.readAndWatchFileWithHash = function readAndWatchFileWithHash(path) {
    var osPath = files.convertToOSPath(path);
    var sourceRoot = this.getSourceRoot();
    var relPath = files.pathRelative(sourceRoot, osPath);
    if (relPath.startsWith("..")) {
      throw new Error('Attempting to read file outside ' + (this.getPackageName() || "the app") + ': ' + osPath);
    }
    var sourceBatch = this._resourceSlot.packageSourceBatch;
    return _readAndWatchFileWithHash(sourceBatch.unibuild.watchSet, osPath);
  };

  InputFile.prototype.readAndWatchFile = function readAndWatchFile(path) {
    return this.readAndWatchFileWithHash(path).contents;
  };

  InputFile.prototype._stat = function _stat(absPath) {
    return _.has(this._statCache, absPath) ? this._statCache[absPath] : this._statCache[absPath] = optimisticStatOrNull(absPath);
  };

  // Search ancestor directories for control files (e.g. package.json,
  // .babelrc), and return the absolute path of the first one found, or
  // null if the search failed.


  InputFile.prototype.findControlFile = function findControlFile(basename) {
    var absPath = this._controlFileCache[basename];
    if (typeof absPath === "string") {
      return absPath;
    }

    var sourceRoot = this._resourceSlot.packageSourceBatch.sourceRoot;
    if (!_.isString(sourceRoot)) {
      return this._controlFileCache[basename] = null;
    }

    var dir = files.pathDirname(this.getPathInPackage());
    while (true) {
      absPath = files.pathJoin(sourceRoot, dir, basename);

      var stat = this._stat(absPath);
      if (stat && stat.isFile()) {
        return this._controlFileCache[basename] = absPath;
      }

      if (files.pathBasename(dir) === "node_modules") {
        // The search for control files should not escape node_modules.
        return this._controlFileCache[basename] = null;
      }

      var parentDir = files.pathDirname(dir);
      if (parentDir === dir) break;
      dir = parentDir;
    }

    return this._controlFileCache[basename] = null;
  };

  InputFile.prototype._resolveCacheLookup = function _resolveCacheLookup(id, parentPath) {
    var byId = this._resolveCache[id];
    return byId && byId[parentPath];
  };

  InputFile.prototype._resolveCacheStore = function _resolveCacheStore(id, parentPath, resolved) {
    var byId = this._resolveCache[id];
    if (!byId) {
      byId = this._resolveCache[id] = Object.create(null);
    }
    return byId[parentPath] = resolved;
  };

  InputFile.prototype.resolve = function resolve(id, parentPath) {
    var batch = this._resourceSlot.packageSourceBatch;

    parentPath = parentPath || files.pathJoin(batch.sourceRoot, this.getPathInPackage());

    var resId = this._resolveCacheLookup(id, parentPath);
    if (resId) {
      return resId;
    }

    var parentStat = files.statOrNull(parentPath);
    if (!parentStat || !parentStat.isFile()) {
      throw new Error("Not a file: " + parentPath);
    }

    var resolver = batch.getResolver();
    var resolved = resolver.resolve(id, parentPath);

    if (resolved === "missing") {
      var error = new Error("Cannot find module '" + id + "'");
      error.code = "MODULE_NOT_FOUND";
      throw error;
    }

    return this._resolveCacheStore(id, parentPath, resolved.id);
  };

  InputFile.prototype.require = function (_require) {
    function require(_x, _x2) {
      return _require.apply(this, arguments);
    }

    require.toString = function () {
      return _require.toString();
    };

    return require;
  }(function (id, parentPath) {
    return require(this.resolve(id, parentPath));
  });

  InputFile.prototype.getArch = function getArch() {
    return this._resourceSlot.packageSourceBatch.processor.arch;
  };

  InputFile.prototype.getSourceHash = function getSourceHash() {
    return this._resourceSlot.inputResource.hash;
  };

  /**
   * @summary Returns the extension that matched the compiler plugin.
   * The longest prefix is preferred.
   * @returns {String}
   */


  InputFile.prototype.getExtension = function getExtension() {
    return this._resourceSlot.inputResource.extension;
  };

  /**
   * @summary Returns a list of symbols declared as exports in this target. The
   * result of `api.export('symbol')` calls in target's control file such as
   * package.js.
   * @memberof InputFile
   * @returns {String[]}
   */


  InputFile.prototype.getDeclaredExports = function getDeclaredExports() {
    var self = this;
    return self._resourceSlot.packageSourceBatch.unibuild.declaredExports;
  };

  /**
   * @summary Returns a relative path that can be used to form error messages or
   * other display properties. Can be used as an input to a source map.
   * @memberof InputFile
   * @returns {String}
   */


  InputFile.prototype.getDisplayPath = function getDisplayPath() {
    var self = this;
    return self._resourceSlot.packageSourceBatch.unibuild.pkg._getServePath(self.getPathInPackage());
  };

  /**
   * @summary Web targets only. Add a stylesheet to the document. Not available
   * for linter build plugins.
   * @param {Object} options
   * @param {String} options.path The requested path for the added CSS, may not
   * be satisfied if there are path conflicts.
   * @param {String} options.data The content of the stylesheet that should be
   * added.
   * @param {String|Object} options.sourceMap A stringified JSON
   * sourcemap, in case the stylesheet was generated from a different
   * file.
   * @memberOf InputFile
   * @instance
   */


  InputFile.prototype.addStylesheet = function addStylesheet(options) {
    var self = this;
    if (options.sourceMap && typeof options.sourceMap === 'string') {
      // XXX remove an anti-XSSI header? ")]}'\n"
      options.sourceMap = JSON.parse(options.sourceMap);
    }
    self._resourceSlot.addStylesheet(options);
  };

  /**
   * @summary Add JavaScript code. The code added will only see the
   * namespaces imported by this package as runtime dependencies using
   * ['api.use'](#PackageAPI-use). If the file being compiled was added
   * with the bare flag, the resulting JavaScript won't be wrapped in a
   * closure.
   * @param {Object} options
   * @param {String} options.path The path at which the JavaScript file
   * should be inserted, may not be honored in case of path conflicts.
   * @param {String} options.data The code to be added.
   * @param {String|Object} options.sourceMap A stringified JSON
   * sourcemap, in case the JavaScript file was generated from a
   * different file.
   * @memberOf InputFile
   * @instance
   */


  InputFile.prototype.addJavaScript = function addJavaScript(options) {
    var self = this;
    if (options.sourceMap && typeof options.sourceMap === 'string') {
      // XXX remove an anti-XSSI header? ")]}'\n"
      options.sourceMap = JSON.parse(options.sourceMap);
    }
    self._resourceSlot.addJavaScript(options);
  };

  /**
   * @summary Add a file to serve as-is to the browser or to include on
   * the browser, depending on the target. On the web, it will be served
   * at the exact path requested. For server targets, it can be retrieved
   * using `Assets.getText` or `Assets.getBinary`.
   * @param {Object} options
   * @param {String} options.path The path at which to serve the asset.
   * @param {Buffer|String} options.data The data that should be placed in the
   * file.
   * @param {String} [options.hash] Optionally, supply a hash for the output
   * file.
   * @memberOf InputFile
   * @instance
   */


  InputFile.prototype.addAsset = function addAsset(options) {
    var self = this;
    self._resourceSlot.addAsset(options);
  };

  /**
   * @summary Works in web targets only. Add markup to the `head` or `body`
   * section of the document.
   * @param  {Object} options
   * @param {String} options.section Which section of the document should
   * be appended to. Can only be "head" or "body".
   * @param {String} options.data The content to append.
   * @memberOf InputFile
   * @instance
   */


  InputFile.prototype.addHtml = function addHtml(options) {
    var self = this;
    self._resourceSlot.addHtml(options);
  };

  InputFile.prototype._reportError = function _reportError(message, info) {
    if (this.getFileOptions().lazy === true) {
      // Files with fileOptions.lazy === true were not explicitly added to
      // the source batch via api.addFiles or api.mainModule, so any
      // compilation errors should not be fatal until the files are
      // actually imported by the ImportScanner. Attempting compilation is
      // still important for lazy files that might end up being imported
      // later, which is why we defang the error here, instead of avoiding
      // compilation preemptively. Note also that exceptions thrown by the
      // compiler will still cause build errors.
      this._resourceSlot.addError(message, info);
    } else {
      _buildPluginModule$In.prototype._reportError.call(this, message, info);
    }
  };

  return InputFile;
}(buildPluginModule.InputFile);

var ResourceSlot = function () {
  function ResourceSlot(unibuildResourceInfo, sourceProcessor, packageSourceBatch) {
    _classCallCheck(this, ResourceSlot);

    var self = this;
    // XXX ideally this should be an classy object, but it's not.
    self.inputResource = unibuildResourceInfo;
    // Everything but JS.
    self.outputResources = [];
    // JS, which gets linked together at the end.
    self.jsOutputResources = [];
    self.sourceProcessor = sourceProcessor;
    self.packageSourceBatch = packageSourceBatch;

    if (self.inputResource.type === "source") {
      if (sourceProcessor) {
        // If we have a sourceProcessor, it will handle the adding of the
        // final processed JavaScript.
      } else if (self.inputResource.extension === "js") {
        // If there is no sourceProcessor for a .js file, add the source
        // directly to the output. #HardcodeJs
        self.addJavaScript({
          // XXX it's a shame to keep converting between Buffer and string, but
          // files.convertToStandardLineEndings only works on strings for now
          data: self.inputResource.data.toString('utf8'),
          path: self.inputResource.path,
          hash: self.inputResource.hash,
          bare: self.inputResource.fileOptions && (self.inputResource.fileOptions.bare ||
          // XXX eventually get rid of backward-compatibility "raw" name
          // XXX COMPAT WITH 0.6.4
          self.inputResource.fileOptions.raw)
        });
      }
    } else {
      if (sourceProcessor) {
        throw Error("sourceProcessor for non-source? " + JSON.stringify(unibuildResourceInfo));
      }
      // Any resource that isn't handled by compiler plugins just gets passed
      // through.
      if (self.inputResource.type === "js") {
        var resource = self.inputResource;
        if (!_.isString(resource.sourcePath)) {
          resource.sourcePath = self.inputResource.path;
        }
        if (!_.isString(resource.targetPath)) {
          resource.targetPath = resource.sourcePath;
        }
        self.jsOutputResources.push(resource);
      } else {
        self.outputResources.push(self.inputResource);
      }
    }
  }

  ResourceSlot.prototype._getOption = function _getOption(name, options) {
    if (options && _.has(options, name)) {
      return options[name];
    }
    var fileOptions = this.inputResource.fileOptions;
    return fileOptions && fileOptions[name];
  };

  ResourceSlot.prototype._isLazy = function _isLazy(options) {
    var lazy = this._getOption("lazy", options);

    if (typeof lazy === "boolean") {
      return lazy;
    }

    // If file.lazy was not previously defined, mark the file lazy if
    // it is contained by an imports directory. Note that any files
    // contained by a node_modules directory will already have been
    // marked lazy in PackageSource#_inferFileOptions. Same for
    // non-test files if running (non-full-app) tests (`meteor test`)
    if (!this.packageSourceBatch.useMeteorInstall) {
      return false;
    }

    var splitPath = this.inputResource.path.split(files.pathSep);
    var isInImports = splitPath.indexOf("imports") >= 0;

    if (global.testCommandMetadata && (global.testCommandMetadata.isTest || global.testCommandMetadata.isAppTest)) {
      // test files should always be included, if we're running app
      // tests.
      return isInImports && !isTestFilePath(this.inputResource.path);
    } else {
      return isInImports;
    }
  };

  ResourceSlot.prototype.addStylesheet = function addStylesheet(options) {
    var self = this;
    if (!self.sourceProcessor) {
      throw Error("addStylesheet on non-source ResourceSlot?");
    }

    var data = files.convertToStandardLineEndings(options.data);
    var useMeteorInstall = self.packageSourceBatch.useMeteorInstall;
    var sourcePath = this.inputResource.path;
    var targetPath = options.path || sourcePath;
    var resource = {
      refreshable: true,
      sourcePath: sourcePath,
      targetPath: targetPath,
      servePath: self.packageSourceBatch.unibuild.pkg._getServePath(targetPath),
      hash: sha1(data),
      lazy: this._isLazy(options)
    };

    if (useMeteorInstall && resource.lazy) {
      // If the current packageSourceBatch supports modules, and this CSS
      // file is lazy, add it as a lazy JS module instead of adding it
      // unconditionally as a CSS resource, so that it can be imported
      // when needed.
      resource.type = "js";
      resource.data = new Buffer(cssToCommonJS(data, resource.hash), "utf8");

      self.jsOutputResources.push(resource);
    } else {
      // Eager CSS is added unconditionally to a combined <style> tag at
      // the beginning of the <head>. If the corresponding module ever
      // gets imported, its module.exports object should be an empty stub,
      // rather than a <style> node added dynamically to the <head>.
      self.jsOutputResources.push(_extends({}, resource, {
        type: "js",
        data: new Buffer("// These styles have already been applied to the document.\n", "utf8"),
        // If a compiler plugin calls addJavaScript with the same
        // sourcePath, that code should take precedence over this empty
        // stub, so this property marks the resource as disposable.
        emtpyStub: true,
        lazy: true
      }));

      resource.type = "css";
      resource.data = new Buffer(data, 'utf8'),

      // XXX do we need to call convertSourceMapPaths here like we did
      //     in legacy handlers?
      resource.sourceMap = options.sourceMap;

      self.outputResources.push(resource);
    }
  };

  ResourceSlot.prototype.addJavaScript = function addJavaScript(options) {
    var self = this;
    // #HardcodeJs this gets called by constructor in the "js" case
    if (!self.sourceProcessor && self.inputResource.extension !== "js") {
      throw Error("addJavaScript on non-source ResourceSlot?");
    }

    var sourcePath = self.inputResource.path;
    if (_.has(options, "sourcePath") && typeof options.sourcePath === "string") {
      sourcePath = options.sourcePath;
    }

    var targetPath = options.path || sourcePath;

    var data = new Buffer(files.convertToStandardLineEndings(options.data), 'utf8');

    self.jsOutputResources.push({
      type: "js",
      data: data,
      sourcePath: sourcePath,
      targetPath: targetPath,
      servePath: self.packageSourceBatch.unibuild.pkg._getServePath(targetPath),
      // XXX should we allow users to be trusted and specify a hash?
      hash: sha1(data),
      // XXX do we need to call convertSourceMapPaths here like we did
      //     in legacy handlers?
      sourceMap: options.sourceMap,
      // intentionally preserve a possible `undefined` value for files
      // in apps, rather than convert it into `false` via `!!`
      lazy: self._isLazy(options),
      bare: !!self._getOption("bare", options),
      mainModule: !!self._getOption("mainModule", options)
    });
  };

  ResourceSlot.prototype.addAsset = function addAsset(options) {
    var self = this;
    if (!self.sourceProcessor) {
      throw Error("addAsset on non-source ResourceSlot?");
    }

    if (!(options.data instanceof Buffer)) {
      if (_.isString(options.data)) {
        options.data = new Buffer(options.data);
      } else {
        throw new Error("'data' option to addAsset must be a Buffer or String.");
      }
    }

    self.outputResources.push({
      type: 'asset',
      data: options.data,
      path: options.path,
      servePath: self.packageSourceBatch.unibuild.pkg._getServePath(options.path),
      hash: sha1(options.data),
      lazy: self._isLazy(options)
    });
  };

  ResourceSlot.prototype.addHtml = function addHtml(options) {
    var self = this;
    var unibuild = self.packageSourceBatch.unibuild;

    if (!archinfo.matches(unibuild.arch, "web")) {
      throw new Error("Document sections can only be emitted to " + "web targets: " + self.inputResource.path);
    }
    if (options.section !== "head" && options.section !== "body") {
      throw new Error("'section' must be 'head' or 'body': " + self.inputResource.path);
    }
    if (typeof options.data !== "string") {
      throw new Error("'data' option to appendDocument must be a string: " + self.inputResource.path);
    }

    self.outputResources.push({
      type: options.section,
      data: new Buffer(files.convertToStandardLineEndings(options.data), 'utf8'),
      lazy: self._isLazy(options)
    });
  };

  ResourceSlot.prototype.addError = function addError(message, info) {
    // If this file is ever actually imported, only then will we report
    // the error. Use this.jsOutputResources because that's what the
    // ImportScanner deals with.
    this.jsOutputResources.push({
      type: "js",
      sourcePath: this.inputResource.path,
      targetPath: this.inputResource.path,
      servePath: this.inputResource.path,
      data: new Buffer("throw new Error(" + JSON.stringify(message) + ");\n", "utf8"),
      lazy: true,
      error: { message: message, info: info }
    });
  };

  return ResourceSlot;
}();

var babelRuntime = void 0;
function checkBabelRuntimeHelper(id) {
  if (!babelRuntime) {
    babelRuntime = require("../tool-env/isopackets.js").load("runtime")["babel-runtime"];
  }
  return babelRuntime.checkHelper(id);
}

var PackageSourceBatch = function () {
  function PackageSourceBatch(unibuild, processor, _ref2) {
    var sourceRoot = _ref2.sourceRoot;
    var linkerCacheDir = _ref2.linkerCacheDir;

    _classCallCheck(this, PackageSourceBatch);

    var self = this;
    buildmessage.assertInJob();

    self.unibuild = unibuild;
    self.processor = processor;
    self.sourceRoot = sourceRoot;
    self.linkerCacheDir = linkerCacheDir;
    self.importExtensions = [".js", ".json"];
    self._resolver = null;

    var sourceProcessorSet = self._getSourceProcessorSet();

    self.resourceSlots = [];
    unibuild.resources.forEach(function (resource) {
      var sourceProcessor = null;
      if (resource.type === "source") {
        var extension = resource.extension;
        if (extension === null) {
          var filename = files.pathBasename(resource.path);
          sourceProcessor = sourceProcessorSet.getByFilename(filename);
          if (!sourceProcessor) {
            buildmessage.error('no plugin found for ' + resource.path + ' in ' + (unibuild.pkg.displayName() + '; a plugin for ' + filename + ' ') + 'was active when it was published but none is now');
            return;
            // recover by ignoring
          }
        } else {
          sourceProcessor = sourceProcessorSet.getByExtension(extension);
          // If resource.extension === 'js', it's ok for there to be no
          // sourceProcessor, since we #HardcodeJs in ResourceSlot.
          if (!sourceProcessor && extension !== 'js') {
            buildmessage.error('no plugin found for ' + resource.path + ' in ' + (unibuild.pkg.displayName() + '; a plugin for *.' + extension + ' ') + 'was active when it was published but none is now');
            return;
            // recover by ignoring
          }

          self.addImportExtension(extension);
        }
      }

      self.resourceSlots.push(new ResourceSlot(resource, sourceProcessor, self));
    });

    // Compute imports by merging the exports of all of the packages we
    // use. Note that in the case of conflicting symbols, later packages get
    // precedence.
    //
    // We don't get imports from unordered dependencies (since they
    // may not be defined yet) or from
    // weak/debugOnly/prodOnly/testOnly dependencies (because the
    // meaning of a name shouldn't be affected by the non-local
    // decision of whether or not an unrelated package in the target
    // depends on something).
    self.importedSymbolToPackageName = {}; // map from symbol to supplying package name

    compiler.eachUsedUnibuild({
      dependencies: self.unibuild.uses,
      arch: self.processor.arch,
      isopackCache: self.processor.isopackCache,
      skipUnordered: true,
      // don't import symbols from debugOnly, prodOnly and testOnly packages, because
      // if the package is not linked it will cause a runtime error.
      // the code must access them with `Package["my-package"].MySymbol`.
      skipDebugOnly: true,
      skipProdOnly: true,
      skipTestOnly: true
    }, function (depUnibuild) {
      _.each(depUnibuild.declaredExports, function (symbol) {
        // Slightly hacky implementation of test-only exports.
        if (!symbol.testOnly || self.unibuild.pkg.isTest) {
          self.importedSymbolToPackageName[symbol.name] = depUnibuild.pkg.name;
        }
      });
    });

    self.useMeteorInstall = _.isString(self.sourceRoot) && self.processor.isopackCache.uses(self.unibuild.pkg, "modules", self.unibuild.arch);
  }

  PackageSourceBatch.prototype.addImportExtension = function addImportExtension(extension) {
    extension = extension.toLowerCase();

    if (!extension.startsWith(".")) {
      extension = "." + extension;
    }

    if (this.importExtensions.indexOf(extension) < 0) {
      this.importExtensions.push(extension);
    }
  };

  PackageSourceBatch.prototype.getResolver = function getResolver() {
    if (this._resolver) {
      return this._resolver;
    }

    var nmds = this.unibuild.nodeModulesDirectories;
    var nodeModulesPaths = [];

    _.each(nmds, function (nmd, path) {
      if (!nmd.local) {
        nodeModulesPaths.push(files.convertToOSPath(path.replace(/\/$/g, "")));
      }
    });

    return this._resolver = Resolver.getOrCreate({
      caller: "PackageSourceBatch#getResolver",
      sourceRoot: this.sourceRoot,
      targetArch: this.processor.arch,
      extensions: this.importExtensions,
      nodeModulesPaths: nodeModulesPaths
    });
  };

  PackageSourceBatch.prototype._getSourceProcessorSet = function _getSourceProcessorSet() {
    var self = this;

    buildmessage.assertInJob();

    var isopack = self.unibuild.pkg;
    var activePluginPackages = compiler.getActivePluginPackages(isopack, {
      uses: self.unibuild.uses,
      isopackCache: self.processor.isopackCache
    });
    var sourceProcessorSet = new buildPluginModule.SourceProcessorSet(isopack.displayName(), { hardcodeJs: true });

    _.each(activePluginPackages, function (otherPkg) {
      otherPkg.ensurePluginsInitialized();

      sourceProcessorSet.merge(otherPkg.sourceProcessors.compiler, { arch: self.processor.arch });
    });

    return sourceProcessorSet;
  };

  // Returns a map from package names to arrays of JS output files.


  PackageSourceBatch.computeJsOutputFilesMap = function computeJsOutputFilesMap(sourceBatches) {
    var map = new Map();

    sourceBatches.forEach(function (batch) {
      var name = batch.unibuild.pkg.name || null;
      var inputFiles = [];

      batch.resourceSlots.forEach(function (slot) {
        inputFiles.push.apply(inputFiles, _toConsumableArray(slot.jsOutputResources));
      });

      map.set(name, {
        files: inputFiles,
        importExtensions: batch.importExtensions
      });
    });

    if (!map.has("modules")) {
      // In the unlikely event that no package is using the modules
      // package, then the map is already complete, and we don't need to
      // do any import scanning.
      return map;
    }

    // Append install(<name>) calls to the install-packages.js file in the
    // modules package for every Meteor package name used.
    map.get("modules").files.some(function (file) {
      if (file.sourcePath !== "install-packages.js") {
        return false;
      }

      var meteorPackageInstalls = [];

      map.forEach(function (info, name) {
        if (!name) return;

        var mainModule = _.find(info.files, function (file) {
          return file.mainModule;
        });
        mainModule = mainModule ? 'meteor/' + name + '/' + mainModule.targetPath : false;

        meteorPackageInstalls.push("install(" + JSON.stringify(name) + (mainModule ? ", " + JSON.stringify(mainModule) : '') + ");\n");
      });

      if (meteorPackageInstalls.length === 0) {
        return false;
      }

      file.data = new Buffer(file.data.toString("utf8") + "\n" + meteorPackageInstalls.join(""), "utf8");

      file.hash = sha1(file.data);

      return true;
    });

    var allMissingNodeModules = Object.create(null);
    // Records the subset of allMissingNodeModules that were successfully
    // relocated to a source batch that could handle them.
    var allRelocatedNodeModules = Object.create(null);
    var scannerMap = new Map();

    sourceBatches.forEach(function (batch) {
      var name = batch.unibuild.pkg.name || null;
      var isApp = !name;

      if (!batch.useMeteorInstall && !isApp) {
        // If this batch represents a package that does not use the module
        // system, then we don't need to scan its dependencies.
        return;
      }

      var nodeModulesPaths = [];
      _.each(batch.unibuild.nodeModulesDirectories, function (nmd, sourcePath) {
        if (!nmd.local) {
          // Local node_modules directories will be found by the
          // ImportScanner, but we need to tell it about any external
          // node_modules directories (e.g. .npm/package/node_modules).
          nodeModulesPaths.push(sourcePath);
        }
      });

      var scanner = new ImportScanner({
        name: name,
        bundleArch: batch.processor.arch,
        extensions: batch.importExtensions,
        sourceRoot: batch.sourceRoot,
        nodeModulesPaths: nodeModulesPaths,
        watchSet: batch.unibuild.watchSet
      });

      scanner.addInputFiles(map.get(name).files);

      if (batch.useMeteorInstall) {
        scanner.scanImports();
        _.extend(allMissingNodeModules, scanner.allMissingNodeModules);
      }

      scannerMap.set(name, scanner);
    });

    function handleMissing(missingNodeModules) {
      var missingMap = new Map();

      _.each(missingNodeModules, function (info, id) {
        var parts = id.split("/");
        var name = null;

        if (parts[0] === "meteor") {
          if (parts.length > 2) {
            name = parts[1];
            parts[1] = ".";
            id = parts.slice(1).join("/");
          } else {
            return;
          }
        }

        if (!scannerMap.has(name)) {
          return;
        }

        if (!missingMap.has(name)) {
          missingMap.set(name, {});
        }

        var missing = missingMap.get(name);
        if (!_.has(missing, id) || !info.possiblySpurious) {
          // Allow any non-spurious identifier to replace an existing
          // possibly spurious identifier.
          missing[id] = info;
        }
      });

      var nextMissingNodeModules = Object.create(null);

      missingMap.forEach(function (ids, name) {
        var _scannerMap$get$addNo = scannerMap.get(name).addNodeModules(ids);

        var newlyAdded = _scannerMap$get$addNo.newlyAdded;
        var newlyMissing = _scannerMap$get$addNo.newlyMissing;

        _.extend(allRelocatedNodeModules, newlyAdded);
        _.extend(nextMissingNodeModules, newlyMissing);
      });

      if (!_.isEmpty(nextMissingNodeModules)) {
        handleMissing(nextMissingNodeModules);
      }
    }

    handleMissing(allMissingNodeModules);

    _.each(allRelocatedNodeModules, function (info, id) {
      delete allMissingNodeModules[id];
    });

    this._warnAboutMissingModules(allMissingNodeModules);

    var meteorProvidesBabelRuntime = map.has("babel-runtime");

    scannerMap.forEach(function (scanner, name) {
      var isApp = !name;
      var isWeb = scanner.isWeb();
      var outputFiles = scanner.getOutputFiles();

      if (isApp) {
        (function () {
          var appFilesWithoutNodeModules = [];

          outputFiles.forEach(function (file) {
            var parts = file.installPath.split("/");

            if (meteorProvidesBabelRuntime || !isWeb) {
              // If the Meteor babel-runtime package is installed, it will
              // provide implementations for babel-runtime/helpers/* and
              // babel-runtime/regenerator at runtime, so we should filter
              // out any node_modules/babel-runtime/* modules from the app.
              // If the Meteor babel-runtime package is not installed, then
              // we should rely on node_modules/babel-runtime/* instead. On
              // the server that still means removing bundled files here and
              // relying on programs/server/npm/node_modules/babel-runtime,
              // but on the web these bundled files are all we have, so we'd
              // better not remove them.
              if (checkBabelRuntimeHelper(file.installPath)) {
                return;
              }
            }

            var nodeModulesIndex = parts.indexOf("node_modules");

            if (nodeModulesIndex === -1 || nodeModulesIndex === 0 && parts[1] === "meteor") {
              appFilesWithoutNodeModules.push(file);
            } else {
              // This file is going to be installed in a node_modules
              // directory, so we move it to the modules bundle so that it
              // can be imported by any package that uses the modules
              // package. Note that this includes all files within any
              // node_modules directory in the app, even though packages in
              // client/node_modules will not be importable by Meteor
              // packages, because it's important for all npm packages in
              // the app to share the same limited scope (i.e. the scope of
              // the modules package).
              map.get("modules").files.push(file);
            }
          });

          map.get(null).files = appFilesWithoutNodeModules;
        })();
      } else {
        map.get(name).files = outputFiles;
      }
    });

    return map;
  };

  PackageSourceBatch._warnAboutMissingModules = function _warnAboutMissingModules(missingNodeModules) {
    var topLevelMissingIDs = {};
    var warnings = [];

    _.each(missingNodeModules, function (info, id) {
      if (info.packageName) {
        // Silence warnings generated by Meteor packages, since package
        // authors can be trusted to test their packages, and may have
        // different/better approaches to ensuring their dependencies are
        // available. This blanket check makes some of the checks below
        // redundant, but I would rather create a bit of dead code than
        // risk introducing bugs when/if this check is reverted.
        return;
      }

      if (info.possiblySpurious) {
        // Silence warnings for missing dependencies in Browserify/Webpack
        // bundles, since we can reasonably conclude at this point that
        // they are false positives.
        return;
      }

      if (id in serverLibPackages && archinfo.matches(info.bundleArch, "os")) {
        // Packages in dev_bundle/server-lib/node_modules can always be
        // resolved at runtime on the server, so we don't need to warn
        // about them here.
        return;
      }

      if (id === "meteor-node-stubs" && info.packageName === "modules" && info.parentPath.endsWith("stubs.js")) {
        // Don't warn about the require("meteor-node-stubs") call in
        // packages/modules/stubs.js.
        return;
      }

      var parts = id.split("/");

      if ("./".indexOf(id.charAt(0)) < 0) {
        var packageDir = parts[0];
        if (packageDir === "meteor") {
          // Don't print warnings for uninstalled Meteor packages.
          return;
        }

        if (checkBabelRuntimeHelper(id)) {
          // Don't print warnings for babel-runtime/helpers/* modules,
          // since we provide most of those.
          return;
        }

        if (!_.has(topLevelMissingIDs, packageDir)) {
          // This information will be used to recommend installing npm
          // packages below.
          topLevelMissingIDs[packageDir] = id;
        }

        if (id.startsWith("meteor-node-stubs/deps/")) {
          // Instead of printing a warning that meteor-node-stubs/deps/fs
          // is missing, warn about the "fs" module, but still recommend
          // installing meteor-node-stubs via npm below.
          id = parts.slice(2).join("/");
        }
      } else if (info.packageName) {
        // Disable warnings about relative module resolution failures in
        // Meteor packages, since there's not much the application
        // developer can do about those.
        return;
      }

      warnings.push('  ' + JSON.stringify(id) + ' in ' + info.parentPath + ' (' + info.bundleArch + ')');
    });

    if (warnings.length > 0) {
      Console.rawWarn("\nUnable to resolve some modules:\n\n");
      warnings.forEach(function (text) {
        return Console.warn(text);
      });
      Console.warn();

      var topLevelKeys = Object.keys(topLevelMissingIDs);
      if (topLevelKeys.length > 0) {
        Console.warn("If you notice problems related to these missing modules, consider running:");
        Console.warn();
        Console.warn("  meteor npm install --save " + topLevelKeys.join(" "));
        Console.warn();
      }
    }
  };

  // Called by bundler's Target._emitResources.  It returns the actual resources
  // that end up in the program for this package.  By this point, it knows what
  // its dependencies are and what their exports are, so it can set up
  // linker-style imports and exports.


  PackageSourceBatch.prototype.getResources = function getResources(_ref3) {
    var jsResources = _ref3.files;
    var _ref3$importExtension = _ref3.importExtensions;
    var importExtensions = _ref3$importExtension === undefined ? [".js", ".json"] : _ref3$importExtension;

    buildmessage.assertInJob();

    function flatten(arrays) {
      return Array.prototype.concat.apply([], arrays);
    }

    var resources = flatten(_.pluck(this.resourceSlots, 'outputResources'));

    resources.push.apply(resources, _toConsumableArray(this._linkJS(jsResources || flatten(_.pluck(this.resourceSlots, 'jsOutputResources')), this.useMeteorInstall && {
      extensions: importExtensions
    })));

    return resources;
  };

  PackageSourceBatch.prototype._linkJS = function _linkJS(jsResources, meteorInstallOptions) {
    var self = this;
    buildmessage.assertInJob();

    var bundleArch = self.processor.arch;

    // Run the linker.
    var isApp = !self.unibuild.pkg.name;
    var isWeb = archinfo.matches(self.unibuild.arch, "web");
    var linkerOptions = {
      useGlobalNamespace: isApp,
      meteorInstallOptions: meteorInstallOptions,
      // I was confused about this, so I am leaving a comment -- the
      // combinedServePath is either [pkgname].js or [pluginName]:plugin.js.
      // XXX: If we change this, we can get rid of source arch names!
      combinedServePath: isApp ? "/app.js" : "/packages/" + colonConverter.convert(self.unibuild.pkg.name + (self.unibuild.kind === "main" ? "" : ":" + self.unibuild.kind) + ".js"),
      name: self.unibuild.pkg.name || null,
      declaredExports: _.pluck(self.unibuild.declaredExports, 'name'),
      imports: self.importedSymbolToPackageName,
      // XXX report an error if there is a package called global-imports
      importStubServePath: isApp && '/packages/global-imports.js',
      includeSourceMapInstructions: isWeb,
      noLineNumbers: !isWeb
    };

    var cacheKey = sha1(JSON.stringify({
      LINKER_CACHE_SALT: LINKER_CACHE_SALT,
      linkerOptions: linkerOptions,
      files: jsResources.map(function (inputFile) {
        return {
          hash: inputFile.hash,
          installPath: inputFile.installPath,
          sourceMap: !!inputFile.sourceMap,
          mainModule: inputFile.mainModule,
          imported: inputFile.imported,
          lazy: inputFile.lazy,
          bare: inputFile.bare
        };
      })
    }));

    {
      var inMemoryCached = LINKER_CACHE.get(cacheKey);
      if (inMemoryCached) {
        if (CACHE_DEBUG) {
          console.log('LINKER IN-MEMORY CACHE HIT:', linkerOptions.name, bundleArch);
        }
        return inMemoryCached;
      }
    }

    var cacheFilename = self.linkerCacheDir && files.pathJoin(self.linkerCacheDir, cacheKey + '.cache');

    // The return value from _linkJS includes Buffers, but we want everything to
    // be JSON for writing to the disk cache. This function converts the string
    // version to the Buffer version.
    function bufferifyJSONReturnValue(resources) {
      resources.forEach(function (r) {
        r.data = new Buffer(r.data, 'utf8');
      });
    }

    if (cacheFilename) {
      var diskCached = null;
      try {
        diskCached = files.readJSONOrNull(cacheFilename);
      } catch (e) {
        // Ignore JSON parse errors; pretend there was no cache.
        if (!(e instanceof SyntaxError)) {
          throw e;
        }
      }
      if (diskCached && diskCached instanceof Array) {
        // Fix the non-JSON part of our return value.
        bufferifyJSONReturnValue(diskCached);
        if (CACHE_DEBUG) {
          console.log('LINKER DISK CACHE HIT:', linkerOptions.name, bundleArch);
        }
        // Add the bufferized value of diskCached to the in-memory LRU cache
        // so we don't have to go to disk next time.
        LINKER_CACHE.set(cacheKey, diskCached);
        return diskCached;
      }
    }

    if (CACHE_DEBUG) {
      console.log('LINKER CACHE MISS:', linkerOptions.name, bundleArch);
    }

    // nb: linkedFiles might be aliased to an entry in LINKER_CACHE, so don't
    // mutate anything from it.
    var canCache = true;
    var linkedFiles = null;
    buildmessage.enterJob('linking', function () {
      linkedFiles = linker.fullLink(jsResources, linkerOptions);
      if (buildmessage.jobHasMessages()) {
        canCache = false;
      }
    });
    // Add each output as a resource
    var ret = linkedFiles.map(function (file) {
      var sm = typeof file.sourceMap === 'string' ? JSON.parse(file.sourceMap) : file.sourceMap;
      return {
        type: "js",
        // This is a string... but we will convert it to a Buffer
        // before returning from the method (but after writing
        // to cache).
        data: file.source,
        servePath: file.servePath,
        sourceMap: sm
      };
    });

    var retAsJSON = void 0;
    if (canCache && cacheFilename) {
      retAsJSON = JSON.stringify(ret);
    }

    // Convert strings to buffers, now that we've serialized it.
    bufferifyJSONReturnValue(ret);

    if (canCache) {
      LINKER_CACHE.set(cacheKey, ret);
      if (cacheFilename) {
        // Write asynchronously.
        Fiber(function () {
          return files.writeFileAtomically(cacheFilename, retAsJSON);
        }).run();
      }
    }

    return ret;
  };

  return PackageSourceBatch;
}();

_.each(["getResources", "_linkJS"], function (method) {
  var proto = PackageSourceBatch.prototype;
  proto[method] = Profile("PackageSourceBatch#" + method, proto[method]);
});

// static methods to measure in profile
_.each(["computeJsOutputFilesMap"], function (method) {
  PackageSourceBatch[method] = Profile("PackageSourceBatch." + method, PackageSourceBatch[method]);
});
//# sourceMappingURL=compiler-plugin.js.map