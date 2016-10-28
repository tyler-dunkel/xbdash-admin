module.export({CordovaRunTarget:function(){return CordovaRunTarget},iOSRunTarget:function(){return iOSRunTarget},AndroidRunTarget:function(){return AndroidRunTarget}});var _slicedToArray;module.import('babel-runtime/helpers/slicedToArray',{"default":function(v){_slicedToArray=v}});var _regeneratorRuntime;module.import('babel-runtime/regenerator',{"default":function(v){_regeneratorRuntime=v}});var _possibleConstructorReturn;module.import('babel-runtime/helpers/possibleConstructorReturn',{"default":function(v){_possibleConstructorReturn=v}});var _inherits;module.import('babel-runtime/helpers/inherits',{"default":function(v){_inherits=v}});var _classCallCheck;module.import('babel-runtime/helpers/classCallCheck',{"default":function(v){_classCallCheck=v}});var _createClass;module.import('babel-runtime/helpers/createClass',{"default":function(v){_createClass=v}});var _;module.import('underscore',{"default":function(v){_=v}});var chalk;module.import('chalk',{"default":function(v){chalk=v}});var child_process;module.import('child_process',{"default":function(v){child_process=v}});var eachline;module.import('eachline',{"default":function(v){eachline=v}});var loadIsopacket;module.import('../tool-env/isopackets.js',{"load":function(v){loadIsopacket=v}});var runLog;module.import('../runners/run-log.js',{"default":function(v){runLog=v}});var Console;module.import('../console/console.js',{"Console":function(v){Console=v}});var files;module.import('../fs/files.js',{"default":function(v){files=v}});var execFileSync,execFileAsync;module.import('../utils/processes.js',{"execFileSync":function(v){execFileSync=v},"execFileAsync":function(v){execFileAsync=v}});
















var CordovaRunTarget = function () {
  function CordovaRunTarget() {
    _classCallCheck(this, CordovaRunTarget);
  }

  _createClass(CordovaRunTarget, [{
    key: 'title',
    get: function get() {
      return 'app on ' + this.displayName;
    }
  }]);

  return CordovaRunTarget;
}();

var iOSRunTarget = function (_CordovaRunTarget) {
  _inherits(iOSRunTarget, _CordovaRunTarget);

  function iOSRunTarget(isDevice) {
    _classCallCheck(this, iOSRunTarget);

    var _this = _possibleConstructorReturn(this, _CordovaRunTarget.call(this));

    _this.platform = 'ios';
    _this.isDevice = isDevice;
    return _this;
  }

  iOSRunTarget.prototype.start = function start(cordovaProject) {
    return _regeneratorRuntime.async(function start$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!this.isDevice) {
              _context.next = 4;
              break;
            }

            openXcodeProject(files.pathJoin(cordovaProject.projectRoot, 'platforms', 'ios'));
            _context.next = 7;
            break;

          case 4:
            _context.next = 6;
            return _regeneratorRuntime.awrap(cordovaProject.run(this.platform, this.isDevice, undefined));

          case 6:

            // Bring iOS Simulator to front (it is called Simulator in Xcode 7)
            execFileAsync('osascript', ['-e', 'tell application "System Events"\n  set possibleSimulatorNames to {"iOS Simulator", "Simulator"}\n  repeat with possibleSimulatorName in possibleSimulatorNames\n    if application process possibleSimulatorName exists then\n      set frontmost of process possibleSimulatorName to true\n    end if\n  end repeat\nend tell']);

          case 7:
          case 'end':
            return _context.stop();
        }
      }
    }, null, this);
  };

  _createClass(iOSRunTarget, [{
    key: 'displayName',
    get: function get() {
      return this.isDevice ? "iOS Device" : "iOS Simulator";
    }
  }]);

  return iOSRunTarget;
}(CordovaRunTarget);

