module.export({CordovaBuilder:function(){return CordovaBuilder}});var _slicedToArray;module.import('babel-runtime/helpers/slicedToArray',{"default":function(v){_slicedToArray=v}});var _classCallCheck;module.import('babel-runtime/helpers/classCallCheck',{"default":function(v){_classCallCheck=v}});var _;module.import('underscore',{"default":function(v){_=v}});var util;module.import('util',{"default":function(v){util=v}});var Console;module.import('../console/console.js',{"Console":function(v){Console=v}});var buildmessage;module.import('../utils/buildmessage.js',{"default":function(v){buildmessage=v}});var files;module.import('../fs/files.js',{"default":function(v){files=v}});var bundler;module.import('../isobuild/bundler.js',{"default":function(v){bundler=v}});var archinfo;module.import('../utils/archinfo.js',{"default":function(v){archinfo=v}});var release;module.import('../packaging/release.js',{"default":function(v){release=v}});var loadIsopacket;module.import('../tool-env/isopackets.js',{"load":function(v){loadIsopacket=v}});var utils;module.import('../utils/utils.js',{"default":function(v){utils=v}});var CORDOVA_ARCH;module.import('./index.js',{"CORDOVA_ARCH":function(v){CORDOVA_ARCH=v}});














// Hard-coded size constants

var iconsIosSizes = {
  'iphone_2x': '120x120',
  'iphone_3x': '180x180',
  'ipad': '76x76',
  'ipad_2x': '152x152',
  'ipad_pro': '167x167',
  'ios_settings': '29x29',
  'ios_settings_2x': '58x58',
  'ios_settings_3x': '87x87',
  'ios_spotlight': '40x40',
  'ios_spotlight_2x': '80x80'
};

var iconsAndroidSizes = {
  'android_mdpi': '48x48',
  'android_hdpi': '72x72',
  'android_xhdpi': '96x96',
  'android_xxhdpi': '144x144',
  'android_xxxhdpi': '192x192'
};

var launchIosSizes = {
  'iphone_2x': '640x960',
  'iphone5': '640x1136',
  'iphone6': '750x1334',
  'iphone6p_portrait': '1242x2208',
  'iphone6p_landscape': '2208x1242',
  'ipad_portrait': '768x1024',
  'ipad_portrait_2x': '1536x2048',
  'ipad_landscape': '1024x768',
  'ipad_landscape_2x': '2048x1536'
};

var launchAndroidSizes = {
  'android_mdpi_portrait': '320x470',
  'android_mdpi_landscape': '470x320',
  'android_hdpi_portrait': '480x640',
  'android_hdpi_landscape': '640x480',
  'android_xhdpi_portrait': '720x960',
  'android_xhdpi_landscape': '960x720',
  'android_xxhdpi_portrait': '1080x1440',
  'android_xxhdpi_landscape': '1440x1080'
};

