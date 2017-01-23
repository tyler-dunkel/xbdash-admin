var _extends;module.import('babel-runtime/helpers/extends',{"default":function(v){_extends=v}});var _toConsumableArray;module.import('babel-runtime/helpers/toConsumableArray',{"default":function(v){_toConsumableArray=v}});var _classCallCheck;module.import('babel-runtime/helpers/classCallCheck',{"default":function(v){_classCallCheck=v}});var Builder;module.import('./builder.js',{"default":function(v){Builder=v}});var SourceArch;module.import('./source-arch.js',{"default":function(v){SourceArch=v}});var PackageNamespace;module.import("./package-namespace.js",{"PackageNamespace":function(v){PackageNamespace=v}});var PackageNpm;module.import("./package-npm.js",{"PackageNpm":function(v){PackageNpm=v}});var PackageCordova;module.import("./package-cordova.js",{"PackageCordova":function(v){PackageCordova=v}});var PackageAPI;module.import("./package-api.js",{"PackageAPI":function(v){PackageAPI=v}});var TEST_FILENAME_REGEXPS,APP_TEST_FILENAME_REGEXPS,isTestFilePath;module.import('./test-files.js',{"TEST_FILENAME_REGEXPS":function(v){TEST_FILENAME_REGEXPS=v},"APP_TEST_FILENAME_REGEXPS":function(v){APP_TEST_FILENAME_REGEXPS=v},"isTestFilePath":function(v){isTestFilePath=v}});var convertColonsInPath;module.import('../utils/colon-converter.js',{"convert":function(v){convertColonsInPath=v}});var optimisticReadFile,optimisticHashOrNull,optimisticStatOrNull;module.import("../fs/optimistic.js",{"optimisticReadFile":function(v){optimisticReadFile=v},"optimisticHashOrNull":function(v){optimisticHashOrNull=v},"optimisticStatOrNull":function(v){optimisticStatOrNull=v}});


var _ = require('underscore');
var sourcemap = require('source-map');

var files = require('../fs/files.js');
var utils = require('../utils/utils.js');
var watch = require('../fs/watch.js');
var buildmessage = require('../utils/buildmessage.js');
var meteorNpm = require('./meteor-npm.js');

var archinfo = require('../utils/archinfo.js');
var catalog = require('../packaging/catalog/catalog.js');
var packageVersionParser = require('../packaging/package-version-parser.js');
var compiler = require('./compiler.js');
var Profile = require('../tool-env/profile.js').Profile;













// XXX: This is a medium-term hack, to avoid having the user set a package name
// & test-name in package.describe. We will change this in the new control file
// world in some way.
var AUTO_TEST_PREFIX = "local-test:";
var isTestName = function isTestName(name) {
  var nameStart = name.slice(0, AUTO_TEST_PREFIX.length);
  return nameStart === AUTO_TEST_PREFIX;
};
var genTestName = function genTestName(name) {
  return AUTO_TEST_PREFIX + name;
};

// Returns a sort comparator to order files into load order.
var loadOrderSort = function loadOrderSort(sourceProcessorSet, arch) {
  var isTemplate = _.memoize(function (filename) {
    var classification = sourceProcessorSet.classifyFilename(filename, arch);
    switch (classification.type) {
      case 'extension':
      case 'filename':
        if (!classification.sourceProcessors) {
          // This is *.js, not a template. #HardcodeJs
          return false;
        }
        if (classification.sourceProcessors.length > 1) {
          throw Error("conflicts in compiler?");
        }
        return classification.sourceProcessors[0].isTemplate;

      case 'legacy-handler':
        return classification.legacyIsTemplate;

      case 'wrong-arch':
      case 'unmatched':
        return false;

      default:
        throw Error('surprising type ' + classification.type + ' for ' + filename);
    }
  });

  return function (a, b) {
    // XXX MODERATELY SIZED HACK --
    // push template files ahead of everything else. this is
    // important because the user wants to be able to say
    //   Template.foo.events = { ... }
    // in a JS file and not have to worry about ordering it
    // before the corresponding .html file.
    //
    // maybe all of the templates should go in one file?
    var isTemplate_a = isTemplate(files.pathBasename(a));
    var isTemplate_b = isTemplate(files.pathBasename(b));
    if (isTemplate_a !== isTemplate_b) {
      return isTemplate_a ? -1 : 1;
    }

    // main.* loaded last
    var ismain_a = files.pathBasename(a).indexOf('main.') === 0;
    var ismain_b = files.pathBasename(b).indexOf('main.') === 0;
    if (ismain_a !== ismain_b) {
      return ismain_a ? 1 : -1;
    }

    // /lib/ loaded first
    var islib_a = a.indexOf(files.pathSep + 'lib' + files.pathSep) !== -1 || a.indexOf('lib' + files.pathSep) === 0;
    var islib_b = b.indexOf(files.pathSep + 'lib' + files.pathSep) !== -1 || b.indexOf('lib' + files.pathSep) === 0;
    if (islib_a !== islib_b) {
      return islib_a ? -1 : 1;
    }

    var a_parts = a.split(files.pathSep);
    var b_parts = b.split(files.pathSep);

    // deeper paths loaded first.
    var len_a = a_parts.length;
    var len_b = b_parts.length;
    if (len_a < len_b) {
      return 1;
    }
    if (len_b < len_a) {
      return -1;
    }

    // Otherwise compare path components lexicographically.
    for (var i = 0; i < len_a; ++i) {
      var a_part = a_parts[i];
      var b_part = b_parts[i];
      if (a_part < b_part) {
        return -1;
      }
      if (b_part < a_part) {
        return 1;
      }
    }

    // Never reached unless there are somehow duplicate paths.
    return 0;
  };
};

var splitConstraint = function splitConstraint(c) {
  // XXX print error better (w/ buildmessage?)?
  var parsed = utils.parsePackageConstraint(c);
  return { 'package': parsed['package'],
    constraint: parsed.constraintString || null };
};

