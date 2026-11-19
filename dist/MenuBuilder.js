/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

class MenuBuilder {
    constructor(e, data, config) {
        if (Array.isArray(data)) {
            this.data = data;
        }
        else {
            this.data = [data];
        }
    }
    static asArray(o, cb) {
        if (Array.isArray(o)) {
            const res = [];
            for (const i of o) {
                res.push(cb(i));
            }
            return res;
        }
        else {
            return o;
        }
    }
    static asEntries(o, cb) {
        if (Array.isArray(o))
            return o;
        if (typeof o === 'object') {
            const res = [];
            for (const key in o) {
                res.push(cb(key, o[key]));
            }
            return res;
        }
        return o;
    }
    each(cb) {
        this.data;
        return this;
    }
    // public reduce<L>(cb: (p: L, c: L) => L): MenuBuilder<L>;
    // public reduce<L>(cb: (p: L, c: F) => L, start: L): MenuBuilder<L>;
    reduce(cb, start) {
        const r = this;
        if (start == undefined) {
            r.data = [this.data.reduce(cb)];
        }
        else {
            r.data = [this.data.reduce(cb, start)];
        }
        return r;
    }
    group(cb) {
        MenuBuilder.asArray(MenuBuilder.asEntries(this.data, cb), cb);
        this.data = cb(this.data);
        return this;
    }
    filter(cb) {
        MenuBuilder.asArray(this.data);
        return this;
    }
}
(function (MenuBuilder) {
    class Ref {
        constructor(initialState, linkedElement) {
            this.onchange = undefined;
            this.value = initialState;
            if (linkedElement != undefined) {
                this.element = linkedElement;
            }
        }
        listen(changeListener) {
            this.onchange = changeListener;
            return this;
        }
        set(value) {
            if (this.onchange != undefined) {
                this.onchange(value);
            }
            this.value = value;
        }
        get() {
            return this.value;
        }
    }
    MenuBuilder.Ref = Ref;
    let ChainElements;
    (function (ChainElements) {
        class Group {
        }
        ChainElements.Group = Group;
        class Range {
        }
        ChainElements.Range = Range;
        class Filter {
        }
        ChainElements.Filter = Filter;
        class Sort {
        }
        ChainElements.Sort = Sort;
        // export class 
    })(ChainElements = MenuBuilder.ChainElements || (MenuBuilder.ChainElements = {}));
    // export function chain():{[Key in ChainElements]:(Key)}
    // export function Chain():{[Key in keyof ChainElements as `${Lowercase<Key>}`]:(ChainElements[Key]["constructor"])} {}
    class Chain {
        constructor() {
            for (const e in MenuBuilder.ChainElements) {
                // this.
            }
        }
    }
    MenuBuilder.Chain = Chain;
})(MenuBuilder || (MenuBuilder = {}));
globalThis.MenuBuilder = MenuBuilder;

/******/ })()
;