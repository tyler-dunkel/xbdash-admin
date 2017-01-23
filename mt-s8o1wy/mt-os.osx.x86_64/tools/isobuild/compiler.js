module.export({getActivePluginPackages:function(){return getActivePluginPackages},isIsobuildFeaturePackage:function(){return isIsobuildFeaturePackage},KNOWN_ISOBUILD_FEATURE_PACKAGES:function(){return KNOWN_ISOBUILD_FEATURE_PACKAGES}});var _extends;module.import('babel-runtime/helpers/extends',{"default":function(v){_extends=v}});var SourceProcessorSet;module.import('./build-plugin.js',{"SourceProcessorSet":function(v){SourceProcessorSet=v}});var optimisticReadFile,optimisticHashOrNull;module.import("../fs/optimistic.js",{"optimisticReadFile":function(v){optimisticReadFile=v},"optimisticHashOrNull":function(v){optimisticHashOrNull=v}});
var _ = require('underscore');

var archinfo = require('../utils/archinfo.js');
var buildmessage = require('../utils/buildmessage.js');
var bundler = require('./bundler.js');
var isopack = require('./isopack.js');
var meteorNpm = require('./meteor-npm.js');
var watch = require('../fs/watch.js');
var Console = require('../console/console.js').Console;
var files = require('../fs/files.js');
var colonConverter = require('../utils/colon-converter.js');
var linterPluginModule = require('./linter-plugin.js');
var compileStepModule = require('./compiler-deprecated-compile-step.js');
var Profile = require('../tool-env/profile.js').Profile;




var compiler = exports;

// Whenever you change anything about the code that generates isopacks, bump
// this version number. The idea is that the "format" field of the isopack
// JSON file only changes when the actual specified structure of the
// isopack/unibuild changes, but this version (which is build-tool-specific)
// can change when the the contents (not structure) of the built output
// changes. So eg, if we improve the linker's static analysis, this should be
// bumped.
//
// You should also update this whenever you update any of the packages used
// directly by the isopack creation process since they do not end up as watched
// dependencies. (At least for now, packages only used in target creation (eg
// minifiers) don't require you to update BUILT_BY, though you will need to quit
// and rerun "meteor run".)
compiler.BUILT_BY = 'meteor/24';

// This is a list of all possible architectures that a build can target. (Client
// is expanded into 'web.browser' and 'web.cordova')
compiler.ALL_ARCHES = ["os", "web.browser", "web.cordova"];

