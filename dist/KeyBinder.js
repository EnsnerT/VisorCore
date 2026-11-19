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
class KeyBinder {
    // private static _
    static bindAction(actionId, callback) {
    }
    static dispatchAction(actionId, actionData, eventObject) {
    }
    /**
     * Construct the default KeyBinder handle.
     * @param target the target to apply default handle events
     * @param config defined configuration
     */
    static construct(target, config) {
        const interestedModifierKeys = ["Alt", "AltGraph", "Control", "Meta", "Shift"];
        target.addEventListener('keydown', function (event) {
            const kbevent = event;
            const modifier = { code: kbevent.code, key: kbevent.key, alt: kbevent.altKey, meta: kbevent.metaKey, ctrl: kbevent.ctrlKey, shift: kbevent.shiftKey, location: kbevent.location };
            let modif = {};
            for (const mod of interestedModifierKeys) {
                modif[mod] = kbevent.getModifierState(mod);
            }
            console.log(modifier, kbevent, modif);
        }, { capture: true });
    }
    /**
     * Browser Events will be dispatched here.
     * e.g. keydown event with alt and
     */
    static event(eventName, eventObject, additionalContext) {
    }
}
(function (KeyBinder) {
    class Translator {
        constructor() {
            this._globalDecidors = new Map();
            this._eventDecidors = new Map();
            this._idToEventMap = new Map();
        }
        // private static () { }
        static addGlobal(uniqueCustomId, handler) {
            // todo ; add 
        }
        static removeGlobal() { }
        static removeAllGlobal() { }
        static addEvent() { }
        static modifyEvent() { }
        static removeEvent() { }
        static removeAllEvents() { }
        static addKey() { }
        static removeKey() { }
    }
    KeyBinder.Translator = Translator;
})(KeyBinder || (KeyBinder = {}));
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (KeyBinder);
globalThis.KeyBinder = KeyBinder;

/******/ })()
;