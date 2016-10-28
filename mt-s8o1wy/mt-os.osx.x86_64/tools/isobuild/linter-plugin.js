module.export({LinterPlugin:function(){return LinterPlugin},LintingFile:function(){return LintingFile}});var _possibleConstructorReturn;module.import("babel-runtime/helpers/possibleConstructorReturn",{"default":function(v){_possibleConstructorReturn=v}});var _inherits;module.import("babel-runtime/helpers/inherits",{"default":function(v){_inherits=v}});var _classCallCheck;module.import("babel-runtime/helpers/classCallCheck",{"default":function(v){_classCallCheck=v}});var InputFile;module.import("./build-plugin.js",{"InputFile":function(v){InputFile=v}});




var LinterPlugin = function LinterPlugin(pluginDefinition, userPlugin) {
  _classCallCheck(this, LinterPlugin);

  this.pluginDefinition = pluginDefinition;
  this.userPlugin = userPlugin;
};

var LintingFile = function (_InputFile) {
  _inherits(LintingFile, _InputFile);

  function LintingFile(source) {
    _classCallCheck(this, LintingFile);

    var _this = _possibleConstructorReturn(this, _InputFile.call(this));

    _this._source = source;
    return _this;
  }

  LintingFile.prototype.getContentsAsBuffer = function getContentsAsBuffer() {
    return this._source.contents;
  };

  LintingFile.prototype.getPathInPackage = function getPathInPackage() {
    return this._source.relPath;
  };

  LintingFile.prototype.getPackageName = function getPackageName() {
    return this._source["package"];
  };

  LintingFile.prototype.getSourceHash = function getSourceHash() {
    return this._source.hash;
  };

  LintingFile.prototype.getArch = function getArch() {
    return this._source.arch;
  };

  LintingFile.prototype.getFileOptions = function getFileOptions() {
    return this._source.fileOptions || {};
  };

  return LintingFile;
}(InputFile);
//# sourceMappingURL=linter-plugin.js.map