compiler.compile = Profile(function (packageSource, options) {
  return 'compiler.compile(' + (packageSource.name || 'the app') + ')';
}, function (packageSource, options) {
  buildmessage.assertInCapture();

  var packageMap = options.packageMap;
  var isopackCache = options.isopackCache;
  var includeCordovaUnibuild = options.includeCordovaUnibuild;

  var pluginWatchSet = packageSource.pluginWatchSet.clone();
  var plugins = {};

  var pluginProviderPackageNames = {};

  // Build plugins
  _.each(packageSource.pluginInfo, function (info) {
    buildmessage.enterJob({
      title: "building plugin `" + info.name + "` in package `" + packageSource.name + "`",
      rootPath: packageSource.sourceRoot
    }, function () {
      // XXX we should probably also pass options.noLineNumbers into
      //     buildJsImage so it can pass it back to its call to
      //     compiler.compile
      var buildResult = bundler.buildJsImage({
        name: info.name,
        packageMap: packageMap,
        isopackCache: isopackCache,
        use: info.use,
        sourceRoot: packageSource.sourceRoot,
        sources: info.sources,
        // While we're not actually "serving" the file, the serveRoot is used to
        // calculate file names in source maps.
        serveRoot: 'packages/' + packageSource.name,
        npmDependencies: info.npmDependencies,
        // Plugins have their own npm dependencies separate from the
        // rest of the package, so they need their own separate npm
        // shrinkwrap and cache state.
        npmDir: files.pathResolve(files.pathJoin(packageSource.sourceRoot, '.npm', 'plugin', colonConverter.convert(info.name)))
      });
      // Add this plugin's dependencies to our "plugin dependency"
      // WatchSet. buildResult.watchSet will end up being the merged
      // watchSets of all of the unibuilds of the plugin -- plugins have
      // only one unibuild and this should end up essentially being just
      // the source files of the plugin.
      //
      // Note that we do this even on error, so that you can fix the error
      // and have the runner restart.
      pluginWatchSet.merge(buildResult.watchSet);

      if (buildmessage.jobHasMessages()) {
        return;
      }

      _.each(buildResult.usedPackageNames, function (packageName) {
        pluginProviderPackageNames[packageName] = true;
      });

      // Register the built plugin's code.
      if (!_.has(plugins, info.name)) {
        plugins[info.name] = {};
      }
      plugins[info.name][buildResult.image.arch] = buildResult.image;
    });
  });

  // Grab any npm dependencies. Keep them in a cache in the package
  // source directory so we don't have to do this from scratch on
  // every build.
  //
  // Go through a specialized npm dependencies update process,
  // ensuring we don't get new versions of any (sub)dependencies. This
  // process also runs mostly safely multiple times in parallel (which
  // could happen if you have two apps running locally using the same
  // package).
  //
  // We run this even if we have no dependencies, because we might
  // need to delete dependencies we used to have.
  var nodeModulesPath = null;
  if (packageSource.npmCacheDirectory) {
    if (meteorNpm.updateDependencies(packageSource.name, packageSource.npmCacheDirectory, packageSource.npmDependencies)) {
      nodeModulesPath = files.pathJoin(packageSource.npmCacheDirectory, 'node_modules');
    }
  }

  // Find all the isobuild:* pseudo-packages that this package depends on. Why
  // do we need to do this? Well, we actually load the plugins in this package
  // before we've fully compiled the package --- plugins are loaded before the
  // compiler builds the unibuilds in this package (because plugins are allowed
  // to act on the package itself). But when we load plugins, we need to know if
  // the package depends on (eg) isobuild:compiler-plugin, to know if the plugin
  // is allowed to call Plugin.registerCompiler. At this point, the Isopack
  // object doesn't yet have any unibuilds... but isopack.js doesn't have access
  // to the PackageSource either (because it needs to work with both
  // compiled-from-source and loaded-from-disk packages). So we need to make
  // sure here that the Isopack has *some* reference to the isobuild features
  // which the unibuilds depend on, so we do it here (and also in
  // Isopack#initFromPath).
  var isobuildFeatures = [];
  packageSource.architectures.forEach(function (sourceArch) {
    sourceArch.uses.forEach(function (use) {
      if (!use.weak && isIsobuildFeaturePackage(use['package']) && isobuildFeatures.indexOf(use['package']) === -1) {
        isobuildFeatures.push(use['package']);
      }
    });
  });
  isobuildFeatures = _.uniq(isobuildFeatures);

  var isopk = new isopack.Isopack();
  isopk.initFromOptions({
    name: packageSource.name,
    metadata: packageSource.metadata,
    version: packageSource.version,
    isTest: packageSource.isTest,
    plugins: plugins,
    pluginWatchSet: pluginWatchSet,
    cordovaDependencies: packageSource.cordovaDependencies,
    npmDiscards: packageSource.npmDiscards,
    includeTool: packageSource.includeTool,
    debugOnly: packageSource.debugOnly,
    prodOnly: packageSource.prodOnly,
    testOnly: packageSource.testOnly,
    pluginCacheDir: options.pluginCacheDir,
    isobuildFeatures: isobuildFeatures
  });

  _.each(packageSource.architectures, function (architecture) {
    if (architecture.arch === 'web.cordova' && !includeCordovaUnibuild) {
      return;
    }

    files.withCache(function () {
      var unibuildResult = compileUnibuild({
        isopack: isopk,
        sourceArch: architecture,
        isopackCache: isopackCache,
        nodeModulesPath: nodeModulesPath,
        noLineNumbers: options.noLineNumbers
      });

      _.extend(pluginProviderPackageNames, unibuildResult.pluginProviderPackageNames);
    });
  });

  if (options.includePluginProviderPackageMap) {
    isopk.setPluginProviderPackageMap(packageMap.makeSubsetMap(_.keys(pluginProviderPackageNames)));
  }

  return isopk;
});

// options:
// - isopack
// - isopackCache
// - includeCordovaUnibuild
compiler.lint = Profile(function (packageSource, options) {
  return 'compiler.lint(' + (packageSource.name || 'the app') + ')';
}, function (packageSource, options) {
  // Note: the buildmessage context of compiler.lint and lintUnibuild is a
  // normal error message context (eg, there might be errors from initializing
  // plugins in getLinterSourceProcessorSet).  We return the linter warnings as
  // our return value.
  buildmessage.assertInJob();

  var warnings = new buildmessage._MessageSet();
  var linted = false;
  _.each(packageSource.architectures, function (architecture) {
    // skip Cordova if not required
    if (!options.includeCordovaUnibuild && architecture.arch === 'web.cordova') {
      return;
    }

    var unibuildWarnings = lintUnibuild({
      isopack: options.isopack,
      isopackCache: options.isopackCache,
      sourceArch: architecture
    });
    if (unibuildWarnings) {
      linted = true;
      warnings.merge(unibuildWarnings);
    }
  });
  return { warnings: warnings, linted: linted };
});

