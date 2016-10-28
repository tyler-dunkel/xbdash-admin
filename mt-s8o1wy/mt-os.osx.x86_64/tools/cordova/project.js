module.export({CordovaProject:function(){return CordovaProject}});var _toConsumableArray;module.import('babel-runtime/helpers/toConsumableArray',{"default":function(v){_toConsumableArray=v}});var _typeof;module.import('babel-runtime/helpers/typeof',{"default":function(v){_typeof=v}});var _regeneratorRuntime;module.import('babel-runtime/regenerator',{"default":function(v){_regeneratorRuntime=v}});var _classCallCheck;module.import('babel-runtime/helpers/classCallCheck',{"default":function(v){_classCallCheck=v}});var _createClass;module.import('babel-runtime/helpers/createClass',{"default":function(v){_createClass=v}});var _;module.import('underscore',{"default":function(v){_=v}});var util;module.import('util',{"default":function(v){util=v}});var assert;module.import('assert',{"default":function(v){assert=v}});var chalk;module.import('chalk',{"default":function(v){chalk=v}});var semver;module.import('semver',{"default":function(v){semver=v}});var files;module.import('../fs/files.js',{"default":function(v){files=v}});var utils;module.import('../utils/utils.js',{"default":function(v){utils=v}});var Console;module.import('../console/console.js',{"Console":function(v){Console=v}});var buildmessage;module.import('../utils/buildmessage.js',{"default":function(v){buildmessage=v}});var main;module.import('../cli/main.js',{"default":function(v){main=v}});var httpHelpers;module.import('../utils/http-helpers.js',{"default":function(v){httpHelpers=v}});var execFileSync,execFileAsync;module.import('../utils/processes.js',{"execFileSync":function(v){execFileSync=v},"execFileAsync":function(v){execFileAsync=v}});module.import('./protect-string-proto.js');var cordova_lib,cordova_events,CordovaError;module.import('cordova-lib',{"cordova":function(v){cordova_lib=v},"events":function(v){cordova_events=v},"CordovaError":function(v){CordovaError=v}});var cordova_util;module.import('cordova-lib/src/cordova/util.js',{"default":function(v){cordova_util=v}});var superspawn;module.import('cordova-common/src/superspawn.js',{"default":function(v){superspawn=v}});var PluginInfoProvider;module.import('cordova-common/src/PluginInfo/PluginInfoProvider.js',{"default":function(v){PluginInfoProvider=v}});var CORDOVA_PLATFORMS,CORDOVA_PLATFORM_VERSIONS,displayNameForPlatform,displayNamesForPlatforms,newPluginId,convertPluginVersions,convertToGitUrl;module.import('./index.js',{"CORDOVA_PLATFORMS":function(v){CORDOVA_PLATFORMS=v},"CORDOVA_PLATFORM_VERSIONS":function(v){CORDOVA_PLATFORM_VERSIONS=v},"displayNameForPlatform":function(v){displayNameForPlatform=v},"displayNamesForPlatforms":function(v){displayNamesForPlatforms=v},"newPluginId":function(v){newPluginId=v},"convertPluginVersions":function(v){convertPluginVersions=v},"convertToGitUrl":function(v){convertToGitUrl=v}});var CordovaBuilder;module.import('./builder.js',{"CordovaBuilder":function(v){CordovaBuilder=v}});


















 // must always come before 'cordova-lib'








cordova_events.on('verbose', logIfVerbose);
cordova_events.on('log', logIfVerbose);
cordova_events.on('info', logIfVerbose);
cordova_events.on('warn', log);
cordova_events.on('error', log);

cordova_events.on('results', logIfVerbose);

function logIfVerbose() {
  if (Console.verbose) {
    log.apply(undefined, arguments);
  }
};

function log() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  Console.rawInfo('%% ' + util.format.apply(null, args) + '\n');
}

// We pin platform versions ourselves instead of relying on cordova-lib
// so we we can update them independently (e.g. use Cordova iOS 4.0.1
// with Cordova 5.4.1)
var pinnedPlatformVersions = CORDOVA_PLATFORM_VERSIONS;

