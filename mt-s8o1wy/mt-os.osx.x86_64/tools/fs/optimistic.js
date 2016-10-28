module.export({dirtyNodeModulesDirectory:function(){return dirtyNodeModulesDirectory},optimisticStatOrNull:function(){return optimisticStatOrNull},optimisticLStat:function(){return optimisticLStat},optimisticReadFile:function(){return optimisticReadFile},optimisticReaddir:function(){return optimisticReaddir},optimisticHashOrNull:function(){return optimisticHashOrNull},optimisticReadJsonOrNull:function(){return optimisticReadJsonOrNull}});var _toConsumableArray;module.import("babel-runtime/helpers/toConsumableArray",{"default":function(v){_toConsumableArray=v}});var assert;module.import("assert",{"default":function(v){assert=v}});var wrap;module.import("optimism",{"wrap":function(v){wrap=v}});var Profile;module.import("../tool-env/profile.js",{"Profile":function(v){Profile=v}});var watch;module.import("./safe-watcher.js",{"watch":function(v){watch=v}});var sha1;module.import("./watch.js",{"sha1":function(v){sha1=v}});var pathSep,pathIsAbsolute,statOrNull,lstat,readFile,readdir;module.import("./files.js",{"pathSep":function(v){pathSep=v},"pathIsAbsolute":function(v){pathIsAbsolute=v},"statOrNull":function(v){statOrNull=v},"lstat":function(v){lstat=v},"readFile":function(v){readFile=v},"readdir":function(v){readdir=v}});







// When in doubt, the optimistic caching system can be completely disabled
// by setting this environment variable.
var ENABLED = !process.env.METEOR_DISABLE_OPTIMISTIC_CACHING;

function makeOptimistic(name, fn) {
  var wrapper = wrap(ENABLED ? function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    maybeDependOnNodeModules(args[0]);
    return fn.apply(this, args);
  } : fn, {
    makeCacheKey: function makeCacheKey() {
      if (!ENABLED) {
        // Cache nothing when the optimistic caching system is disabled.
        return;
      }

      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      var path = args[0];
      if (!pathIsAbsolute(path)) {
        return;
      }

      var parts = [];

      for (var i = 0; i < args.length; ++i) {
        var arg = args[i];

        if (typeof arg !== "string") {
          // If any of the arguments is not a string, then we won't cache the
          // result of the corresponding file.* method invocation.
          return;
        }

        parts.push(arg);
      }

      return parts.join("\0");
    },
    subscribe: function subscribe() {
      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      var path = args[0];

      // Starting a watcher for every single file contained within a
      // node_modules directory would be prohibitively expensive, so
      // instead we rely on dependOnNodeModules to tell us when files in
      // node_modules directories might have changed.
      if (path.split(pathSep).indexOf("node_modules") >= 0) {
        return;
      }

      assert.ok(pathIsAbsolute(path));

      var watcher = watch(path, function () {
        wrapper.dirty.apply(wrapper, _toConsumableArray(args));
      });

      return function () {
        if (watcher) {
          watcher.close();
          watcher = null;
        }
      };
    }
  });

  return Profile("optimistic " + name, wrapper);
}

function maybeDependOnNodeModules(path) {
  if (typeof path !== "string") {
    return;
  }

  var parts = path.split(pathSep);

  while (true) {
    var index = parts.lastIndexOf("node_modules");
    if (index < 0) {
      return;
    }

    parts.length = index + 1;
    dependOnNodeModules(parts.join(pathSep));
    assert.strictEqual(parts.pop(), "node_modules");
  }
}

var npmDepCount = 0;

// Called by any optimistic function that receives a */node_modules/* path
// as its first argument, so that we can later bulk-invalidate the results
// of those calls if the contents of the node_modules directory change.
// Note that this strategy will not detect changes within subdirectories
// of this node_modules directory, but that's ok because the use case we
// care about is adding or removing npm packages.
var dependOnNodeModules = wrap(function (nodeModulesDir) {
  assert(pathIsAbsolute(nodeModulesDir));
  assert(nodeModulesDir.endsWith(pathSep + "node_modules"));

  // Always return something different to prevent optimism from
  // second-guessing the dirtiness of this function.
  return ++npmDepCount;
}, {
  subscribe: function subscribe(nodeModulesDir) {
    var watcher = watch(nodeModulesDir, function () {
      return dependOnNodeModules.dirty(nodeModulesDir);
    });

    return function () {
      if (watcher) {
        watcher.close();
        watcher = null;
      }
    };
  }
});

// Invalidate all optimistic results derived from paths involving the
// given node_modules directory.
function dirtyNodeModulesDirectory(nodeModulesDir) {
  dependOnNodeModules.dirty(nodeModulesDir);
}

var optimisticStatOrNull = makeOptimistic("statOrNull", statOrNull);
var optimisticLStat = makeOptimistic("lstat", lstat);
var optimisticReadFile = makeOptimistic("readFile", readFile);
var optimisticReaddir = makeOptimistic("readdir", readdir);
var optimisticHashOrNull = makeOptimistic("hashOrNull", function () {
  try {
    return sha1(optimisticReadFile.apply(undefined, arguments));
  } catch (e) {
    if (e.code !== "EISDIR" && e.code !== "ENOENT") {
      throw e;
    }
  }

  return null;
});

var optimisticReadJsonOrNull = makeOptimistic("readJsonOrNull", function () {
  try {
    var buffer = optimisticReadFile.apply(undefined, arguments);
  } catch (e) {
    if (e.code !== "ENOENT") {
      throw e;
    }
    return null;
  }
  return JSON.parse(buffer);
});
//# sourceMappingURL=optimistic.js.map