function openXcodeProject(projectDir) {
  var projectFilename = files.readdir(projectDir).filter(function (entry) {
    return entry.match(/\.xcodeproj$/i);
  })[0];

  if (!projectFilename) {
    printFailure('Couldn\'t find your Xcode project in directory \'' + files.convertToOSPath(projectDir) + '\'');
    return;
  }

  var projectFilePath = files.pathJoin(projectDir, projectFilename);

  try {
    execFileSync('open', [projectFilePath]);

    Console.info();
    Console.info(chalk.green("Your project has been opened in Xcode so that you can run your " + "app on an iOS device. For further instructions, visit this " + "wiki page: ") + Console.url("https://github.com/meteor/meteor/wiki/" + "How-to-run-your-app-on-an-iOS-device"));
    Console.info();
  } catch (error) {
    printFailure('Failed to open your project in Xcode:\n' + error.message);
  }

  function printFailure(message) {
    Console.error();
    Console.error(message);
    Console.error(chalk.green("Instructions for running your app on an iOS device: ") + Console.url("https://github.com/meteor/meteor/wiki/" + "How-to-run-your-app-on-an-iOS-device"));
    Console.error();
  }
}

var AndroidRunTarget = function (_CordovaRunTarget2) {
  _inherits(AndroidRunTarget, _CordovaRunTarget2);

  function AndroidRunTarget(isDevice) {
    _classCallCheck(this, AndroidRunTarget);

    var _this2 = _possibleConstructorReturn(this, _CordovaRunTarget2.call(this));

    _this2.platform = 'android';
    _this2.isDevice = isDevice;
    return _this2;
  }

  AndroidRunTarget.prototype.start = function start(cordovaProject) {
    var target;
    return _regeneratorRuntime.async(function start$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            // XXX This only works if we have at most one device or one emulator
            // connected. We should find a way to get the target ID from run and use
            // it instead of -d or -e.
            target = this.isDevice ? "-d" : "-e";

            // Clear logs

            execFileAsync('adb', [target, 'logcat', '-c']);

            _context2.next = 4;
            return _regeneratorRuntime.awrap(cordovaProject.run(this.platform, this.isDevice));

          case 4:

            this.tailLogs(cordovaProject, target).done();

          case 5:
          case 'end':
            return _context2.stop();
        }
      }
    }, null, this);
  };

  AndroidRunTarget.prototype.checkPlatformRequirementsAndSetEnv = function checkPlatformRequirementsAndSetEnv(cordovaProject) {
    var check_reqs_path, check_reqs;
    return _regeneratorRuntime.async(function checkPlatformRequirementsAndSetEnv$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            // Cordova Android is fairly good at applying various heuristics to find
            // suitable values for JAVA_HOME and ANDROID_HOME, and to augment the PATH
            // with those variables.
            // Unfortunately, this is intertwined with checking requirements, so the
            // only way to get access to this functionality is to run check_reqs and
            // let it modify process.env
            check_reqs_path = files.pathJoin(cordovaProject.projectRoot, 'platforms', this.platform, 'cordova', 'lib', 'check_reqs');

            check_reqs_path = files.convertToOSPath(check_reqs_path);
            check_reqs = require(check_reqs_path);
            // We can't use check_reqs.run() because that will print the values of
            // JAVA_HOME and ANDROID_HOME to stdout.

            _context3.next = 5;
            return _regeneratorRuntime.awrap(Promise.all([check_reqs.check_java(), check_reqs.check_android().then(check_reqs.check_android_target)]));

          case 5:
          case 'end':
            return _context3.stop();
        }
      }
    }, null, this);
  };

  AndroidRunTarget.prototype.tailLogs = function tailLogs(cordovaProject, target) {
    var _this3 = this;

    return _regeneratorRuntime.async(function tailLogs$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            cordovaProject.runCommands('tailing logs for ' + this.displayName, function _callee() {
              var logLevel, filterExpressions, Log, logStream;
              return _regeneratorRuntime.async(function _callee$(_context4) {
                while (1) {
                  switch (_context4.prev = _context4.next) {
                    case 0:
                      _context4.next = 2;
                      return _regeneratorRuntime.awrap(_this3.checkPlatformRequirementsAndSetEnv(cordovaProject));

                    case 2:
                      logLevel = Console.verbose ? "V" : "I";
                      filterExpressions = ['MeteorWebApp:' + logLevel, 'CordovaLog:' + logLevel, 'chromium:' + logLevel, 'SystemWebViewClient:' + logLevel, '*:F'];
                      Log = loadIsopacket('cordova-support')['logging'].Log;
                      logStream = eachline(function (line) {
                        var logEntry = logFromAndroidLogcatLine(Log, line);
                        if (logEntry) {
                          return logEntry + '\n';
                        }
                      });

                      logStream.pipe(process.stdout);

                      // Asynchronously start tailing logs to stdout
                      execFileAsync('adb', [target, 'logcat'].concat(filterExpressions), { destination: logStream });

                    case 8:
                    case 'end':
                      return _context4.stop();
                  }
                }
              }, null, _this3);
            });

          case 1:
          case 'end':
            return _context5.stop();
        }
      }
    }, null, this);
  };

  _createClass(AndroidRunTarget, [{
    key: 'displayName',
    get: function get() {
      return this.isDevice ? "Android Device" : "Android Emulator";
    }
  }]);

  return AndroidRunTarget;
}(CordovaRunTarget);

