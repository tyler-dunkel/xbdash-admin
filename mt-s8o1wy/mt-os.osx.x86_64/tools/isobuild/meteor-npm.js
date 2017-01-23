module.export({getProdPackageNames:function(){return getProdPackageNames}});var _typeof;module.import('babel-runtime/helpers/typeof',{"default":function(v){_typeof=v}});var _extends;module.import('babel-runtime/helpers/extends',{"default":function(v){_extends=v}});var execFileAsync;module.import("../utils/processes.js",{"execFileAsync":function(v){execFileAsync=v}});var getRebuildArgs;module.import("../static-assets/server/npm-rebuild-args.js",{"get":function(v){getRebuildArgs=v}});var convertColonsInPath;module.import("../utils/colon-converter.js",{"convert":function(v){convertColonsInPath=v}});var dirtyNodeModulesDirectory,optimisticLStat,optimisticStatOrNull,optimisticReadJsonOrNull,optimisticReaddir;module.import("../fs/optimistic.js",{"dirtyNodeModulesDirectory":function(v){dirtyNodeModulesDirectory=v},"optimisticLStat":function(v){optimisticLStat=v},"optimisticStatOrNull":function(v){optimisticStatOrNull=v},"optimisticReadJsonOrNull":function(v){optimisticReadJsonOrNull=v},"optimisticReaddir":function(v){optimisticReaddir=v}});

/// Implements the process of managing a package's .npm directory,
/// in which we call `npm install` to install npm dependencies,
/// and a variety of related commands. Notably, we use `npm shrinkwrap`
/// to ensure we get consistent versions of npm sub-dependencies.

var assert = require('assert');
var cleanup = require('../tool-env/cleanup.js');
var fs = require('fs');
var files = require('../fs/files.js');
var os = require('os');
var _ = require('underscore');
var httpHelpers = require('../utils/http-helpers.js');
var buildmessage = require('../utils/buildmessage.js');
var utils = require('../utils/utils.js');
var runLog = require('../runners/run-log.js');
var Profile = require('../tool-env/profile.js').Profile;






var meteorNpm = exports;

// if a user exits meteor while we're trying to create a .npm
// directory, we will have temporary directories that we clean up
var tmpDirs = [];
cleanup.onExit(function () {
  _.each(tmpDirs, function (dir) {
    if (files.exists(dir)) {
      files.rm_recursive(dir);
    }
  });
});

// Exception used internally to gracefully bail out of a npm run if
// something goes wrong
var NpmFailure = function NpmFailure() {};

// Creates a temporary directory in which the new contents of the
// package's .npm directory will be assembled. If all is successful,
// renames that directory back to .npm. Returns true if there are NPM
// dependencies and they are installed without error.
//
// @param npmDependencies {Object} dependencies that should be
//     installed, eg {tar: '0.1.6', gcd: '0.0.0'}. If falsey or empty,
//     will remove the .npm directory instead.
meteorNpm.updateDependencies = function (packageName, packageNpmDir, npmDependencies, quiet) {
  // we make sure to put it beside the original package dir so that
  // we can then atomically rename it. we also make sure to
  // randomize the name, in case we're bundling this package
  // multiple times in parallel.
  var newPackageNpmDir = convertColonsInPath(packageNpmDir) + '-new-' + utils.randomToken();

  if (!npmDependencies || _.isEmpty(npmDependencies)) {
    // No NPM dependencies? Delete the .npm directory if it exists (because,
    // eg, we used to have NPM dependencies but don't any more).  We'd like to
    // do this in as atomic a way as possible in case multiple meteor
    // instances are trying to make this update in parallel, so we rename the
    // directory to something before doing the rm -rf.
    try {
      files.rename(packageNpmDir, newPackageNpmDir);
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
      // It didn't exist, which is exactly what we wanted.
      return false;
    }
    files.rm_recursive(newPackageNpmDir);
    return false;
  }

  try {
    // v0.6.0 had a bug that could cause .npm directories to be
    // created without npm-shrinkwrap.json
    // (https://github.com/meteor/meteor/pull/927). Running your app
    // in that state causes consistent "Corrupted .npm directory"
    // errors.
    //
    // If you've reached that state, delete the empty directory and
    // proceed.
    if (files.exists(packageNpmDir) && !files.exists(files.pathJoin(packageNpmDir, 'npm-shrinkwrap.json'))) {
      files.rm_recursive(packageNpmDir);
    }

    if (files.exists(packageNpmDir)) {
      // we already nave a .npm directory. update it appropriately with some
      // ceremony involving:
      // `npm install`, `npm install name@version`, `npm shrinkwrap`
      updateExistingNpmDirectory(packageName, newPackageNpmDir, packageNpmDir, npmDependencies, quiet);
    } else {
      // create a fresh .npm directory with `npm install
      // name@version` and `npm shrinkwrap`
      createFreshNpmDirectory(packageName, newPackageNpmDir, packageNpmDir, npmDependencies, quiet);
    }
  } catch (e) {
    if (e instanceof NpmFailure) {
      // Something happened that was out of our control, but wasn't
      // exactly unexpected (eg, no such npm package, no internet
      // connection). Handle it gracefully.
      return false;
    }

    // Some other exception -- let it propagate.
    throw e;
  } finally {
    if (files.exists(newPackageNpmDir)) {
      files.rm_recursive(newPackageNpmDir);
    }
    tmpDirs = _.without(tmpDirs, newPackageNpmDir);
  }

  return true;
};

