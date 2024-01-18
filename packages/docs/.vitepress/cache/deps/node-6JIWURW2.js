import {
  EventEmitter,
  consoleHook,
  findStartScriptPackageJson,
  fromBundlerFilesToFS,
  generateRandomId,
  getMessageFromError,
  readBuffer,
  writeBuffer
} from "./chunk-TPAXK3BO.js";
import {
  SandpackClient
} from "./chunk-JF2Y4BLK.js";
import {
  __assign,
  __awaiter,
  __extends,
  __generator,
  createError,
  nullthrows
} from "./chunk-4OFJSVZJ.js";
import "./chunk-5WWUZCGV.js";

// ../../node_modules/.pnpm/@codesandbox+nodebox@0.1.8/node_modules/@codesandbox/nodebox/build/index.mjs
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var __privateMethod = (obj, member, method) => {
  __accessCheck(obj, member, "access private method");
  return method;
};
var require_pad = __commonJS({
  "../../node_modules/.pnpm/cuid@2.1.8/node_modules/cuid/lib/pad.js"(exports, module) {
    module.exports = function pad(num, size) {
      var s = "000000000" + num;
      return s.substr(s.length - size);
    };
  }
});
var require_fingerprint_browser = __commonJS({
  "../../node_modules/.pnpm/cuid@2.1.8/node_modules/cuid/lib/fingerprint.browser.js"(exports, module) {
    var pad = require_pad();
    var env = typeof window === "object" ? window : self;
    var globalCount = Object.keys(env).length;
    var mimeTypesLength = navigator.mimeTypes ? navigator.mimeTypes.length : 0;
    var clientId = pad((mimeTypesLength + navigator.userAgent.length).toString(36) + globalCount.toString(36), 4);
    module.exports = function fingerprint() {
      return clientId;
    };
  }
});
var require_getRandomValue_browser = __commonJS({
  "../../node_modules/.pnpm/cuid@2.1.8/node_modules/cuid/lib/getRandomValue.browser.js"(exports, module) {
    var getRandomValue;
    var crypto = typeof window !== "undefined" && (window.crypto || window.msCrypto) || typeof self !== "undefined" && self.crypto;
    if (crypto) {
      lim = Math.pow(2, 32) - 1;
      getRandomValue = function() {
        return Math.abs(crypto.getRandomValues(new Uint32Array(1))[0] / lim);
      };
    } else {
      getRandomValue = Math.random;
    }
    var lim;
    module.exports = getRandomValue;
  }
});
var require_cuid = __commonJS({
  "../../node_modules/.pnpm/cuid@2.1.8/node_modules/cuid/index.js"(exports, module) {
    var fingerprint = require_fingerprint_browser();
    var pad = require_pad();
    var getRandomValue = require_getRandomValue_browser();
    var c = 0;
    var blockSize = 4;
    var base = 36;
    var discreteValues = Math.pow(base, blockSize);
    function randomBlock() {
      return pad((getRandomValue() * discreteValues << 0).toString(base), blockSize);
    }
    function safeCounter() {
      c = c < discreteValues ? c : 0;
      c++;
      return c - 1;
    }
    function cuid3() {
      var letter = "c", timestamp = (/* @__PURE__ */ new Date()).getTime().toString(base), counter = pad(safeCounter().toString(base), blockSize), print = fingerprint(), random = randomBlock() + randomBlock();
      return letter + timestamp + counter + print + random;
    }
    cuid3.slug = function slug() {
      var date = (/* @__PURE__ */ new Date()).getTime().toString(36), counter = safeCounter().toString(36).slice(-4), print = fingerprint().slice(0, 1) + fingerprint().slice(-1), random = randomBlock().slice(-2);
      return date.slice(-2) + counter + print + random;
    };
    cuid3.isCuid = function isCuid(stringToCheck) {
      if (typeof stringToCheck !== "string")
        return false;
      if (stringToCheck.startsWith("c"))
        return true;
      return false;
    };
    cuid3.isSlug = function isSlug(stringToCheck) {
      if (typeof stringToCheck !== "string")
        return false;
      var stringLength = stringToCheck.length;
      if (stringLength >= 7 && stringLength <= 10)
        return true;
      return false;
    };
    cuid3.fingerprint = fingerprint;
    module.exports = cuid3;
  }
});
var require_createDeferredExecutor = __commonJS({
  "../../node_modules/.pnpm/@open-draft+deferred-promise@2.1.0/node_modules/@open-draft/deferred-promise/build/createDeferredExecutor.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createDeferredExecutor = void 0;
    function createDeferredExecutor() {
      const executor = (resolve, reject) => {
        executor.state = "pending";
        executor.resolve = (data) => {
          if (executor.state !== "pending") {
            return;
          }
          executor.result = data;
          const onFulfilled = (value) => {
            executor.state = "fulfilled";
            return value;
          };
          return resolve(data instanceof Promise ? data : Promise.resolve(data).then(onFulfilled));
        };
        executor.reject = (reason) => {
          if (executor.state !== "pending") {
            return;
          }
          queueMicrotask(() => {
            executor.state = "rejected";
          });
          return reject(executor.rejectionReason = reason);
        };
      };
      return executor;
    }
    exports.createDeferredExecutor = createDeferredExecutor;
  }
});
var require_DeferredPromise = __commonJS({
  "../../node_modules/.pnpm/@open-draft+deferred-promise@2.1.0/node_modules/@open-draft/deferred-promise/build/DeferredPromise.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DeferredPromise = void 0;
    var createDeferredExecutor_1 = require_createDeferredExecutor();
    var DeferredPromise4 = class extends Promise {
      #executor;
      resolve;
      reject;
      constructor(executor = null) {
        const deferredExecutor = (0, createDeferredExecutor_1.createDeferredExecutor)();
        super((originalResolve, originalReject) => {
          deferredExecutor(originalResolve, originalReject);
          executor?.(deferredExecutor.resolve, deferredExecutor.reject);
        });
        this.#executor = deferredExecutor;
        this.resolve = this.#executor.resolve;
        this.reject = this.#executor.reject;
      }
      get state() {
        return this.#executor.state;
      }
      get rejectionReason() {
        return this.#executor.rejectionReason;
      }
      then(onFulfilled, onRejected) {
        return this.#decorate(super.then(onFulfilled, onRejected));
      }
      catch(onRejected) {
        return this.#decorate(super.catch(onRejected));
      }
      finally(onfinally) {
        return this.#decorate(super.finally(onfinally));
      }
      #decorate(promise) {
        return Object.defineProperties(promise, {
          resolve: { configurable: true, value: this.resolve },
          reject: { configurable: true, value: this.reject }
        });
      }
    };
    exports.DeferredPromise = DeferredPromise4;
  }
});
var require_build = __commonJS({
  "../../node_modules/.pnpm/@open-draft+deferred-promise@2.1.0/node_modules/@open-draft/deferred-promise/build/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m)
        if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
          __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_createDeferredExecutor(), exports);
    __exportStar(require_DeferredPromise(), exports);
  }
});
var require_MemoryLeakError = __commonJS({
  "../../node_modules/.pnpm/strict-event-emitter@0.4.3/node_modules/strict-event-emitter/lib/MemoryLeakError.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MemoryLeakError = void 0;
    var MemoryLeakError = class extends Error {
      emitter;
      type;
      count;
      constructor(emitter, type, count) {
        super(`Possible EventEmitter memory leak detected. ${count} ${type.toString()} listeners added. Use emitter.setMaxListeners() to increase limit`);
        this.emitter = emitter;
        this.type = type;
        this.count = count;
        this.name = "MaxListenersExceededWarning";
      }
    };
    exports.MemoryLeakError = MemoryLeakError;
  }
});
var require_Emitter = __commonJS({
  "../../node_modules/.pnpm/strict-event-emitter@0.4.3/node_modules/strict-event-emitter/lib/Emitter.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Emitter = void 0;
    var MemoryLeakError_1 = require_MemoryLeakError();
    var _events, _maxListeners, _hasWarnedAboutPotentialMemortyLeak, _getListeners, getListeners_fn, _removeListener, removeListener_fn, _wrapOnceListener, wrapOnceListener_fn, _internalEmit, internalEmit_fn;
    var _Emitter = class {
      constructor() {
        __privateAdd(this, _getListeners);
        __privateAdd(this, _removeListener);
        __privateAdd(this, _wrapOnceListener);
        __privateAdd(this, _internalEmit);
        __privateAdd(this, _events, void 0);
        __privateAdd(this, _maxListeners, void 0);
        __privateAdd(this, _hasWarnedAboutPotentialMemortyLeak, void 0);
        __privateSet(this, _events, /* @__PURE__ */ new Map());
        __privateSet(this, _maxListeners, _Emitter.defaultMaxListeners);
        __privateSet(this, _hasWarnedAboutPotentialMemortyLeak, false);
      }
      static listenerCount(emitter, eventName) {
        return emitter.listenerCount(eventName);
      }
      setMaxListeners(maxListeners) {
        __privateSet(this, _maxListeners, maxListeners);
        return this;
      }
      getMaxListeners() {
        return __privateGet(this, _maxListeners);
      }
      eventNames() {
        return Array.from(__privateGet(this, _events).keys());
      }
      emit(eventName, ...data) {
        const listeners = __privateMethod(this, _getListeners, getListeners_fn).call(this, eventName);
        listeners.forEach((listener) => {
          listener.apply(this, data);
        });
        return listeners.length > 0;
      }
      addListener(eventName, listener) {
        __privateMethod(this, _internalEmit, internalEmit_fn).call(this, "newListener", eventName, listener);
        const nextListeners = __privateMethod(this, _getListeners, getListeners_fn).call(this, eventName).concat(listener);
        __privateGet(this, _events).set(eventName, nextListeners);
        if (__privateGet(this, _maxListeners) > 0 && this.listenerCount(eventName) > __privateGet(this, _maxListeners) && !__privateGet(this, _hasWarnedAboutPotentialMemortyLeak)) {
          __privateSet(this, _hasWarnedAboutPotentialMemortyLeak, true);
          const memoryLeakWarning = new MemoryLeakError_1.MemoryLeakError(this, eventName, this.listenerCount(eventName));
          console.warn(memoryLeakWarning);
        }
        return this;
      }
      on(eventName, listener) {
        return this.addListener(eventName, listener);
      }
      once(eventName, listener) {
        return this.addListener(eventName, __privateMethod(this, _wrapOnceListener, wrapOnceListener_fn).call(this, eventName, listener));
      }
      prependListener(eventName, listener) {
        const listeners = __privateMethod(this, _getListeners, getListeners_fn).call(this, eventName);
        if (listeners.length > 0) {
          const nextListeners = [listener].concat(listeners);
          __privateGet(this, _events).set(eventName, nextListeners);
        } else {
          __privateGet(this, _events).set(eventName, listeners.concat(listener));
        }
        return this;
      }
      prependOnceListener(eventName, listener) {
        return this.prependListener(eventName, __privateMethod(this, _wrapOnceListener, wrapOnceListener_fn).call(this, eventName, listener));
      }
      removeListener(eventName, listener) {
        const listeners = __privateMethod(this, _getListeners, getListeners_fn).call(this, eventName);
        if (listeners.length > 0) {
          __privateMethod(this, _removeListener, removeListener_fn).call(this, listeners, listener);
          __privateGet(this, _events).set(eventName, listeners);
          __privateMethod(this, _internalEmit, internalEmit_fn).call(this, "removeListener", eventName, listener);
        }
        return this;
      }
      off(eventName, listener) {
        return this.removeListener(eventName, listener);
      }
      removeAllListeners(eventName) {
        if (eventName) {
          __privateGet(this, _events).delete(eventName);
        } else {
          __privateGet(this, _events).clear();
        }
        return this;
      }
      listeners(eventName) {
        return Array.from(__privateMethod(this, _getListeners, getListeners_fn).call(this, eventName));
      }
      listenerCount(eventName) {
        return __privateMethod(this, _getListeners, getListeners_fn).call(this, eventName).length;
      }
      rawListeners(eventName) {
        return this.listeners(eventName);
      }
    };
    var Emitter2 = _Emitter;
    _events = /* @__PURE__ */ new WeakMap();
    _maxListeners = /* @__PURE__ */ new WeakMap();
    _hasWarnedAboutPotentialMemortyLeak = /* @__PURE__ */ new WeakMap();
    _getListeners = /* @__PURE__ */ new WeakSet();
    getListeners_fn = function(eventName) {
      return __privateGet(this, _events).get(eventName) || [];
    };
    _removeListener = /* @__PURE__ */ new WeakSet();
    removeListener_fn = function(listeners, listener) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
      return [];
    };
    _wrapOnceListener = /* @__PURE__ */ new WeakSet();
    wrapOnceListener_fn = function(eventName, listener) {
      const onceListener = (...data) => {
        this.removeListener(eventName, onceListener);
        listener.apply(this, data);
      };
      return onceListener;
    };
    _internalEmit = /* @__PURE__ */ new WeakSet();
    internalEmit_fn = function(internalEventName, eventName, listener) {
      this.emit(
        internalEventName,
        ...[eventName, listener]
      );
    };
    __publicField(Emitter2, "defaultMaxListeners", 10);
    exports.Emitter = Emitter2;
  }
});
var require_lib = __commonJS({
  "../../node_modules/.pnpm/strict-event-emitter@0.4.3/node_modules/strict-event-emitter/lib/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m)
        if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
          __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_Emitter(), exports);
    __exportStar(require_MemoryLeakError(), exports);
  }
});
var import_cuid = __toESM(require_cuid());
var POSITIONALS_EXP = /(%?)(%([sdjo]))/g;
function serializePositional(positional, flag) {
  switch (flag) {
    case "s":
      return positional;
    case "d":
    case "i":
      return Number(positional);
    case "j":
      return JSON.stringify(positional);
    case "o": {
      if (typeof positional === "string") {
        return positional;
      }
      const json = JSON.stringify(positional);
      if (json === "{}" || json === "[]" || /^\[object .+?\]$/.test(json)) {
        return positional;
      }
      return json;
    }
  }
}
function format(message, ...positionals) {
  if (positionals.length === 0) {
    return message;
  }
  let positionalIndex = 0;
  let formattedMessage = message.replace(
    POSITIONALS_EXP,
    (match, isEscaped, _, flag) => {
      const positional = positionals[positionalIndex];
      const value = serializePositional(positional, flag);
      if (!isEscaped) {
        positionalIndex++;
        return value;
      }
      return match;
    }
  );
  if (positionalIndex < positionals.length) {
    formattedMessage += ` ${positionals.slice(positionalIndex).join(" ")}`;
  }
  formattedMessage = formattedMessage.replace(/%{2,2}/g, "%");
  return formattedMessage;
}
var STACK_FRAMES_TO_IGNORE = 2;
function cleanErrorStack(error) {
  if (!error.stack) {
    return;
  }
  const nextStack = error.stack.split("\n");
  nextStack.splice(1, STACK_FRAMES_TO_IGNORE);
  error.stack = nextStack.join("\n");
}
var InvariantError = class extends Error {
  constructor(message, ...positionals) {
    super(message);
    this.message = message;
    this.name = "Invariant Violation";
    this.message = format(message, ...positionals);
    cleanErrorStack(this);
  }
};
var invariant = (predicate, message, ...positionals) => {
  if (!predicate) {
    throw new InvariantError(message, ...positionals);
  }
};
invariant.as = (ErrorConstructor, predicate, message, ...positionals) => {
  if (!predicate) {
    const isConstructor = ErrorConstructor.prototype.name != null;
    const error = isConstructor ? new ErrorConstructor(format(message, positionals)) : ErrorConstructor(format(message, positionals));
    throw error;
  }
};
var import_deferred_promise = __toESM(require_build());
var FLAG = window.localStorage["CSB_EMULATOR_DEBUG"];
var DEFAULT = "\x1B[0m";
var GREEN = "\x1B[32;1m";
var RED = "\x1B[31m";
var BLUE = "\x1B[34m";
var YELLOW = "\x1B[33;1m";
var MAGENTA = "\x1B[35;1m";
var CYAN = "\x1B[36;1m";
var COLOR_SCOPE = {
  preview: YELLOW,
  emulator: MAGENTA,
  runtime: CYAN,
  bridge: BLUE,
  "runtime:worker": CYAN
};
function createDebug(scope) {
  return function debug3(message, ...data) {
    if (FLAG === "true") {
      const direction = () => {
        if (message.includes("sender"))
          return `${GREEN}sender`;
        if (message.includes("receiver"))
          return `${RED}receiver`;
        return "";
      };
      const cleanMessage = message.replace(/\[.+\]:/, "");
      console.debug(`${COLOR_SCOPE[scope]}${scope}:${direction()}${DEFAULT}:${cleanMessage}`, ...data);
    }
  };
}
var debug = createDebug("emulator");
var MessageSender = class {
  constructor(target) {
    this.target = target;
    this.emitter = new EventTarget();
    this.channel = new MessageChannel();
    this.receiverPort = this.channel.port1;
    const receiverReadyPromise = new import_deferred_promise.DeferredPromise();
    const handshakeListener = (message) => {
      if (message.data.type === "internal/ready") {
        debug("[message-sender]: runtime is ready");
        receiverReadyPromise.resolve();
      }
    };
    window.addEventListener("message", handshakeListener);
    receiverReadyPromise.then(() => {
      window.removeEventListener("message", handshakeListener);
    });
    this.receiverReadyPromise = receiverReadyPromise;
    this.receiverPort.onmessage = (evt) => {
      const data = evt.data;
      if (data.type != null) {
        debug('[message-sender]: emitting "%s" event...', data.type, data.payload);
        this.emitter.dispatchEvent(new MessageEvent(data.type, { data: data.payload }));
      }
    };
  }
  emitter;
  channel;
  receiverPort;
  receiverReadyPromise;
  async handshake() {
    const handshakePromise = new import_deferred_promise.DeferredPromise();
    await this.receiverReadyPromise;
    debug("[message-sender]: sending handshake");
    this.target.postMessage(
      {
        type: "internal/handshake"
      },
      "*",
      [this.channel.port2]
    );
    this.on("internal/handshake/done", () => {
      handshakePromise.resolve();
      clearTimeout(rejectionTimeout);
    });
    const rejectionTimeout = setTimeout(() => {
      handshakePromise.reject(new Error("MessageSender: Handshake timeout"));
    }, 5e3);
    return handshakePromise;
  }
  on(event, listener, options) {
    debug('[message-sender]: add listener "%s"', event);
    this.emitter.addEventListener(
      event,
      (message) => {
        if (message instanceof MessageEvent) {
          listener(message);
        }
      },
      options
    );
  }
  off(event, listener, options) {
    this.emitter.removeEventListener(event, listener, options);
  }
  async send(event, ...data) {
    const operationPromise = new import_deferred_promise.DeferredPromise();
    const operationId = (0, import_cuid.default)();
    const payload = data[0] || {};
    debug('[message-sender]: send "%s" (%s)', event, operationId, payload);
    this.receiverPort.postMessage({ type: event, payload: { operationId, payload } });
    debug('[message-sender]: adding done listener for "%s" (%s)', event, operationId);
    const handleOperationDone = (doneEvent) => {
      const { data: data2 } = doneEvent;
      if (data2.operationId === operationId) {
        const listenerPayload = data2.listenerPayload || {};
        debug('[message-sender]: resolving "%s (%s) promise!', event, operationId);
        operationPromise.resolve({
          ...listenerPayload,
          operationId: data2.operationId
        });
      }
    };
    const handleOperationFailed = (failEvent) => {
      const { data: data2 } = failEvent;
      if (data2.operationId === operationId) {
        debug('[message-sender]: rejecting "%s (%s) promise!', event, operationId);
        operationPromise.reject(data2.error);
      }
    };
    this.on("internal/operation/done", handleOperationDone);
    this.on("internal/operation/failed", handleOperationFailed);
    return operationPromise.finally(() => {
      this.emitter.removeEventListener("internal/operation/done", handleOperationDone);
      this.emitter.removeEventListener("internal/operation/failed", handleOperationFailed);
    });
  }
};
var import_deferred_promise3 = __toESM(require_build());
var import_cuid2 = __toESM(require_cuid());
var FileSystemApi = class {
  constructor(channel) {
    this.channel = channel;
  }
  async init(files) {
    await this.channel.send("fs/init", { files });
  }
  async readFile(path, encoding) {
    const response = await this.channel.send("fs/readFile", { path, encoding }).catch((error) => {
      throw new Error(format('Failed to read file at path "%s"', path), { cause: error });
    });
    if (!response) {
      throw new Error("File not found");
    }
    return response.data;
  }
  async writeFile(path, content, options) {
    let encoding = void 0;
    let recursive = false;
    if (typeof options === "object") {
      encoding = options.encoding;
      recursive = !!options.recursive;
    } else if (typeof options === "string") {
      encoding = options;
    }
    await this.channel.send("fs/writeFile", { path, content, encoding, recursive }).catch((error) => {
      throw new Error(format('Failed to write file at path "%s"', path), { cause: error });
    });
  }
  async readdir(path) {
    const response = await this.channel.send("fs/readdir", { path }).catch((error) => {
      throw new Error(format('Failed to read directory at path "%s"', path), { cause: error });
    });
    if (!response) {
      throw new Error("Directory not found");
    }
    return response.data;
  }
  async mkdir(path, options) {
    const recursive = !!options?.recursive;
    await this.channel.send("fs/mkdir", { path, recursive }).catch((error) => {
      throw new Error(format('Failed to make directory at path "%s"', path), { cause: error });
    });
  }
  async stat(path) {
    const response = await this.channel.send("fs/stat", { path }).catch((error) => {
      throw new Error(format('Failed to stat file at path "%s"', path), { cause: error });
    });
    if (!response) {
      throw new Error("File not found");
    }
    return response.data;
  }
  async rm(path, options) {
    const { force, recursive } = options || {};
    await this.channel.send("fs/rm", { path, force, recursive }).catch((error) => {
      throw new Error(format('Failed to remove file at path "%s"', path), { cause: error });
    });
  }
  async watch(includes, excludes, listener) {
    const watcherId = (0, import_cuid2.default)();
    await this.channel.send("fs/watch", { watcherId, includes, excludes });
    this.channel.on("fs/watch-event", ({ data }) => {
      if (data.watcherId === watcherId && listener) {
        const evt = { ...data };
        delete evt.watcherId;
        listener(evt);
      }
    });
    return {
      dispose: () => this.channel.send("fs/unwatch", { watcherId })
    };
  }
};
var import_strict_event_emitter = __toESM(require_lib());
var ShellApi = class {
  constructor(channel) {
    this.channel = channel;
  }
  create() {
    return new ShellProcess(this.channel);
  }
};
var ShellProcess = class {
  constructor(channel) {
    this.channel = channel;
    this.state = "running";
    this.stdout = new import_strict_event_emitter.Emitter();
    this.stderr = new import_strict_event_emitter.Emitter();
    this.stdin = {
      write: (data) => {
        if (!this.id) {
          throw new Error("Failed to write to stdin, no process is currently running");
        }
        return this.channel.send("shell/stdin", { data, workerId: this.id });
      }
    };
    this.forwardStdEvents();
  }
  id;
  state;
  stdout;
  stderr;
  stdin;
  forwardStdEvents() {
    this.channel.on("worker/tty", (message) => {
      const { data } = message;
      if (data.workerId !== this.id) {
        return;
      }
      switch (data.payload.type) {
        case "out": {
          this.stdout.emit("data", data.payload.data);
          break;
        }
        case "err": {
          this.stderr.emit("data", data.payload.data);
          break;
        }
      }
    });
  }
  async runCommand(command, args, options = {}) {
    invariant(!this.id, 'Failed to run "runCommand" on a ShellProcess: there is already a process running.');
    const shellInfo = await this.channel.send("shell/runCommand", { command, args, options });
    invariant(shellInfo, 'Failed to run "runCommand" on a ShellProcess: was not able to retrieve a running process.');
    this.id = shellInfo.id;
    this.state = "running";
    return shellInfo;
  }
  async on(message, listener) {
    switch (message) {
      case "progress": {
        this.channel.on("worker/progress", ({ data }) => {
          listener(data.status);
        });
        return;
      }
      case "exit": {
        this.channel.on("worker/exit", ({ data }) => {
          if (data.workerId === this.id) {
            listener(data.exitCode, data.error);
          }
        });
        return;
      }
    }
  }
  async kill() {
    invariant(
      this.id,
      'Failed to run "kill" on a ShellProcess: there is no process running. Did you forget to run it?'
    );
    this.state = "idle";
    await this.channel.send("shell/exit", { id: this.id }).catch((error) => {
      throw new Error(format('Failed to kill shell with ID "%s"', this.id), { cause: error });
    });
    this.id = void 0;
  }
};
var import_deferred_promise2 = __toESM(require_build());
var TIMEOUT = 2e4;
var PreviewApi = class {
  constructor(channel) {
    this.channel = channel;
  }
  async waitFor(payload, predicate, timeout = TIMEOUT) {
    const readyPromise = new import_deferred_promise2.DeferredPromise();
    const rejectTimeout = setTimeout(() => {
      readyPromise.reject();
    }, timeout);
    const previewInformation = await this.channel.send("preview/get/info", payload).catch((error) => {
      readyPromise.reject(
        new Error(
          format(
            'Failed to look up preview information for shell ID "%s" (port: %d)',
            payload.sourceShellId,
            payload.port
          )
        )
      );
    });
    const foundPreview = previewInformation && predicate(previewInformation);
    if (foundPreview) {
      readyPromise.resolve({
        url: previewInformation.url,
        port: previewInformation.port,
        sourceShellId: previewInformation.sourceShellId
      });
    }
    this.channel.on("preview/port/ready", ({ data }) => {
      if (!foundPreview && predicate(data)) {
        readyPromise.resolve({
          url: data.url,
          port: data.port,
          sourceShellId: data.sourceShellId
        });
      }
    });
    return readyPromise.finally(() => {
      clearTimeout(rejectTimeout);
    });
  }
  async getByShellId(sourceShellId, timeout) {
    return this.waitFor({ sourceShellId }, (data) => data.sourceShellId === sourceShellId, timeout).catch((error) => {
      throw new Error(format('Failed to get shell by ID "%s"', sourceShellId), { cause: error });
    });
  }
  async waitForPort(port, timeout) {
    return this.waitFor({ port }, (data) => data.port === port, timeout).catch((error) => {
      throw new Error(format("Failed to await port %d", port), { cause: error });
    });
  }
};
var DEFAULT_RUNTIME_URL = "https://nodebox-runtime.codesandbox.io";
var debug2 = createDebug("emulator");
var Nodebox = class {
  constructor(options) {
    this.options = options;
    invariant(
      this.options.iframe,
      'Failed to create a Nodebox: expected "iframe" argument to be a reference to an <iframe> element but got %j',
      this.options.iframe
    );
    this.url = this.options.runtimeUrl || DEFAULT_RUNTIME_URL;
    this.isConnected = false;
  }
  channel = null;
  isConnected;
  url;
  fileSystemApi = null;
  shellApi = null;
  previewApi = null;
  async connect() {
    const { iframe, cdnUrl } = this.options;
    debug2("[message-sender]: Connecting to node emulator...");
    const connectionPromise = new import_deferred_promise3.DeferredPromise();
    if (!this.url) {
      connectionPromise.reject(
        new Error("Nodebox URL is missing. Did you forget to provide it when creating this Nodebox instance?")
      );
    }
    invariant(
      iframe.contentWindow,
      "Failed to create a MessageChannel with the Nodebox iframe: no content window found"
    );
    this.channel = new MessageSender(iframe.contentWindow);
    const frameLoadPromise = new import_deferred_promise3.DeferredPromise();
    iframe.setAttribute("src", this.url);
    iframe.addEventListener(
      "load",
      () => {
        frameLoadPromise.resolve();
      },
      { once: true }
    );
    iframe.addEventListener(
      "error",
      (event) => {
        frameLoadPromise.reject(event.error);
      },
      { once: true }
    );
    await frameLoadPromise;
    debug2("[message-sender]: IFrame loaded...");
    await this.channel.handshake();
    debug2("[message-sender]: Handshake completed...");
    this.channel.send("connect", {
      cdnUrl
    });
    this.channel.on("runtime/ready", () => {
      connectionPromise.resolve();
    });
    return connectionPromise.then(() => {
      debug2("[message-sender]: Connected to runtime...");
      this.isConnected = true;
    });
  }
  get fs() {
    invariant(
      this.isConnected,
      'Failed to access the File System API: consumer is not connected. Did you forget to run "connect()"?'
    );
    if (this.fileSystemApi) {
      return this.fileSystemApi;
    }
    this.fileSystemApi = new FileSystemApi(this.channel);
    return this.fileSystemApi;
  }
  get shell() {
    invariant(
      this.isConnected,
      'Failed to access the Shell API: consumer is not connected. Did you forget to run "connect()"?'
    );
    if (this.shellApi) {
      return this.shellApi;
    }
    this.shellApi = new ShellApi(this.channel);
    return this.shellApi;
  }
  get preview() {
    invariant(
      this.isConnected,
      'Failed to access the Preview API: consumer is not connected. Did you forget to run "connect()"?'
    );
    if (this.previewApi) {
      return this.previewApi;
    }
    this.previewApi = new PreviewApi(this.channel);
    return this.previewApi;
  }
};
var INJECT_MESSAGE_TYPE = "INJECT_AND_INVOKE";
var PREVIEW_LOADED_MESSAGE_TYPE = "PREVIEW_LOADED";

