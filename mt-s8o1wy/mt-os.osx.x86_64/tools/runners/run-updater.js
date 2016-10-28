var _regeneratorRuntime;module.import('babel-runtime/regenerator',{"default":function(v){_regeneratorRuntime=v}});
var _ = require('underscore');
var Fiber = require('fibers');
var fiberHelpers = require('../utils/fiber-helpers.js');
var Console = require('../console/console.js').Console;

var Updater = function Updater() {
  var self = this;
  self.timer = null;
};

// XXX make it take a runLog?
// XXX need to deal with updater writing messages (bypassing old
// stdout interception.. maybe it should be global after all..)
_.extend(Updater.prototype, {
  start: function start() {
    var self = this;

    if (self.timer) {
      throw new Error("already running?");
    }

    // Check every 3 hours. (Should not share buildmessage state with
    // the main fiber.)
    function check() {
      return _regeneratorRuntime.async(function check$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              self._check();

            case 1:
            case 'end':
              return _context.stop();
          }
        }
      }, null, this);
    }

    self.timer = setInterval(check, 3 * 60 * 60 * 1000);

    // Also start a check now, but don't block on it. (This should
    // not share buildmessage state with the main fiber.)
    check();
  },

  _check: function _check() {
    var self = this;
    var updater = require('../packaging/updater.js');
    try {
      updater.tryToDownloadUpdate({ showBanner: true });
    } catch (e) {
      // oh well, this was the background. Only show errors if we are in debug
      // mode.
      Console.debug("Error inside updater.");
      Console.debug(e.stack);
      return;
    }
  },

  // Returns immediately. However if an update check is currently
  // running it will complete in the background. Idempotent.
  stop: function stop() {
    var self = this;

    if (self.timer) {
      return;
    }
    clearInterval(self.timer);
    self.timer = null;
  }
});

exports.Updater = Updater;
//# sourceMappingURL=run-updater.js.map