// Returns a flattened dictionary of npm package names used in production,
// or false if there is no package.json file in the parent directory.
function getProdPackageNames(nodeModulesDir) {
  var names = Object.create(null);
  var dirs = Object.create(null);
  var nodeModulesDirStack = [];

  // Returns true iff dir is a package directory.
  function walk(dir) {
    var packageJsonPath = files.pathJoin(dir, "package.json");
    var packageJsonStat = optimisticStatOrNull(packageJsonPath);

    if (packageJsonStat && packageJsonStat.isFile()) {
      var pkg = optimisticReadJsonOrNull(packageJsonPath);
      var _nodeModulesDir = files.pathJoin(dir, "node_modules");
      nodeModulesDirStack.push(_nodeModulesDir);

      // Scan all dependencies except pkg.devDependencies.
      scanDeps(pkg.dependencies);
      scanDeps(pkg.peerDependencies);
      scanDeps(pkg.optionalDependencies);
      scanDeps(pkg.bundledDependencies);
      // This typo is also honored.
      scanDeps(pkg.bundleDependencies);

      assert.strictEqual(nodeModulesDirStack.pop(), _nodeModulesDir);

      return true;
    }

    return false;
  }

  function scanDeps(deps) {
    if (!deps) {
      return;
    }

    Object.keys(deps).forEach(function (name) {
      var resDir = resolve(name);
      if (!resDir || _.has(dirs, resDir)) {
        return;
      }

      // Record that we've seen this directory so that we don't try to
      // walk it again.
      dirs[resDir] = name;

      if (walk(resDir)) {
        // If resDir is indeed a package directory, record the package
        // name in the set of production names.
        names[name] = true;
      }
    });
  }

  function resolve(name) {
    for (var i = nodeModulesDirStack.length - 1; i >= 0; --i) {
      var _nodeModulesDir2 = nodeModulesDirStack[i];
      var candidate = files.pathJoin(_nodeModulesDir2, name);
      var stat = optimisticStatOrNull(candidate);
      if (stat && stat.isDirectory()) {
        return candidate;
      }
    }
  }

  // If the top-level nodeModulesDir is not contained by a package
  // directory with a package.json file, then we return false to indicate
  // that we don't know or care which packages are production-specific.
  // Concretely, this means your app needs to have a package.json file if
  // you want any npm packages to be excluded in production.
  return walk(files.pathDirname(nodeModulesDir)) && names;
}

var lastRebuildJSONFilename = ".meteor-last-rebuild-version.json";

var currentVersions = {
  platform: process.platform,
  arch: process.arch,
  versions: _extends({}, process.versions)
};

var currentVersionsJSON = JSON.stringify(currentVersions, null, 2) + "\n";

function recordLastRebuildVersions(pkgDir) {
  // Record the current process.{platform,arch,versions} so that we can
  // avoid copying/rebuilding/renaming next time.
  files.writeFile(files.pathJoin(pkgDir, lastRebuildJSONFilename), currentVersionsJSON, "utf8");
}