function logFromAndroidLogcatLine(Log, line) {
  // Ignore lines indicating beginning of logging
  if (line.match(/^--------- beginning of /)) {
    return null;
  }

  // Matches logcat brief format
  // "I/Tag(  PID): message"
  var match = line.match(/^([A-Z])\/([^\(]*?)\(\s*(\d+)\): (.*)$/);

  if (match) {
    var _match = match;

    var _match2 = _slicedToArray(_match, 5);

    priority = _match2[1];
    tag = _match2[2];
    pid = _match2[3];
    message = _match2[4];


    if (tag === 'chromium') {
      // Matches Chromium log format
      // [INFO:CONSOLE(23)] "Bla!", source: http://meteor.local/app/mobileapp.js (23)
      match = message.match(/^\[(.*):(.*)\((\d+)\)\] (.*)$/);

      if (match) {
        var _match3 = match;

        var _match4 = _slicedToArray(_match3, 5);

        logLevel = _match4[1];
        filename = _match4[2];
        lineNumber = _match4[3];
        message = _match4[4];


        if (filename === 'CONSOLE') {
          match = message.match(/^\"(.*)\", source: (.*) \((\d+)\)$/);

          if (match) {
            var _match5 = match;

            var _match6 = _slicedToArray(_match5, 4);

            message = _match6[1];
            filename = _match6[2];
            lineNumber = _match6[3];

            return logFromConsoleOutput(Log, message, filename, lineNumber);
          }
        }
      }
    } else if (tag === 'CordovaLog') {
      // http://meteor.local/mobileappold.js?3c198a97a802ad2c6eab52da0244245e30b964ed: Line 15 : Clicked!

      match = message.match(/^(.*): Line (\d+) : (.*)$/);

      if (match) {
        var _match7 = match;

        var _match8 = _slicedToArray(_match7, 4);

        filename = _match8[1];
        lineNumber = _match8[2];
        message = _match8[3];

        return logFromConsoleOutput(Log, message, filename, lineNumber);
      }
    }
  }

  return Log.format(Log.objFromText(line), { metaColor: 'green', color: true });
};

function logFromConsoleOutput(Log, message, filename, lineNumber) {
  if (isDebugOutput(message) && !Console.verbose) {
    return null;
  }

  filename = filename.replace(/\?.*$/, '');

  return Log.format({
    time: new Date(),
    level: 'info',
    file: filename,
    line: lineNumber,
    message: message,
    program: 'android'
  }, {
    metaColor: 'green',
    color: true
  });
}

function isDebugOutput(message) {
  // Skip the debug output produced by Meteor components.
  return (/^METEOR CORDOVA DEBUG /.test(message) || /^HTTPD DEBUG /.test(message)
  );
};
//# sourceMappingURL=run-targets.js.map