compiler.getMinifiers = function (packageSource, options) {
  buildmessage.assertInJob();

  var minifiers = [];
  _.each(packageSource.architectures, function (architecture) {
    var activePluginPackages = getActivePluginPackages(options.isopack, {
      isopackCache: options.isopackCache,
      uses: architecture.uses
    });

    _.each(activePluginPackages, function (otherPkg) {
      otherPkg.ensurePluginsInitialized();

      _.each(otherPkg.sourceProcessors.minifier.allSourceProcessors, function (sp) {
        minifiers.push(sp);
      });
    });
  });

  minifiers = _.uniq(minifiers);
  // check for extension-wise uniqness
  _.each(['js', 'css'], function (ext) {
    var plugins = _.filter(minifiers, function (plugin) {
      return _.contains(plugin.extensions, ext);
    });

    if (plugins.length > 1) {
      var packages = _.map(plugins, function (p) {
        return p.isopack.name;
      });
      buildmessage.error(packages.join(', ') + ': multiple packages registered minifiers for extension "' + ext + '".');
    }
  });

  return minifiers;
};

function getLinterSourceProcessorSet(_ref) {
  var isopack = _ref.isopack;
  var activePluginPackages = _ref.activePluginPackages;

  buildmessage.assertInJob();

  var sourceProcessorSet = new SourceProcessorSet(isopack.displayName, { allowConflicts: true });

  _.each(activePluginPackages, function (otherPkg) {
    otherPkg.ensurePluginsInitialized();

    sourceProcessorSet.merge(otherPkg.sourceProcessors.linter);
  });

  return sourceProcessorSet;
}

var lintUnibuild = function lintUnibuild(_ref2) {
  var isopack = _ref2.isopack;
  var isopackCache = _ref2.isopackCache;
  var sourceArch = _ref2.sourceArch;

  // Note: the buildmessage context of compiler.lint and lintUnibuild is a
  // normal error message context (eg, there might be errors from initializing
  // plugins in getLinterSourceProcessorSet).  We return the linter warnings as
  // our return value.
  buildmessage.assertInJob();

  var activePluginPackages = getActivePluginPackages(isopack, {
    isopackCache: isopackCache,
    uses: sourceArch.uses
  });

  var sourceProcessorSet = getLinterSourceProcessorSet({ isopack: isopack, activePluginPackages: activePluginPackages });
  // bail out early if we had trouble loading plugins or if we're not
  // going to lint anything
  if (buildmessage.jobHasMessages() || sourceProcessorSet.isEmpty()) {
    return null;
  }

  var unibuild = _.find(isopack.unibuilds, function (unibuild) {
    return archinfo.matches(unibuild.arch, sourceArch.arch);
  });

  if (!unibuild) {
    throw Error('No ' + sourceArch.arch + ' unibuild for ' + isopack.name + '!');
  }

  var _sourceArch$getFiles = sourceArch.getFiles(sourceProcessorSet, unibuild.watchSet);

  var sources = _sourceArch$getFiles.sources;


  var linterMessages = buildmessage.capture(function () {
    runLinters({
      isopackCache: isopackCache,
      sources: sources,
      sourceProcessorSet: sourceProcessorSet,
      inputSourceArch: sourceArch,
      watchSet: unibuild.watchSet
    });
  });
  return linterMessages;
};