// Returns true iff isSubtreeOf(currentVersions, versions), allowing
// valid semantic versions to differ in their patch versions.
function versionsAreCompatible(versions) {var parse;module.import("semver",{"parse":function(v){parse=v}});
  

  return isSubtreeOf(currentVersions, versions, function (a, b) {
    // Technically already handled by isSubtreeOf, but doesn't hurt.
    if (a === b) {
      return true;
    }

    if (!a || !b) {
      return false;
    }

    var aType = typeof a === 'undefined' ? 'undefined' : _typeof(a);
    var bType = typeof b === 'undefined' ? 'undefined' : _typeof(b);

    if (aType !== bType) {
      return false;
    }

    if (aType === "string") {
      var aVer = parse(a);
      var bVer = parse(b);
      return aVer && bVer && aVer.major === bVer.major && aVer.minor === bVer.minor;
    }
  });
}

function rebuildVersionsAreCompatible(pkgPath) {
  var versionFile = files.pathJoin(pkgPath, lastRebuildJSONFilename);

  return versionsAreCompatible(optimisticReadJsonOrNull(versionFile));
}

// Rebuilds any binary dependencies in the given node_modules directory,
// and returns true iff anything was rebuilt.
meteorNpm.rebuildIfNonPortable = Profile("meteorNpm.rebuildIfNonPortable", function (nodeModulesDir) {
  var dirsToRebuild = [];

  files.readdir(nodeModulesDir).forEach(function (pkg) {
    var pkgPath = files.pathJoin(nodeModulesDir, pkg);

    if (isPortable(pkgPath)) {
      return;
    }

    if (rebuildVersionsAreCompatible(pkgPath)) {
      return;
    }

    dirsToRebuild.push(pkgPath);
  });

  if (dirsToRebuild.length === 0) {
    return false;
  }

  var tempDir = files.pathJoin(nodeModulesDir, ".temp-" + utils.randomToken());

  // There's a chance the basename of the original nodeModulesDir isn't
  // actually "node_modules", which will confuse the `npm rebuild`
  // command, but fortunately we can ensure this temporary directory has
  // exactly that basename.
  var tempNodeModules = files.pathJoin(tempDir, "node_modules");
  files.mkdir_p(tempNodeModules);

  // Map from original package directory paths to temporary package
  // directory paths.
  var tempPkgDirs = {};

  dirsToRebuild.forEach(function (pkgPath) {
    var tempPkgDir = tempPkgDirs[pkgPath] = files.pathJoin(tempNodeModules, files.pathBasename(pkgPath));

    // Copy the package directory instead of renaming it, so that the
    // original package will be left untouched if the rebuild fails. We
    // could just run files.cp_r(pkgPath, tempPkgDir) here, except that we
    // want to handle nested node_modules directories specially.
    copyNpmPackageWithSymlinkedNodeModules(pkgPath, tempPkgDir);

    // Record the current process.versions so that we can avoid
    // copying/rebuilding/renaming next time.
    recordLastRebuildVersions(tempPkgDir);
  });

  // The `npm rebuild` command must be run in the parent directory of the
  // relevant node_modules directory, which in this case is tempDir.
  var rebuildResult = runNpmCommand(getRebuildArgs(), tempDir);
  if (!rebuildResult.success) {
    buildmessage.error(rebuildResult.error);
    files.rm_recursive(tempDir);
    return false;
  }

  dirtyNodeModulesDirectory(nodeModulesDir);

  // If the `npm rebuild` command succeeded, overwrite the original
  // package directories with the rebuilt package directories.
  dirsToRebuild.forEach(function (pkgPath) {
    var actualNodeModulesDir = files.pathJoin(pkgPath, "node_modules");

    var actualNodeModulesStat = files.statOrNull(actualNodeModulesDir);

    if (actualNodeModulesStat && actualNodeModulesStat.isDirectory()) {
      // If the original package had a node_modules directory, move it
      // into the temporary package directory, overwriting the one created
      // by copyNpmPackageWithSymlinkedNodeModules (which contains only
      // symlinks), so that when we rename the temporary directory back to
      // the original directory below, we'll end up with a node_modules
      // directory that contains real packages rather than symlinks.

      var symlinkNodeModulesDir = files.pathJoin(tempPkgDirs[pkgPath], "node_modules");

      files.renameDirAlmostAtomically(actualNodeModulesDir, symlinkNodeModulesDir);
    }

    files.renameDirAlmostAtomically(tempPkgDirs[pkgPath], pkgPath);
  });

  files.rm_recursive(tempDir);

  return true;
});