// We pin plugin versions to make sure we do not install versions that are
// incompatible with the current platform versions.
// Versions are taken from cordova-lib's package.json and should be updated
// when we update to a newer version of cordova-lib.
var pinnedPluginVersions = {
  "cordova-plugin-battery-status": "1.2.0",
  "cordova-plugin-camera": "2.3.0",
  "cordova-plugin-console": "1.0.4",
  "cordova-plugin-contacts": "2.2.0",
  "cordova-plugin-device": "1.1.3",
  "cordova-plugin-device-motion": "1.2.2",
  "cordova-plugin-device-orientation": "1.0.4",
  "cordova-plugin-dialogs": "1.3.0",
  "cordova-plugin-file": "4.3.0",
  "cordova-plugin-file-transfer": "1.6.0",
  "cordova-plugin-geolocation": "2.3.0",
  "cordova-plugin-globalization": "1.0.4",
  "cordova-plugin-inappbrowser": "1.5.0",
  "cordova-plugin-legacy-whitelist": "1.1.1",
  "cordova-plugin-media": "2.4.0",
  "cordova-plugin-media-capture": "1.4.0",
  "cordova-plugin-network-information": "1.3.0",
  "cordova-plugin-splashscreen": "4.0.0",
  "cordova-plugin-statusbar": "2.2.0",
  "cordova-plugin-test-framework": "1.1.3",
  "cordova-plugin-vibration": "2.1.2",
  "cordova-plugin-whitelist": "1.3.0",
  "cordova-plugin-wkwebview-engine": "1.1.0"
};

