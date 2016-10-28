var _toConsumableArray;module.import('babel-runtime/helpers/toConsumableArray',{"default":function(v){_toConsumableArray=v}});var _;module.import('underscore',{"default":function(v){_=v}});var main;module.import('./main.js',{"default":function(v){main=v}});var Console;module.import('../console/console.js',{"Console":function(v){Console=v}});var catalog;module.import('../packaging/catalog/catalog.js',{"default":function(v){catalog=v}});var ProjectContext,PlatformList;module.import('../project-context.js',{"ProjectContext":function(v){ProjectContext=v},"PlatformList":function(v){PlatformList=v}});var buildmessage;module.import('../utils/buildmessage.js',{"default":function(v){buildmessage=v}});var files;module.import('../fs/files.js',{"default":function(v){files=v}});var cordova={};module.import('../cordova',{"*":function(v,n){cordova[n]=v}});var CordovaProject;module.import('../cordova/project.js',{"CordovaProject":function(v){CordovaProject=v}});











function createProjectContext(appDir) {
  var projectContext = new ProjectContext({
    projectDir: appDir
  });
  main.captureAndExit('=> Errors while initializing project:', function () {
    // We're just reading metadata here; we don't need to resolve constraints.
    projectContext.readProjectMetadata();
  });
  return projectContext;
}

// Add one or more Cordova platforms
main.registerCommand({
  name: 'add-platform',
  options: {
    verbose: { type: Boolean, short: "v" }
  },
  minArgs: 1,
  maxArgs: Infinity,
  requiresApp: true,
  catalogRefresh: new catalog.Refresh.Never(),
  notOnWindows: false
}, function (options) {
  Console.setVerbose(!!options.verbose);

  var projectContext = createProjectContext(options.appDir);

  var platformsToAdd = options.args;
  var installedPlatforms = projectContext.platformList.getPlatforms();

  main.captureAndExit('', 'adding platforms', function () {
    for (var _iterator = platformsToAdd, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      if (_isArray) {
        if (_i >= _iterator.length) break;
        platform = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        platform = _i.value;
      }

      if (_.contains(installedPlatforms, platform)) {
        buildmessage.error(platform + ': platform is already added');
      } else if (!_.contains(cordova.CORDOVA_PLATFORMS, platform)) {
        buildmessage.error(platform + ': no such platform');
      }
    }

    if (buildmessage.jobHasMessages()) {
      return;
    }

    var cordovaProject = new CordovaProject(projectContext);
    if (buildmessage.jobHasMessages()) return;

    installedPlatforms = installedPlatforms.concat(platformsToAdd);
    var cordovaPlatforms = cordova.filterPlatforms(installedPlatforms);
    cordovaProject.ensurePlatformsAreSynchronized(cordovaPlatforms);

    if (buildmessage.jobHasMessages()) {
      return;
    }

    // Only write the new platform list when we have succesfully synchronized
    projectContext.platformList.write(installedPlatforms);

    for (var _iterator2 = platformsToAdd, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
      if (_isArray2) {
        if (_i2 >= _iterator2.length) break;
        platform = _iterator2[_i2++];
      } else {
        _i2 = _iterator2.next();
        if (_i2.done) break;
        platform = _i2.value;
      }

      Console.info(platform + ': added platform');
      if (_.contains(cordovaPlatforms, platform)) {
        cordovaProject.checkPlatformRequirements(platform);
      }
    }
  });
});

// Remove one or more Cordova platforms
main.registerCommand({
  name: 'remove-platform',
  minArgs: 1,
  maxArgs: Infinity,
  requiresApp: true,
  catalogRefresh: new catalog.Refresh.Never()
}, function (options) {
  var projectContext = createProjectContext(options.appDir);

  var platformsToRemove = options.args;
  var installedPlatforms = projectContext.platformList.getPlatforms();

  main.captureAndExit('', 'removing platforms', function () {
    for (var _iterator3 = platformsToRemove, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
      if (_isArray3) {
        if (_i3 >= _iterator3.length) break;
        platform = _iterator3[_i3++];
      } else {
        _i3 = _iterator3.next();
        if (_i3.done) break;
        platform = _i3.value;
      }

      // Explain why we can't remove server or browser platforms
      if (_.contains(PlatformList.DEFAULT_PLATFORMS, platform)) {
        buildmessage.error(platform + ': cannot remove platform in this version of Meteor');
      } else if (!_.contains(installedPlatforms, platform)) {
        buildmessage.error(platform + ': platform is not in this project');
      }
    }

    if (buildmessage.jobHasMessages()) {
      return;
    }

    installedPlatforms = _.without.apply(_, [installedPlatforms].concat(_toConsumableArray(platformsToRemove)));
    projectContext.platformList.write(installedPlatforms);

    for (var _iterator4 = platformsToRemove, _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : _iterator4[Symbol.iterator]();;) {
      if (_isArray4) {
        if (_i4 >= _iterator4.length) break;
        platform = _iterator4[_i4++];
      } else {
        _i4 = _iterator4.next();
        if (_i4.done) break;
        platform = _i4.value;
      }

      Console.info(platform + ': removed platform');
    }

    if (process.platform !== 'win32') {
      var cordovaProject = new CordovaProject(projectContext);
      if (buildmessage.jobHasMessages()) return;
      var cordovaPlatforms = cordova.filterPlatforms(installedPlatforms);
      cordovaProject.ensurePlatformsAreSynchronized(cordovaPlatforms);
    }
  });
});

main.registerCommand({
  name: 'list-platforms',
  requiresApp: true,
  catalogRefresh: new catalog.Refresh.Never()
}, function (options) {
  var projectContext = createProjectContext(options.appDir);

  var installedPlatforms = projectContext.platformList.getPlatforms();

  Console.rawInfo(installedPlatforms.join('\n') + '\n');
});

main.registerCommand({
  name: 'install-sdk',
  options: {
    verbose: { type: Boolean, short: "v" }
  },
  minArgs: 0,
  maxArgs: Infinity,
  catalogRefresh: new catalog.Refresh.Never(),
  hidden: true,
  notOnWindows: true
}, function (options) {
  Console.setVerbose(!!options.verbose);

  Console.info("Please follow the installation instructions in the mobile guide:");
  Console.info(Console.url("http://guide.meteor.com/mobile.html#installing-prerequisites"));

  return 0;
});

main.registerCommand({
  name: 'configure-android',
  options: {
    verbose: { type: Boolean, short: "v" }
  },
  minArgs: 0,
  maxArgs: Infinity,
  catalogRefresh: new catalog.Refresh.Never(),
  hidden: true,
  notOnWindows: true
}, function (options) {
  Console.setVerbose(!!options.verbose);

  Console.info('You can launch the Android SDK Manager from within Android Studio.\nSee', Console.url("http://developer.android.com/tools/help/sdk-manager.html"), '\nAlternatively, you can launch it by running the \'android\' command.\n(This requires that you have set ANDROID_HOME and added ANDROID_HOME/tools to your PATH.)');

  return 0;
});
//# sourceMappingURL=commands-cordova.js.map