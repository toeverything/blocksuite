import {
  SandpackClient
} from "./chunk-JF2Y4BLK.js";
import {
  SandpackLogLevel,
  __assign,
  __awaiter,
  __extends,
  __generator,
  __spreadArray,
  addPackageJSONIfNeeded,
  createError,
  createPackageJSON,
  dequal,
  extractErrorDetails,
  nullthrows
} from "./chunk-4OFJSVZJ.js";
import "./chunk-5WWUZCGV.js";

// ../../node_modules/.pnpm/@codesandbox+sandpack-client@2.9.0/node_modules/@codesandbox/sandpack-client/dist/clients/runtime/index.mjs
var Protocol = (
  /** @class */
  function() {
    function Protocol2(type, handleMessage, protocol) {
      var _this = this;
      this.type = type;
      this.handleMessage = handleMessage;
      this.protocol = protocol;
      this._disposeMessageListener = this.protocol.channelListen(function(msg) {
        return __awaiter(_this, void 0, void 0, function() {
          var message, result, response, err_1, response;
          return __generator(this, function(_a2) {
            switch (_a2.label) {
              case 0:
                if (!(msg.type === this.getTypeId() && msg.method))
                  return [3, 4];
                message = msg;
                _a2.label = 1;
              case 1:
                _a2.trys.push([1, 3, , 4]);
                return [4, this.handleMessage(message)];
              case 2:
                result = _a2.sent();
                response = {
                  type: this.getTypeId(),
                  msgId: message.msgId,
                  result
                };
                this.protocol.dispatch(response);
                return [3, 4];
              case 3:
                err_1 = _a2.sent();
                response = {
                  type: this.getTypeId(),
                  msgId: message.msgId,
                  error: {
                    message: err_1.message
                  }
                };
                this.protocol.dispatch(response);
                return [3, 4];
              case 4:
                return [
                  2
                  /*return*/
                ];
            }
          });
        });
      });
    }
    Protocol2.prototype.getTypeId = function() {
      return "protocol-" + this.type;
    };
    Protocol2.prototype.dispose = function() {
      this._disposeMessageListener();
    };
    return Protocol2;
  }()
);
var IFrameProtocol = (
  /** @class */
  function() {
    function IFrameProtocol2(iframe, origin) {
      this.globalListeners = {};
      this.globalListenersCount = 0;
      this.channelListeners = {};
      this.channelListenersCount = 0;
      this.channelId = Math.floor(Math.random() * 1e6);
      this.frameWindow = iframe.contentWindow;
      this.origin = origin;
      this.globalListeners = [];
      this.channelListeners = [];
      this.eventListener = this.eventListener.bind(this);
      if (typeof window !== "undefined") {
        window.addEventListener("message", this.eventListener);
      }
    }
    IFrameProtocol2.prototype.cleanup = function() {
      window.removeEventListener("message", this.eventListener);
      this.globalListeners = {};
      this.channelListeners = {};
      this.globalListenersCount = 0;
      this.channelListenersCount = 0;
    };
    IFrameProtocol2.prototype.register = function() {
      if (!this.frameWindow) {
        return;
      }
      this.frameWindow.postMessage({
        type: "register-frame",
        origin: document.location.origin,
        id: this.channelId
      }, this.origin);
    };
    IFrameProtocol2.prototype.dispatch = function(message) {
      if (!this.frameWindow) {
        return;
      }
      this.frameWindow.postMessage(__assign({ $id: this.channelId, codesandbox: true }, message), this.origin);
    };
    IFrameProtocol2.prototype.globalListen = function(listener) {
      var _this = this;
      if (typeof listener !== "function") {
        return function() {
          return;
        };
      }
      var listenerId = this.globalListenersCount;
      this.globalListeners[listenerId] = listener;
      this.globalListenersCount++;
      return function() {
        delete _this.globalListeners[listenerId];
      };
    };
    IFrameProtocol2.prototype.channelListen = function(listener) {
      var _this = this;
      if (typeof listener !== "function") {
        return function() {
          return;
        };
      }
      var listenerId = this.channelListenersCount;
      this.channelListeners[listenerId] = listener;
      this.channelListenersCount++;
      return function() {
        delete _this.channelListeners[listenerId];
      };
    };
    IFrameProtocol2.prototype.eventListener = function(evt) {
      if (evt.source !== this.frameWindow) {
        return;
      }
      var message = evt.data;
      if (!message.codesandbox) {
        return;
      }
      Object.values(this.globalListeners).forEach(function(listener) {
        return listener(message);
      });
      if (message.$id !== this.channelId) {
        return;
      }
      Object.values(this.channelListeners).forEach(function(listener) {
        return listener(message);
      });
    };
    return IFrameProtocol2;
  }()
);
var MAX_CLIENT_DEPENDENCY_COUNT = 50;
function getTemplate(pkg, modules) {
  if (!pkg) {
    return "static";
  }
  var _a2 = pkg.dependencies, dependencies = _a2 === void 0 ? {} : _a2, _b = pkg.devDependencies, devDependencies = _b === void 0 ? {} : _b;
  var totalDependencies = __spreadArray(__spreadArray([], Object.keys(dependencies), true), Object.keys(devDependencies), true);
  var moduleNames = Object.keys(modules);
  var adonis = ["@adonisjs/framework", "@adonisjs/core"];
  if (totalDependencies.some(function(dep) {
    return adonis.indexOf(dep) > -1;
  })) {
    return "adonis";
  }
  var nuxt = ["nuxt", "nuxt-edge", "nuxt-ts", "nuxt-ts-edge", "nuxt3"];
  if (totalDependencies.some(function(dep) {
    return nuxt.indexOf(dep) > -1;
  })) {
    return "nuxt";
  }
  if (totalDependencies.indexOf("next") > -1) {
    return "next";
  }
  var apollo = [
    "apollo-server",
    "apollo-server-express",
    "apollo-server-hapi",
    "apollo-server-koa",
    "apollo-server-lambda",
    "apollo-server-micro"
  ];
  if (totalDependencies.some(function(dep) {
    return apollo.indexOf(dep) > -1;
  })) {
    return "apollo";
  }
  if (totalDependencies.indexOf("mdx-deck") > -1) {
    return "mdx-deck";
  }
  if (totalDependencies.indexOf("gridsome") > -1) {
    return "gridsome";
  }
  if (totalDependencies.indexOf("vuepress") > -1) {
    return "vuepress";
  }
  if (totalDependencies.indexOf("ember-cli") > -1) {
    return "ember";
  }
  if (totalDependencies.indexOf("sapper") > -1) {
    return "sapper";
  }
  if (totalDependencies.indexOf("gatsby") > -1) {
    return "gatsby";
  }
  if (totalDependencies.indexOf("quasar") > -1) {
    return "quasar";
  }
  if (totalDependencies.indexOf("@docusaurus/core") > -1) {
    return "docusaurus";
  }
  if (totalDependencies.indexOf("remix") > -1) {
    return "remix";
  }
  if (totalDependencies.indexOf("astro") > -1) {
    return "node";
  }
  if (moduleNames.some(function(m) {
    return m.endsWith(".re");
  })) {
    return "reason";
  }
  var parcel = ["parcel-bundler", "parcel"];
  if (totalDependencies.some(function(dep) {
    return parcel.indexOf(dep) > -1;
  })) {
    return "parcel";
  }
  var dojo = ["@dojo/core", "@dojo/framework"];
  if (totalDependencies.some(function(dep) {
    return dojo.indexOf(dep) > -1;
  })) {
    return "@dojo/cli-create-app";
  }
  if (totalDependencies.indexOf("@nestjs/core") > -1 || totalDependencies.indexOf("@nestjs/common") > -1) {
    return "nest";
  }
  if (totalDependencies.indexOf("react-styleguidist") > -1) {
    return "styleguidist";
  }
  if (totalDependencies.indexOf("react-scripts") > -1) {
    return "create-react-app";
  }
  if (totalDependencies.indexOf("react-scripts-ts") > -1) {
    return "create-react-app-typescript";
  }
  if (totalDependencies.indexOf("@angular/core") > -1) {
    return "angular-cli";
  }
  if (totalDependencies.indexOf("preact-cli") > -1) {
    return "preact-cli";
  }
  if (totalDependencies.indexOf("@sveltech/routify") > -1 || totalDependencies.indexOf("@roxi/routify") > -1) {
    return "node";
  }
  if (totalDependencies.indexOf("vite") > -1) {
    return "node";
  }
  if (totalDependencies.indexOf("@frontity/core") > -1) {
    return "node";
  }
  if (totalDependencies.indexOf("svelte") > -1) {
    return "svelte";
  }
  if (totalDependencies.indexOf("vue") > -1) {
    return "vue-cli";
  }
  if (totalDependencies.indexOf("cx") > -1) {
    return "cxjs";
  }
  var nodeDeps = [
    "express",
    "koa",
    "nodemon",
    "ts-node",
    "@tensorflow/tfjs-node",
    "webpack-dev-server",
    "snowpack"
  ];
  if (totalDependencies.some(function(dep) {
    return nodeDeps.indexOf(dep) > -1;
  })) {
    return "node";
  }
  if (Object.keys(dependencies).length >= MAX_CLIENT_DEPENDENCY_COUNT) {
    return "node";
  }
  return void 0;
}
var _a;
var BUNDLER_URL = "https://" + ((_a = "2.9.0") === null || _a === void 0 ? void 0 : _a.replace(/\./g, "-")) + "-sandpack.codesandbox.io/";
var SandpackRuntime = (
  /** @class */
  function(_super) {
    __extends(SandpackRuntime2, _super);
    function SandpackRuntime2(selector, sandboxSetup, options) {
      if (options === void 0) {
        options = {};
      }
      var _this = _super.call(this, selector, sandboxSetup, options) || this;
      _this.getTranspilerContext = function() {
        return new Promise(function(resolve) {
          var unsubscribe = _this.listen(function(message) {
            if (message.type === "transpiler-context") {
              resolve(message.data);
              unsubscribe();
            }
          });
          _this.dispatch({ type: "get-transpiler-context" });
        });
      };
      _this.bundlerURL = options.bundlerURL || BUNDLER_URL;
      if (options.teamId) {
        _this.bundlerURL = _this.bundlerURL.replace("https://", "https://" + options.teamId + "-") + ("?cache=" + Date.now());
      }
      _this.bundlerState = void 0;
      _this.errors = [];
      _this.status = "initializing";
      if (typeof selector === "string") {
        _this.selector = selector;
        var element = document.querySelector(selector);
        nullthrows(element, "The element '" + selector + "' was not found");
        _this.element = element;
        _this.iframe = document.createElement("iframe");
        _this.initializeElement();
      } else {
        _this.element = selector;
        _this.iframe = selector;
      }
      if (!_this.iframe.getAttribute("sandbox")) {
        _this.iframe.setAttribute("sandbox", "allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts");
        _this.iframe.setAttribute("allow", "accelerometer; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; clipboard-write;");
      }
      _this.setLocationURLIntoIFrame();
      _this.iframeProtocol = new IFrameProtocol(_this.iframe, _this.bundlerURL);
      _this.unsubscribeGlobalListener = _this.iframeProtocol.globalListen(function(mes) {
        if (mes.type !== "initialized" || !_this.iframe.contentWindow) {
          return;
        }
        _this.iframeProtocol.register();
        if (_this.options.fileResolver) {
          _this.fileResolverProtocol = new Protocol("fs", function(data) {
            return __awaiter(_this, void 0, void 0, function() {
              return __generator(this, function(_a2) {
                if (data.method === "isFile") {
                  return [2, this.options.fileResolver.isFile(data.params[0])];
                } else if (data.method === "readFile") {
                  return [2, this.options.fileResolver.readFile(data.params[0])];
                } else {
                  throw new Error("Method not supported");
                }
              });
            });
          }, _this.iframeProtocol);
        }
        _this.updateSandbox(_this.sandboxSetup, true);
      });
      _this.unsubscribeChannelListener = _this.iframeProtocol.channelListen(function(mes) {
        switch (mes.type) {
          case "start": {
            _this.errors = [];
            break;
          }
          case "status": {
            _this.status = mes.status;
            break;
          }
          case "action": {
            if (mes.action === "show-error") {
              _this.errors = __spreadArray(__spreadArray([], _this.errors, true), [extractErrorDetails(mes)], false);
            }
            break;
          }
          case "done": {
            _this.status = "done";
            break;
          }
          case "state": {
            _this.bundlerState = mes.state;
            break;
          }
        }
      });
      return _this;
    }
    SandpackRuntime2.prototype.setLocationURLIntoIFrame = function() {
      var _a2;
      var urlSource = this.options.startRoute ? new URL(this.options.startRoute, this.bundlerURL).toString() : this.bundlerURL;
      (_a2 = this.iframe.contentWindow) === null || _a2 === void 0 ? void 0 : _a2.location.replace(urlSource);
      this.iframe.src = urlSource;
    };
    SandpackRuntime2.prototype.destroy = function() {
      this.unsubscribeChannelListener();
      this.unsubscribeGlobalListener();
      this.iframeProtocol.cleanup();
    };
    SandpackRuntime2.prototype.updateOptions = function(options) {
      if (!dequal(this.options, options)) {
        this.options = options;
        this.updateSandbox();
      }
    };
    SandpackRuntime2.prototype.updateSandbox = function(sandboxSetup, isInitializationCompile) {
      var _a2, _b, _c, _d;
      if (sandboxSetup === void 0) {
        sandboxSetup = this.sandboxSetup;
      }
      this.sandboxSetup = __assign(__assign({}, this.sandboxSetup), sandboxSetup);
      var files = this.getFiles();
      var modules = Object.keys(files).reduce(function(prev, next) {
        var _a3;
        return __assign(__assign({}, prev), (_a3 = {}, _a3[next] = {
          code: files[next].code,
          path: next
        }, _a3));
      }, {});
      var packageJSON = JSON.parse(createPackageJSON(this.sandboxSetup.dependencies, this.sandboxSetup.devDependencies, this.sandboxSetup.entry));
      try {
        packageJSON = JSON.parse(files["/package.json"].code);
      } catch (e) {
        console.error(createError("could not parse package.json file: " + e.message));
      }
      var normalizedModules = Object.keys(files).reduce(function(prev, next) {
        var _a3;
        return __assign(__assign({}, prev), (_a3 = {}, _a3[next] = {
          content: files[next].code,
          path: next
        }, _a3));
      }, {});
      this.dispatch({
        type: "compile",
        codesandbox: true,
        version: 3,
        isInitializationCompile,
        modules,
        reactDevTools: this.options.reactDevTools,
        externalResources: this.options.externalResources || [],
        hasFileResolver: Boolean(this.options.fileResolver),
        disableDependencyPreprocessing: this.sandboxSetup.disableDependencyPreprocessing,
        template: this.sandboxSetup.template || getTemplate(packageJSON, normalizedModules),
        showOpenInCodeSandbox: (_a2 = this.options.showOpenInCodeSandbox) !== null && _a2 !== void 0 ? _a2 : true,
        showErrorScreen: (_b = this.options.showErrorScreen) !== null && _b !== void 0 ? _b : true,
        showLoadingScreen: (_c = this.options.showLoadingScreen) !== null && _c !== void 0 ? _c : false,
        skipEval: this.options.skipEval || false,
        clearConsoleDisabled: !this.options.clearConsoleOnFirstCompile,
        logLevel: (_d = this.options.logLevel) !== null && _d !== void 0 ? _d : SandpackLogLevel.Info,
        customNpmRegistries: this.options.customNpmRegistries,
        teamId: this.options.teamId,
        sandboxId: this.options.sandboxId
      });
    };
    SandpackRuntime2.prototype.dispatch = function(message) {
      if (message.type === "refresh") {
        this.setLocationURLIntoIFrame();
      }
      this.iframeProtocol.dispatch(message);
    };
    SandpackRuntime2.prototype.listen = function(listener) {
      return this.iframeProtocol.channelListen(listener);
    };
    SandpackRuntime2.prototype.getCodeSandboxURL = function() {
      var files = this.getFiles();
      var paramFiles = Object.keys(files).reduce(function(prev, next) {
        var _a2;
        return __assign(__assign({}, prev), (_a2 = {}, _a2[next.replace("/", "")] = {
          content: files[next].code,
          isBinary: false
        }, _a2));
      }, {});
      return fetch("https://codesandbox.io/api/v1/sandboxes/define?json=1", {
        method: "POST",
        body: JSON.stringify({ files: paramFiles }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      }).then(function(x) {
        return x.json();
      }).then(function(res) {
        return {
          sandboxId: res.sandbox_id,
          editorUrl: "https://codesandbox.io/s/" + res.sandbox_id,
          embedUrl: "https://codesandbox.io/embed/" + res.sandbox_id
        };
      });
    };
    SandpackRuntime2.prototype.getFiles = function() {
      var sandboxSetup = this.sandboxSetup;
      if (sandboxSetup.files["/package.json"] === void 0) {
        return addPackageJSONIfNeeded(sandboxSetup.files, sandboxSetup.dependencies, sandboxSetup.devDependencies, sandboxSetup.entry);
      }
      return this.sandboxSetup.files;
    };
    SandpackRuntime2.prototype.initializeElement = function() {
      this.iframe.style.border = "0";
      this.iframe.style.width = this.options.width || "100%";
      this.iframe.style.height = this.options.height || "100%";
      this.iframe.style.overflow = "hidden";
      nullthrows(this.element.parentNode, "The given iframe does not have a parent.");
      this.element.parentNode.replaceChild(this.iframe, this.element);
    };
    return SandpackRuntime2;
  }(SandpackClient)
);
export {
  SandpackRuntime
};
//# sourceMappingURL=runtime-WAQU3VV5.js.map
