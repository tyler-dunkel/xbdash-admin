module.export({CordovaRunner:function(){return CordovaRunner}});var _classCallCheck;module.import('babel-runtime/helpers/classCallCheck',{"default":function(v){_classCallCheck=v}});var _createClass;module.import('babel-runtime/helpers/createClass',{"default":function(v){_createClass=v}});var _;module.import('underscore',{"default":function(v){_=v}});var buildmessage;module.import('../utils/buildmessage.js',{"default":function(v){buildmessage=v}});var runLog;module.import('../runners/run-log.js',{"default":function(v){runLog=v}});var Console;module.import('../console/console.js',{"Console":function(v){Console=v}});var main;module.import('../cli/main.js',{"default":function(v){main=v}});var displayNameForPlatform,prepareProjectForBuild;module.import('./index.js',{"displayNameForPlatform":function(v){displayNameForPlatform=v},"prepareProjectForBuild":function(v){prepareProjectForBuild=v}});









var CordovaRunner = function () {
  function CordovaRunner(cordovaProject, runTargets) {
    _classCallCheck(this, CordovaRunner);

    this.cordovaProject = cordovaProject;
    this.runTargets = runTargets;

    this.started = false;
  }

  CordovaRunner.prototype.checkPlatformsForRunTargets = function checkPlatformsForRunTargets() {
    var _this = this;

    this.cordovaProject.ensurePlatformsAreSynchronized();

    var satisfied = true;
    var messages = buildmessage.capture({ title: 'checking platform requirements' }, function () {
      for (var _iterator = _this.platformsForRunTargets, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        if (_isArray) {
          if (_i >= _iterator.length) break;
          platform = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          platform = _i.value;
        }

        satisfied = _this.cordovaProject.checkPlatformRequirements(platform) && satisfied;
      }
    });

    if (messages.hasMessages()) {
      Console.printMessages(messages);
      throw new main.ExitWithCode(1);
    } else if (!satisfied) {
      throw new main.ExitWithCode(1);
    };
  };

  CordovaRunner.prototype.printWarningsIfNeeded = function printWarningsIfNeeded() {
    // OAuth2 packages don't work so well with any mobile platform except the
    // iOS Simulator. Print a warning and direct users to the wiki page for help.
    if (this.projectContext.packageMap.getInfo('oauth2')) {
      Console.warn();
      Console.labelWarn("It looks like you are using OAuth2 login in your app. " + "Meteor's OAuth2 implementation does not currently work with " + "mobile apps in local development mode, except in the iOS " + "simulator. You can run the iOS simulator with 'meteor run ios'. " + "For additional workarounds, see " + Console.url("https://github.com/meteor/meteor/wiki/" + "OAuth-for-mobile-Meteor-clients."));
    }

    // If we are targeting remote devices, warn about ports and same network.
    if (_.findWhere(this.runTargets, { isDevice: true })) {
      Console.warn();
      Console.labelWarn("You are testing your app on a remote device. " + "For the mobile app to be able to connect to the local server, make " + "sure your device is on the same network, and that the network " + "configuration allows clients to talk to each other " + "(no client isolation).");
    }
  };

  CordovaRunner.prototype.prepareProject = function prepareProject(bundlePath, pluginVersions, options) {
    var _this2 = this;

    buildmessage.assertInCapture();

    buildmessage.enterJob({ title: "preparing Cordova project" }, function () {
      _this2.cordovaProject.prepareFromAppBundle(bundlePath, pluginVersions, options);

      if (buildmessage.jobHasMessages()) {
        return;
      }

      for (var _iterator2 = _this2.platformsForRunTargets, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
        if (_isArray2) {
          if (_i2 >= _iterator2.length) break;
          platform = _iterator2[_i2++];
        } else {
          _i2 = _iterator2.next();
          if (_i2.done) break;
          platform = _i2.value;
        }

        _this2.cordovaProject.prepareForPlatform(platform);
      }
    });

    this.pluginVersions = pluginVersions;
  };

  CordovaRunner.prototype.startRunTargets = function startRunTargets() {
    var _this3 = this;

    this.started = false;

    for (var _iterator3 = this.runTargets, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
      if (_isArray3) {
        if (_i3 >= _iterator3.length) break;
        runTarget = _iterator3[_i3++];
      } else {
        _i3 = _iterator3.next();
        if (_i3.done) break;
        runTarget = _i3.value;
      }

      var messages = buildmessage.capture({ title: 'starting ' + runTarget.title }, function () {
        Promise.await(runTarget.start(_this3.cordovaProject));
      });
      if (messages.hasMessages()) {
        Console.printMessages(messages);
      } else {
        runLog.log('Started ' + runTarget.title + '.', { arrow: true });
      }
    }

    this.started = true;
  };

  CordovaRunner.prototype.havePlatformsChangedSinceLastRun = function havePlatformsChangedSinceLastRun() {
    var platformsForRunTargets = this.platformsForRunTargets;
    if (!platformsForRunTargets) {
      return false;
    }

    var cordovaPlatformsInApp = this.cordovaProject.cordovaPlatformsInApp;

    return !_.isEqual(platformsForRunTargets, _.intersection(platformsForRunTargets, cordovaPlatformsInApp));
  };

  CordovaRunner.prototype.havePluginsChangedSinceLastRun = function havePluginsChangedSinceLastRun(pluginVersions) {
    return this.pluginVersions && !_.isEqual(this.pluginVersions, pluginVersions);
  };

  _createClass(CordovaRunner, [{
    key: 'projectContext',
    get: function get() {
      return this.cordovaProject.projectContext;
    }
  }, {
    key: 'platformsForRunTargets',
    get: function get() {
      return _.uniq(this.runTargets.map(function (runTarget) {
        return runTarget.platform;
      }));
    }
  }]);

  return CordovaRunner;
}();
//# sourceMappingURL=runner.js.map