var CordovaBuilder = function () {
  function CordovaBuilder(projectContext, projectRoot, options) {
    _classCallCheck(this, CordovaBuilder);

    this.projectContext = projectContext;
    this.projectRoot = projectRoot;
    this.options = options;

    this.resourcesPath = files.pathJoin(this.projectRoot, 'resources');

    this.initalizeDefaults();
  }

  CordovaBuilder.prototype.initalizeDefaults = function initalizeDefaults() {
    var _this = this;

    // Convert the appId (a base 36 string) to a number
    var appIdAsNumber = parseInt(this.projectContext.appIdentifier, 36);
    // We use the appId to choose a local server port between 12000-13000.
    // This range should be large enough to avoid collisions with other
    // Meteor apps, and has also been chosen to avoid collisions
    // with other apps or services on the device (although this can never be
    // guaranteed).
    var localServerPort = 12000 + appIdAsNumber % 1000;

    this.metadata = {
      id: 'com.id' + this.projectContext.appIdentifier,
      version: '0.0.1',
      buildNumber: undefined,
      name: files.pathBasename(this.projectContext.projectDir),
      description: 'New Meteor Mobile App',
      author: 'A Meteor Developer',
      email: 'n/a',
      website: 'n/a',
      contentUrl: 'http://localhost:' + localServerPort + '/'
    };

    // Set some defaults different from the Cordova defaults
    this.additionalConfiguration = {
      global: {
        'webviewbounce': false,
        'DisallowOverscroll': true
      },
      platform: {
        ios: {},
        android: {}
      }
    };

    // Custom elements that will be appended into config.xml's widgets
    this.custom = [];

    var packageMap = this.projectContext.packageMap;

    if (packageMap && packageMap.getInfo('launch-screen')) {
      this.additionalConfiguration.global.AutoHideSplashScreen = false;
      this.additionalConfiguration.global.SplashScreen = 'screen';
      this.additionalConfiguration.global.SplashScreenDelay = 5000;
      this.additionalConfiguration.global.FadeSplashScreenDuration = 250;
      this.additionalConfiguration.global.ShowSplashScreenSpinner = false;
    }

    if (packageMap && packageMap.getInfo('mobile-status-bar')) {
      this.additionalConfiguration.global.StatusBarOverlaysWebView = false;
      this.additionalConfiguration.global.StatusBarStyle = 'default';
    }

    // Default access rules.
    // Rules can be extended with App.accesRule() in mobile-config.js.
    this.accessRules = {
      // Allow the app to ask the system to open these types of URLs.
      // (e.g. in the phone app or an email client)
      'tel:*': { type: 'intent' },
      'geo:*': { type: 'intent' },
      'mailto:*': { type: 'intent' },
      'sms:*': { type: 'intent' },
      'market:*': { type: 'intent' },
      'itms:*': { type: 'intent' },
      'itms-apps:*': { type: 'intent' },

      // Allow navigation to localhost, which is needed for the local server
      'http://localhost': { type: 'navigation' }
    };

    var mobileServerUrl = this.options.mobileServerUrl;
    var serverDomain = mobileServerUrl ? utils.parseUrl(mobileServerUrl).hostname : null;

    // If the remote server domain is known, allow access to it for XHR and DDP
    // connections.
    if (serverDomain) {
      // Application Transport Security (new in iOS 9) doesn't allow you
      // to give access to IP addresses (just domains). So we allow access to
      // everything if we don't have a domain, which sets NSAllowsArbitraryLoads.
      if (utils.isIPv4Address(serverDomain)) {
        this.accessRules['*'] = { type: 'network' };
      } else {
        this.accessRules['*://' + serverDomain] = { type: 'network' };

        // Android talks to localhost over 10.0.2.2. This config file is used for
        // multiple platforms, so any time that we say the server is on localhost we
        // should also say it is on 10.0.2.2.
        if (serverDomain === 'localhost') {
          this.accessRules['*://10.0.2.2'] = { type: 'network' };
        }
      }
    }

    this.imagePaths = {
      icon: {},
      splash: {}
    };

    // Defaults are Meteor meatball images located in tools/cordova/assets directory
    var assetsPath = files.pathJoin(__dirname, 'assets');
    var iconsPath = files.pathJoin(assetsPath, 'icons');
    var launchScreensPath = files.pathJoin(assetsPath, 'launchscreens');

    var setDefaultIcon = function setDefaultIcon(size, name) {
      var imageFile = files.pathJoin(iconsPath, size + '.png');
      if (files.exists(imageFile)) {
        _this.imagePaths.icon[name] = imageFile;
      }
    };

    var setDefaultLaunchScreen = function setDefaultLaunchScreen(size, name) {
      var imageFile = files.pathJoin(launchScreensPath, size + '.png');
      if (files.exists(imageFile)) {
        _this.imagePaths.splash[name] = imageFile;
      }
    };

    _.each(iconsIosSizes, setDefaultIcon);
    _.each(iconsAndroidSizes, setDefaultIcon);
    _.each(launchIosSizes, setDefaultLaunchScreen);
    _.each(launchAndroidSizes, setDefaultLaunchScreen);

    this.pluginsConfiguration = {};
  };

  CordovaBuilder.prototype.processControlFile = function processControlFile() {
    var _this2 = this;

    var controlFilePath = files.pathJoin(this.projectContext.projectDir, 'mobile-config.js');

    if (files.exists(controlFilePath)) {
      Console.debug('Processing mobile-config.js');

      buildmessage.enterJob({ title: 'processing mobile-config.js' }, function () {
        var code = files.readFile(controlFilePath, 'utf8');

        try {
          files.runJavaScript(code, {
            filename: 'mobile-config.js',
            symbols: { App: createAppConfiguration(_this2) }
          });
        } catch (error) {
          buildmessage.exception(error);
        }
      });
    }
  };

  CordovaBuilder.prototype.writeConfigXmlAndCopyResources = function writeConfigXmlAndCopyResources() {
    var shouldCopyResources = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
    var XmlBuilder = loadIsopacket('cordova-support')['xmlbuilder'].XmlBuilder;


    var config = XmlBuilder.create('widget');

    // Set the root attributes
    _.each({
      id: this.metadata.id,
      version: this.metadata.version,
      'android-versionCode': this.metadata.buildNumber,
      'ios-CFBundleVersion': this.metadata.buildNumber,
      xmlns: 'http://www.w3.org/ns/widgets',
      'xmlns:cdv': 'http://cordova.apache.org/ns/1.0'
    }, function (value, key) {
      if (value) {
        config.att(key, value);
      }
    });

    // Set the metadata
    config.element('name').txt(this.metadata.name);
    config.element('description').txt(this.metadata.description);
    config.element('author', {
      href: this.metadata.website,
      email: this.metadata.email
    }).txt(this.metadata.author);

    // Set the additional global configuration preferences
    _.each(this.additionalConfiguration.global, function (value, key) {
      config.element('preference', {
        name: key,
        value: value.toString()
      });
    });

    // Set custom tags into widget element
    _.each(this.custom, function (elementSet) {
      var tag = config.raw(elementSet);
    });

    config.element('content', { src: this.metadata.contentUrl });

    // Copy all the access rules
    _.each(this.accessRules, function (options, pattern) {
      var type = options.type;
      options = _.omit(options, 'type');

      if (type === 'intent') {
        config.element('allow-intent', { href: pattern });
      } else if (type === 'navigation') {
        config.element('allow-navigation', _.extend({ href: pattern }, options));
      } else {
        config.element('access', _.extend({ origin: pattern }, options));
      }
    });

    var platformElement = {
      ios: config.element('platform', { name: 'ios' }),
      android: config.element('platform', { name: 'android' })
    };

    // Set the additional platform-specific configuration preferences
    _.each(this.additionalConfiguration.platform, function (prefs, platform) {
      _.each(prefs, function (value, key) {
        platformElement[platform].element('preference', {
          name: key,
          value: value.toString()
        });
      });
    });

    if (shouldCopyResources) {
      // Prepare the resources folder
      files.rm_recursive(this.resourcesPath);
      files.mkdir_p(this.resourcesPath);

      Console.debug('Copying resources for mobile apps');

      this.configureAndCopyImages(iconsIosSizes, platformElement.ios, 'icon');
      this.configureAndCopyImages(iconsAndroidSizes, platformElement.android, 'icon');
      this.configureAndCopyImages(launchIosSizes, platformElement.ios, 'splash');
      this.configureAndCopyImages(launchAndroidSizes, platformElement.android, 'splash');
    }

    Console.debug('Writing new config.xml');

    var configXmlPath = files.pathJoin(this.projectRoot, 'config.xml');
    var formattedXmlConfig = config.end({ pretty: true });
    files.writeFile(configXmlPath, formattedXmlConfig, 'utf8');
  };

  CordovaBuilder.prototype.configureAndCopyImages = function configureAndCopyImages(sizes, xmlElement, tag) {
    var _this3 = this;

    var imageAttributes = function imageAttributes(name, width, height, src) {
      var androidMatch = /android_(.?.dpi)_(landscape|portrait)/g.exec(name);

      var attributes = {
        src: src,
        width: width,
        height: height
      };

      // XXX special case for Android
      if (androidMatch) {
        attributes.density = androidMatch[2].substr(0, 4) + '-' + androidMatch[1];
      }

      return attributes;
    };

    _.each(sizes, function (size, name) {
      var _size$split = size.split('x');

      var _size$split2 = _slicedToArray(_size$split, 2);

      var width = _size$split2[0];
      var height = _size$split2[1];


      var suppliedPath = _this3.imagePaths[tag][name];
      if (!suppliedPath) {
        return;
      }

      var suppliedFilename = _.last(suppliedPath.split(files.pathSep));
      var extension = _.last(suppliedFilename.split('.'));

      // XXX special case for 9-patch png's
      if (suppliedFilename.match(/\.9\.png$/)) {
        extension = '9.png';
      }

      var filename = name + '.' + tag + '.' + extension;
      var src = files.pathJoin('resources', filename);

      // Copy the file to the build folder with a standardized name
      files.copyFile(files.pathResolve(_this3.projectContext.projectDir, suppliedPath), files.pathJoin(_this3.resourcesPath, filename));

      // Set it to the xml tree
      xmlElement.element(tag, imageAttributes(name, width, height, src));
    });
  };

  CordovaBuilder.prototype.copyWWW = function copyWWW(bundlePath) {
    var wwwPath = files.pathJoin(this.projectRoot, 'www');

    // Remove existing www
    files.rm_recursive(wwwPath);

    // Create www and www/application directories
    var applicationPath = files.pathJoin(wwwPath, 'application');
    files.mkdir_p(applicationPath);

    // Copy Cordova arch program from bundle to www/application
    var programPath = files.pathJoin(bundlePath, 'programs', CORDOVA_ARCH);
    files.cp_r(programPath, applicationPath);

    // Load program.json
    var programJsonPath = files.convertToOSPath(files.pathJoin(applicationPath, 'program.json'));
    var program = JSON.parse(files.readFile(programJsonPath, 'utf8'));

    // Load settings
    var settingsFile = this.options.settingsFile;
    var settings = settingsFile ? JSON.parse(files.readFile(settingsFile, 'utf8')) : {};
    var publicSettings = settings['public'];

    // Calculate client hash and append to program
    this.appendVersion(program, publicSettings);

    // Write program.json
    files.writeFile(programJsonPath, JSON.stringify(program), 'utf8');

    var bootstrapPage = this.generateBootstrapPage(applicationPath, program, publicSettings);
    files.writeFile(files.pathJoin(applicationPath, 'index.html'), bootstrapPage, 'utf8');
  };

  CordovaBuilder.prototype.appendVersion = function appendVersion(program, publicSettings) {
    var configDummy = {};
    configDummy.PUBLIC_SETTINGS = publicSettings || {};

    var WebAppHashing = loadIsopacket('cordova-support')['webapp-hashing'].WebAppHashing;

    program.version = WebAppHashing.calculateClientHash(program.manifest, null, configDummy);
  };

  CordovaBuilder.prototype.generateBootstrapPage = function generateBootstrapPage(applicationPath, program, publicSettings) {
    var meteorRelease = release.current.isCheckout() ? "none" : release.current.name;

    var manifest = program.manifest;
    var autoupdateVersion = process.env.AUTOUPDATE_VERSION || program.version;

    var mobileServerUrl = this.options.mobileServerUrl;

    var runtimeConfig = {
      meteorRelease: meteorRelease,
      ROOT_URL: mobileServerUrl,
      // XXX propagate it from this.options?
      ROOT_URL_PATH_PREFIX: '',
      DDP_DEFAULT_CONNECTION_URL: mobileServerUrl,
      autoupdateVersionCordova: autoupdateVersion,
      appId: this.projectContext.appIdentifier,
      meteorEnv: {
        NODE_ENV: process.env.NODE_ENV || "production",
        TEST_METADATA: process.env.TEST_METADATA || "{}"
      }
    };

    if (publicSettings) {
      runtimeConfig.PUBLIC_SETTINGS = publicSettings;
    }

    var Boilerplate = loadIsopacket('cordova-support')['boilerplate-generator'].Boilerplate;

    var boilerplate = new Boilerplate(CORDOVA_ARCH, manifest, {
      urlMapper: _.identity,
      pathMapper: function pathMapper(path) {
        return files.convertToOSPath(files.pathJoin(applicationPath, path));
      },
      baseDataExtension: {
        meteorRuntimeConfig: JSON.stringify(encodeURIComponent(JSON.stringify(runtimeConfig)))
      }
    });

    return boilerplate.toHTML();
  };

  CordovaBuilder.prototype.copyBuildOverride = function copyBuildOverride() {
    var buildOverridePath = files.pathJoin(this.projectContext.projectDir, 'cordova-build-override');

    if (files.exists(buildOverridePath) && files.stat(buildOverridePath).isDirectory()) {
      Console.debug('Copying over the cordova-build-override directory');
      files.cp_r(buildOverridePath, this.projectRoot);
    }
  };

  return CordovaBuilder;
}();

