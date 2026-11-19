type U = {};
type MenuBuilderConfig = {};
declare class MenuBuilder<F> {
    private data;
    constructor(e: HTMLElement, data: any, config?: Partial<MenuBuilderConfig>);
    private static asArray;
    private static asEntries;
    each<R>(cb: (e: F) => R): MenuBuilder<R>;
    reduce<L>(cb: (p: L, c: F) => L, start: L | undefined): MenuBuilder<L>;
    group<R extends string | number, F>(cb: (e: F) => R): MenuBuilder<{
        [key: R]: F;
    }>;
    filter<R>(cb: (e: F) => boolean): MenuBuilder<F>;
}
declare namespace MenuBuilder {
    class Ref<T> {
        element: HTMLElement | undefined;
        private value;
        onchange: undefined | ((newValue: typeof this.value) => void);
        constructor(initialState: T, linkedElement: typeof this.element);
        listen(changeListener: typeof this.onchange): typeof this;
        set(value: T): void;
        get(): T;
    }
    namespace ChainElements {
        class Group {
        }
        class Range {
        }
        class Filter {
        }
        class Sort {
        }
    }
    class Chain {
        constructor();
    }
}