// Copy an npm package directory to another location, but attempt to
// symlink all of its node_modules rather than recursively copying them,
// which potentially saves a lot of time.
function copyNpmPackageWithSymlinkedNodeModules(fromPkgDir, toPkgDir) {
  files.mkdir_p(toPkgDir);

  var needToHandleNodeModules = false;

  files.readdir(fromPkgDir).forEach(function (item) {
    if (item === "node_modules") {
      // We'll link or copy node_modules in a follow-up step.
      needToHandleNodeModules = true;
      return;
    }

    files.cp_r(files.pathJoin(fromPkgDir, item), files.pathJoin(toPkgDir, item));
  });

  if (!needToHandleNodeModules) {
    return;
  }

  var nodeModulesFromPath = files.pathJoin(fromPkgDir, "node_modules");
  var nodeModulesToPath = files.pathJoin(toPkgDir, "node_modules");

  files.mkdir(nodeModulesToPath);

  files.readdir(nodeModulesFromPath).forEach(function (depPath) {
    if (depPath === ".bin") {
      // Avoid copying node_modules/.bin because commands like
      // .bin/node-gyp and .bin/node-pre-gyp tend to cause problems.
      return;
    }

    var absDepFromPath = files.pathJoin(nodeModulesFromPath, depPath);

    if (!files.stat(absDepFromPath).isDirectory()) {
      // Only copy package directories, even though there might be other
      // kinds of files in node_modules.
      return;
    }

    var absDepToPath = files.pathJoin(nodeModulesToPath, depPath);

    // Try to symlink node_modules dependencies if possible (faster),
    // and fall back to a recursive copy otherwise.
    try {
      files.symlink(absDepFromPath, absDepToPath, "junction");
    } catch (e) {
      files.cp_r(absDepFromPath, absDepToPath);
    }
  });
}

var isPortable = Profile("meteorNpm.isPortable", function (dir) {
  var lstat = optimisticLStat(dir);
  if (!lstat.isDirectory()) {
    // Non-directory files are portable unless they end with .node.
    return !dir.endsWith(".node");
  }

  var pkgJsonStat = optimisticStatOrNull(files.pathJoin(dir, "package.json"));
  var canCache = pkgJsonStat && pkgJsonStat.isFile();
  var portableFile = files.pathJoin(dir, ".meteor-portable");

  if (canCache) {
    // Cache previous results by writing a boolean value to a hidden file
    // called .meteor-portable. Although it's tempting to write this file
    // once for the whole node_modules directory, it's important that we
    // put .meteor-portable files only in the individual top-level package
    // directories, so that they will get cleared away the next time those
    // packages are (re)installed.
    var _result = optimisticReadJsonOrNull(portableFile);
    if (_result) {
      return _result;
    }
  } else {
    // Clean up any .meteor-portable files we mistakenly wrote in
    // directories that do not contain package.json files. #7296
    fs.unlink(portableFile, function (error) {});
  }

  var result = optimisticReaddir(dir).every(
  // Ignore files that start with a ".", such as .bin directories.
  function (itemName) {
    return itemName.startsWith(".") || isPortable(files.pathJoin(dir, itemName));
  });

  if (canCache) {
    // Write the .meteor-portable file asynchronously, and don't worry
    // if it fails, e.g. because the file system is read-only (#6591).
    // Failing to write the file only means more work next time.
    fs.writeFile(portableFile, JSON.stringify(result) + "\n", function (error) {});
  }

  return result;
});

// Return true if all of a package's npm dependencies are portable
// (that is, if the node_modules can be copied anywhere and we'd
// expect it to work, rather than containing native extensions that
// were built just for our architecture), else
// false. updateDependencies should first be used to bring
// nodeModulesDir up to date.
meteorNpm.dependenciesArePortable = function (nodeModulesDir) {
  // We use a simple heuristic: we check to see if a package (or any
  // of its transitive dependencies) contains any *.node files. .node
  // is the extension that signals to Node that it should load a file
  // as a shared object rather than as JavaScript, so this should work
  // in the vast majority of cases.

  assert.ok(files.pathBasename(nodeModulesDir).startsWith("node_modules"), "Bad node_modules directory: " + nodeModulesDir);

  // Only check/write .meteor-portable files in each of the top-level
  // package directories.
  return isPortable(nodeModulesDir);
};

var makeNewPackageNpmDir = function makeNewPackageNpmDir(newPackageNpmDir) {
  // keep track so that we can remove them on process exit
  tmpDirs.push(newPackageNpmDir);
  files.mkdir_p(newPackageNpmDir);

  // create node_modules -- prevent npm install from installing
  // to an existing node_modules dir higher up in the filesystem
  files.mkdir(files.pathJoin(newPackageNpmDir, 'node_modules'));

  // create .gitignore -- node_modules shouldn't be in git since we
  // recreate it as needed by using `npm install`. since we use `npm
  // shrinkwrap` we're guaranteed to have the same version installed
  // each time.
  files.writeFile(files.pathJoin(newPackageNpmDir, '.gitignore'), ['node_modules', '' /*git diff complains without trailing newline*/].join('\n'));
};