// Given the text of a README.md file, excerpts the text between the first and
// second heading.
//
// Specifically - if there is text between the document name, and the first
// subheading, it will take that text. If there is no text there, and only text
// after the first subheading, it will take that text. It won't look any deeper
// than that (in case the user intentionally wants to leave the section blank
// for some reason). Skips lines that start with an exclamation point.
var getExcerptFromReadme = function getExcerptFromReadme(text) {
  // Don't waste time parsing if the document is empty.
  if (!text) {
    return "";
  }

  // Split into lines with Commonmark.
  var commonmark = require('commonmark');
  var reader = new commonmark.DocParser();
  var parsed = reader.parse(text);

  // Commonmark will parse the Markdown into an array of nodes. These are the
  // nodes that represent the text between the first and second heading.
  var relevantNodes = [];

  // Go through the document until we get the nodes that we are looking for,
  // then stop.
  _.any(parsed.children, function (child) {
    var isHeader = child.t === "Header";
    // Don't excerpt anything before the first header.
    if (!isHeader) {
      // If we are currently in the middle of excerpting, continue doing that
      // until we hit hit a header (and this is not a header). Otherwise, if
      // this is text, we should begin to excerpt it.
      relevantNodes.push(child);
    } else if (!_.isEmpty(relevantNodes) && isHeader) {
      // We have been excerpting, and came across a header. That means
      // that we are done.
      return true;
    }
    return false;
  });

  // If we have not found anything, we are done.
  if (_.isEmpty(relevantNodes)) {
    return "";
  }

  // For now, we will do the simple thing of just taking the raw markdown from
  // the start of the excerpt to the end.
  var textLines = text.split("\n");
  var start = relevantNodes[0].start_line - 1;
  var stop = _.last(relevantNodes).end_line;
  // XXX: There is a bug in commonmark that happens when processing the last
  // node in the document. Here is the github issue:
  // https://github.com/jgm/CommonMark/issues/276
  // Remove this workaround when the issue is fixed.
  if (stop === _.last(parsed.children).end_line) {
    stop++;
  }
  var excerpt = textLines.slice(start, stop).join("\n");

  // Strip the preceeding and trailing new lines.
  return excerpt.replace(/^\n+|\n+$/g, "");
};

var SymlinkLoopChecker = function () {
  function SymlinkLoopChecker(sourceRoot) {
    _classCallCheck(this, SymlinkLoopChecker);

    this.sourceRoot = sourceRoot;
    this._seenPaths = {};
    this._realpathCache = {};
  }

  SymlinkLoopChecker.prototype.check = function check(relDir) {
    var quietly = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    var absPath = files.pathJoin(this.sourceRoot, relDir);

    try {
      var realPath = files.realpath(absPath, this._realpathCache);
    } catch (e) {
      if (!e || e.code !== 'ELOOP') {
        throw e;
      }
      // else leave realPath undefined
    }

    if (!realPath || _.has(this._seenPaths, realPath)) {
      if (!quietly) {
        buildmessage.error("Symlink cycle detected at " + relDir);
      }

      return true;
    }

    this._seenPaths[realPath] = true;

    return false;
  };

  return SymlinkLoopChecker;
}();

///////////////////////////////////////////////////////////////////////////////
// PackageSource
///////////////////////////////////////////////////////////////////////////////

var PackageSource = function PackageSource() {
  var self = this;

  // The name of the package, or null for an app pseudo-package or
  // collection. The package's exports will reside in Package.<name>.
  // When it is null it is linked like an application instead of like
  // a package.
  self.name = null;

  // The path relative to which all source file paths are interpreted
  // in this package. Also used to compute the location of the
  // package's .npm directory (npm shrinkwrap state).
  self.sourceRoot = null;

  // Path that will be prepended to the URLs of all resources emitted
  // by this package (assuming they don't end up getting
  // concatenated). For non-web targets, the only effect this will
  // have is to change the actual on-disk paths of the files in the
  // bundle, for those that care to open up the bundle and look (but
  // it's still nice to get it right).
  self.serveRoot = null;

  // Package metadata. Keys are 'summary', 'git' and 'documentation'. Currently
  // all of these are optional.
  self.metadata = {};
  self.docsExplicitlyProvided = false;

  // Package version as a meteor-version string. Optional; not all packages
  // (for example, the app) have versions.
  // XXX when we have names, maybe we want to say that all packages
  // with names have versions? certainly the reverse is true
  self.version = null;
  self.versionExplicitlyProvided = false;

  // Available architectures of this package. Array of SourceArch.
  self.architectures = [];

  // The information necessary to build the plugins in this
  // package. Map from plugin name to object with keys 'name', 'use',
  // 'sources', and 'npmDependencies'.
  self.pluginInfo = {};

  // Analogous to watchSet in SourceArch but for plugins. At this
  // stage will typically contain just 'package.js'.
  self.pluginWatchSet = new watch.WatchSet();

  // npm packages used by this package (on os.* architectures only).
  // Map from npm package name to the required version of the package
  // as a string.
  self.npmDependencies = {};

  // Files to be stripped from the installed NPM dependency tree. See the
  // Npm.strip comment below for further usage information.
  self.npmDiscards = null;

  // Absolute path to a directory on disk that serves as a cache for
  // the npm dependencies, so we don't have to fetch them on every
  // build. Required not just if we have npmDependencies, but if we
  // ever could have had them in the past.
  self.npmCacheDirectory = null;

  // cordova plugins used by this package (on os.* architectures only).
  // Map from cordova plugin name to the required version of the package
  // as a string.
  self.cordovaDependencies = {};

  // If this package has a corresponding test package (for example,
  // underscore-test), defined in the same package.js file, store its value
  // here.
  self.testName = null;

  // Test packages are dealt with differently in the linker (and not published
  // to the catalog), so we need to keep track of them.
  self.isTest = false;

  // Some packages belong to a test framework and should never be bundled into
  // production. A package with this flag should not be picked up by the bundler
  // for production builds.
  self.debugOnly = false;

  // A package marked prodOnly is ONLY picked up by the bundler for production
  // builds.
  self.prodOnly = false;

  // A package marked testOnly is ONLY picked up by the bundler as
  // part of the `meteor test` command.
  self.testOnly = false;

  // If this is set, we will take the currently running git checkout and bundle
  // the meteor tool from it inside this package as a tool. We will include
  // built copies of all known isopackets.
  self.includeTool = false;

  // Is this a core package? Core packages don't record version files, because
  // core packages are only ever run from checkout. For the preview release,
  // core packages do not need to specify their versions at publication (since
  // there isn't likely to be any exciting version skew yet), but we will
  // specify the correct restrictions at 0.90.
  // XXX: 0.90 package versions.
  self.isCore = false;
};

