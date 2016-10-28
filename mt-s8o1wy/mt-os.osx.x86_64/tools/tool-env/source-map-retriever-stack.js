module.export({push:function(){return push}});var sourceMapSupport;module.import('source-map-support',{"default":function(v){sourceMapSupport=v}});

// Why this file exists:
// We have two places in the tool where we need to do source maps:
// 1. Loaded isopacks, which use a special custom source map cache
// 2. Transpiled tool code from Babel
//
// In order to avoid crazy bootstrapping, it would be nice to be able to add
// functions to look for source maps, so that we can call
// sourceMapSupport.install as early as possible, and not worry about having
// the right data structures around.
//
// This module maintains a stack of source map retrieval functions, which are
// called in reverse order until one returns a truthy value.

var stack = [];

// Add a function to locate source maps; all of the functions are executed in
// reverse order
function push(func) {
  stack.push(func);
}

function tryAllSourceMapRetrievers(filename) {
  for (var i = stack.length - 1; i >= 0; i--) {
    var sourceMapData = stack[i](filename);

    if (sourceMapData) {
      return sourceMapData;
    }
  }

  return null;
}

function wrapCallSite(unwrappedFrame) {
  var frame = sourceMapSupport.wrapCallSite(unwrappedFrame);
  function wrapGetter(name) {
    var origGetter = frame[name];
    frame[name] = function (arg) {
      // replace a custom location domain that we set for better UX in Chrome
      // DevTools (separate domain group) in source maps.
      var source = origGetter(arg);
      if (!source) {
        return source;
      }
      return source.replace(/(^|\()meteor:\/\/..app\//, '$1');
    };
  }
  wrapGetter('getScriptNameOrSourceURL');
  wrapGetter('getEvalOrigin');

  return frame;
}

sourceMapSupport.install({
  retrieveSourceMap: tryAllSourceMapRetrievers,
  // Disable the feature of source-map-support that shows an accurate snippet
  // of source code on uncaught exception, because we haven't fixed it to
  // be able to locate the proper source code to display.  (Note that the
  // stack trace of an uncaught exception will be correctly source-mapped
  // independent of this option.)
  handleUncaughtExceptions: false,
  wrapCallSite: wrapCallSite
});

// Save the correct prepareStackTrace so that if third-party code overwrites
// it (ahem, coffeescript), we can restore it.
Error.METEOR_prepareStackTrace = Error.prepareStackTrace;

// Default retrievers

// Always fall back to the default in the end
push(sourceMapSupport.retrieveSourceMap);

/* eslint-disable max-len */

/* eslint-enable max-len */
//# sourceMappingURL=source-map-retriever-stack.js.map