function createAppConfiguration(builder) {
  /**
   * @namespace App
   * @global
   * @summary The App configuration object in mobile-config.js
   */
  return {
    /**
     * @summary Set your mobile app's core configuration information.
     * @param {Object} options
     * @param {String} [options.id,version,name,description,author,email,website]
     * Each of the options correspond to a key in the app's core configuration
     * as described in the [Cordova documentation](http://cordova.apache.org/docs/en/5.1.1/config_ref_index.md.html#The%20config.xml%20File_core_configuration_elements).
     * @memberOf App
     */
    info: function info(options) {
      // check that every key is meaningful
      _.each(options, function (value, key) {
        if (!_.has(builder.metadata, key)) {
          throw new Error("Unknown key in App.info configuration: " + key);
        }
      });

      _.extend(builder.metadata, options);
    },
    /**
     * @summary Add a preference for your build as described in the
     * [Cordova documentation](http://cordova.apache.org/docs/en/5.1.1/config_ref_index.md.html#The%20config.xml%20File_global_preferences).
     * @param {String} name A preference name supported by Cordova's
     * `config.xml`.
     * @param {String} value The value for that preference.
     * @param {String} [platform] Optional. A platform name (either `ios` or `android`) to add a platform-specific preference.
     * @memberOf App
     */
    setPreference: function setPreference(key, value, platform) {
      if (platform) {
        if (!_.contains(['ios', 'android'], platform)) {
          throw new Error('Unknown platform in App.setPreference: ' + platform + '. Valid platforms are: ios, android.');
        }

        builder.additionalConfiguration.platform[platform][key] = value;
      } else {
        builder.additionalConfiguration.global[key] = value;
      }
    },

    /**
     * @summary Set the build-time configuration for a Cordova plugin.
     * @param {String} id The identifier of the plugin you want to
     * configure.
     * @param {Object} config A set of key-value pairs which will be passed
     * at build-time to configure the specified plugin.
     * @memberOf App
     */
    configurePlugin: function configurePlugin(id, config) {
      builder.pluginsConfiguration[id] = config;
    },

    /**
     * @summary Set the icons for your mobile app.
     * @param {Object} icons An Object where the keys are different
     * devices and screen sizes, and values are image paths
     * relative to the project root directory.
     *
     * Valid key values:
     * - `iphone_2x` (120x120)
     * - `iphone_3x` (180x180)
     * - `ipad` (76x76)
     * - `ipad_2x` (152x152)
     * - `ipad_pro` (167x167)
     * - `ios_settings` (29x29)
     * - `ios_settings_2x` (58x58)
     * - `ios_settings_3x` (87x87)
     * - `ios_spotlight` (40x40)
     * - `ios_spotlight_2x` (80x80)
     * - `android_mdpi` (48x48)
     * - `android_hdpi` (72x72)
     * - `android_xhdpi` (96x96)
     * - `android_xxhdpi` (144x144)
     * - `android_xxxhdpi` (192x192)
     * @memberOf App
     */
    icons: function icons(_icons) {
      var validDevices = _.keys(iconsIosSizes).concat(_.keys(iconsAndroidSizes));
      _.each(_icons, function (value, key) {
        if (!_.include(validDevices, key)) {
          Console.labelWarn(key + ': unknown key in App.icons configuration. The key may be deprecated.');
        }
      });
      _.extend(builder.imagePaths.icon, _icons);
    },

    /**
     * @summary Set the launch screen images for your mobile app.
     * @param {Object} launchScreens A dictionary where keys are different
     * devices, screen sizes, and orientations, and the values are image paths
     * relative to the project root directory.
     *
     * For Android, launch screen images should
     * be special "Nine-patch" image files that specify how they should be
     * stretched. See the [Android docs](https://developer.android.com/guide/topics/graphics/2d-graphics.html#nine-patch).
     *
     * Valid key values:
     * - `iphone_2x` (640x960)
     * - `iphone5` (640x1136)
     * - `iphone6` (750x1334)
     * - `iphone6p_portrait` (1242x2208)
     * - `iphone6p_landscape` (2208x1242)
     * - `ipad_portrait` (768x1024)
     * - `ipad_portrait_2x` (1536x2048)
     * - `ipad_landscape` (1024x768)
     * - `ipad_landscape_2x` (2048x1536)
     * - `android_mdpi_portrait` (320x470)
     * - `android_mdpi_landscape` (470x320)
     * - `android_hdpi_portrait` (480x640)
     * - `android_hdpi_landscape` (640x480)
     * - `android_xhdpi_portrait` (720x960)
     * - `android_xhdpi_landscape` (960x720)
     * - `android_xxhdpi_portrait` (1080x1440)
     * - `android_xxhdpi_landscape` (1440x1080)
     *
     * @memberOf App
     */
    launchScreens: function launchScreens(_launchScreens) {
      var validDevices = _.keys(launchIosSizes).concat(_.keys(launchAndroidSizes));

      _.each(_launchScreens, function (value, key) {
        if (!_.include(validDevices, key)) {
          Console.labelWarn(key + ': unknown key in App.launchScreens configuration. The key may be deprecated.');
        }
      });
      _.extend(builder.imagePaths.splash, _launchScreens);
    },

    /**
     * @summary Set a new access rule based on origin domain for your app.
     * By default your application has a limited list of servers it can contact.
     * Use this method to extend this list.
     *
     * Default access rules:
     *
     * - `tel:*`, `geo:*`, `mailto:*`, `sms:*`, `market:*` are allowed and
     *   are handled by the system (e.g. opened in the phone app or an email client)
     * - `http://localhost:*` is used to serve the app's assets from.
     * - The domain or address of the Meteor server to connect to for DDP and
     *   hot code push of new versions.
     *
     * Read more about domain patterns in [Cordova
     * docs](http://cordova.apache.org/docs/en/6.0.0/guide_appdev_whitelist_index.md.html).
     *
     * Starting with Meteor 1.0.4 access rule for all domains and protocols
     * (`<access origin="*"/>`) is no longer set by default due to
     * [certain kind of possible
     * attacks](http://cordova.apache.org/announcements/2014/08/04/android-351.html).
     *
     * @param {String} pattern The pattern defining affected domains or URLs.
     * @param {Object} [options]
     * @param {String} options.type Possible values:
     * - **`'intent'`**: Controls which URLs the app is allowed to ask the system to open.
     *  (e.g. in the phone app or an email client).
     * - **`'navigation'`**: Controls which URLs the WebView itself can be navigated to
     *  (can also needed for iframes).
     * - **`'network'` or undefined**: Controls which network requests (images, XHRs, etc) are allowed to be made.
     * @param {Boolean} options.launchExternal (Deprecated, use `type: 'intent'` instead.)
     * @memberOf App
     */
    accessRule: function accessRule(pattern, options) {
      options = options || {};

      if (options.launchExternal) {
        options.type = 'intent';
      }

      builder.accessRules[pattern] = options;
    },

    /**
     * @summary Append custom tags into config's widget element.
     *
     * `App.appendToConfig('<any-xml-content/>');`
     *
     * @param  {String} element The XML you want to include 
     * @memberOf App
     */
    appendToConfig: function appendToConfig(xml) {
      builder.custom.push(xml);
    }
  };
}
//# sourceMappingURL=builder.js.map