// ../../node_modules/.pnpm/@codesandbox+sandpack-client@2.9.0/node_modules/@codesandbox/sandpack-client/dist/clients/node/index.mjs
function loadPreviewIframe(iframe, url) {
  return __awaiter(this, void 0, void 0, function() {
    var contentWindow, TIME_OUT, MAX_MANY_TIRES, tries, timeout;
    return __generator(this, function(_a) {
      contentWindow = iframe.contentWindow;
      nullthrows(contentWindow, "Failed to await preview iframe: no content window found");
      TIME_OUT = 9e4;
      MAX_MANY_TIRES = 20;
      tries = 0;
      return [2, new Promise(function(resolve, reject) {
        var triesToSetUrl = function() {
          var onLoadPage = function() {
            clearTimeout(timeout);
            tries = MAX_MANY_TIRES;
            resolve();
            iframe.removeEventListener("load", onLoadPage);
          };
          if (tries >= MAX_MANY_TIRES) {
            reject(createError("Could not able to connect to preview."));
            return;
          }
          iframe.setAttribute("src", url);
          timeout = setTimeout(function() {
            triesToSetUrl();
            iframe.removeEventListener("load", onLoadPage);
          }, TIME_OUT);
          tries = tries + 1;
          iframe.addEventListener("load", onLoadPage);
        };
        iframe.addEventListener("error", function() {
          return reject(new Error("Iframe error"));
        });
        iframe.addEventListener("abort", function() {
          return reject(new Error("Aborted"));
        });
        triesToSetUrl();
      })];
    });
  });
}
var setPreviewIframeProperties = function(iframe, options) {
  iframe.style.border = "0";
  iframe.style.width = options.width || "100%";
  iframe.style.height = options.height || "100%";
  iframe.style.overflow = "hidden";
  iframe.allow = "cross-origin-isolated";
};
function setupHistoryListeners(_a) {
  var scope = _a.scope;
  var origHistoryProto = window.history.__proto__;
  var historyList = [];
  var historyPosition = 0;
  var dispatchMessage = function(url) {
    parent.postMessage({
      type: "urlchange",
      url,
      back: historyPosition > 0,
      forward: historyPosition < historyList.length - 1,
      channelId: scope.channelId
    }, "*");
  };
  function pushHistory(url, state) {
    historyList.splice(historyPosition + 1);
    historyList.push({ url, state });
    historyPosition = historyList.length - 1;
  }
  Object.assign(window.history, {
    go: function(delta) {
      var newPos = historyPosition + delta;
      if (newPos >= 0 && newPos <= historyList.length - 1) {
        historyPosition = newPos;
        var _a2 = historyList[historyPosition], url = _a2.url, state = _a2.state;
        origHistoryProto.replaceState.call(window.history, state, "", url);
        var newURL = document.location.href;
        dispatchMessage(newURL);
        window.dispatchEvent(new PopStateEvent("popstate", { state }));
      }
    },
    back: function() {
      window.history.go(-1);
    },
    forward: function() {
      window.history.go(1);
    },
    pushState: function(state, title, url) {
      origHistoryProto.replaceState.call(window.history, state, title, url);
      pushHistory(url, state);
      dispatchMessage(document.location.href);
    },
    replaceState: function(state, title, url) {
      origHistoryProto.replaceState.call(window.history, state, title, url);
      historyList[historyPosition] = { state, url };
      dispatchMessage(document.location.href);
    }
  });
  function handleMessage(_a2) {
    var data = _a2.data;
    if (data.type === "urlback") {
      history.back();
    } else if (data.type === "urlforward") {
      history.forward();
    } else if (data.type === "refresh") {
      document.location.reload();
    }
  }
  window.addEventListener("message", handleMessage);
}
var scripts = [
  { code: setupHistoryListeners.toString(), id: "historyListener" },
  {
    code: "function consoleHook({ scope }) {" + consoleHook + "\n};",
    id: "consoleHook"
  }
];
var injectScriptToIframe = function(iframe, channelId) {
  scripts.forEach(function(_a) {
    var _b;
    var code = _a.code, id = _a.id;
    var message = {
      uid: id,
      type: INJECT_MESSAGE_TYPE,
      code: "exports.activate = " + code,
      scope: { channelId }
    };
    (_b = iframe.contentWindow) === null || _b === void 0 ? void 0 : _b.postMessage(message, "*");
  });
};
var SandpackNode = (
  /** @class */
  function(_super) {
    __extends(SandpackNode2, _super);
    function SandpackNode2(selector, sandboxInfo, options) {
      if (options === void 0) {
        options = {};
      }
      var _this = _super.call(this, selector, sandboxInfo, __assign(__assign({}, options), { bundlerURL: options.bundlerURL })) || this;
      _this._modulesCache = /* @__PURE__ */ new Map();
      _this.messageChannelId = generateRandomId();
      _this._initPromise = null;
      _this.emitter = new EventEmitter();
      _this.manageIframes(selector);
      _this.emulator = new Nodebox({
        iframe: _this.emulatorIframe,
        runtimeUrl: _this.options.bundlerURL
      });
      _this.updateSandbox(sandboxInfo);
      return _this;
    }
    SandpackNode2.prototype._init = function(files) {
      return __awaiter(this, void 0, void 0, function() {
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              return [4, this.emulator.connect()];
            case 1:
              _a.sent();
              return [4, this.emulator.fs.init(files)];
            case 2:
              _a.sent();
              return [4, this.globalListeners()];
            case 3:
              _a.sent();
              return [
                2
                /*return*/
              ];
          }
        });
      });
    };
    SandpackNode2.prototype.compile = function(files) {
      return __awaiter(this, void 0, void 0, function() {
        var shellId, err_1;
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 5, , 6]);
              this.status = "initializing";
              this.dispatch({ type: "start", firstLoad: true });
              if (!this._initPromise) {
                this._initPromise = this._init(files);
              }
              return [4, this._initPromise];
            case 1:
              _a.sent();
              this.dispatch({ type: "connected" });
              return [4, this.createShellProcessFromTask(files)];
            case 2:
              shellId = _a.sent().id;
              return [4, this.createPreviewURLFromId(shellId)];
            case 3:
              _a.sent();
              return [4, this.setLocationURLIntoIFrame()];
            case 4:
              _a.sent();
              this.dispatchDoneMessage();
              return [3, 6];
            case 5:
              err_1 = _a.sent();
              this.dispatch({
                type: "action",
                action: "notification",
                notificationType: "error",
                title: getMessageFromError(err_1)
              });
              this.dispatch({ type: "done", compilatonError: true });
              return [3, 6];
            case 6:
              return [
                2
                /*return*/
              ];
          }
        });
      });
    };
    SandpackNode2.prototype.createShellProcessFromTask = function(files) {
      return __awaiter(this, void 0, void 0, function() {
        var packageJsonContent;
        var _a;
        var _this = this;
        return __generator(this, function(_b) {
          switch (_b.label) {
            case 0:
              packageJsonContent = readBuffer(files["/package.json"]);
              this.emulatorCommand = findStartScriptPackageJson(packageJsonContent);
              this.emulatorShellProcess = this.emulator.shell.create();
              return [4, this.emulatorShellProcess.on("exit", function(exitCode) {
                _this.dispatch({
                  type: "action",
                  action: "notification",
                  notificationType: "error",
                  title: createError("Error: process.exit(" + exitCode + ") called.")
                });
              })];
            case 1:
              _b.sent();
              return [4, this.emulatorShellProcess.on("progress", function(data) {
                var _a2, _b2;
                if (data.state === "command_running" || data.state === "starting_command") {
                  _this.dispatch({
                    type: "shell/progress",
                    data: __assign(__assign({}, data), { command: [
                      (_a2 = _this.emulatorCommand) === null || _a2 === void 0 ? void 0 : _a2[0],
                      (_b2 = _this.emulatorCommand) === null || _b2 === void 0 ? void 0 : _b2[1].join(" ")
                    ].join(" ") })
                  });
                  _this.status = "installing-dependencies";
                  return;
                }
                _this.dispatch({ type: "shell/progress", data });
              })];
            case 2:
              _b.sent();
              this.emulatorShellProcess.stdout.on("data", function(data) {
                _this.dispatch({ type: "stdout", payload: { data, type: "out" } });
              });
              this.emulatorShellProcess.stderr.on("data", function(data) {
                _this.dispatch({ type: "stdout", payload: { data, type: "err" } });
              });
              return [4, (_a = this.emulatorShellProcess).runCommand.apply(_a, this.emulatorCommand)];
            case 3:
              return [2, _b.sent()];
          }
        });
      });
    };
    SandpackNode2.prototype.createPreviewURLFromId = function(id) {
      var _a;
      return __awaiter(this, void 0, void 0, function() {
        var url;
        return __generator(this, function(_b) {
          switch (_b.label) {
            case 0:
              this.iframePreviewUrl = void 0;
              return [4, this.emulator.preview.getByShellId(id)];
            case 1:
              url = _b.sent().url;
              this.iframePreviewUrl = (_a = url + this.options.startRoute) !== null && _a !== void 0 ? _a : "";
              return [
                2
                /*return*/
              ];
          }
        });
      });
    };
    SandpackNode2.prototype.manageIframes = function(selector) {
      var _a;
      if (typeof selector === "string") {
        var element = document.querySelector(selector);
        nullthrows(element, "The element '" + selector + "' was not found");
        this.iframe = document.createElement("iframe");
      } else {
        this.iframe = selector;
      }
      setPreviewIframeProperties(this.iframe, this.options);
      nullthrows(this.iframe.parentNode, "The given iframe does not have a parent.");
      this.emulatorIframe = document.createElement("iframe");
      this.emulatorIframe.classList.add("sp-bridge-frame");
      (_a = this.iframe.parentNode) === null || _a === void 0 ? void 0 : _a.appendChild(this.emulatorIframe);
    };
    SandpackNode2.prototype.setLocationURLIntoIFrame = function() {
      return __awaiter(this, void 0, void 0, function() {
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              if (!this.iframePreviewUrl)
                return [3, 2];
              return [4, loadPreviewIframe(this.iframe, this.iframePreviewUrl)];
            case 1:
              _a.sent();
              _a.label = 2;
            case 2:
              return [
                2
                /*return*/
              ];
          }
        });
      });
    };
    SandpackNode2.prototype.dispatchDoneMessage = function() {
      this.status = "done";
      this.dispatch({ type: "done", compilatonError: false });
      if (this.iframePreviewUrl) {
        this.dispatch({
          type: "urlchange",
          url: this.iframePreviewUrl,
          back: false,
          forward: false
        });
      }
    };
    SandpackNode2.prototype.globalListeners = function() {
      return __awaiter(this, void 0, void 0, function() {
        var _this = this;
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              window.addEventListener("message", function(event) {
                if (event.data.type === PREVIEW_LOADED_MESSAGE_TYPE) {
                  injectScriptToIframe(_this.iframe, _this.messageChannelId);
                }
                if (event.data.type === "urlchange" && event.data.channelId === _this.messageChannelId) {
                  _this.dispatch({
                    type: "urlchange",
                    url: event.data.url,
                    back: event.data.back,
                    forward: event.data.forward
                  });
                } else if (event.data.channelId === _this.messageChannelId) {
                  _this.dispatch(event.data);
                }
              });
              return [4, this.emulator.fs.watch(["*"], [
                ".next",
                "node_modules",
                "build",
                "dist",
                "vendor",
                ".config",
                ".vuepress"
              ], function(message) {
                return __awaiter(_this, void 0, void 0, function() {
                  var event, path, type, _a2, content, newContent, err_2;
                  return __generator(this, function(_b) {
                    switch (_b.label) {
                      case 0:
                        if (!message)
                          return [
                            2
                            /*return*/
                          ];
                        event = message;
                        path = "newPath" in event ? event.newPath : "path" in event ? event.path : "";
                        return [4, this.emulator.fs.stat(path)];
                      case 1:
                        type = _b.sent().type;
                        if (type !== "file")
                          return [2, null];
                        _b.label = 2;
                      case 2:
                        _b.trys.push([2, 10, , 11]);
                        _a2 = event.type;
                        switch (_a2) {
                          case "change":
                            return [3, 3];
                          case "create":
                            return [3, 3];
                          case "remove":
                            return [3, 5];
                          case "rename":
                            return [3, 6];
                          case "close":
                            return [3, 8];
                        }
                        return [3, 9];
                      case 3:
                        return [4, this.emulator.fs.readFile(event.path, "utf8")];
                      case 4:
                        content = _b.sent();
                        this.dispatch({
                          type: "fs/change",
                          path: event.path,
                          content
                        });
                        this._modulesCache.set(event.path, writeBuffer(content));
                        return [3, 9];
                      case 5:
                        this.dispatch({
                          type: "fs/remove",
                          path: event.path
                        });
                        this._modulesCache["delete"](event.path);
                        return [3, 9];
                      case 6:
                        this.dispatch({
                          type: "fs/remove",
                          path: event.oldPath
                        });
                        this._modulesCache["delete"](event.oldPath);
                        return [4, this.emulator.fs.readFile(event.newPath, "utf8")];
                      case 7:
                        newContent = _b.sent();
                        this.dispatch({
                          type: "fs/change",
                          path: event.newPath,
                          content: newContent
                        });
                        this._modulesCache.set(event.newPath, writeBuffer(newContent));
                        return [3, 9];
                      case 8:
                        return [3, 9];
                      case 9:
                        return [3, 11];
                      case 10:
                        err_2 = _b.sent();
                        this.dispatch({
                          type: "action",
                          action: "notification",
                          notificationType: "error",
                          title: getMessageFromError(err_2)
                        });
                        return [3, 11];
                      case 11:
                        return [
                          2
                          /*return*/
                        ];
                    }
                  });
                });
              })];
            case 1:
              _a.sent();
              return [
                2
                /*return*/
              ];
          }
        });
      });
    };
    SandpackNode2.prototype.restartShellProcess = function() {
      var _a;
      return __awaiter(this, void 0, void 0, function() {
        return __generator(this, function(_b) {
          switch (_b.label) {
            case 0:
              if (!(this.emulatorShellProcess && this.emulatorCommand))
                return [3, 3];
              this.dispatch({ type: "start", firstLoad: true });
              this.status = "initializing";
              return [4, this.emulatorShellProcess.kill()];
            case 1:
              _b.sent();
              (_a = this.iframe) === null || _a === void 0 ? void 0 : _a.removeAttribute("attr");
              this.emulator.fs.rm("/node_modules/.vite", {
                recursive: true,
                force: true
              });
              return [4, this.compile(Object.fromEntries(this._modulesCache))];
            case 2:
              _b.sent();
              _b.label = 3;
            case 3:
              return [
                2
                /*return*/
              ];
          }
        });
      });
    };
    SandpackNode2.prototype.updateSandbox = function(setup) {
      var _this = this;
      var _a;
      var modules = fromBundlerFilesToFS(setup.files);
      if (((_a = this.emulatorShellProcess) === null || _a === void 0 ? void 0 : _a.state) === "running") {
        Object.entries(modules).forEach(function(_a2) {
          var key = _a2[0], value = _a2[1];
          if (!_this._modulesCache.get(key) || readBuffer(value) !== readBuffer(_this._modulesCache.get(key))) {
            _this.emulator.fs.writeFile(key, value, { recursive: true });
          }
        });
        return;
      }
      this.dispatch({
        codesandbox: true,
        modules,
        template: setup.template,
        type: "compile"
      });
      Object.entries(modules).forEach(function(_a2) {
        var key = _a2[0], value = _a2[1];
        _this._modulesCache.set(key, writeBuffer(value));
      });
    };
    SandpackNode2.prototype.dispatch = function(message) {
      var _a, _b;
      return __awaiter(this, void 0, void 0, function() {
        var _c;
        return __generator(this, function(_d) {
          switch (_d.label) {
            case 0:
              _c = message.type;
              switch (_c) {
                case "compile":
                  return [3, 1];
                case "refresh":
                  return [3, 2];
                case "urlback":
                  return [3, 4];
                case "urlforward":
                  return [3, 4];
                case "shell/restart":
                  return [3, 5];
                case "shell/openPreview":
                  return [3, 6];
              }
              return [3, 7];
            case 1:
              this.compile(message.modules);
              return [3, 8];
            case 2:
              return [4, this.setLocationURLIntoIFrame()];
            case 3:
              _d.sent();
              return [3, 8];
            case 4:
              (_b = (_a = this.iframe) === null || _a === void 0 ? void 0 : _a.contentWindow) === null || _b === void 0 ? void 0 : _b.postMessage(message, "*");
              return [3, 8];
            case 5:
              this.restartShellProcess();
              return [3, 8];
            case 6:
              window.open(this.iframePreviewUrl, "_blank");
              return [3, 8];
            case 7:
              this.emitter.dispatch(message);
              _d.label = 8;
            case 8:
              return [
                2
                /*return*/
              ];
          }
        });
      });
    };
    SandpackNode2.prototype.listen = function(listener) {
      return this.emitter.listener(listener);
    };
    SandpackNode2.prototype.destroy = function() {
      this.emulatorIframe.remove();
      this.emitter.cleanup();
    };
    return SandpackNode2;
  }(SandpackClient)
);
export {
  SandpackNode
};
//# sourceMappingURL=node-6JIWURW2.js.map