var updateExistingNpmDirectory = function updateExistingNpmDirectory(packageName, newPackageNpmDir, packageNpmDir, npmDependencies, quiet) {
  // sanity check on contents of .npm directory
  if (!files.stat(packageNpmDir).isDirectory()) {
    throw new Error("Corrupted .npm directory -- should be a directory: " + packageNpmDir);
  }
  if (!files.exists(files.pathJoin(packageNpmDir, 'npm-shrinkwrap.json'))) {
    throw new Error("Corrupted .npm directory -- can't find npm-shrinkwrap.json in " + packageNpmDir);
  }

  // We need to rebuild all node modules when the Node version
  // changes, in case there are some binary ones. Technically this is
  // racey, but it shouldn't fail very often.
  var nodeModulesDir = files.pathJoin(packageNpmDir, 'node_modules');
  if (files.exists(nodeModulesDir)) {
    var oldNodeVersion;
    try {
      oldNodeVersion = files.readFile(files.pathJoin(packageNpmDir, 'node_modules', '.node_version'), 'utf8');
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
      // Use the Node version from the last release where we didn't
      // drop this file.
      oldNodeVersion = 'v0.8.24';
    }

    if (oldNodeVersion !== currentNodeCompatibilityVersion()) {
      files.rm_recursive(nodeModulesDir);
    }
  }

  // Make sure node_modules is present (fix for #1761). Prevents npm install
  // from installing to an existing node_modules dir higher up in the
  // filesystem.  node_modules may be absent due to a change in Node version or
  // when `meteor add`ing a cloned package for the first time (node_modules is
  // excluded by .gitignore)
  if (!files.exists(nodeModulesDir)) {
    files.mkdir(nodeModulesDir);
  }

  var installedDependenciesTree = getInstalledDependenciesTree(packageNpmDir);
  var shrinkwrappedDependenciesTree = getShrinkwrappedDependenciesTree(packageNpmDir);

  var npmTree = { dependencies: {} };
  _.each(npmDependencies, function (version, name) {
    npmTree.dependencies[name] = { version: version };
  });

  var minInstalledTree = minimizeDependencyTree(installedDependenciesTree);
  var minShrinkwrapTree = minimizeDependencyTree(shrinkwrappedDependenciesTree);

  if (isSubtreeOf(npmTree, minInstalledTree) && isSubtreeOf(minShrinkwrapTree, minInstalledTree)) {
    return;
  }

  if (!quiet) {
    logUpdateDependencies(packageName, npmDependencies);
  }

  var preservedShrinkwrap = void 0;

  if (_.isEmpty(npmDependencies)) {
    // If there are no npmDependencies, make sure nothing is installed.
    preservedShrinkwrap = { dependencies: {} };
  } else if (isSubtreeOf(npmTree, minShrinkwrapTree)) {
    // If the top-level npm dependencies are already encompassed by the
    // npm-shrinkwrap.json file, then reuse that file.
    preservedShrinkwrap = shrinkwrappedDependenciesTree;
  } else {
    // Otherwise install only the required npm packages and their
    // dependencies.
    preservedShrinkwrap = npmTree;
  }

  makeNewPackageNpmDir(newPackageNpmDir);

  if (!_.isEmpty(preservedShrinkwrap.dependencies)) {
    var newShrinkwrapFile = files.pathJoin(newPackageNpmDir, 'npm-shrinkwrap.json');

    // There are some unchanged packages here. Install from shrinkwrap.
    files.writeFile(newShrinkwrapFile, JSON.stringify(preservedShrinkwrap, null, 2));

    // `npm install`
    installFromShrinkwrap(newPackageNpmDir);

    files.unlink(newShrinkwrapFile);
  }

  completeNpmDirectory(packageName, newPackageNpmDir, packageNpmDir, npmDependencies);
};

function isSubtreeOf(subsetTree, supersetTree, predicate) {
  if (subsetTree === supersetTree) {
    return true;
  }

  if (_.isObject(subsetTree)) {
    return _.isObject(supersetTree) && _.every(subsetTree, function (value, key) {
      return isSubtreeOf(value, supersetTree[key], predicate);
    });
  }

  if (_.isFunction(predicate)) {
    var result = predicate(subsetTree, supersetTree);
    if (typeof result === "boolean") {
      return result;
    }
  }

  return false;
}

