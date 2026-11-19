type ContextTester = (args?: string) => string | boolean;
interface ContextDecider {
    test(args?: string): string | boolean;
}
declare class Contextable {
    private static _contexts;
    static test(id: string, args?: string): boolean | string | number;
    static resetRegister(): void;
    static registerContext(id: string, decider: ContextDecider | ContextTester): void;
    static parseExpression(expression: string): Contextable.ContextExpression;
}
declare namespace Contextable {
    class ContextExpression {
        /**
         * Depending on <code>this.type</code>, each <code>this.childs</code> is describing the handling.
         */
        private type;
        /**
         * type <code>string</code>, if starting with <literal>'</literal> then the string is a literal type, otherwise the type is context; contexts can be evaluated using <code>Contextable.test(contextId)</code>
         * otherwise it can only be type <code>ContextExpression</code>.
         */
        private childs;
        constructor(type: typeof this.type, expressions: ContextExpression | string);
        constructor(type: typeof this.type, expressions: typeof this.childs);
        evaluate(): boolean | undefined;
        /**
         * Parses logical expressions into ContextExpression objects.
         * Supports '&&', '||', '!' operators and context comparisons (e.g., <code>context1 == 'amp'</code>).
         * Builds an expression tree for evaluation.
         * Example: 'context1 && context2 || !context3' builds to ContextExpression
         */
        static parse(expression: string): ContextExpression;
        private static parseOr;
        private static parseAnd;
        private static parsePrimary;
        private static parseIdentifier;
        private static isIdentifierChar;
    }
}
export default Contextable;
