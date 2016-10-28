module.export({JsFile:function(){return JsFile},CssFile:function(){return CssFile}});var _classCallCheck;module.import('babel-runtime/helpers/classCallCheck',{"default":function(v){_classCallCheck=v}});var _possibleConstructorReturn;module.import('babel-runtime/helpers/possibleConstructorReturn',{"default":function(v){_possibleConstructorReturn=v}});var _inherits;module.import('babel-runtime/helpers/inherits',{"default":function(v){_inherits=v}});var buildmessage;module.import('../utils/buildmessage.js',{"default":function(v){buildmessage=v}});



var buildPluginModule = require('./build-plugin.js');

var InputFile = function (_buildPluginModule$In) {
  _inherits(InputFile, _buildPluginModule$In);

  function InputFile(source) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, InputFile);

    var _this = _possibleConstructorReturn(this, _buildPluginModule$In.call(this));

    _this._source = source;
    _this._arch = options.arch;
    _this._minifiedFiles = [];
    return _this;
  }

  InputFile.prototype.getContentsAsBuffer = function getContentsAsBuffer() {
    return this._source.contents();
  };

  InputFile.prototype.getPathInPackage = function getPathInPackage() {
    throw new Error("Compiled files don't belong to any package");
  };

  InputFile.prototype.getPackageName = function getPackageName() {
    throw new Error("Compiled files don't belong to any package");
  };

  InputFile.prototype.getSourceHash = function getSourceHash() {
    return this._source.hash();
  };

  InputFile.prototype.getArch = function getArch() {
    return this._arch;
  };

  InputFile.prototype.error = function error(_ref) {
    var message = _ref.message;
    var sourcePath = _ref.sourcePath;
    var line = _ref.line;
    var column = _ref.column;
    var func = _ref.func;

    var relPath = this.getPathInBundle();
    buildmessage.error(message || 'error minifying ' + relPath, {
      file: sourcePath || relPath,
      line: line ? line : undefined,
      column: column ? column : undefined,
      func: func ? func : undefined
    });
  };

  /**
   * @summary Returns the path of the compiled file in the bundle.
   * @memberof InputFile
   * @returns {String}
   */


  InputFile.prototype.getPathInBundle = function getPathInBundle() {
    return this._source.targetPath;
  };

  /**
   * @summary Returns the source-map associated with the file.
   * @memberof InputFile
   * @returns {String}
   */


  InputFile.prototype.getSourceMap = function getSourceMap() {
    return this._source.sourceMap;
  };

  return InputFile;
}(buildPluginModule.InputFile);

var JsFile = function (_InputFile) {
  _inherits(JsFile, _InputFile);

  function JsFile() {
    _classCallCheck(this, JsFile);

    return _possibleConstructorReturn(this, _InputFile.apply(this, arguments));
  }

  // - data
  // - sourceMap
  // - path
  // - hash?
  JsFile.prototype.addJavaScript = function addJavaScript(options) {
    var self = this;
    self._minifiedFiles.push({
      data: options.data,
      sourceMap: options.sourceMap,
      path: options.path
    });
  };

  return JsFile;
}(InputFile);

var CssFile = function (_InputFile2) {
  _inherits(CssFile, _InputFile2);

  function CssFile() {
    _classCallCheck(this, CssFile);

    return _possibleConstructorReturn(this, _InputFile2.apply(this, arguments));
  }

  // - data
  // - sourceMap
  // - path
  // - hash?
  CssFile.prototype.addStylesheet = function addStylesheet(options) {
    this._minifiedFiles.push({
      data: options.data,
      sourceMap: options.sourceMap,
      path: options.path
    });
  };

  return CssFile;
}(InputFile);
//# sourceMappingURL=minifier-plugin.js.map