var createFreshNpmDirectory = function createFreshNpmDirectory(packageName, newPackageNpmDir, packageNpmDir, npmDependencies, quiet) {
  if (!quiet) {
    logUpdateDependencies(packageName, npmDependencies);
  }

  makeNewPackageNpmDir(newPackageNpmDir);
  // install dependencies
  _.each(npmDependencies, function (version, name) {
    installNpmModule(name, version, newPackageNpmDir);
  });

  completeNpmDirectory(packageName, newPackageNpmDir, packageNpmDir, npmDependencies);
};

// Shared code for updateExistingNpmDirectory and createFreshNpmDirectory.
function completeNpmDirectory(packageName, newPackageNpmDir, packageNpmDir, npmDependencies) {
  // Create a shrinkwrap file.
  shrinkwrap(newPackageNpmDir);

  // And stow a copy of npm-shrinkwrap too.
  files.copyFile(files.pathJoin(newPackageNpmDir, 'npm-shrinkwrap.json'), files.pathJoin(newPackageNpmDir, 'node_modules', '.npm-shrinkwrap.json'));

  createReadme(newPackageNpmDir);
  createNodeVersion(newPackageNpmDir);
  files.renameDirAlmostAtomically(newPackageNpmDir, packageNpmDir);

  dirtyNodeModulesDirectory(files.pathJoin(packageNpmDir, "node_modules"));
}

var createReadme = function createReadme(newPackageNpmDir) {
  // This file gets checked in to version control by users, so resist the
  // temptation to make unnecessary tweaks to it.
  files.writeFile(files.pathJoin(newPackageNpmDir, 'README'), "This directory and the files immediately inside it are automatically generated\n" + "when you change this package's NPM dependencies. Commit the files in this\n" + "directory (npm-shrinkwrap.json, .gitignore, and this README) to source control\n" + "so that others run the same versions of sub-dependencies.\n" + "\n" + "You should NOT check in the node_modules directory that Meteor automatically\n" + "creates; if you are using git, the .gitignore file tells git to ignore it.\n");
};

var createNodeVersion = function createNodeVersion(newPackageNpmDir) {
  files.writeFile(files.pathJoin(newPackageNpmDir, 'node_modules', '.node_version'), currentNodeCompatibilityVersion());
};

// This value should change whenever we think that the Node C ABI has changed
// (ie, when we need to be sure to reinstall npm packages because they might
// have native components that need to be rebuilt). It does not need to change
// for every patch release of Node! Notably, it needed to change between 0.8.*
// and 0.10.*.  If Node does make a patch release of 0.10 that breaks
// compatibility, you can just change this from "0.10.*" to "0.10.35" or
// whatever.
var currentNodeCompatibilityVersion = function currentNodeCompatibilityVersion() {
  var version = process.version;
  version = version.replace(/\.(\d+)$/, '.*');
  return version + '\n';
};

var npmUserConfigFile = files.pathJoin(__dirname, "meteor-npm-userconfig");

var runNpmCommand = meteorNpm.runNpmCommand = Profile("meteorNpm.runNpmCommand", function (args, cwd) {var getEnv;module.import("../cli/dev-bundle-bin-helpers.js",{"getEnv":function(v){getEnv=v}});
  

  var devBundleDir = files.getDevBundle();
  var isWindows = process.platform === "win32";
  var npmPath = files.convertToOSPath(files.pathJoin(devBundleDir, "bin", isWindows ? "npm.cmd" : "npm"));

  if (meteorNpm._printNpmCalls) {
    // only used by test-bundler.js
    process.stdout.write('cd ' + cwd + ' && ' + npmPath + ' ' + args.join(' ') + ' ...\n');
  }

  return getEnv({
    devBundle: devBundleDir
  }).then(function (env) {
    var opts = {
      env: env,
      maxBuffer: 10 * 1024 * 1024
    };

    if (cwd) {
      opts.cwd = files.convertToOSPath(cwd);
    }

    // Make sure we don't honor any user-provided configuration files.
    env.npm_config_userconfig = npmUserConfigFile;

    return new Promise(function (resolve) {
      require('child_process').execFile(npmPath, args, opts, function (err, stdout, stderr) {
        if (meteorNpm._printNpmCalls) {
          process.stdout.write(err ? 'failed\n' : 'done\n');
        }

        resolve({
          success: !err,
          error: err ? '' + err.message + stderr : stderr,
          stdout: stdout,
          stderr: stderr
        });
      });
    }).await();
  }).await();
});

