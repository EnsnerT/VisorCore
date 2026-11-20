class Contextable {

    static check(ctx: Contextable.ContextTester | Contextable.ContextDecider, args?: string): string | boolean {
        if (typeof ctx === 'function')
            return ctx(args);
        else
            return ctx.test(args);
    }

    // private 
    private static _contexts: Map<string, Contextable.ContextDecider | Contextable.ContextTester> = new Map();

    public static test(id: string, args?: string): boolean | string | number {
        // Check if the context ID is registered and return its state
        const context = this._contexts.get(id);
        return context ? Contextable.check(context, args) : false;
    }

    public static resetRegister() {
        this._contexts.clear();
    }

    public static unregisterContext(id: string): void {
        this._contexts.delete(id);
    }

    public static registerContext(id: string, decider: Contextable.ContextDecider | Contextable.ContextTester): void {
        this._contexts.set(id, decider);
    }

    public static parseExpression(expression: string): Contextable.ContextExpression {
        return Contextable.ContextExpression.parse(expression);
    }
}

namespace Contextable {
    export type ContextTester = (args?: string) => string | boolean;
    export interface ContextDecider {
        test(args?: string): string | boolean;
    }

    type ChangeListener<T> = (new_value: T, unhook: () => void) => void;

    export class StateChangeListeners<T> {
        private static uid: number = 1;
        private value: T;
        constructor(initial_value: T) {
            this.value = initial_value;
        }
        private listeners: { [key: number]: ChangeListener<T> } = {};
        private static getNextUID(): number {
            return ++StateChangeListeners.uid;
        }

        listen(listener: ChangeListener<T>): number;
        listen(listener: ChangeListener<T>, triggerInitial: boolean): number;
        listen(listener: ChangeListener<T>, triggerInitial?: boolean): number {
            var once = false;
            if (typeof triggerInitial === 'boolean' && triggerInitial) {
                listener(this.value, function () { once = true; });
            }
            if (once) {
                return -1;
            } else {
                const nextUID = StateChangeListeners.getNextUID();
                this.listeners[nextUID] = listener;
                return nextUID;
            }
        }

        change(new_value: T): T {
            const oldValue = this.value;
            this.value = new_value;
            const removals: string[] = [];
            for (const key in this.listeners) {
                this.listeners[key](this.value, function () { removals.push(key); })
            }
            for (const key in removals) {
                delete this.listeners[key];
            }
            return oldValue;
        }
    }

    export class RadioDecision {
        private state: string = "";

        constructor();
        constructor(initial_state: string);
        constructor(initial_state?: string) {
            if (typeof initial_state === "string") {
                this.state = initial_state;
            }
        }

        public create(expected_state: string): ContextDecider {
            const self = this;
            return {
                test(): boolean {
                    return self.state === expected_state;
                }
            }
        }

        public setState(next_state: string): void {
            this.state = next_state;
        }

    }

    export class LatchedDecision implements ContextDecider {
        private state: boolean;

        constructor(initial_state: boolean) {
            this.state = initial_state;
        }
        on(): void {
            this.state = true;
        }
        off(): void {
            this.state = false;
        }
        public test(): boolean {
            return this.state;
        }
    }

    export class CachedDecision implements ContextDecider {
        private child: ContextDecider | ContextTester;
        private last_state: string | boolean | undefined;
        private cached_args?: string;
        constructor(child: typeof this.child) {
            this.child = child;
        }

        refresh(): void {
            this.last_state = Contextable.check(this.child, this.cached_args);
        }

        test(args?: string): string | boolean {
            if (this.last_state == undefined || this.cached_args !== args) {
                this.last_state = Contextable.check(this.child, args);
                this.cached_args = args;
            }
            return this.last_state;
        }
    }

    export class ContextExpression {

        /**
         * Depending on <code>this.type</code>, each <code>this.childs</code> is describing the handling.
         */
        private type: "and" | "or" | "not" | "comparison" = "or";
        /**
         * type <code>string</code>, if starting with <literal>'</literal> then the string is a literal type, otherwise the type is context; contexts can be evaluated using <code>Contextable.test(contextId)</code>
         * otherwise it can only be type <code>ContextExpression</code>.
         */
        private childs: (ContextExpression | string)[] = [];

        constructor(type: typeof this.type, expressions: ContextExpression | string);
        constructor(type: typeof this.type, expressions: typeof this.childs);
        constructor(type: typeof this.type, expressions: (ContextExpression | string) | (ContextExpression | string)[]) {
            this.type = type;
            if (Array.isArray(expressions))
                this.childs = expressions;
            else
                this.childs = [expressions];
        }

        public inspect(): typeof this {
            console.log(this.asJson());
            return this;
        }

        public asJson(): string {
            const _childs = [];
            for (const _child of this.childs) {
                if (typeof _child === 'string') {
                    _childs.push(_child);
                } else {
                    _childs.push(_child.asJson());
                }
            }
            return 'CE{type:\'' + this.type + '\',childs:[' + _childs.join(',') + ']}';
        }

