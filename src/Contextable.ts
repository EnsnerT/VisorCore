function check(ctx: Contextable.ContextTester | Contextable.ContextDecider, args?: string): string | boolean {
    if (typeof ctx === 'function')
        return ctx(args);
    else
        return ctx.test(args);
}

class Contextable {
    // private 
    private static _contexts: Map<string, Contextable.ContextDecider | Contextable.ContextTester> = new Map();

    public static test(id: string, args?: string): boolean | string | number {
        // Check if the context ID is registered and return its state
        const context = this._contexts.get(id);
        return context ? check(context, args) : false;
    }

    public static resetRegister() {
        this._contexts.clear();
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
            this.last_state = check(this.child, this.cached_args);
        }

        test(args?: string): string | boolean {
            if (this.last_state == undefined || this.cached_args !== args) {
                this.last_state = check(this.child, args);
                this.cached_args = args;
            }
            return this.last_state;
        }
    }

    export class ContextExpression {

        /**
         * Depending on <code>this.type</code>, each <code>this.childs</code> is describing the handling.
         */
        private type: "and" | "or" | "not" | "comparison" | "literal" = "or";
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

        public evaluate() {
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
        public static parse(expression: string): ContextExpression {
            let index = 0;
            const result = this.parseOr(expression, index);
            // Check if the entire expression was consumed
            if (result.index < expression.length) {
                console.debug(result.expression);
                throw new Error('Unexpected characters at the end of the expression, index:' + result.index + ', length:' + expression.length);
            }
            return result.expression;
        }

        private static parseOr(expression: string, index: number): { expression: ContextExpression, index: number } {
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

        private static parseAnd(expression: string, index: number): { expression: ContextExpression, index: number } {
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

        private static parsePrimary(expression: string, index: number): { expression: ContextExpression, index: number } {
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
                } else {
                    throw new Error('Expected closing parenthesis');
                }
                return { expression: result.expression, index };
            } else if (index < expression.length && this.isIdentifierChar(expression[index])) {
                const identifier = this.parseIdentifier(expression, index);
                return { expression: new ContextExpression('literal', identifier.content), index: identifier.index };
            } else {
                throw new Error('Unexpected character');
            }
        }

        private static parseIdentifier(expression: string, index: number): { content: string, index: number } {
            let identifier = '';
            while (index < expression.length && this.isIdentifierChar(expression[index])) {
                identifier += expression[index];
                index++;
            }
            return { content: identifier, index: index + 1 };
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
(globalThis as any).Contextable = Contextable;