// Gets a JSON object from `npm ls --json` (getInstalledDependenciesTree) or
// `npm-shrinkwrap.json` (getShrinkwrappedDependenciesTree).
//
// @returns {Object} eg {
//   "name": "packages",
//   "version": "0.0.0",
//   "dependencies": {
//     "sockjs": {
//       "version": "0.3.4",
//       "dependencies": {
//         "node-uuid": {
//           "version": "1.3.3"
//         }
//       }
//     }
//   }
// }
function getInstalledDependenciesTree(dir) {
  function ls(nodeModulesDir) {
    var contents = void 0;
    try {
      contents = files.readdir(nodeModulesDir).sort();
    } finally {
      if (!contents) return;
    }

    var result = {};

    contents.forEach(function (item) {
      if (item.startsWith(".")) {
        return;
      }

      var pkgDir = files.pathJoin(nodeModulesDir, item);
      var pkgJsonPath = files.pathJoin(pkgDir, "package.json");

      var pkg = void 0;
      try {
        pkg = JSON.parse(files.readFile(pkgJsonPath));
      } finally {
        if (!pkg) return;
      }

      var info = result[item] = {
        version: pkg.version
      };

      var resolved = pkg._resolved || pkg.resolved;
      if (resolved) {
        info.resolved = resolved;
      }

      var from = pkg._from || pkg.from;
      if (from) {
        info.from = from;
      }

      var deps = ls(files.pathJoin(pkgDir, "node_modules"));
      if (deps && !_.isEmpty(deps)) {
        info.dependencies = deps;
      }
    });

    return result;
  }

  return {
    dependencies: ls(files.pathJoin(dir, "node_modules"))
  };
}

var getShrinkwrappedDependenciesTree = function getShrinkwrappedDependenciesTree(dir) {
  var shrinkwrapFile = files.readFile(files.pathJoin(dir, 'npm-shrinkwrap.json'));
  return JSON.parse(shrinkwrapFile);
};

// Maps a "dependency object" (a thing you find in `npm ls --json` or
// npm-shrinkwrap.json with keys like "version" and "from") to the
// canonical version that matches what users put in the `Npm.depends`
// clause.  ie, either the version or the tarball URL.
//
// If more logic is added here, it should probably go in minimizeModule too.
var canonicalVersion = function canonicalVersion(depObj) {
  if (utils.isNpmUrl(depObj.from)) {
    return depObj.from;
  } else {
    return depObj.version;
  }
};

// map the structure returned from `npm ls` or shrinkwrap.json into
// the structure of npmDependencies (e.g. {gcd: '0.0.0'}), so that
// they can be diffed. This only returns top-level dependencies.
var treeToDependencies = function treeToDependencies(tree) {
  return _.object(_.map(tree.dependencies, function (properties, name) {
    return [name, canonicalVersion(properties)];
  }));
};

var getInstalledDependencies = function getInstalledDependencies(dir) {
  return treeToDependencies(getInstalledDependenciesTree(dir));
};

// (appears to not be called)
var getShrinkwrappedDependencies = function getShrinkwrappedDependencies(dir) {
  return treeToDependencies(getShrinkwrappedDependenciesTree(dir));
};