        public evaluate(): boolean {
            // @AI: this is just an Example implementation and can be enhanced later.
            if (this.type === 'and' || this.type === 'or') {
                var combination = [];
                for (const instance of this.childs) {
                    let value = false;
                    if (typeof instance === 'string') {
                        value = (!!Contextable.test(instance));
                    } else {
                        value = (instance.evaluate());
                    }
                    if (this.type === 'or' && !!value)
                        return true;
                    else if (this.type === 'and' && !value)
                        return false;
                }
            } else if (this.type === 'not') {
                if (this.childs.length !== 1) {
                    throw new Error("CE invalid Invert Structure!");
                }
                if (typeof this.childs[0] === 'string') {
                    return !Contextable.test(this.childs[0]);
                } else {
                    return !this.childs[0].evaluate();
                }
            } else if (this.type === 'comparison') {
                // here i expect exactly 3 or more childs
                if (this.childs.length == 1 && typeof this.childs[0] !== 'string') {
                    return this.childs[0].evaluate();
                }
                if (this.childs.length < 2) {
                    throw new Error('CE invalid Comparison Structure!');
                }
                var values = [];
                const comparisonType = this.childs[1];
                for (var i = 0; i < this.childs.length; i++) {
                    if (i == 1) { continue; }
                    const instance = this.childs[i];
                    if (typeof instance === 'string') {
                        if ((instance.startsWith('\'') && instance.endsWith('\'')) || (instance.startsWith('\"') && instance.endsWith('\"'))) {
                            values.push(instance.substring(1, instance.length - 1));
                        } else {
                            values.push(Contextable.test(instance));
                        }
                    } else {
                        values.push(instance.evaluate());
                    }
                }
                if (comparisonType === '==' || comparisonType === '===') {
                    // expectation : 3 values
                    if (values.length < 2)
                        throw new Error("CE invalid equals Comparison!");
                    // console.debug(values);
                    return values[0] == values[1];
                } else if (comparisonType === '!=' || comparisonType === '!==') {
                    // expectation : 3 values
                    if (values.length < 2)
                        throw new Error("CE invalid equals Comparison!");
                    // console.debug(values);
                    return values[0] != values[1];
                }
            }
            console.warn("Warning there was no option for evaluate in ContextExpression! Falling back to 'false' to prevent issues.")
            return false; // fallback
        }

        /**
         * Parses logical expressions into ContextExpression objects.
         * Supports '&&', '||', '!' operators and context comparisons (e.g., <code>context1 == 'amp'</code>).
         * Builds an expression tree for evaluation.
         * Example: 'context1 && context2 || !context3' builds to ContextExpression 
         */
        // public static parse(expression: string): ContextExpression {
        // }
        public static parse(expression: string): ContextExpression {
            const tokens = expression.split(/(\s*&&\s*|\s*\|\|\s*|\s*!\s*|\s*===?\s*|\s*!==?\s*|\(|\))/).filter(token => token.trim() !== '');
            const stack: (ContextExpression | string)[] = [];
            let currentType: "and" | "or" | "not" | "comparison" | "literal" = "or";
            const operatorStack: ("and" | "or" | "not")[] = [];

            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];
                if (token === '&&') {
                    while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] === 'and') {
                        const op = operatorStack.pop();
                        const right = stack.pop();
                        const left = stack.pop();
                        stack.push(new ContextExpression(op!, [left!, right!]));
                    }
                    operatorStack.push('and');
                } else if (token === '||') {
                    while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== 'not') {
                        const op = operatorStack.pop();
                        const right = stack.pop();
                        const left = stack.pop();
                        stack.push(new ContextExpression(op!, [left!, right!]));
                    }
                    operatorStack.push('or');
                } else if (token === '!') {
                    operatorStack.push('not');
                } else if (token === '==' || token === '!=' || token === '===' || token === '!==') {
                    currentType = 'comparison';
                    const left = stack.pop();
                    const right = tokens[++i];
                    stack.push(new ContextExpression(currentType!, [left!, token!, right!]));
                } else if (token === '(') {
                    // Find matching closing parenthesis
                    let depth = 1;
                    let j = i + 1;
                    while (j < tokens.length && depth > 0) {
                        if (tokens[j] === '(') depth++;
                        else if (tokens[j] === ')') depth--;
                        j++;
                    }
                    const subTokens = tokens.slice(i + 1, j - 1);
                    const subExpression = this.parse(subTokens.join(''));
                    stack.push(subExpression);
                    // Move i to the closing parenthesis
                    i = j - 1;
                } else if (token === ')') {
                    break;
                } else {
                    stack.push(token);
                }
            }

            while (operatorStack.length > 0) {
                const op = operatorStack.pop();
                const right = stack.pop();
                const left = stack.pop();
                stack.push(new ContextExpression(op!, [left!, right!]));
            }

            // Reset currentType to 'or' if no explicit type was set
            const finalType = stack.length > 0 ? (stack[0] instanceof ContextExpression ? stack[0].type : 'or') : 'or';
            return new ContextExpression(finalType, stack);
        }

        private static isIdentifierChar(char: string): boolean {
            return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_';
        }
    }
}

// what must the API support?
// - context type : hover & focus on elements/regions/selectors ; example : hover on HTMLCanvasElement or focus in "body div:has(>textarea)"
// - context type : environment ; example : only if checkbox "X" is enabled or settings (later) is above 5
// how would a Context be defined?
// - Every context has a unique ID (string) which can be tested from global or (itself) a context. ; example : keyboard shortcut "[shift]+[alt]+v" only give "test() == true" if a textarea is selected (example id: "inTextarea"). 
// how can a context be updated?
// - settings (future implementation): a "CachedDecision" is beeing fed by the value and "refresh" is called from settings manipulation.
// - focus / hover / click and other events : either a LatchedDescition or a 

export default Contextable;
