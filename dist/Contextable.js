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
function check(ctx, args) {
    if (typeof ctx === 'function')
        return ctx(args);
    else
        return ctx.test(args);
}
class StateChangeListeners {
    constructor(initial_value) {
        this.listeners = {};
        this.value = initial_value;
    }
    static getNextUID() {
        return ++StateChangeListeners.uid;
    }
    listen(listener) {
        const nextUID = StateChangeListeners.getNextUID();
        this.listeners[nextUID] = listener;
        return nextUID;
    }
    change(new_value) {
        const oldValue = this.value;
        this.value = new_value;
        const removals = [];
        for (const key in this.listeners) {
            this.listeners[key](this.value, function () { removals.push(key); });
        }
        for (const key in removals) {
            delete this.listeners[key];
        }
        return oldValue;
    }
}
StateChangeListeners.uid = 1;
class RadioDecision {
    constructor(initial_state) {
        this.state = "";
        if (typeof initial_state === "string") {
            this.state = initial_state;
        }
    }
    create(expected_state) {
        const self = this;
        return {
            test() {
                return self.state === expected_state;
            }
        };
    }
    setState(next_state) {
        this.state = next_state;
    }
}
class LatchedDecision {
    constructor(initial_state) {
        this.state = initial_state;
    }
    on() {
        this.state = true;
    }
    off() {
        this.state = false;
    }
    test() {
        return this.state;
    }
}
class CachedDecision {
    constructor(child) {
        this.child = child;
    }
    refresh() {
        this.last_state = check(this.child, this.cached_args);
    }
    test(args) {
        if (this.last_state == undefined || this.cached_args !== args) {
            this.last_state = check(this.child, args);
            this.cached_args = args;
        }
        return this.last_state;
    }
}
class Contextable {
    static test(id, args) {
        // Check if the context ID is registered and return its state
        const context = this._contexts.get(id);
        return context ? check(context, args) : false;
    }
    static resetRegister() {
        this._contexts.clear();
    }
    static registerContext(id, decider) {
        this._contexts.set(id, decider);
    }
    static parseExpression(expression) {
        return Contextable.ContextExpression.parse(expression);
    }
}
// private 
Contextable._contexts = new Map();
(function (Contextable) {
    class ContextExpression {
        constructor(type, expressions) {
            /**
             * Depending on <code>this.type</code>, each <code>this.childs</code> is describing the handling.
             */
            this.type = "or";
            /**
             * type <code>string</code>, if starting with <literal>'</literal> then the string is a literal type, otherwise the type is context; contexts can be evaluated using <code>Contextable.test(contextId)</code>
             * otherwise it can only be type <code>ContextExpression</code>.
             */
            this.childs = [];
            this.type = type;
            if (Array.isArray(expressions))
                this.childs = expressions;
            else
                this.childs = [expressions];
        }
        evaluate() {
            // @AI: sample implementation
            for (const instance of this.childs) {
                if (typeof instance === 'string') {
                    const contextValue = Contextable.test(instance);
                    if (typeof contextValue === 'boolean') {
                        return contextValue;
                    }
                }
            }
        }
        /**
         * Parses logical expressions into ContextExpression objects.
         * Supports '&&', '||', '!' operators and context comparisons (e.g., <code>context1 == 'amp'</code>).
         * Builds an expression tree for evaluation.
         * Example: 'context1 && context2 || !context3' builds to ContextExpression
         */
        static parse(expression) {
            let index = 0;
            const result = this.parseOr(expression, index);
            // Check if the entire expression was consumed
            if (result.index < expression.length) {
                console.debug(result.expression);
                throw new Error('Unexpected characters at the end of the expression, index:' + result.index + ', length:' + expression.length);
            }
            return result.expression;
        }
        static parseOr(expression, index) {
            let left = this.parseAnd(expression, index);
            index = left.index;
            while (index + 1 < expression.length && expression[index] === '|' && expression[index + 1] === '|') {
                index += 2;
                // Skip whitespace
                while (index < expression.length && expression[index] === ' ') {
                    index++;
                }
                const right = this.parseAnd(expression, index);
                index = right.index;
                left.expression = new ContextExpression('or', [left.expression, right.expression]);
            }
            return { expression: left.expression, index: index };
        }
        static parseAnd(expression, index) {
            let left = this.parsePrimary(expression, index);
            index = left.index;
            while (index + 1 < expression.length && expression[index] === '&' && expression[index + 1] === '&') {
                index += 2;
                // Skip whitespace
                while (index < expression.length && expression[index] === ' ') {
                    index++;
                }
                const right = this.parsePrimary(expression, index);
                index = right.index;
                left.expression = new ContextExpression('and', [left.expression, right.expression]);
            }
            return { expression: left.expression, index: index };
        }
        static parsePrimary(expression, index) {
            // Skip whitespace
            while (index < expression.length && expression[index] === ' ') {
                index++;
            }
            if (index < expression.length && expression[index] === '(') {
                index++;
                const result = this.parseOr(expression, index);
                index = result.index;
                // Skip whitespace
                while (index < expression.length && expression[index] === ' ') {
                    index++;
                }
                if (index < expression.length && expression[index] === ')') {
                    index++;
                }
                else {
                    throw new Error('Expected closing parenthesis');
                }
                return { expression: result.expression, index };
            }
            else if (index < expression.length && this.isIdentifierChar(expression[index])) {
                const identifier = this.parseIdentifier(expression, index);
                return { expression: new ContextExpression('literal', identifier.content), index: identifier.index };
            }
            else {
                throw new Error('Unexpected character');
            }
        }
        static parseIdentifier(expression, index) {
            let identifier = '';
            while (index < expression.length && this.isIdentifierChar(expression[index])) {
                identifier += expression[index];
                index++;
            }
            return { content: identifier, index: index + 1 };
        }
        static isIdentifierChar(char) {
            return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_';
        }
    }
    Contextable.ContextExpression = ContextExpression;
})(Contextable || (Contextable = {}));
// what must the API support?
// - context type : hover & focus on elements/regions/selectors ; example : hover on HTMLCanvasElement or focus in "body div:has(>textarea)"
// - context type : environment ; example : only if checkbox "X" is enabled or settings (later) is above 5
// how would a Context be defined?
// - Every context has a unique ID (string) which can be tested from global or (itself) a context. ; example : keyboard shortcut "[shift]+[alt]+v" only give "test() == true" if a textarea is selected (example id: "inTextarea"). 
// how can a context be updated?
// - settings (future implementation): a "CachedDecision" is beeing fed by the value and "refresh" is called from settings manipulation.
// - focus / hover / click and other events : either a LatchedDescition or a 
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Contextable);
globalThis.Contextable = Contextable;

/******/ })()
;