var installNpmModule = function installNpmModule(name, version, dir) {

  var installArg = utils.isNpmUrl(version) ? version : name + "@" + version;

  // We don't use npm.commands.install since we couldn't figure out
  // how to silence all output (specifically the installed tree which
  // is printed out with `console.log`)
  //
  // We used to use --force here, because the NPM cache is broken! See
  // https://github.com/npm/npm/issues/3265 Basically, switching
  // back and forth between a tarball fork of version X and the real
  // version X could confuse NPM. But the main reason to use tarball
  // URLs is to get a fork of the latest version with some fix, so
  // it was easy to trigger this!
  //
  // We now use a forked version of npm with our PR
  // https://github.com/npm/npm/pull/5137 to work around this.
  var result = runNpmCommand(["install", installArg], dir);

  if (!result.success) {
    var pkgNotFound = "404 '" + utils.quotemeta(name) + "' is not in the npm registry";
    var versionNotFound = "version not found: " + utils.quotemeta(name) + '@' + utils.quotemeta(version);
    if (result.stderr.match(new RegExp(pkgNotFound))) {
      buildmessage.error("there is no npm package named '" + name + "'");
    } else if (result.stderr.match(new RegExp(versionNotFound))) {
      buildmessage.error(name + " version " + version + " " + "is not available in the npm registry");
    } else {
      buildmessage.error('couldn\'t install npm package ' + name + '@' + version + ': ' + result.error);
    }

    // Recover by returning false from updateDependencies
    throw new NpmFailure();
  }

  var pkgDir = files.pathJoin(dir, "node_modules", name);
  if (!isPortable(pkgDir)) {
    recordLastRebuildVersions(pkgDir);
  }

  if (process.platform !== "win32") {
    // If we are on a unixy file system, we should not build a package that
    // can't be used on Windows.

    var pathsWithColons = files.findPathsWithRegex(".", new RegExp(":"), { cwd: files.pathJoin(dir, "node_modules") });

    if (pathsWithColons.length) {
      var firstTen = pathsWithColons.slice(0, 10);
      if (pathsWithColons.length > 10) {
        firstTen.push("... " + (pathsWithColons.length - 10) + " paths omitted.");
      }

      buildmessage.error("Some filenames in your package have invalid characters.\n" + "The following file paths in the NPM module '" + name + "' have colons, ':', which won't work on Windows:\n" + firstTen.join("\n"));

      throw new NpmFailure();
    }
  }
};

var installFromShrinkwrap = function installFromShrinkwrap(dir) {
  if (!files.exists(files.pathJoin(dir, "npm-shrinkwrap.json"))) {
    throw new Error("Can't call `npm install` without a npm-shrinkwrap.json file present");
  }

  var tempPkgJsonPath = files.pathJoin(dir, "package.json");
  var pkgJsonExisted = files.exists(tempPkgJsonPath);
  if (!pkgJsonExisted) {
    // Writing an empty package.json file prevents ENOENT warnings about
    // package.json not existing, which are noisy at best and sometimes
    // seem to interfere with the install.
    files.writeFile(tempPkgJsonPath, "{}\n", "utf8");
  }

  // `npm install`, which reads npm-shrinkwrap.json.
  var result = runNpmCommand(["install"], dir);

  if (!pkgJsonExisted) {
    files.rm_recursive(tempPkgJsonPath);
  }

  if (!result.success) {
    buildmessage.error('couldn\'t install npm packages from npm-shrinkwrap: ' + result.error);
    // Recover by returning false from updateDependencies
    throw new NpmFailure();
  }

  var nodeModulesDir = files.pathJoin(dir, "node_modules");
  files.readdir(nodeModulesDir).forEach(function (name) {
    var pkgDir = files.pathJoin(nodeModulesDir, name);
    if (!isPortable(pkgDir, true)) {
      recordLastRebuildVersions(pkgDir);
    }
  });
};

// `npm shrinkwrap`
function shrinkwrap(dir) {
  var tree = getInstalledDependenciesTree(dir);

  files.writeFile(files.pathJoin(dir, "npm-shrinkwrap.json"), JSON.stringify(tree, null, 2) + "\n");

  return tree;
}

// Reduces a dependency tree (as read from a just-made npm-shrinkwrap.json or
// from npm ls --json) to just the versions we want. Returns an object that does
// not share state with its input
var minimizeDependencyTree = function minimizeDependencyTree(tree) {
  var minimizeModule = function minimizeModule(module) {
    var version;
    if (module.resolved && !module.resolved.match(/^https?:\/\/registry.npmjs.org\//)) {
      version = module.resolved;
    } else if (utils.isNpmUrl(module.from)) {
      version = module.from;
    } else {
      version = module.version;
    }
    var minimized = { version: version };

    if (module.dependencies) {
      minimized.dependencies = {};
      _.each(module.dependencies, function (subModule, name) {
        minimized.dependencies[name] = minimizeModule(subModule);
      });
    }
    return minimized;
  };

  var newTopLevelDependencies = {};
  _.each(tree.dependencies, function (module, name) {
    newTopLevelDependencies[name] = minimizeModule(module);
  });
  return { dependencies: newTopLevelDependencies };
};

var logUpdateDependencies = function logUpdateDependencies(packageName, npmDependencies) {
  runLog.log(packageName + ': updating npm dependencies -- ' + _.keys(npmDependencies).join(', ') + '...');
};
//# sourceMappingURL=meteor-npm.js.map