var CordovaProject = function () {
  function CordovaProject(projectContext) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, CordovaProject);

    this.projectContext = projectContext;

    this.projectRoot = projectContext.getProjectLocalDirectory('cordova-build');
    this.options = options;

    this.pluginsDir = files.pathJoin(this.projectRoot, 'plugins');

    this.createIfNeeded();
  }

  CordovaProject.prototype.createIfNeeded = function createIfNeeded() {
    var _this = this;

    buildmessage.assertInJob();

    // Check if we have an existing Cordova project directory with outdated
    // platforms. In that case, we remove the whole directory to avoid issues.
    if (files.exists(this.projectRoot)) {
      (function () {
        var installedPlatforms = _this.listInstalledPlatforms();

        var outdated = _.some(pinnedPlatformVersions, function (pinnedVersion, platform) {
          // If the platform is not installed, it cannot be outdated
          if (!_.contains(installedPlatforms, platform)) {
            return false;
          }

          var installedVersion = _this.installedVersionForPlatform(platform);
          // If we cannot establish the installed version, we consider it outdated
          if (!installedVersion) {
            return true;
          }

          return semver.lt(installedVersion, pinnedVersion);
        });

        if (outdated) {
          Console.debug('Removing Cordova project directory to avoid issues with\noutdated platforms');
          // Remove Cordova project directory to start afresh
          // and avoid a broken project
          files.rm_recursive(_this.projectRoot);
        }
      })();
    }

    if (!files.exists(this.projectRoot)) {
      var _ret2 = function () {
        var _options;

        // We create a temporary directory with a generated config.xml
        // to use as a template for creating the Cordova project
        // This way, we are not dependent on the contents of
        // cordova-app-hello-world but we base our initial project state on
        // our own defaults and optionally a mobile-config.js

        var templatePath = files.mkdtemp('cordova-template-');

        // If we don't create an empty hooks directory, cordova-lib will attempt
        // to install one from a hardcoded path to cordova-app-hello-world
        files.mkdir_p(files.pathJoin(templatePath, 'hooks'));

        // If we don't create an empty www directory, cordova-lib will get
        // confused
        files.mkdir_p(files.pathJoin(templatePath, 'www'));

        var builder = new CordovaBuilder(_this.projectContext, templatePath, (_options = _this.options, mobileServerUrl = _options.mobileServerUrl, settingsFile = _options.settingsFile, _options));

        builder.processControlFile();

        if (buildmessage.jobHasMessages()) {
          return {
            v: void 0
          };
        }

        // Don't copy resources (they will be copied as part of the prepare)
        builder.writeConfigXmlAndCopyResources(false);

        // Create the Cordova project root directory
        files.mkdir_p(files.pathDirname(_this.projectRoot));

        var config = {
          lib: {
            www: {
              url: files.convertToOSPath(templatePath),
              template: true
            }
          }
        };

        // Don't set cwd to project root in runCommands because it doesn't
        // exist yet
        _this.runCommands('creating Cordova project', function _callee() {
          return _regeneratorRuntime.async(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.next = 2;
                  return _regeneratorRuntime.awrap(cordova_lib.raw.create(files.convertToOSPath(_this.projectRoot), undefined, undefined, config));

                case 2:
                case 'end':
                  return _context.stop();
              }
            }
          }, null, _this);
        }, undefined, null);
      }();

      if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
    }
  };

  // Preparing

  CordovaProject.prototype.prepareFromAppBundle = function prepareFromAppBundle(bundlePath, pluginVersions) {
    var _options2;

    assert(bundlePath);
    assert(pluginVersions);

    buildmessage.assertInJob();

    Console.debug('Preparing Cordova project from app bundle');

    var builder = new CordovaBuilder(this.projectContext, this.projectRoot, (_options2 = this.options, mobileServerUrl = _options2.mobileServerUrl, settingsFile = _options2.settingsFile, _options2));

    builder.processControlFile();

    if (buildmessage.jobHasMessages()) {
      return;
    }

    builder.writeConfigXmlAndCopyResources();
    builder.copyWWW(bundlePath);

    this.ensurePlatformsAreSynchronized();
    this.ensurePluginsAreSynchronized(pluginVersions, builder.pluginsConfiguration);

    // Temporary workaround for Cordova iOS bug until
    // https://issues.apache.org/jira/browse/CB-10885 is fixed
    var iosBuildExtrasPath = files.pathJoin(this.projectRoot, 'platforms/ios/cordova/build-extras.xcconfig');

    if (files.exists(iosBuildExtrasPath)) {
      files.writeFile(iosBuildExtrasPath, 'LD_RUNPATH_SEARCH_PATHS = @executable_path/Frameworks;');
    }

    builder.copyBuildOverride();
  };

  CordovaProject.prototype.prepareForPlatform = function prepareForPlatform(platform) {
    var _this2 = this;

    assert(platform);

    // Temporary workaround for Cordova iOS bug until
    // https://issues.apache.org/jira/browse/CB-11731 has been released
    delete require.cache[files.pathJoin(this.projectRoot, 'platforms/ios/cordova/lib/configMunger.js')];
    delete require.cache[files.pathJoin(this.projectRoot, 'platforms/ios/cordova/lib/prepare.js')];

    var commandOptions = _.extend(this.defaultOptions, { platforms: [platform] });

    this.runCommands('preparing Cordova project for platform ' + displayNameForPlatform(platform), function _callee2() {
      return _regeneratorRuntime.async(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return _regeneratorRuntime.awrap(cordova_lib.raw.prepare(commandOptions));

            case 2:
            case 'end':
              return _context2.stop();
          }
        }
      }, null, _this2);
    });
  };

  // Building (includes prepare)

  CordovaProject.prototype.buildForPlatform = function buildForPlatform(platform) {
    var _this3 = this;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var extraPaths = arguments[2];

    assert(platform);

    var commandOptions = _.extend(this.defaultOptions, { platforms: [platform], options: options });

    this.runCommands('building Cordova app for platform ' + displayNameForPlatform(platform), function _callee3() {
      return _regeneratorRuntime.async(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return _regeneratorRuntime.awrap(cordova_lib.raw.build(commandOptions));

            case 2:
            case 'end':
              return _context3.stop();
          }
        }
      }, null, _this3);
    });
  };

  // Running

  CordovaProject.prototype.run = function run(platform, isDevice) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
    var extraPaths = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
    var env, command;
    return _regeneratorRuntime.async(function run$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            options.push(isDevice ? '--device' : '--emulator');

            env = this.defaultEnvWithPathsAdded.apply(this, _toConsumableArray(extraPaths));
            command = files.convertToOSPath(files.pathJoin(this.projectRoot, 'platforms', platform, 'cordova', 'run'));


            this.runCommands('running Cordova app for platform ' + displayNameForPlatform(platform) + ' with options ' + options, execFileAsync(command, options, {
              env: env,
              cwd: this.projectRoot,
              stdio: Console.verbose ? 'inherit' : 'pipe',
              waitForClose: false
            }), null, null);

          case 4:
          case 'end':
            return _context4.stop();
        }
      }
    }, null, this);
  };

  // Platforms

  // Checks to see if the requirements for building and running on the
  // specified Cordova platform are satisfied, printing
  // installation instructions when needed.


  CordovaProject.prototype.checkPlatformRequirements = function checkPlatformRequirements(platform) {
    var _this4 = this;

    if (platform === 'ios' && process.platform !== 'darwin') {
      Console.warn("Currently, it is only possible to build iOS apps \
on an OS X system.");
      return false;
    }

    var installedPlatforms = this.listInstalledPlatforms();

    var inProject = _.contains(installedPlatforms, platform);
    if (!inProject) {
      Console.warn('Please add the ' + displayNameForPlatform(platform) + ' platform to your project first.');
      Console.info('Run: ' + Console.command('meteor add-platform ' + platform));
      return false;
    }

    var allRequirements = this.runCommands('checking Cordova requirements for platform ' + displayNameForPlatform(platform), function _callee4() {
      return _regeneratorRuntime.async(function _callee4$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              _context5.next = 2;
              return _regeneratorRuntime.awrap(cordova_lib.raw.requirements([platform], _this4.defaultOptions));

            case 2:
              return _context5.abrupt('return', _context5.sent);

            case 3:
            case 'end':
              return _context5.stop();
          }
        }
      }, null, _this4);
    });
    var requirements = allRequirements && allRequirements[platform];
    if (!requirements) {
      Console.error('Failed to check requirements for platform ' + displayNameForPlatform(platform));
      return false;
    } else if (requirements instanceof CordovaError) {
      Console.error('Cordova error: ' + requirements.message);
      return false;
    }

    // We don't use ios-deploy, but open Xcode to run on a device instead
    requirements = _.reject(requirements, function (requirement) {
      return requirement.id === 'ios-deploy';
    });

    var satisfied = _.every(requirements, function (requirement) {
      return requirement.installed;
    });

    if (!satisfied) {
      Console.info();
      Console.info('Your system does not yet seem to fulfill all requirements to build apps for ' + displayNameForPlatform(platform) + '.');

      Console.info();
      Console.info("Please follow the installation instructions in the mobile guide:");
      Console.info(Console.url("http://guide.meteor.com/mobile.html#installing-prerequisites"));

      Console.info();

      Console.info("Status of the individual requirements:");
      for (var _iterator = requirements, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        if (_isArray) {
          if (_i >= _iterator.length) break;
          requirement = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          requirement = _i.value;
        }

        var name = requirement.name;
        if (requirement.installed) {
          Console.success(name, "installed");
        } else {
          var reason = requirement.metadata && requirement.metadata.reason;
          if (reason) {
            Console.failInfo(name + ': ' + reason);
          } else {
            Console.failInfo(name);
          }
        }
      }
    }
    return satisfied;
  };

  CordovaProject.prototype.listInstalledPlatforms = function listInstalledPlatforms() {
    return cordova_util.listPlatforms(files.convertToOSPath(this.projectRoot));
  };

  CordovaProject.prototype.installedVersionForPlatform = function installedVersionForPlatform(platform) {
    var command = files.convertToOSPath(files.pathJoin(this.projectRoot, 'platforms', platform, 'cordova', 'version'));
    // Make sure the command exists before trying to execute it
    if (files.exists(command)) {
      return this.runCommands('getting installed version for platform ' + platform + ' in Cordova project', execFileSync(command, {
        env: this.defaultEnvWithPathsAdded(),
        cwd: this.projectRoot }), null, null);
    } else {
      return null;
    }
  };

  CordovaProject.prototype.updatePlatforms = function updatePlatforms() {
    var _this5 = this;

    var platforms = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.listInstalledPlatforms();

    this.runCommands('updating Cordova project for platforms ' + displayNamesForPlatforms(platforms), function _callee5() {
      return _regeneratorRuntime.async(function _callee5$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              _context6.next = 2;
              return _regeneratorRuntime.awrap(cordova_lib.raw.platform('update', platforms, _this5.defaultOptions));

            case 2:
            case 'end':
              return _context6.stop();
          }
        }
      }, null, _this5);
    });
  };

  CordovaProject.prototype.addPlatform = function addPlatform(platform) {
    var _this6 = this;

    this.runCommands('adding platform ' + displayNameForPlatform(platform) + ' to Cordova project', function _callee6() {
      var version, platformSpec;
      return _regeneratorRuntime.async(function _callee6$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              version = pinnedPlatformVersions[platform];
              platformSpec = version ? platform + '@' + version : platform;
              _context7.next = 4;
              return _regeneratorRuntime.awrap(cordova_lib.raw.platform('add', platformSpec, _this6.defaultOptions));

            case 4:
            case 'end':
              return _context7.stop();
          }
        }
      }, null, _this6);
    });
  };

  CordovaProject.prototype.removePlatform = function removePlatform(platform) {
    var _this7 = this;

    this.runCommands('removing platform ' + displayNameForPlatform(platform) + ' from Cordova project', function _callee7() {
      return _regeneratorRuntime.async(function _callee7$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              _context8.next = 2;
              return _regeneratorRuntime.awrap(cordova_lib.raw.platform('rm', platform, _this7.defaultOptions));

            case 2:
            case 'end':
              return _context8.stop();
          }
        }
      }, null, _this7);
    });
  };

  // Ensures that the Cordova platforms are synchronized with the app-level
  // platforms.
  CordovaProject.prototype.ensurePlatformsAreSynchronized = function ensurePlatformsAreSynchronized() {
    var platforms = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.cordovaPlatformsInApp;

    buildmessage.assertInCapture();

    var installedPlatforms = this.listInstalledPlatforms();

    for (var _iterator2 = platforms, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
      if (_isArray2) {
        if (_i2 >= _iterator2.length) break;
        platform = _iterator2[_i2++];
      } else {
        _i2 = _iterator2.next();
        if (_i2.done) break;
        platform = _i2.value;
      }

      if (_.contains(installedPlatforms, platform)) {
        continue;
      }

      this.addPlatform(platform);
    }

    for (var _iterator3 = installedPlatforms, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
      if (_isArray3) {
        if (_i3 >= _iterator3.length) break;
        platform = _iterator3[_i3++];
      } else {
        _i3 = _iterator3.next();
        if (_i3.done) break;
        platform = _i3.value;
      }

      if (!_.contains(platforms, platform) && _.contains(CORDOVA_PLATFORMS, platform)) {
        this.removePlatform(platform);
      }
    }
  };

  // Plugins

  // Because PluginInfoProvider reads in the plugin versions from
  // their plugin.xml, that only gives us the declared version and doesn't
  // tell us if plugins have been fetched from a Git SHA URL or a local path.
  // So we overwrite the declared versions with versions from
  // listFetchedPluginVersions that do contain this information.


  CordovaProject.prototype.listInstalledPluginVersions = function listInstalledPluginVersions() {
    var pluginInfoProvider = new PluginInfoProvider();
    var installedPluginVersions = pluginInfoProvider.getAllWithinSearchPath(files.convertToOSPath(this.pluginsDir));
    var fetchedPluginVersions = this.listFetchedPluginVersions();
    return _.object(installedPluginVersions.map(function (pluginInfo) {
      var id = pluginInfo.id;
      var version = fetchedPluginVersions[id] || pluginInfo.version;
      return [id, version];
    }));
  };

  // There is no Cordova function to get the fetched plugin versions, so we
  // have to read in fetch.json (a file managed by plugman, a semi-independent
  // part of cordova-lib) and parse the format ourselves into a version
  // string suitable to be passed to targetForPlugin.
  // Note that a plugin can be fetched but not installed, so that's why we
  // still need a separate listInstalledPluginVersions.


  CordovaProject.prototype.listFetchedPluginVersions = function listFetchedPluginVersions() {
    var fetchJsonPath = files.pathJoin(this.pluginsDir, 'fetch.json');

    if (!files.exists(fetchJsonPath)) {
      return {};
    }

    var fetchedPluginsMetadata = JSON.parse(files.readFile(fetchJsonPath, 'utf8'));
    return _.object(_.map(fetchedPluginsMetadata, function (metadata, id) {
      var source = metadata.source;
      var version = void 0;
      if (source.type === 'registry') {
        version = source.id.split('@')[1];
      } else if (source.type === 'git') {
        version = source.url + '#' + source.ref;
      } else if (source.type === 'local') {
        version = 'file://' + source.path;
      }
      return [id, version];
    }));
  };

  // Construct a target suitable for 'cordova plugin add' from an id and
  // version, converting or resolving a URL or path where needed.


  CordovaProject.prototype.targetForPlugin = function targetForPlugin(id, version) {
    assert(id);
    assert(version);

    buildmessage.assertInJob();

    if (utils.isUrlWithSha(version)) {
      return convertToGitUrl(version);
    } else if (utils.isUrlWithFileScheme(version)) {
      // Strip file:// and resolve the path relative to the cordova-build
      // directory
      var pluginPath = this.resolveLocalPluginPath(version);
      // We need to check if the directory exists ourselves because Cordova
      // will try to install from npm (and fail with an unhelpful error message)
      // if the directory is not found
      var stat = files.statOrNull(pluginPath);
      if (!(stat && stat.isDirectory())) {
        buildmessage.error('Couldn\'t find local directory \'' + files.convertToOSPath(pluginPath) + '\' (while attempting to install plugin ' + id + ').');
        return null;
      }
      return files.convertToOSPath(pluginPath);
    } else {
      return id + '@' + version;
    }
  };

  // Strips file:// and resolves the path relative to the cordova-build
  // directory


  CordovaProject.prototype.resolveLocalPluginPath = function resolveLocalPluginPath(pluginPath) {
    pluginPath = pluginPath.substr("file://".length);
    if (utils.isPathRelative(pluginPath)) {
      return files.pathResolve(this.projectContext.projectDir, pluginPath);
    } else {
      return pluginPath;
    }
  };

  CordovaProject.prototype.addPlugin = function addPlugin(id, version) {
    var _this8 = this;

    var config = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    var target = this.targetForPlugin(id, version);
    if (target) {
      (function () {
        var commandOptions = _.extend(_this8.defaultOptions, { cli_variables: config, link: utils.isUrlWithFileScheme(version) });

        _this8.runCommands('adding plugin ' + target + ' to Cordova project', function _callee8() {
          return _regeneratorRuntime.async(function _callee8$(_context9) {
            while (1) {
              switch (_context9.prev = _context9.next) {
                case 0:
                  _context9.next = 2;
                  return _regeneratorRuntime.awrap(cordova_lib.raw.plugin('add', [target], commandOptions));

                case 2:
                case 'end':
                  return _context9.stop();
              }
            }
          }, null, _this8);
        });
      })();
    }
  };

  // plugins is an array of plugin IDs.


  CordovaProject.prototype.removePlugins = function removePlugins(plugins) {
    var _this9 = this;

    if (_.isEmpty(plugins)) {
      return;
    }

    this.runCommands('removing plugins ' + plugins + ' from Cordova project', function _callee9() {
      return _regeneratorRuntime.async(function _callee9$(_context10) {
        while (1) {
          switch (_context10.prev = _context10.next) {
            case 0:
              _context10.next = 2;
              return _regeneratorRuntime.awrap(cordova_lib.raw.plugin('rm', plugins, _this9.defaultOptions));

            case 2:
            case 'end':
              return _context10.stop();
          }
        }
      }, null, _this9);
    });
  };

  // Ensures that the Cordova plugins are synchronized with the app-level
  // plugins.


  CordovaProject.prototype.ensurePluginsAreSynchronized = function ensurePluginsAreSynchronized(pluginVersions) {
    var _this10 = this;

    var pluginsConfiguration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    assert(pluginVersions);

    buildmessage.assertInCapture();

    buildmessage.enterJob({ title: "installing Cordova plugins" }, function () {
      // Cordova plugin IDs have changed as part of moving to npm.
      // We convert old plugin IDs to new IDs in the 1.2.0-cordova-changes
      // upgrader and when adding plugins, but packages may still depend on
      // the old IDs.
      // To avoid attempts at duplicate installation, we check for old IDs here
      // and convert them to new IDs when needed. We also convert old-style GitHub
      // tarball URLs to new Git URLs, and check if other Git URLs contain a
      // SHA reference.
      pluginVersions = convertPluginVersions(pluginVersions);

      // To ensure we do not attempt to install plugin versions incompatible
      // with the current platform versions, we compare them against a list of
      // pinned versions and adjust them if necessary.
      _this10.ensurePinnedPluginVersions(pluginVersions);

      if (buildmessage.jobHasMessages()) {
        return;
      }

      // Also, we warn if any App.configurePlugin calls in mobile-config.js
      // need to be updated (and in the meantime we take care of the
      // conversion of the plugin configuration to the new ID).
      pluginsConfiguration = _.object(_.map(pluginsConfiguration, function (config, id) {
        var newId = newPluginId(id);
        if (newId) {
          Console.warn();
          Console.labelWarn('Cordova plugin ' + id + ' has been renamed to ' + newId + ' as part of moving to npm. Please change the App.configurePlugin call in mobile-config.js accordingly.');
          return [newId, config];
        } else {
          return [id, config];
        }
      }));

      var installedPluginVersions = convertPluginVersions(_this10.listInstalledPluginVersions());

      // Due to the dependency structure of Cordova plugins, it is impossible to
      // upgrade the version on an individual Cordova plugin. Instead, whenever
      // a new Cordova plugin is added or removed, or its version is changed,
      // we just reinstall all of the plugins.
      var shouldReinstallAllPlugins = false;

      // Iterate through all of the plugins and find if any of them have a new
      // version. Additionally, check if we have plugins installed from a local
      // path.
      var pluginsFromLocalPath = {};
      _.each(pluginVersions, function (version, id) {
        // Check if plugin is installed from a local path.
        var isPluginFromLocalPath = utils.isUrlWithFileScheme(version);

        if (isPluginFromLocalPath) {
          pluginsFromLocalPath[id] = version;
        } else {
          if (!_.has(installedPluginVersions, id) || installedPluginVersions[id] !== version) {
            // We do not have the plugin installed or the version has changed.
            shouldReinstallAllPlugins = true;
          }
        }
      });

      if (!_.isEmpty(pluginsFromLocalPath)) {
        Console.debug('Reinstalling Cordova plugins added from the local path');
      }

      // Check to see if we have any installed plugins that are not in the
      // current set of plugins.
      _.each(installedPluginVersions, function (version, id) {
        if (!_.has(pluginVersions, id)) {
          shouldReinstallAllPlugins = true;
        }
      });

      // We either reinstall all plugins or only those fetched from a local
      // path.
      if (shouldReinstallAllPlugins || !_.isEmpty(pluginsFromLocalPath)) {
        (function () {
          var pluginsToRemove = void 0;
          if (shouldReinstallAllPlugins) {
            pluginsToRemove = Object.keys(installedPluginVersions);
          } else {
            // Only try to remove plugins that are currently installed.
            pluginsToRemove = _.intersection(Object.keys(pluginsFromLocalPath), Object.keys(installedPluginVersions));
          }

          _this10.removePlugins(pluginsToRemove);

          // Now install the necessary plugins.
          if (shouldReinstallAllPlugins) {
            pluginVersionsToInstall = pluginVersions;
          } else {
            pluginVersionsToInstall = pluginsFromLocalPath;
          }

          var pluginsToInstallCount = _.size(pluginVersionsToInstall);
          var installedPluginsCount = 0;

          buildmessage.reportProgress({ current: 0, end: pluginsToInstallCount });
          _.each(pluginVersionsToInstall, function (version, id) {
            _this10.addPlugin(id, version, pluginsConfiguration[id]);

            buildmessage.reportProgress({
              current: ++installedPluginsCount,
              end: pluginsToInstallCount
            });
          });
        })();
      }
    });
  };

  CordovaProject.prototype.ensurePinnedPluginVersions = function ensurePinnedPluginVersions(pluginVersions) {
    assert(pluginVersions);

    _.each(pluginVersions, function (version, id) {
      // Skip plugin specs that are not actual versions
      if (utils.isUrlWithSha(version) || utils.isUrlWithFileScheme(version)) {
        return;
      }

      var pinnedVersion = pinnedPluginVersions[id];

      if (pinnedVersion && semver.lt(version, pinnedVersion)) {
        Console.labelWarn('Attempting to install plugin ' + id + '@' + version + ', but it should have a minimum version of ' + pinnedVersion + ' to ensure compatibility with the current platform versions. Installing the minimum version for convenience, but you should adjust your dependencies.');
        pluginVersions[id] = pinnedVersion;
      }
    });
  };

  // Cordova commands support

  CordovaProject.prototype.defaultEnvWithPathsAdded = function defaultEnvWithPathsAdded() {
    var paths = this.defaultPaths || [];
    paths.unshift.apply(paths, arguments);
    var env = files.currentEnvWithPathsAdded.apply(files, _toConsumableArray(paths));
    return env;
  };

  CordovaProject.prototype.runCommands = function runCommands(title, promiseOrAsyncFunction) {
    var env = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.defaultEnvWithPathsAdded();
    var cwd = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : this.projectRoot;

    // Capitalize title for debug output
    Console.debug(title[0].toUpperCase() + title.slice(1));

    var oldCwd = process.cwd();
    if (cwd) {
      process.chdir(files.convertToOSPath(cwd));
    }

    var oldEnv = process.env;
    if (env) {
      // this preserves case insensitivity for PATH on windows
      Object.keys(env).forEach(function (key) {
        process.env[key] = env[key];
      });
    }

    try {
      var promise = typeof promiseOrAsyncFunction === 'function' ? promiseOrAsyncFunction() : promiseOrAsyncFunction;
      return Promise.await(promise);
    } catch (error) {
      Console.arrowError('Errors executing Cordova commands:');
      Console.error();
      var consoleOptions = Console.options({ indent: 3 });
      Console.error('While ' + title + ':', consoleOptions);

      if (error instanceof CordovaError) {
        // Only print the message for errors thrown by cordova-lib, because
        // these are meant for end-user consumption.
        // But warn that they may not completely apply to our situation.
        // (We do print the stack trace if we are in verbose mode.)
        var errorMessage = Console.verbose ? error.stack || error.message : error.message;
        Console.error('Cordova error: ' + errorMessage, consoleOptions);
        Console.error(chalk.green('(If the error message contains suggestions for a fix, note that this may not apply to the Meteor integration. You can try running again with the --verbose option to help diagnose the issue.)'), consoleOptions);
      } else {
        // Print stack trace for other errors by default, because the message
        // usually does not give us enough information to know what is going on
        var _errorMessage = error && error.stack || error;
        Console.error(_errorMessage, consoleOptions);
      };
      throw new main.ExitWithCode(1);
    } finally {
      if (cwd && oldCwd) {
        process.chdir(oldCwd);
      }
      if (env && oldEnv) {
        process.env = oldEnv;
      }
    }
  };

  _createClass(CordovaProject, [{
    key: 'cordovaPlatformsInApp',
    get: function get() {
      return this.projectContext.platformList.getCordovaPlatforms();
    }
  }, {
    key: 'defaultOptions',
    get: function get() {
      return { silent: !Console.verbose, verbose: Console.verbose };
    }
  }, {
    key: 'defaultPaths',
    get: function get() {
      var nodeBinDir = files.getCurrentNodeBinDir();

      // Add the ios-sim bin path so Cordova can find it
      var iosSimBinPath = files.pathJoin(files.getDevBundle(), 'lib/node_modules/ios-sim/bin');

      return [nodeBinDir, iosSimBinPath];
    }
  }]);

  return CordovaProject;
}();
//# sourceMappingURL=project.js.map