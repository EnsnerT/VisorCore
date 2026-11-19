/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	const __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	// define getter/value functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop));
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ 	
/************************************************************************/
let __webpack_exports__ = {};
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/// <reference no-default-lib="true" />
/// <reference lib="es2024.promise" />
/// <reference lib="webworker" />
// ts: target: ES5, JSX:none, Module: ES2020, declaration
// node "C:\Users\Thomas\AppData\Roaming\npm\tsc" workerAPI.ts -d -m commonjs --lib webworker
class WorkerAPI {
    constructor(worker, messageAPI) {
        this.callbacks = {};
        this.workerSupplier = worker;
        this.messageAPIRef = messageAPI;
        this.id = Date.now();
        this.uuid = crypto.randomUUID();
    }
    /**
     * start
     */
    start() {
        this.workerSupplier.addEventListener("message", this.handleEvent.bind(this));
        return this;
    }
    handleEvent(event) {
        let data;
        if ("data" in event) {
            if (typeof event.data === "string") {
                try {
                    data = JSON.parse(event.data);
                }
                catch (e) {
                }
            }
            else {
                data = event.data;
            }
        }
        if (typeof data === "object" && "type" in data) {
            let packet = data;
            if (packet.type === "response") {
                let target = packet.id;
                if (target in this.callbacks) {
                    this.callbacks[target].resolver(packet.value);
                }
                return;
            }
            if (typeof this.messageAPIRef !== "undefined") {
                if (packet.type === "call") {
                    let target = packet.id;
                    let method = packet.name;
                    let args = packet.arguments;
                    if (typeof method === "string" && method in this.messageAPIRef && typeof this.messageAPIRef[method] === "function") {
                        let value = this.messageAPIRef[method](...args);
                        let source = "source" in event ? event.source : this.workerSupplier;
                        if (source == undefined) {
                            source = this.workerSupplier;
                        }
                        if (value == undefined)
                            value = 0;
                        var outMessage = { "type": "response", "id": target, "value": value };
                        try {
                            if ("port" in source)
                                source.port.postMessage(outMessage);
                            else {
                                source.postMessage(outMessage);
                            }
                        }
                        catch (e) {
                            console.error(e, value, target);
                            throw e;
                        }
                        return;
                    }
                    else {
                        console.warn("can not find " + method + " in " + this.messageAPIRef);
                    }
                }
            }
        }
    }
    call(method, ...args) {
        const ID = this.uuid + (++this.id);
        if (this.workerSupplier === undefined) {
            return function () { return Promise.reject("No worker found"); };
        }
        const _this = this;
        return function (tr) {
            const creator = Promise.withResolvers();
            const callback = creator.promise;
            const resolve = function (value) {
                creator.resolve(value);
                delete _this.callbacks[ID];
            };
            _this.callbacks[ID] = {
                "id": ID,
                "resolver": resolve,
                "callback": callback
            };
            const message = { "type": "call", "id": ID, "name": method, "arguments": args };
            if ("port" in _this.workerSupplier)
                _this.workerSupplier.port.postMessage(message, { transfer: tr });
            else
                _this.workerSupplier.postMessage(message, { transfer: tr });
            console.log("Request Sent:" + message);
            return callback;
        };
    }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (WorkerAPI);
globalThis.WorkerAPI = WorkerAPI;

/******/ })()
;