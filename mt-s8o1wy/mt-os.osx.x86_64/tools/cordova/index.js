module.export({CORDOVA_ARCH:function(){return CORDOVA_ARCH},CORDOVA_PLATFORMS:function(){return CORDOVA_PLATFORMS},CORDOVA_PLATFORM_VERSIONS:function(){return CORDOVA_PLATFORM_VERSIONS},displayNameForPlatform:function(){return displayNameForPlatform},displayNamesForPlatforms:function(){return displayNamesForPlatforms},filterPlatforms:function(){return filterPlatforms},splitPluginsAndPackages:function(){return splitPluginsAndPackages},pluginVersionsFromStarManifest:function(){return pluginVersionsFromStarManifest},newPluginId:function(){return newPluginId},convertPluginVersions:function(){return convertPluginVersions},convertToGitUrl:function(){return convertToGitUrl}});var _slicedToArray;module.import('babel-runtime/helpers/slicedToArray',{"default":function(v){_slicedToArray=v}});var _toArray;module.import('babel-runtime/helpers/toArray',{"default":function(v){_toArray=v}});var _;module.import('underscore',{"default":function(v){_=v}});var assert;module.import('assert',{"default":function(v){assert=v}});var utils;module.import('../utils/utils.js',{"default":function(v){utils=v}});var buildmessage;module.import('../utils/buildmessage.js',{"default":function(v){buildmessage=v}});var oldToNewPluginIds,newToOldPluginIds;module.import('cordova-registry-mapper',{"oldToNew":function(v){oldToNewPluginIds=v},"newToOld":function(v){newToOldPluginIds=v}});








var CORDOVA_ARCH = "web.cordova";

var CORDOVA_PLATFORMS = ['ios', 'android'];

var CORDOVA_PLATFORM_VERSIONS = {
  'android': '5.2.2',
  'ios': '4.2.1'
};

var PLATFORM_TO_DISPLAY_NAME_MAP = {
  'ios': 'iOS',
  'android': 'Android'
};

function displayNameForPlatform(platform) {
  return PLATFORM_TO_DISPLAY_NAME_MAP[platform] || platform;
};

function displayNamesForPlatforms(platforms) {
  return platforms.map(function (platform) {
    return displayNameForPlatform(platform);
  }).join(', ');
}

// This filters the Cordova platforms from a list of app-level platforms.
// Right now, the only other platforms are the default browser and server
// platforms.
function filterPlatforms(platforms) {
  return _.intersection(platforms, CORDOVA_PLATFORMS);
}

function splitPluginsAndPackages(packages) {
  var result = {
    plugins: [],
    packages: []
  };

  for (var _iterator = packages, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref;

    if (_isArray) {
      if (_i >= _iterator.length) break;
      _ref = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      _ref = _i.value;
    }

    var pkg = _ref;

    var _pkg$split = pkg.split(':');

    var _pkg$split2 = _toArray(_pkg$split);

    var namespace = _pkg$split2[0];

    var rest = _pkg$split2.slice(1);

    if (namespace === 'cordova') {
      var name = rest.join(':');
      result.plugins.push(name);
    } else {
      result.packages.push(pkg);
    }
  }

  return result;
}

// Returns the cordovaDependencies of the Cordova arch from a star manifest.
function pluginVersionsFromStarManifest(star) {
  var cordovaProgram = _.findWhere(star.programs, { arch: CORDOVA_ARCH });
  return cordovaProgram ? cordovaProgram.cordovaDependencies : {};
}

function newPluginId(id) {
  return oldToNewPluginIds[id];
}

function convertPluginVersions(pluginVersions) {
  assert(pluginVersions);
  buildmessage.assertInJob();

  var newPluginVersions = {};

  _.each(pluginVersions, function (version, id) {
    if (utils.isUrlWithSha(version)) {
      version = convertToGitUrl(version);
      if (!version) {
        // convertToGitUrl will add an error to buildmessage messages
        return;
      }
    }

    var newId = newPluginId(id);

    if (newId) {
      // If the plugin has already been added using the new ID, we do not
      // overwrite the version.
      if (!_.has(pluginVersions, newId)) {
        newPluginVersions[newId] = version;
      }
    } else {
      newPluginVersions[id] = version;
    }
  });

  return newPluginVersions;
}

// Convert old-style GitHub tarball URLs to new Git URLs, and check if other
// Git URLs contain a SHA reference.
function convertToGitUrl(url) {
  buildmessage.assertInJob();

  // Matches GitHub tarball URLs, like:
  // https://github.com/meteor/com.meteor.cordova-update/tarball/92fe99b7248075318f6446b288995d4381d24cd2
  var match = url.match(/^https?:\/\/github.com\/(.+?)\/(.+?)\/tarball\/([0-9a-f]{40})/);
  if (match) {
    var _match = _slicedToArray(match, 4);

    var organization = _match[1];
    var repository = _match[2];
    var sha = _match[3];
    // Convert them to a Git URL

    return 'https://github.com/' + organization + '/' + repository + '.git#' + sha;
    // We only support Git URLs with a SHA reference to guarantee repeatability
    // of builds
  } else if (/\.git#[0-9a-f]{40}/.test(url)) {
    return url;
  } else {
    buildmessage.error('Meteor no longer supports installing Cordova plugins from arbitrary tarball URLs. You can either add a plugin from a Git URL with a SHA reference, or from a local path. (Attempting to install from ' + url + '.)');
    return null;
  }
}

function displayNameForHostPlatform() {
  var platform = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : process.platform;

  switch (platform) {
    case 'darwin':
      return "Mac";
    case 'linux':
      return "Linux";
    case 'win32':
      return "Windows";
  }
}
//# sourceMappingURL=index.js.map