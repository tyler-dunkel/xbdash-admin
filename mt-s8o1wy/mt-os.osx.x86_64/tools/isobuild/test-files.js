module.export({TEST_FILENAME_REGEXPS:function(){return TEST_FILENAME_REGEXPS},APP_TEST_FILENAME_REGEXPS:function(){return APP_TEST_FILENAME_REGEXPS},isTestFilePath:function(){return isTestFilePath}});var _;module.import('underscore',{"default":function(v){_=v}});var pathSep;module.import('../fs/files',{"pathSep":function(v){pathSep=v}});


// We have two things "tests" and "app-tests".
var TEST_FILENAME_REGEXPS = [
// "*.test[s].*" or "*.spec[s].*"
/\.tests?./, /\.specs?./];

var APP_TEST_FILENAME_REGEXPS = [
// "*.app-tests.*" or "*.app-specs.*"
/\.app-tests?./, /\.app-specs?./];

// Given a path to a file in an app (relative to the app root
// directory), is this file a test file?
function isTestFilePath(path) {
  var splitPath = path.split(pathSep);

  // Does the filename match one of the test filename forms?
  return _.any([].concat(TEST_FILENAME_REGEXPS, APP_TEST_FILENAME_REGEXPS), function (regexp) {
    return regexp.test(_.last(splitPath));
  });
}
//# sourceMappingURL=test-files.js.map