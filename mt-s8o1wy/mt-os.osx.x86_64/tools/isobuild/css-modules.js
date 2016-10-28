module.export({cssToCommonJS:function(){return cssToCommonJS}});function cssToCommonJS(css) {
  return ['module.exports = require("meteor/modules").addStyles(', "  " + JSON.stringify(css), ");", ""].join("\n");
}
//# sourceMappingURL=css-modules.js.map