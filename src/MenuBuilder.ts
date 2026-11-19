// @ts-nocheck
type U = {};

type MenuBuilderConfig = {

};

class MenuBuilder<F> {
    private data: F[];

    constructor(e: HTMLElement, data: any, config?: Partial<MenuBuilderConfig>) {
        if (Array.isArray(data)) {
            this.data = data;
        } else {
            this.data = [data];
        }
    }

    private static asArray<I, P>(o: I[] | any, cb: (entries: I) => P): P[] | any {
        if (Array.isArray(o)) {
            const res: P[] = [];
            for (const i of o) {
                res.push(cb(i));
            }
            return res;
        } else {
            return o;
        }
    }
    private static asEntries<E, P, O extends any>(o: { [key: string | number]: E } | O, cb: (key: string | number, value: E) => P): P[] | O {
        if (Array.isArray(o))
            return o;
        if (typeof o === 'object') {
            const res: P[] = [];
            for (const key in o) {
                res.push(cb(key, o[key]));
            }
            return res;
        }
        return o;
    }
    public each<R>(cb: (e: F) => R): MenuBuilder<R> {
        this.data

        return this as unknown as MenuBuilder<R>;
    }
    // public reduce<L>(cb: (p: L, c: L) => L): MenuBuilder<L>;
    // public reduce<L>(cb: (p: L, c: F) => L, start: L): MenuBuilder<L>;
    public reduce<L>(cb: (p: L, c: F) => L, start: L|undefined): MenuBuilder<L> {
        const r = this as unknown as MenuBuilder<L>;
        if (start == undefined){
            r.data = [this.data.reduce(cb)];
        } else {
            r.data = [this.data.reduce(cb, start)];
        }
        return r;
    }

    public group<R extends string | number, F>(cb: (e: F) => R): MenuBuilder<{ [key: R]: F }> {
        MenuBuilder.asArray(MenuBuilder.asEntries(this.data, cb), cb);
        this.data = cb(this.data);
        return this;
    }

    public filter<R>(cb: (e: F) => boolean): MenuBuilder<F> {
        MenuBuilder.asArray(this.data,)
        return this;
    }

}
namespace MenuBuilder {
    export class Ref<T> {
        element: HTMLElement | undefined;
        private value: T;
        onchange: undefined | ((newValue: typeof this.value) => void) = undefined;

        constructor(initialState: T, linkedElement: typeof this.element) {
            this.value = initialState;
            if (linkedElement != undefined) {
                this.element = linkedElement;
            }
        }

        public listen(changeListener: typeof this.onchange): typeof this {
            this.onchange = changeListener;
            return this;
        }

        public set(value: T): void {
            if (this.onchange != undefined) {
                this.onchange(value);
            }
            this.value = value;
        }

        public get(): T {
            return this.value;
        }
    }

    export namespace ChainElements {
        export class Group { }
        export class Range { }
        export class Filter { }
        export class Sort { }
        // export class 
    }

    // export function chain():{[Key in ChainElements]:(Key)}

    // export function Chain():{[Key in keyof ChainElements as `${Lowercase<Key>}`]:(ChainElements[Key]["constructor"])} {}

    export class Chain {
        constructor() {
            for (const e in MenuBuilder.ChainElements) {
                // this.
            }
        }
    }

}

export default MenuBuilder;
(globalThis as any).MenuBuilder = MenuBuilder;
// undeclared API!