// options.sourceArch is a SourceArch to compile.  Process all source files
// through the appropriate legacy handlers. Create a new Unibuild and add it to
// options.isopack.
//
// Returns a list of source files that were used in the compilation.
var compileUnibuild = Profile(function (options) {
  return 'compileUnibuild (' + (options.isopack.name || 'the app') + ')';
}, function (options) {
  buildmessage.assertInCapture();

  var isopk = options.isopack;
  var inputSourceArch = options.sourceArch;
  var isopackCache = options.isopackCache;
  var nodeModulesPath = options.nodeModulesPath;
  var noLineNumbers = options.noLineNumbers;

  var isApp = !inputSourceArch.pkg.name;
  var resources = [];
  var pluginProviderPackageNames = {};
  var watchSet = inputSourceArch.watchSet.clone();

  // *** Determine and load active plugins
  var activePluginPackages = getActivePluginPackages(isopk, {
    uses: inputSourceArch.uses,
    isopackCache: isopackCache,
    // If other package is built from source, then we need to rebuild this
    // package if any file in the other package that could define a plugin
    // changes.  getActivePluginPackages will add entries to this WatchSet.
    pluginProviderWatchSet: watchSet,
    pluginProviderPackageNames: pluginProviderPackageNames
  });

  // *** Assemble the SourceProcessorSet from the plugins. This data
  // structure lets us decide what to do with each file: which plugin
  // should process it in what method.
  //
  // We also build a SourceProcessorSet for this package's linters even
  // though we're not linting right now. This is so we can tell the
  // difference between an file added to a package as a linter config
  // file (not handled by any compiler), and a file that's truly not
  // handled by anything (which is an error unless explicitly declared
  // as a static asset).
  var sourceProcessorSet = void 0,
      linterSourceProcessorSet = void 0;
  buildmessage.enterJob("determining active plugins", function () {
    sourceProcessorSet = new SourceProcessorSet(isopk.displayName(), { hardcodeJs: true });

    activePluginPackages.forEach(function (otherPkg) {
      otherPkg.ensurePluginsInitialized();

      // Note that this may log a buildmessage if there are conflicts.
      sourceProcessorSet.merge(otherPkg.sourceProcessors.compiler);
    });

    // Used to excuse functions from the "undeclared static asset" check.
    linterSourceProcessorSet = getLinterSourceProcessorSet({
      activePluginPackages: activePluginPackages,
      isopack: isopk
    });
    if (buildmessage.jobHasMessages()) {
      // Recover by not calling getFiles and pretending there are no
      // items.
      sourceProcessorSet = null;
    }
  });

  // *** Determine source files
  // Note: the getFiles function isn't expected to add its
  // source files to watchSet; rather, the watchSet is for other
  // things that the getFiles consulted (such as directory
  // listings or, in some hypothetical universe, control files) to
  // determine its source files.
  var sourceProcessorFiles = sourceProcessorSet ? inputSourceArch.getFiles(sourceProcessorSet, watchSet) : {};
  var sources = sourceProcessorFiles.sources || [];
  var assets = sourceProcessorFiles.assets || [];

  var nodeModulesDirectories = Object.create(null);

  function addNodeModulesDirectory(options) {
    var nmd = new bundler.NodeModulesDirectory(options);
    nodeModulesDirectories[nmd.sourcePath] = nmd;
  }

  _.each(inputSourceArch.localNodeModulesDirs, function (info, dir) {
    addNodeModulesDirectory(_extends({
      packageName: inputSourceArch.pkg.name,
      sourceRoot: inputSourceArch.sourceRoot,
      sourcePath: files.pathJoin(inputSourceArch.sourceRoot, dir),
      // Npm.strip applies to local node_modules directories of Meteor
      // packages, as well as .npm/package/node_modules directories.
      npmDiscards: isopk.npmDiscards,
      local: true
    }, _.isObject(info) ? info : Object.prototype));
  });

  if (nodeModulesPath) {
    addNodeModulesDirectory({
      packageName: inputSourceArch.pkg.name,
      sourceRoot: inputSourceArch.sourceRoot,
      sourcePath: nodeModulesPath,
      npmDiscards: isopk.npmDiscards,
      local: false
    });

    // If this slice has node modules, we should consider the shrinkwrap file
    // to be part of its inputs. (This is a little racy because there's no
    // guarantee that what we read here is precisely the version that's used,
    // but it's better than nothing at all.)
    //
    // Note that this also means that npm modules used by plugins will get
    // this npm-shrinkwrap.json in their pluginDependencies (including for all
    // packages that depend on us)!  This is good: this means that a tweak to
    // an indirect dependency of the coffee-script npm module used by the
    // coffeescript package will correctly cause packages with *.coffee files
    // to be rebuilt.
    var shrinkwrapPath = nodeModulesPath.replace(/node_modules$/, 'npm-shrinkwrap.json');
    watch.readAndWatchFile(watchSet, shrinkwrapPath);
  }

  // This function needs to be factored out to support legacy handlers later on
  // in the compilation process
  function addAsset(contents, relPath, hash) {
    // XXX hack to strip out private and public directory names from app asset
    // paths
    if (!inputSourceArch.pkg.name) {
      relPath = relPath.replace(/^(private|public)\//, '');
    }

    resources.push({
      type: "asset",
      data: contents,
      path: relPath,
      servePath: colonConverter.convert(files.pathJoin(inputSourceArch.pkg.serveRoot, relPath)),
      hash: hash
    });
  }

  // Add all assets
  _.values(assets).forEach(function (asset) {
    var relPath = asset.relPath;
    var absPath = files.pathResolve(inputSourceArch.sourceRoot, relPath);

    // readAndWatchFileWithHash returns an object carrying a buffer with the
    // file-contents. The buffer contains the original data of the file (no EOL
    // transforms from the tools/files.js part).
    var file = watch.readAndWatchFileWithHash(watchSet, absPath);
    var hash = file.hash;
    var contents = file.contents;

    addAsset(contents, relPath, hash);
  });

  // Add and compile all source files
  _.values(sources).forEach(function (source) {
    var relPath = source.relPath;
    var fileOptions = _.clone(source.fileOptions) || {};
    var absPath = files.pathResolve(inputSourceArch.sourceRoot, relPath);
    var filename = files.pathBasename(relPath);

    // Find the handler for source files with this extension
    var classification = null;
    classification = sourceProcessorSet.classifyFilename(filename, inputSourceArch.arch);

    if (classification.type === 'wrong-arch') {
      // This file is for a compiler plugin but not for this arch. Skip it,
      // and don't even watch it.  (eg, skip CSS preprocessor files on the
      // server.)  This `return` skips this source file and goes on to the next
      // one.
      return;
    }

    if (classification.type === 'unmatched') {
      // This is not matched by any compiler plugin or legacy source handler,
      // but it was added as a source file.
      //
      // Prior to the batch-plugins project, these would be implicitly treated
      // as static assets. Now we consider this to be an error; you need to
      // explicitly tell that you want something to be a static asset by calling
      // addAssets or putting it in the public/private directories in an app.
      //
      // This is a backwards-incompatible change, but it doesn't affect
      // previously-published packages (because the check is occuring in the
      // compiler), and it doesn't affect apps (where random files outside of
      // private/public never end up in the source list anyway).
      //
      // As one special case, if a file is unmatched by the compiler
      // SourceProcessorSet but is matched by the linter SourceProcessorSet (ie,
      // a linter config file), we don't report an error; this is so that you
      // can run `api.addFiles('.jshintrc')` and have it work.  (This is only
      // relevant for packages.)  We don't put these files in the WatchSet,
      // though; that happens via compiler.lint.

      if (isApp) {
        // This shouldn't happen, because initFromAppDir's getFiles
        // should only return assets or sources which match
        // sourceProcessorSet.
        throw Error("app contains non-asset files without plugin? " + relPath + " - " + filename);
      }

      var linterClassification = linterSourceProcessorSet.classifyFilename(filename, inputSourceArch.arch);
      if (linterClassification.type !== 'unmatched') {
        // The linter knows about this, so we'll just ignore it instead of
        // throwing an error.
        return;
      }

      buildmessage.error('No plugin known to handle file \'' + relPath + '\'. If you want this file to be a static asset, use addAssets instead of addFiles; eg, api.addAssets(\'' + relPath + '\', \'client\').');
      // recover by ignoring
      return;
    }

    var contents = optimisticReadFile(absPath);
    var hash = optimisticHashOrNull(absPath);
    var file = { contents: contents, hash: hash };
    watchSet.addFile(absPath, hash);

    Console.nudge(true);

    if (contents === null) {
      // It really sucks to put this check here, since this isn't publish
      // code...
      // XXX We think this code can probably be deleted at this point because
      // people probably aren't trying to use files with colons in them any
      // more.
      if (source.relPath.match(/:/)) {
        buildmessage.error("Couldn't build this package on Windows due to the following file " + "with a colon -- " + source.relPath + ". Please rename and " + "and re-publish the package.");
      } else {
        buildmessage.error("File not found: " + source.relPath);
      }

      // recover by ignoring (but still watching the file)
      return;
    }

    if (classification.isNonLegacySource()) {
      // This is source used by a new-style compiler plugin; it will be fully
      // processed later in the bundler.
      resources.push({
        type: "source",
        extension: classification.extension || null,
        usesDefaultSourceProcessor: !!classification.usesDefaultSourceProcessor,
        data: contents,
        path: relPath,
        hash: hash,
        fileOptions: fileOptions
      });
      return;
    }

    if (classification.type !== 'legacy-handler') {
      throw Error("unhandled type: " + classification.type);
    }

    // OK, time to handle legacy handlers.
    var compileStep = compileStepModule.makeCompileStep(source, file, inputSourceArch, {
      resources: resources,
      addAsset: addAsset
    });

    var handler = buildmessage.markBoundary(classification.legacyHandler);

    try {
      Profile.time('legacy handler (.' + classification.extension + ')', function () {
        handler(compileStep);
      });
    } catch (e) {
      e.message = e.message + " (compiling " + relPath + ")";
      buildmessage.exception(e);

      // Recover by ignoring this source file (as best we can -- the
      // handler might already have emitted resources)
    }
  });

  // *** Determine captured variables
  var declaredExports = _.map(inputSourceArch.declaredExports, function (symbol) {
    return _.pick(symbol, ['name', 'testOnly']);
  });

  // By default, consider this isopack "portable" unless
  // process.env.METEOR_ALLOW_NON_PORTABLE is truthy or the name of the
  // package is "meteor-tool", in which case we determine portability by
  // scanning node_modules directories for binary .node files.
  // Non-portable packages must publish platform-specific builds using
  // publish-for-arch, whereas portable packages can avoid running
  // publish-for-arch and rely instead on the package consumer to rebuild
  // binary npm dependencies when necessary.
  var isPortable = true;
  if (!process.env.METEOR_FORCE_PORTABLE) {
    // Make sure we've rebuilt these npm packages according to the current
    // process.{platform,arch,versions}.
    _.each(nodeModulesDirectories, function (nmd) {
      if (nmd.local) {
        // Meteor never attempts to modify the contents of local
        // node_modules directories (such as the one in the root directory
        // of an application), so we call nmd.rebuildIfNonPortable() only
        // when nmd.local is false.
      } else {
        nmd.rebuildIfNonPortable();
      }
    });

    if (process.env.METEOR_ALLOW_NON_PORTABLE || isopk.name === "meteor-tool") {
      isPortable = _.every(nodeModulesDirectories, function (nmd) {
        return nmd.isPortable();
      });
    }
  }

  // *** Consider npm dependencies and portability
  var arch = inputSourceArch.arch;
  if (arch === "os" && !isPortable) {
    // Contains non-portable compiled npm modules, so set arch correctly
    arch = archinfo.host();
  }

  var nodeModulesDirsOrUndefined = nodeModulesDirectories;
  if (!archinfo.matches(arch, "os") && !isPortable) {
    // non-portable npm modules only work on server architectures
    nodeModulesDirsOrUndefined = undefined;
  }

  // *** Output unibuild object
  isopk.addUnibuild({
    kind: inputSourceArch.kind,
    arch: arch,
    uses: inputSourceArch.uses,
    implies: inputSourceArch.implies,
    watchSet: watchSet,
    nodeModulesDirectories: nodeModulesDirsOrUndefined,
    declaredExports: declaredExports,
    resources: resources
  });

  return {
    pluginProviderPackageNames: pluginProviderPackageNames
  };
});

function runLinters(_ref3) {
  var inputSourceArch = _ref3.inputSourceArch;
  var isopackCache = _ref3.isopackCache;
  var sources = _ref3.sources;
  var sourceProcessorSet = _ref3.sourceProcessorSet;
  var watchSet = _ref3.watchSet;

  // The buildmessage context here is for linter warnings only! runLinters
  // should not do anything that can have a real build failure.
  buildmessage.assertInCapture();

  if (sourceProcessorSet.isEmpty()) {
    return;
  }

  // First we calculate the symbols imported into the current package by
  // packages we depend on. This is because most JS linters are going to want to
  // warn about the use of unknown global variables, and the linker import
  // system works by doing something that looks a whole lot like using
  // undeclared globals!  That said, we don't actually know the imports that
  // will be active when an app is built if the versions of the imported
  // packages differ from those available at package lint time. But it's a good
  // heuristic, at least. (If we transition from linker to ES2015 modules, we
  // won't have the issue any more.)

  // We want to look at the arch of the used packages that matches the arch
  // we're compiling.  Normally when we call compiler.eachUsedUnibuild, we're
  // either specifically looking at archinfo.host() because we're doing
  // something related to plugins (which always run in the host environment), or
  // we're in the process of building a bundler Target (a program), which has a
  // specific arch which is never 'os'.  In this odd case, though, we're trying
  // to run eachUsedUnibuild at package-compile time (not bundle time), so the
  // only 'arch' we've heard of might be 'os', if we're building a portable
  // unibuild.  In that case, we should look for imports in the host arch if it
  // exists instead of failing because a dependency does not have an 'os'
  // unibuild.
  var whichArch = inputSourceArch.arch === 'os' ? archinfo.host() : inputSourceArch.arch;

  // For linters, figure out what are the global imports from other packages
  // that we use directly, or are implied.
  var globalImports = ['Package'];

  if (archinfo.matches(inputSourceArch.arch, "os")) {
    globalImports.push('Npm', 'Assets');
  }

  compiler.eachUsedUnibuild({
    dependencies: inputSourceArch.uses,
    arch: whichArch,
    isopackCache: isopackCache,
    skipUnordered: true,
    // don't import symbols from debugOnly, prodOnly and testOnly
    // packages, because if the package is not linked it will cause a
    // runtime error.  the code must access them with
    // `Package["my-package"].MySymbol`.
    skipDebugOnly: true,
    skipProdOnly: true,
    skipTestOnly: true
  }, function (unibuild) {
    if (unibuild.pkg.name === inputSourceArch.pkg.name) {
      return;
    }
    _.each(unibuild.declaredExports, function (symbol) {
      if (!symbol.testOnly || inputSourceArch.isTest) {
        globalImports.push(symbol.name);
      }
    });
  });

  // sourceProcessor.id -> {sourceProcessor, sources: [WrappedSourceItem]}
  var sourceItemsForLinter = {};
  _.values(sources).forEach(function (sourceItem) {
    var relPath = sourceItem.relPath;
    var fileOptions = sourceItem.fileOptions;

    var classification = sourceProcessorSet.classifyFilename(files.pathBasename(relPath), inputSourceArch.arch);

    // If we don't have a linter for this file (or we do but it's only on
    // another arch), skip without even reading the file into a WatchSet.
    if (classification.type === 'wrong-arch' || classification.type === 'unmatched') {
      return;
    }
    // We shouldn't ever add a legacy handler and we're not hardcoding JS for
    // linters, so we should always have SourceProcessor if anything matches.
    if (!classification.sourceProcessors) {
      throw Error('Unexpected classification for ' + relPath + ': ' + classification.type);
    }

    // Read the file and add it to the WatchSet.

    var _watch$readAndWatchFi = watch.readAndWatchFileWithHash(watchSet, files.pathResolve(inputSourceArch.sourceRoot, relPath));

    var hash = _watch$readAndWatchFi.hash;
    var contents = _watch$readAndWatchFi.contents;

    var wrappedSource = {
      relPath: relPath, contents: contents, hash: hash, fileOptions: fileOptions,
      arch: inputSourceArch.arch,
      'package': inputSourceArch.pkg.name
    };

    // There can be multiple linters on a file.
    classification.sourceProcessors.forEach(function (sourceProcessor) {
      if (!sourceItemsForLinter.hasOwnProperty(sourceProcessor.id)) {
        sourceItemsForLinter[sourceProcessor.id] = {
          sourceProcessor: sourceProcessor,
          sources: []
        };
      }
      sourceItemsForLinter[sourceProcessor.id].sources.push(wrappedSource);
    });
  });

  // Run linters on files. This skips linters that don't have any files.
  _.each(sourceItemsForLinter, function (_ref4) {
    var sourceProcessor = _ref4.sourceProcessor;
    var sources = _ref4.sources;

    var sourcesToLint = sources.map(function (wrappedSource) {
      return new linterPluginModule.LintingFile(wrappedSource);
    });

    var linter = sourceProcessor.userPlugin.processFilesForPackage;

    function archToString(arch) {
      if (arch.match(/web\.cordova/)) {
        return "Cordova";
      }
      if (arch.match(/web\..*/)) {
        return "Client";
      }
      if (arch.match(/os.*/)) {
        return "Server";
      }
      throw new Error("Don't know how to display the arch: " + arch);
    }

    buildmessage.enterJob({
      title: "linting files with " + sourceProcessor.isopack.name + " for " + inputSourceArch.pkg.displayName() + " (" + archToString(inputSourceArch.arch) + ")"
    }, function () {
      try {
        var markedLinter = buildmessage.markBoundary(linter.bind(sourceProcessor.userPlugin));
        markedLinter(sourcesToLint, { globals: globalImports });
      } catch (e) {
        buildmessage.exception(e);
      }
    });
  });
};

// takes an isopack and returns a list of packages isopack depends on,
// containing at least one plugin
function getActivePluginPackages(isopk, _ref5) {
  var uses = _ref5.uses;
  var isopackCache = _ref5.isopackCache;
  var pluginProviderPackageNames = _ref5.pluginProviderPackageNames;
  var pluginProviderWatchSet = _ref5.pluginProviderWatchSet;

  // XXX we used to include our own plugins only if we were the
  // "use" role. now we include them everywhere because we don't have
  // a special "use" role anymore. it's not totally clear to me what
  // the correct behavior should be -- we need to resolve whether we
  // think about plugins as being global to a package or particular
  // to a unibuild.

  // (there's also some weirdness here with handling implies, because
  // the implies field is on the target unibuild, but we really only care
  // about packages.)
  var activePluginPackages = [isopk];
  if (pluginProviderPackageNames) {
    pluginProviderPackageNames[isopk.name] = true;
  }

  // We don't use plugins from weak dependencies, because the ability
  // to compile a certain type of file shouldn't depend on whether or
  // not some unrelated package in the target has a dependency. And we
  // skip unordered dependencies, because it's not going to work to
  // have circular build-time dependencies.
  //
  // eachUsedUnibuild takes care of pulling in implied dependencies for us (eg,
  // templating from standard-app-packages).
  //
  // We pass archinfo.host here, not self.arch, because it may be more specific,
  // and because plugins always have to run on the host architecture.
  compiler.eachUsedUnibuild({
    dependencies: uses,
    arch: archinfo.host(),
    isopackCache: isopackCache,
    skipUnordered: true
    // implicitly skip weak deps by not specifying acceptableWeakPackages option
  }, function (unibuild) {
    if (unibuild.pkg.name === isopk.name) {
      return;
    }
    if (pluginProviderPackageNames) {
      pluginProviderPackageNames[unibuild.pkg.name] = true;
    }
    if (pluginProviderWatchSet) {
      pluginProviderWatchSet.merge(unibuild.pkg.pluginWatchSet);
    }
    if (_.isEmpty(unibuild.pkg.plugins)) {
      return;
    }
    activePluginPackages.push(unibuild.pkg);
  });

  activePluginPackages = _.uniq(activePluginPackages);
  return activePluginPackages;
}

// Iterates over each in options.dependencies as well as unibuilds implied by
// them. The packages in question need to already be built and in
// options.isopackCache.
//
// Skips isobuild:* pseudo-packages.
compiler.eachUsedUnibuild = function (options, callback) {
  buildmessage.assertInCapture();
  var dependencies = options.dependencies;
  var arch = options.arch;
  var isopackCache = options.isopackCache;

  var acceptableWeakPackages = options.acceptableWeakPackages || {};

  var processedUnibuildId = {};
  var usesToProcess = [];
  _.each(dependencies, function (use) {
    if (options.skipUnordered && use.unordered) {
      return;
    }
    if (use.weak && !_.has(acceptableWeakPackages, use['package'])) {
      return;
    }
    usesToProcess.push(use);
  });

  while (!_.isEmpty(usesToProcess)) {
    var use = usesToProcess.shift();

    // We only care about real packages, not isobuild:* psuedo-packages.
    if (isIsobuildFeaturePackage(use['package'])) {
      continue;
    }

    var usedPackage = isopackCache.getIsopack(use['package']);

    // Ignore this package if we were told to skip debug-only packages and it is
    // debug-only.
    if (usedPackage.debugOnly && options.skipDebugOnly) {
      continue;
    }
    // Ditto prodOnly.
    if (usedPackage.prodOnly && options.skipProdOnly) {
      continue;
    }
    // Ditto testOnly.
    if (usedPackage.testOnly && options.skipTestOnly) {
      continue;
    }

    var unibuild = usedPackage.getUnibuildAtArch(arch);
    if (!unibuild) {
      // The package exists but there's no unibuild for us. A buildmessage has
      // already been issued. Recover by skipping.
      continue;
    }

    if (_.has(processedUnibuildId, unibuild.id)) {
      continue;
    }
    processedUnibuildId[unibuild.id] = true;

    callback(unibuild, {
      unordered: !!use.unordered,
      weak: !!use.weak
    });

    _.each(unibuild.implies, function (implied) {
      usesToProcess.push(implied);
    });
  }
};

// Note: this code is duplicated in packages/constraint-solver/solver.js
function isIsobuildFeaturePackage(packageName) {
  return packageName.startsWith('isobuild:');
}

// If you update this data structure to add more feature packages, you should
// update the wiki page here:
// https://github.com/meteor/meteor/wiki/Isobuild-Feature-Packages
var KNOWN_ISOBUILD_FEATURE_PACKAGES = {
  // This package directly calls Plugin.registerCompiler. Package authors
  // must explicitly depend on this feature package to use the API.
  'isobuild:compiler-plugin': ['1.0.0'],

  // This package directly calls Plugin.registerMinifier. Package authors
  // must explicitly depend on this feature package to use the API.
  'isobuild:minifier-plugin': ['1.0.0'],

  // This package directly calls Plugin.registerLinter. Package authors
  // must explicitly depend on this feature package to use the API.
  'isobuild:linter-plugin': ['1.0.0'],

  // This package is only published in the isopack-2 format, not isopack-1 or
  // older. ie, it contains "source" files for compiler plugins, not just
  // JS/CSS/static assets/head/body.
  // This is implicitly added at publish time to any such package; package
  // authors don't have to add it explicitly. It isn't relevant for local
  // packages, which can be rebuilt if possible by the older tool.
  //
  // Specifically, this is to avoid the case where a package is published with a
  // dependency like `api.use('less@1.0.0 || 2.0.0')` and the publication
  // selects the newer compiler plugin version to generate the isopack. The
  // published package (if this feature package wasn't implicitly included)
  // could still be selected by the Version Solver to be used with an old
  // Isobuild... just because less@2.0.0 depends on isobuild:compiler-plugin
  // doesn't mean it couldn't choose less@1.0.0, which is not actually
  // compatible with this published package.  (Constraints of the form described
  // above are not very helpful, but at least we can prevent old Isobuilds from
  // choking on confusing packages.)
  //
  // (Why not isobuild:isopack@2.0.0? Well, that would imply that Version Solver
  // would have to choose only one isobuild:isopack feature version, which
  // doesn't make sense here.)
  'isobuild:isopack-2': ['1.0.0'],

  // This package uses the `prodOnly` metadata flag, which causes it to
  // automatically depend on the `isobuild:prod-only` feature package.
  'isobuild:prod-only': ['1.0.0'],

  // This package depends on a specific version of Cordova. Package authors must
  // explicitly depend on this feature package to indicate that they are not
  // compatible with earlier Cordova versions, which is most likely a result of
  // the Cordova plugins they depend on.
  // One scenario is a package depending on a Cordova plugin or version
  // that is only available on npm, which means downloading the plugin is not
  // supported on versions of Cordova below 5.0.0.
  'isobuild:cordova': ['5.4.0']
};
//# sourceMappingURL=compiler.js.map