_.extend(PackageSource.prototype, {
  // Make a dummy (empty) packageSource that contains nothing of interest.
  // XXX: Do we need this
  initEmpty: function initEmpty(name) {
    var self = this;
    self.name = name;
  },

  // Programmatically initialize a PackageSource from scratch.
  //
  // Unlike user-facing methods of creating a package
  // (initFromPackageDir, initFromAppDir) this does not implicitly add
  // a dependency on the 'meteor' package. If you want such a
  // dependency then you must add it yourself.
  //
  // If called inside a buildmessage job, it will keep going if things
  // go wrong. Be sure to call jobHasMessages to see if it actually
  // succeeded.
  //
  // The architecture is hardcoded to be "os".
  //
  // Note that this does not set a version on the package!
  //
  // Options:
  // - sourceRoot (required if sources present)
  // - serveRoot (required if sources present)
  // - use
  // - sources (array of paths or relPath/fileOptions objects), note that this
  // doesn't support assets at this time. If you want to pass assets here, you
  // should add a new option to this function called `assets`.
  // - npmDependencies
  // - cordovaDependencies
  // - npmDir
  // - localNodeModulesDirs
  initFromOptions: function initFromOptions(name, options) {
    var self = this;
    self.name = name;

    if (options.sources && !_.isEmpty(options.sources) && (!options.sourceRoot || !options.serveRoot)) {
      throw new Error("When source files are given, sourceRoot and " + "serveRoot must be specified");
    }

    // sourceRoot is a relative file system path, one slash identifies a root
    // relative to some starting location
    self.sourceRoot = options.sourceRoot || files.pathSep;
    // serveRoot is actually a part of a url path, root here is a forward slash
    self.serveRoot = options.serveRoot || '/';

    utils.ensureOnlyValidVersions(options.npmDependencies, { forCordova: false });
    self.npmDependencies = options.npmDependencies;

    // If options.npmDir is a string, make sure it contains no colons.
    self.npmCacheDirectory = _.isString(options.npmDir) ? convertColonsInPath(options.npmDir) : options.npmDir;

    utils.ensureOnlyValidVersions(options.cordovaDependencies, { forCordova: true });
    self.cordovaDependencies = options.cordovaDependencies;

    var sources = options.sources.map(function (source) {
      if (typeof source === "string") {
        return {
          relPath: source
        };
      }

      return source;
    });

    var sourceArch = new SourceArch(self, {
      kind: options.kind,
      arch: "os",
      sourceRoot: self.sourceRoot,
      uses: _.map(options.use, splitConstraint),
      getFiles: function getFiles() {
        return {
          sources: sources
        };
      }
    });

    if (options.localNodeModulesDirs) {
      _.extend(sourceArch.localNodeModulesDirs, options.localNodeModulesDirs);
    }

    self.architectures.push(sourceArch);

    if (!self._checkCrossUnibuildVersionConstraints()) {
      throw new Error("only one unibuild, so how can consistency check fail?");
    }
  },

  // Initialize a PackageSource from a package.js-style package directory. Uses
  // the name field provided and the name/test fields in the package.js file to
  // figre out if this is a test package (load from onTest) or a use package
  // (load from onUse).
  //
  // name: name of the package.
  // dir: location of directory on disk.
  // options:
  // - name: override the name of this package with a different name.
  // - buildingIsopackets: true if this is being scanned in the process
  //   of building isopackets
  initFromPackageDir: Profile("PackageSource#initFromPackageDir", function (dir, options) {
    var self = this;
    buildmessage.assertInCapture();
    var isPortable = true;
    options = options || {};
    var initFromPackageDirOptions = options;

    // If we know what package we are initializing, we pass in a
    // name. Otherwise, we are intializing the base package specified by 'name:'
    // field in Package.Describe. In that case, it is clearly not a test
    // package. (Though we could be initializing a specific package without it
    // being a test, for a variety of reasons).
    if (options.name) {
      self.isTest = isTestName(options.name);
      self.name = options.name;
    }

    // Give the package a default version. We do not set
    // versionExplicitlyProvided unless the package configuration file actually
    // sets a version.
    self.version = "0.0.0";

    // To make the transition to using README.md files in Isobuild easier, we
    // initialize the documentation directory to README.md by default.
    self.metadata.documentation = "README.md";

    self.sourceRoot = dir;

    // If we are running from checkout we may be looking at a core package. If
    // we are, let's remember this for things like not recording version files.
    if (files.inCheckout()) {
      var packDir = files.pathJoin(files.getCurrentToolsDir(), 'packages');
      if (files.pathDirname(self.sourceRoot) === packDir) {
        self.isCore = true;
      }
    }
    if (!files.exists(self.sourceRoot)) {
      throw new Error("putative package directory " + dir + " doesn't exist?");
    }

    var packageFileHashes = Object.create(null);
    var packageJsPath = files.pathJoin(self.sourceRoot, 'package.js');
    var packageJsCode = optimisticReadFile(packageJsPath);
    packageFileHashes[packageJsPath] = optimisticHashOrNull(packageJsPath);

    var pkgJsonPath = files.pathJoin(self.sourceRoot, 'package.json');
    var pkgJsonStat = optimisticStatOrNull(pkgJsonPath);
    if (pkgJsonStat && pkgJsonStat.isFile()) {
      packageFileHashes[pkgJsonPath] = optimisticHashOrNull(pkgJsonPath);
    }

    function watchPackageFiles(watchSet) {
      _.each(packageFileHashes, function (hash, path) {
        watchSet.addFile(path, hash);
      });
    }

    // Any package that depends on us needs to be rebuilt if our package.js file
    // changes, because a change to package.js might add or remove a plugin,
    // which could change a file from being handled by plugin vs treated as
    // an asset.
    watchPackageFiles(self.pluginWatchSet);

    /**
     * @global
     * @name  Package
     * @summary The Package object in package.js
     * @namespace
     * @locus package.js
     */
    var Package = new PackageNamespace(this);

    /**
     * @namespace Npm
     * @global
     * @summary The Npm object in package.js and package source files.
     */
    var Npm = new PackageNpm();

    /**
     * @namespace Cordova
     * @global
     * @summary The Cordova object in package.js.
     */
    var Cordova = new PackageCordova();

    try {
      files.runJavaScript(packageJsCode.toString('utf8'), {
        filename: 'package.js',
        symbols: { Package: Package, Npm: Npm, Cordova: Cordova }
      });
    } catch (e) {
      buildmessage.exception(e);

      // Could be a syntax error or an exception. Recover by
      // continuing as if package.js is empty. (Pressing on with
      // whatever handlers were registered before the exception turns
      // out to feel pretty disconcerting -- definitely violates the
      // principle of least surprise.) Leave the metadata if we have
      // it, though.
      Package._fileAndDepLoader = null;
      self.pluginInfo = {};
      Npm._dependencies = null;
      Cordova._dependencies = null;
    }

    // In the past, we did not require a Package.Describe.name field. So, it is
    // possible that we are initializing a package that doesn't use it and
    // expects us to be implicit about it.
    if (!self.name) {
      // For backwards-compatibility, we will take the package name from the
      // directory of the package. That was what we used to do: in fact, we used
      // to only do that.
      self.name = files.pathBasename(dir);
    }

    // Check to see if our name is valid.

    try {
      utils.validatePackageName(self.name);
    } catch (e) {
      if (!e.versionParserError) {
        throw e;
      }
      buildmessage.error(e.message);
      // recover by ignoring
    }

    // We want the "debug mode" to be a property of the *bundle* operation
    // (turning a set of packages, including the app, into a star), not the
    // *compile* operation (turning a package source into an isopack). This is
    // so we don't have to publish two versions of each package. But we have no
    // way to mark a file in an isopack as being the result of running a plugin
    // from a debugOnly dependency, and so there is no way to tell which files
    // to exclude in production mode from a published package. Eventually, we'll
    // add such a flag to the isopack format, but until then we'll sidestep the
    // issue by disallowing build plugins in debugOnly packages.
    if ((self.debugOnly || self.prodOnly || self.testOnly) && !_.isEmpty(self.pluginInfo)) {
      buildmessage.error("can't register build plugins in debugOnly, prodOnly or testOnly packages");
      // recover by ignoring
    }

    // For this old-style, onUse/onTest/where-based package, figure
    // out its dependencies by calling its on_xxx functions and seeing
    // what it does.
    //
    // We have a simple strategy. Call its on_xxx handler with no
    // 'where', which is what happens when the package is added
    // directly to an app, and see what files it adds to the client
    // and the server. When a package is used, include it in both the client
    // and the server by default. This simple strategy doesn't capture even
    // 10% of the complexity possible with onUse, onTest, and where, but
    // probably is sufficient for virtually all packages that actually
    // exist in the field, if not every single one. #OldStylePackageSupport

    var api = new PackageAPI({
      buildingIsopackets: !!initFromPackageDirOptions.buildingIsopackets
    });

    if (Package._fileAndDepLoader) {
      try {
        buildmessage.markBoundary(Package._fileAndDepLoader)(api);
      } catch (e) {
        console.log(e.stack); // XXX should we keep this here -- or do we want broken
        // packages to fail silently?
        buildmessage.exception(e);

        // Recover by ignoring all of the source files in the
        // packages and any remaining handlers. It violates the
        // principle of least surprise to half-run a handler
        // and then continue.
        api.files = {};
        _.each(compiler.ALL_ARCHES, function (arch) {
          api.files[arch] = {
            sources: [],
            assets: []
          };
        });

        Package._fileAndDepLoader = null;
        self.pluginInfo = {};
        Npm._dependencies = null;
        Cordova._dependencies = null;
      }
    }

    // By the way, you can't depend on yourself.
    var doNotDepOnSelf = function doNotDepOnSelf(dep) {
      if (dep['package'] === self.name) {
        buildmessage.error("Circular dependency found: " + self.name + " depends on itself.\n");
      }
    };
    _.each(compiler.ALL_ARCHES, function (label) {
      _.each(api.uses[label], doNotDepOnSelf);
      _.each(api.implies[label], doNotDepOnSelf);
    });

    // Cause packages that use `prodOnly` to automatically depend on the
    // `isobuild:prod-only` feature package, which will cause an error
    // when a package using `prodOnly` is run by a version of the tool
    // that doesn't support the feature.  The choice of 'os' architecture
    // is arbitrary, as the version solver combines the dependencies of all
    // arches.
    if (self.prodOnly) {
      api.uses['os'].push({
        'package': 'isobuild:prod-only', constraint: '1.0.0'
      });
    }

    // If we have specified some release, then we should go through the
    // dependencies and fill in the unspecified constraints with the versions in
    // the releases (if possible).
    if (!_.isEmpty(api.releaseRecords)) {

      // Given a dependency object with keys package (the name of the package)
      // and constraint (the version constraint), if the constraint is null,
      // look in the packages field in the release record and fill in from
      // there.
      var setFromRel = function setFromRel(dep) {
        if (dep.constraint) {
          return dep;
        }
        var newConstraint = [];
        _.each(api.releaseRecords, function (releaseRecord) {
          var packages = releaseRecord.packages;
          if (_.has(packages, dep['package'])) {
            newConstraint.push(packages[dep['package']]);
          }
        });
        if (_.isEmpty(newConstraint)) {
          return dep;
        }
        dep.constraint = _.reduce(newConstraint, function (x, y) {
          return x + " || " + y;
        });
        return dep;
      };

      // For all api.implies and api.uses, fill in the unspecified dependencies from the
      // release.
      _.each(compiler.ALL_ARCHES, function (label) {
        api.uses[label] = _.map(api.uses[label], setFromRel);
        api.implies[label] = _.map(api.implies[label], setFromRel);
      });
    };

    // Make sure that if a dependency was specified in multiple
    // unibuilds, the constraint is exactly the same.
    if (!self._checkCrossUnibuildVersionConstraints()) {}
    // A build error was written. Recover by ignoring the
    // fact that we have differing constraints.


    // Save information about npm dependencies. To keep metadata
    // loading inexpensive, we won't actually fetch them until build
    // time.

    // We used to put the cache directly in .npm, but in linker-land,
    // the package's own NPM dependencies go in .npm/package and build
    // plugin X's goes in .npm/plugin/X. Notably, the former is NOT an
    // ancestor of the latter, so that a build plugin does NOT see the
    // package's node_modules.  XXX maybe there should be separate NPM
    // dirs for use vs test?
    self.npmCacheDirectory = files.pathResolve(files.pathJoin(self.sourceRoot, '.npm', 'package'));
    self.npmDependencies = Npm._dependencies;
    self.npmDiscards = Npm._discards;

    self.cordovaDependencies = Cordova._dependencies;

    // Create source architectures, one for the server and one for each web
    // arch.
    _.each(compiler.ALL_ARCHES, function (arch) {
      // Everything depends on the package 'meteor', which sets up
      // the basic environment) (except 'meteor' itself).
      if (self.name !== "meteor" && !process.env.NO_METEOR_PACKAGE) {
        // Don't add the dependency if one already exists. This allows the
        // package to create an unordered dependency and override the one that
        // we'd add here. This is necessary to resolve the circular dependency
        // between meteor and underscore (underscore has an unordered
        // dependency on meteor dating from when the .js extension handler was
        // in the "meteor" package).
        var alreadyDependsOnMeteor = !!_.find(api.uses[arch], function (u) {
          return u['package'] === "meteor";
        });
        if (!alreadyDependsOnMeteor) {
          api.uses[arch].unshift({ 'package': "meteor" });
        }
      }

      // Each unibuild has its own separate WatchSet. This is so that, eg, a test
      // unibuild's dependencies doesn't end up getting merged into the
      // pluginWatchSet of a package that uses it: only the use unibuild's
      // dependencies need to go there!
      var watchSet = new watch.WatchSet();
      watchPackageFiles(watchSet);

      self.architectures.push(new SourceArch(self, {
        kind: "main",
        arch: arch,
        sourceRoot: self.sourceRoot,
        uses: api.uses[arch],
        implies: api.implies[arch],
        getFiles: function getFiles(sourceProcessorSet, watchSet) {
          var result = api.files[arch];
          var relPathToSourceObj = {};
          var sources = result.sources;

          // Files explicitly passed to api.addFiles remain at the
          // beginning of api.files[arch].sources in their given order.
          sources.forEach(function (sourceObj) {
            relPathToSourceObj[sourceObj.relPath] = sourceObj;
          });

          self._findSources({
            sourceProcessorSet: sourceProcessorSet,
            watchSet: watchSet,
            sourceArch: this,
            isApp: false
          }).forEach(function (relPath) {
            if (!_.has(relPathToSourceObj, relPath)) {
              var fileOptions = self._inferFileOptions(relPath, {
                arch: arch,
                isApp: false
              });

              // Since this file was not explicitly added with
              // api.addFiles, it should not be evaluated eagerly.
              fileOptions.lazy = true;

              sources.push(relPathToSourceObj[relPath] = {
                relPath: relPath,
                fileOptions: fileOptions
              });
            }
          });

          return result;
        },

        declaredExports: api.exports[arch],
        watchSet: watchSet
      }));
    });

    // Serve root of the package.
    self.serveRoot = files.pathJoin('/packages/', self.name);

    // Name of the test.
    if (Package._hasTests) {
      self.testName = genTestName(self.name);
    }
  }),

  _readAndWatchDirectory: function _readAndWatchDirectory(relDir, watchSet, _ref) {
    var include = _ref.include;
    var exclude = _ref.exclude;
    var names = _ref.names;

    return watch.readAndWatchDirectory(watchSet, {
      absPath: files.pathJoin(this.sourceRoot, relDir),
      include: include, exclude: exclude, names: names
    }).map(function (name) {
      return files.pathJoin(relDir, name);
    });
  },


  // Initialize a package from an application directory (has .meteor/packages).
  initFromAppDir: Profile("initFromAppDir", function (projectContext, ignoreFiles) {
    var self = this;
    var appDir = projectContext.projectDir;
    self.name = null;
    self.sourceRoot = appDir;
    self.serveRoot = '/';

    // Determine used packages. Note that these are the same for all arches,
    // because there's no way to specify otherwise in .meteor/packages.
    var uses = [];
    projectContext.projectConstraintsFile.eachConstraint(function (constraint) {
      uses.push({ 'package': constraint['package'],
        constraint: constraint.constraintString });
    });

    var projectWatchSet = projectContext.getProjectWatchSet();

    _.each(compiler.ALL_ARCHES, function (arch) {
      // We don't need to build a Cordova SourceArch if there are no Cordova
      // platforms.
      if (arch === 'web.cordova' && _.isEmpty(projectContext.platformList.getCordovaPlatforms())) {
        return;
      }

      // XXX what about /web.browser/* etc, these directories could also
      // be for specific client targets.

      // Create unibuild
      var sourceArch = new SourceArch(self, {
        kind: 'app',
        arch: arch,
        sourceRoot: self.sourceRoot,
        uses: uses,
        getFiles: function getFiles(sourceProcessorSet, watchSet) {
          sourceProcessorSet.watchSet = watchSet;

          var findOptions = {
            sourceProcessorSet: sourceProcessorSet,
            watchSet: watchSet,
            sourceArch: this,
            ignoreFiles: ignoreFiles,
            isApp: true,
            loopChecker: new SymlinkLoopChecker(self.sourceRoot)
          };

          return {
            sources: self._findSources(findOptions).sort(loadOrderSort(sourceProcessorSet, arch)).map(function (relPath) {
              return {
                relPath: relPath,
                fileOptions: self._inferFileOptions(relPath, {
                  arch: arch,
                  isApp: true
                })
              };
            }),

            assets: self._findAssets(findOptions)
          };
        }
      });

      var origAppDir = projectContext.getOriginalAppDirForTestPackages();

      var origNodeModulesDir = origAppDir && files.pathJoin(origAppDir, "node_modules");

      var origNodeModulesStat = origNodeModulesDir && files.statOrNull(origNodeModulesDir);

      if (origNodeModulesStat && origNodeModulesStat.isDirectory()) {
        sourceArch.localNodeModulesDirs["node_modules"] = {
          // Override these properties when calling
          // addNodeModulesDirectory in compileUnibuild.
          sourceRoot: origAppDir,
          sourcePath: origNodeModulesDir,
          local: false
        };
      }

      self.architectures.push(sourceArch);

      // sourceArch's WatchSet should include all the project metadata files
      // read by the ProjectContext.
      sourceArch.watchSet.merge(projectWatchSet);
    });

    if (!self._checkCrossUnibuildVersionConstraints()) {
      // should never happen since we created the unibuilds from
      // .meteor/packages, which doesn't have a way to express
      // different constraints for different unibuilds
      throw new Error("conflicting constraints in a package?");
    }
  }),

  _inferFileOptions: function _inferFileOptions(relPath, _ref2) {
    var arch = _ref2.arch;
    var isApp = _ref2.isApp;

    var fileOptions = {};
    var isTest = global.testCommandMetadata && global.testCommandMetadata.isTest;
    var isAppTest = global.testCommandMetadata && global.testCommandMetadata.isAppTest;
    var isTestFile = (isTest || isAppTest) && isTestFilePath(relPath);

    // If running in test mode (`meteor test`), all files other than
    // test files should be loaded lazily.
    if (isTest && !isTestFile) {
      fileOptions.lazy = true;
    }

    var dirs = files.pathDirname(relPath).split(files.pathSep);

    for (var i = 0; i < dirs.length; ++i) {
      var _dir = dirs[i];

      if (_dir === "node_modules") {
        fileOptions.lazy = true;
        fileOptions.transpile = false;

        // Return immediately so that we don't apply special meanings to
        // client or server directories inside node_modules directories.
        return fileOptions;
      }

      // Files in `imports/` should be lazily loaded *apart* from tests
      if (isApp && _dir === "imports" && !isTestFile) {
        fileOptions.lazy = true;
      }

      // If the file is restricted to the opposite architecture, make sure
      // it is not evaluated eagerly.
      if (archinfo.matches(arch, "os")) {
        if (_dir === "client") {
          fileOptions.lazy = true;
        }
      } else if (_dir === "server") {
        fileOptions.lazy = true;
      }

      // Special case: in app code on the client, JavaScript files in a
      // `client/compatibility` directory don't get wrapped in a closure.
      if (i > 0 && dirs[i - 1] === "client" && _dir === "compatibility" && isApp && // Skip this check for packages.
      archinfo.matches(arch, "web") && relPath.endsWith(".js")) {
        fileOptions.bare = true;
      }
    }

    return fileOptions;
  },


  // This cache survives for the duration of the process, and stores the
  // complete list of source files for directories within node_modules.
  _findSourcesCache: Object.create(null),

  _findSources: function _findSources(_ref3) {
    var _sourceReadOptions$ex;

    var sourceProcessorSet = _ref3.sourceProcessorSet;
    var watchSet = _ref3.watchSet;
    var isApp = _ref3.isApp;
    var sourceArch = _ref3.sourceArch;
    var _ref3$loopChecker = _ref3.loopChecker;
    var loopChecker = _ref3$loopChecker === undefined ? new SymlinkLoopChecker(this.sourceRoot) : _ref3$loopChecker;
    var _ref3$ignoreFiles = _ref3.ignoreFiles;
    var ignoreFiles = _ref3$ignoreFiles === undefined ? [] : _ref3$ignoreFiles;

    var self = this;
    var arch = sourceArch.arch;
    var sourceReadOptions = sourceProcessorSet.appReadDirectoryOptions(arch);

    // Ignore files starting with dot (unless they are explicitly in
    // 'names').
    sourceReadOptions.exclude.push(/^\./);
    // Ignore the usual ignorable files.
    (_sourceReadOptions$ex = sourceReadOptions.exclude).push.apply(_sourceReadOptions$ex, _toConsumableArray(ignoreFiles));

    // Unless we're running tests, ignore all test filenames and if we are, ignore the
    // type of file we *aren't* running
    if (!global.testCommandMetadata || global.testCommandMetadata.isTest) {
      Array.prototype.push.apply(sourceReadOptions.exclude, APP_TEST_FILENAME_REGEXPS);
    }
    if (!global.testCommandMetadata || global.testCommandMetadata.isAppTest) {
      Array.prototype.push.apply(sourceReadOptions.exclude, TEST_FILENAME_REGEXPS);
    }

    // Read top-level source files, excluding control files that were not
    // explicitly included.
    var controlFiles = ['mobile-config.js'];

    if (!isApp) {
      controlFiles.push('package.js');
    }

    var anyLevelExcludes = [/^tests\/$/, archinfo.matches(arch, "os") ? /^client\/$/ : /^server\/$/].concat(_toConsumableArray(sourceReadOptions.exclude));

    var topLevelExcludes = isApp ? [].concat(_toConsumableArray(anyLevelExcludes), [/^packages\/$/, /^programs\/$/, /^public\/$/, /^private\/$/, /^cordova-build-override\/$/, /^acceptance-tests\/$/]) : anyLevelExcludes;

    var nodeModulesReadOptions = _extends({}, sourceReadOptions, {
      // When we're in a node_modules directory, we can avoid collecting
      // .js and .json files, because (unlike .less or .coffee files) they
      // are allowed to be imported later by the ImportScanner, as they do
      // not require custom processing by compiler plugins.
      exclude: sourceReadOptions.exclude.concat(/\.js(on)?$/i)
    });

    var baseCacheKey = JSON.stringify({
      isApp: isApp,
      arch: arch,
      sourceRoot: self.sourceRoot,
      excludes: anyLevelExcludes
    }, function (key, value) {
      if (_.isRegExp(value)) {
        return [value.source, value.flags];
      }
      return value;
    });

    function makeCacheKey(dir) {
      return baseCacheKey + "\0" + dir;
    }

    function find(dir, depth, inNodeModules) {
      // Remove trailing slash.
      dir = dir.replace(/\/$/, "");

      // If we're in a node_modules directory, cache the results of the
      // find function for the duration of the process.
      var cacheKey = inNodeModules && makeCacheKey(dir);
      if (cacheKey && cacheKey in self._findSourcesCache) {
        return self._findSourcesCache[cacheKey];
      }

      if (loopChecker.check(dir)) {
        // Pretend we found no files.
        return [];
      }

      var readOptions = inNodeModules ? nodeModulesReadOptions : sourceReadOptions;

      var sources = _.difference(self._readAndWatchDirectory(dir, watchSet, readOptions), depth > 0 ? [] : controlFiles);

      var subdirectories = self._readAndWatchDirectory(dir, watchSet, {
        include: [/\/$/],
        exclude: depth > 0 ? anyLevelExcludes : topLevelExcludes
      });

      var nodeModulesDir = void 0;

      subdirectories.forEach(function (subdir) {
        if (/(^|\/)node_modules\/$/.test(subdir)) {
          if (!inNodeModules) {
            sourceArch.localNodeModulesDirs[subdir] = true;
          }

          // Defer handling node_modules until after we handle all other
          // subdirectories, so that we know whether we need to descend
          // further. If sources is still empty after we handle everything
          // else in dir, then nothing in this node_modules subdir can be
          // imported by anthing outside of it, so we can ignore it.
          nodeModulesDir = subdir;
        } else {
          sources.push.apply(sources, _toConsumableArray(find(subdir, depth + 1, inNodeModules)));
        }
      });

      if (isApp && nodeModulesDir && (!inNodeModules || sources.length > 0)) {
        // If we found a node_modules subdirectory above, and either we
        // are not already inside another node_modules directory or we
        // found source files elsewhere in this directory or its other
        // subdirectories, and we're building an app (as opposed to a
        // Meteor package), continue searching this node_modules
        // directory, so that any non-.js(on) files it contains can be
        // imported by the app (#6037).
        sources.push.apply(sources, _toConsumableArray(find(nodeModulesDir, depth + 1, true)));
      }

      if (cacheKey) {
        self._findSourcesCache[cacheKey] = sources;
      }

      return sources;
    }

    return files.withCache(function () {
      return find("", 0, false);
    });
  },
  _findAssets: function _findAssets(_ref4) {
    var sourceProcessorSet = _ref4.sourceProcessorSet;
    var watchSet = _ref4.watchSet;
    var isApp = _ref4.isApp;
    var sourceArch = _ref4.sourceArch;
    var _ref4$loopChecker = _ref4.loopChecker;
    var loopChecker = _ref4$loopChecker === undefined ? new SymlinkLoopChecker(this.sourceRoot) : _ref4$loopChecker;
    var _ref4$ignoreFiles = _ref4.ignoreFiles;
    var ignoreFiles = _ref4$ignoreFiles === undefined ? [] : _ref4$ignoreFiles;

    // Now look for assets for this unibuild.
    var arch = sourceArch.arch;
    var assetDir = archinfo.matches(arch, "web") ? "public/" : "private/";
    var assetDirs = this._readAndWatchDirectory('', watchSet, {
      names: [assetDir]
    });

    var assets = [];

    if (!_.isEmpty(assetDirs)) {
      if (!_.isEqual(assetDirs, [assetDir])) {
        throw new Error("Surprising assetDirs: " + JSON.stringify(assetDirs));
      }

      while (!_.isEmpty(assetDirs)) {
        dir = assetDirs.shift();
        // remove trailing slash
        dir = dir.substr(0, dir.length - 1);

        if (loopChecker.check(dir)) {
          // pretend we found no files
          return [];
        }

        // Find asset files in this directory.
        var assetsAndSubdirs = this._readAndWatchDirectory(dir, watchSet, {
          include: [/.?/],
          // we DO look under dot directories here
          exclude: ignoreFiles
        });

        _.each(assetsAndSubdirs, function (item) {
          if (item[item.length - 1] === '/') {
            // Recurse on this directory.
            assetDirs.push(item);
          } else {
            // This file is an asset.
            assets.push({
              relPath: item
            });
          }
        });
      }
    }

    return assets;
  },


  // True if the package defines any plugins.
  containsPlugins: function containsPlugins() {
    var self = this;
    return !_.isEmpty(self.pluginInfo);
  },

  // Return dependency metadata for all unibuilds, in the format needed
  // by the package catalog.
  //
  // This *DOES* include isobuild:* pseudo-packages!
  //
  // Options:
  // - logError: if true, if something goes wrong, log a buildmessage
  //   and return null rather than throwing an exception.
  // - skipWeak: omit weak dependencies
  // - skipUnordered: omit unordered dependencies
  getDependencyMetadata: function getDependencyMetadata(options) {
    var self = this;
    options = options || {};
    var ret = self._computeDependencyMetadata(options);
    if (!ret) {
      if (options.logError) {
        return null;
      } else {
        throw new Error("inconsistent dependency constraint across unibuilds?");
      }
    }
    return ret;
  },

  // Returns a list of package names which should be loaded before building this
  // package. This is all the packages that we directly depend on in a unibuild
  // or from a plugin.
  //
  // (It's possible that we could do something slightly fancier where we only
  // need to load those dependencies (including implied dependencies) which we
  // know contain plugins first, plus the transitive closure of all the packages
  // we depend on which contain a plugin. This seems good enough, though.)
  //
  // Note that this method filters out isobuild:* pseudo-packages, so it is NOT
  // to be used to create input to Version Solver (see
  // _computeDependencyMetadata for that).
  //
  // Note also that "load" here specifically means "load into the IsopackCache
  // at build time", not "load into a running Meteor app at run
  // time". Specifically, weak constraints do create a run-time load order
  // dependency (if the package is in the app at all) but they do not create a
  // build-time IsopackCache load order dependency (because weak dependencies do
  // not provide plugins).
  getPackagesToLoadFirst: function getPackagesToLoadFirst(packageMap) {
    var self = this;
    var packages = {};
    var processUse = function processUse(use) {
      // We don't have to build weak or unordered deps first (eg they can't
      // contribute to a plugin).
      if (use.weak || use.unordered) {
        return;
      }
      // Only include real packages, not isobuild:* pseudo-packages.
      if (compiler.isIsobuildFeaturePackage(use['package'])) {
        return;
      }

      var packageInfo = packageMap.getInfo(use['package']);
      if (!packageInfo) {
        throw Error("Depending on unknown package " + use['package']);
      }
      packages[use['package']] = true;
    };

    _.each(self.architectures, function (arch) {
      // We need to iterate over both uses and implies, since implied packages
      // also constitute dependencies. We don't have to include the dependencies
      // of implied packages directly here, since their own
      // getPackagesToLoadFirst will include those.
      _.each(arch.uses, processUse);
      _.each(arch.implies, processUse);
    });

    _.each(self.pluginInfo, function (info) {
      // info.use is currently just an array of strings, and there's
      // no way to specify weak/unordered. Much like an app.
      _.each(info.use, function (spec) {
        var parsedSpec = splitConstraint(spec);
        if (!compiler.isIsobuildFeaturePackage(parsedSpec['package'])) {
          packages[parsedSpec['package']] = true;
        }
      });
    });
    return _.keys(packages);
  },

  // Returns an array of objects, representing this package's public
  // exports. Each object has the following keys:
  //  - name: export name (ex: "Accounts")
  //  - arch: an array of strings representing architectures for which this
  //    export is declared.
  //
  // This ignores testOnly exports.
  getExports: function getExports() {
    var self = this;
    var ret = {};
    // Go over all of the architectures, and aggregate the exports together.
    _.each(self.architectures, function (arch) {
      _.each(arch.declaredExports, function (exp) {
        // Skip testOnly exports -- the flag is intended for use in testing
        // only, so it is not of any interest outside this package.
        if (exp.testOnly) {
          return;
        }
        // Add the export to the export map.
        if (!_.has(ret, exp.name)) {
          ret[exp.name] = [arch.arch];
        } else {
          ret[exp.name].push(arch.arch);
        }
      });
    });
    return _.map(ret, function (arches, name) {
      return { name: name, architectures: arches };
    });
  },

  // Processes the documentation provided in Package.describe. Returns an object
  // with the following keys:
  //   - path: full filepath to the Readme file
  //   - excerpt: the subsection between the first and second heading of the
  //     Readme, to be used as a longform package description.
  //   - hash: hash of the full text of this Readme, or "" if the Readme is
  //     blank.
  //
  // Returns null if the documentation is marked as null, or throws a
  // buildmessage error if the documentation could not be read.
  //
  // This function reads and performs string operations on a (potentially) long
  // file. We do not call it unless we actually need this information.
  processReadme: function processReadme() {
    var self = this;
    buildmessage.assertInJob();
    if (!self.metadata.documentation) {
      return null;
    }

    // To ensure atomicity, we want to copy the README to a temporary file.
    var ret = {};
    ret.path = files.pathJoin(self.sourceRoot, self.metadata.documentation);
    // Read in the text of the Readme.
    try {
      var fullReadme = files.readFile(ret.path);
    } catch (err) {
      var errorMessage = "";
      if (err.code === "ENOENT") {
        // This is the most likely and common case, especially when we are
        // inferring the docs as a default value.
        errorMessage = "Documentation not found: " + self.metadata.documentation;
      } else {
        // This is weird, and we don't usually protect the user from errors like
        // this, but maybe we should.
        errorMessage = "Documentation couldn't be read: " + self.metadata.documentation + " ";
        errorMessage += "(Error: " + err.message + ")";
      }

      // The user might not understand that we are automatically inferring
      // README.md as the docs! If they want to avoid pushing anything, explain
      // how to do that.
      if (!self.docsExplicitlyProvided) {
        errorMessage += "\n" + "If you don't want to publish any documentation, " + "please set 'documentation: null' in Package.describe";
      }
      buildmessage.error(errorMessage);
      // Recover by returning null
      return null;
    }

    var text = fullReadme.toString();
    return {
      contents: text,
      hash: utils.sha256(text),
      excerpt: getExcerptFromReadme(text)
    };
  },

  // If dependencies aren't consistent across unibuilds, return false and
  // also log a buildmessage error if inside a buildmessage job. Else
  // return true.
  // XXX: Check that this is used when refactoring is done.
  _checkCrossUnibuildVersionConstraints: function _checkCrossUnibuildVersionConstraints() {
    var self = this;
    return !!self._computeDependencyMetadata({ logError: true });
  },

  // Compute the return value for getDependencyMetadata, or return
  // null if there is a dependency that doesn't have the same
  // constraint across all unibuilds (and, if logError is true, log a
  // buildmessage error).
  //
  // This *DOES* include isobuild:* pseudo-packages!
  //
  // For options, see getDependencyMetadata.
  _computeDependencyMetadata: function _computeDependencyMetadata(options) {
    var self = this;
    options = options || {};

    var dependencies = {};
    var allConstraints = {}; // for error reporting. package name to array
    var failed = false;

    _.each(self.architectures, function (arch) {
      // We need to iterate over both uses and implies, since implied packages
      // also constitute dependencies.
      var processUse = function processUse(implied, use) {
        // We can't really have a weak implies (what does that even mean?) but
        // we check for that elsewhere.
        if (use.weak && options.skipWeak || use.unordered && options.skipUnordered) {
          return;
        }

        if (!_.has(dependencies, use['package'])) {
          dependencies[use['package']] = {
            constraint: null,
            references: []
          };
          allConstraints[use['package']] = [];
        }
        var d = dependencies[use['package']];

        if (use.constraint) {
          allConstraints[use['package']].push(use.constraint);

          if (d.constraint === null) {
            d.constraint = use.constraint;
          } else if (d.constraint !== use.constraint) {
            failed = true;
          }
        }

        var reference = {
          arch: archinfo.withoutSpecificOs(arch.arch)
        };
        if (use.weak) {
          reference.weak = true;
        }
        if (use.unordered) {
          reference.unordered = true;
        }
        if (implied) {
          reference.implied = true;
        }
        d.references.push(reference);
      };
      _.each(arch.uses, _.partial(processUse, false));
      _.each(arch.implies, _.partial(processUse, true));
    });

    _.each(self.pluginInfo, function (info) {
      _.each(info.use, function (spec) {
        var parsedSpec = splitConstraint(spec);
        if (!_.has(dependencies, parsedSpec['package'])) {
          dependencies[parsedSpec['package']] = {
            constraint: null,
            references: []
          };
          allConstraints[parsedSpec['package']] = [];
        }
        var d = dependencies[parsedSpec['package']];

        if (parsedSpec.constraint) {
          allConstraints[parsedSpec['package']].push(parsedSpec.constraint);
          if (d.constraint === null) {
            d.constraint = parsedSpec.constraint;
          } else if (d.constraint !== parsedSpec.constraint) {
            failed = true;
          }
        }
        d.references.push({ arch: 'plugin' });
      });
    });

    if (failed && options.logError) {
      _.each(allConstraints, function (constraints, name) {
        constraints = _.uniq(constraints);
        if (constraints.length > 1) {
          buildmessage.error("The version constraint for a dependency must be the same " + "at every place it is mentioned in a package. " + "'" + name + "' is constrained both as " + constraints.join(' and ') + ". Change them to match.");
          // recover by returning false (the caller had better detect
          // this and use its own recovery logic)
        }
      });
    }

    return failed ? null : dependencies;
  },

  displayName: function displayName() {
    return this.name === null ? 'the app' : this.name;
  }
});

module.exports = PackageSource;
//# sourceMappingURL=package-source.js.map