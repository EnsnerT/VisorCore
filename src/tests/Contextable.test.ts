import Contextable, { Utility } from "../Contextable";

describe('Utility', function () {
    test('array delete index start', function () {
        const array = [1, 2, 3];
        Utility.arr_dropindex(array, 0);
        expect(array).toHaveLength(2);
        expect(array).toContain(2);
        expect(array).toContain(3);
    });
    test('array delete index middle', function () {
        const array = [1, 2, 3];
        Utility.arr_dropindex(array, 1);
        expect(array).toHaveLength(2);
        expect(array).toContain(1);
        expect(array).toContain(3);
    });
    test('array delete index last', function () {
        const array = [1, 2, 3];
        Utility.arr_dropindex(array, 2);
        expect(array).toHaveLength(2);
        expect(array).toContain(1);
        expect(array).toContain(2);
    });
});
describe('Parsing', function () {
    beforeAll(function () {
        Contextable.resetRegister();
        Contextable.registerContext("alpha", function () { return true; });
        Contextable.registerContext("bravo", function () { return "bravo"; });
    });
    test('parse direct', function () {
        expect(Contextable.parseExpression("alpha").evaluate()).toBe(true);
    });
    test('parse direct trimming x3', function () {
        expect(Contextable.parseExpression("alpha ").evaluate()).toBe(true);
        expect(Contextable.parseExpression(" alpha").evaluate()).toBe(true);
        expect(Contextable.parseExpression(" alpha ").evaluate()).toBe(true);
    });
    test('parsing literal x7', function () {
        expect(Contextable.parseExpression("''==''").evaluate()).toBe(true);
        expect(Contextable.parseExpression("' '==''").evaluate()).toBe(false);
        expect(Contextable.parseExpression("' '==' '").evaluate()).toBe(true);
        expect(Contextable.parseExpression("' '== ' '").evaluate()).toBe(true);
        expect(Contextable.parseExpression("' ' == ' '").evaluate()).toBe(true);
        expect(Contextable.parseExpression(" ' '== ' '").evaluate()).toBe(true);
        expect(Contextable.parseExpression(" ' '== ''").evaluate()).toBe(false);
    });
    test('parsing literal with variable x7', function () {
        expect(Contextable.parseExpression("bravo=='bravo'").evaluate()).toBe(true);
        expect(Contextable.parseExpression("bravo =='bravo'").evaluate()).toBe(true);
        expect(Contextable.parseExpression(" bravo=='bravo'").evaluate()).toBe(true);
        expect(Contextable.parseExpression("bravo== 'bravo'").evaluate()).toBe(true);
        expect(Contextable.parseExpression("bravo == 'bravo'").evaluate()).toBe(true);
        expect(Contextable.parseExpression(" bravo== 'bravo'").evaluate()).toBe(true);
        expect(Contextable.parseExpression(" bravo== 'bravo' ").evaluate()).toBe(true);
    });
});
describe('Evaluation', function () {
    beforeAll(function () {
        Contextable.resetRegister();
        Contextable.registerContext("alpha", function () { return true; });
        Contextable.registerContext("bravo", function () { return false; });
        Contextable.registerContext("charlie", function () { return 'charlie'; });
    })
    it('handle single registration', function () {
        expect(Contextable.parseExpression("alpha").evaluate()).toBe(true);
    });
    it('handle "and" comparison', function () {
        expect(Contextable.parseExpression("alpha&&bravo").evaluate()).toBe(false);
        expect(Contextable.parseExpression("bravo&&alpha").evaluate()).toBe(false);
    });
    it('handle "or" comparison', function () {
        expect(Contextable.parseExpression("alpha||bravo").evaluate()).toBe(true);
        expect(Contextable.parseExpression("bravo||alpha").evaluate()).toBe(true);
    });
    it('handle "literal" comparison', function () {
        expect(Contextable.parseExpression("charlie=='charlie'").evaluate()).toBe(true);
        expect(Contextable.parseExpression("charlie=='bravo'").evaluate()).toBe(false);
        expect(Contextable.parseExpression("kkkkkk=='bravo'").evaluate()).toBe(false); // since kkkkkk is undefined, the value is false;
    });
    it('handle "Paranthesis"', function () {
        expect(Contextable.parseExpression("'bravo'=='bravo'").evaluate()).toBe(true);
        expect(Contextable.parseExpression("('bravo'=='bravo')").inspect().evaluate()).toBe(true);
    });
});
describe('Evaluation Listeners', function () {
    var alpha: Contextable.LatchedDecision;
    var bravo: Contextable.RadioDecision<'a' | 'b' | 'c'>;
    beforeAll(function () {
        Contextable.resetRegister();
        alpha = Contextable.createContext('alpha', 'latched', false);
        bravo = Contextable.createContext<'a' | 'b' | 'c'>('bravo', 'radio', 'a');
    });
    test('Decision Listening & Unlistening', function () {
        alpha.change(false);

        var id = alpha.listen(function (value, unhook) {
            expect(value).toBe(true); // t1
        });
        alpha.change(true);
        alpha.unlisten(id);
        alpha.change(false);

        expect.assertions(1);
    });
    test('Context Listening & Unlistening', function () {
        alpha.change(false);

        const alpha_exp = Contextable.parseExpression('alpha');
        alpha_exp.listen(function (value, unhook) {
            expect(value).toBe(true); // t1 
        });
        alpha.change(true);
        alpha_exp.unlisten();
        alpha.change(false);

        expect.assertions(1);
    });
    test('single context', function () {
        alpha.listen(function (value, unhook) {
            expect(value).toBeDefined(); // t1, t4
            if (value == true)
                unhook(); // t4 -> unhooks
        });

        const expression = Contextable.parseExpression('alpha');
        var iteration = 0;

        expression.listen(function (newValue, unhook) {
            if (iteration++ == 0)
                expect(newValue).toBe(false); // t2
            else {
                expect(newValue).toBe(true); // t5
                unhook(); // t5 -> unhooks
            }
        });

        alpha.off(); // trigger t1+t2
        expect(alpha.test()).toBe(false); // t3
        alpha.on(); // trigger t4+t5
        expect(alpha.test()).toBe(true); // t6
        expression.unlisten();

        expect.assertions(6);
    });
    test('double context with 3 parameters', function () {
        alpha.change(true);
        const expression = Contextable.parseExpression('alpha&&bravo=="b"');
        var iteration = 0;

        expect(expression.evaluate()).toBe(false); // since bravo is 'a' and not 'b'

        expression.listen(function (newValue, unhook) {
            if (iteration++ == 0)
                expect(newValue).toBe(true); // change to 'b'
            else {
                expect(newValue).toBe(false); // change to 'c'
                unhook(); // -> unhooks
            }
        });

        alpha.off(); // trigger t1+t2
        expect(alpha.test()).toBe(false); // t3
        alpha.on(); // trigger t4+t5
        expect(alpha.test()).toBe(true); // t6

        expect.assertions(6);
    });
    // test('', function () { });
})
describe('Decider', function () {
    test('StateChangeListener', function () {
        const F_settings = new Contextable.StateChangeListeners<boolean>(false);
        F_settings.listen(function (value, unhook) {
            expect(value).toBe(true);
        });
        F_settings.change(true);
        expect.assertions(1);
    });
    test("Radio Decider", function () {
        const alpha_context = Contextable.createContext<"default" | "on" | "off">("sample", "radio", "default");

        const alpha_is_default = alpha_context.create("default");
        expect(alpha_is_default).toBeDefined();
        const alpha_is_on = alpha_context.create("on");
        expect(alpha_is_on).toBeDefined();
        const alpha_is_off = alpha_context.create("off");
        expect(alpha_is_off).toBeDefined();

        expect(alpha_is_default.test()).toBe(true);
        expect(alpha_is_on.test()).toBe(false);
        expect(alpha_is_off.test()).toBe(false);

        const expression = Contextable.parseExpression("sample=='on'");

        expect(expression.inspect().evaluate()).toBe(false);

        alpha_context.listen(function (value) {
            expect(value).toEqual("on");
        });

        alpha_context.change("on");

        expect(alpha_is_default.test()).toBe(false);
        expect(alpha_is_on.test()).toBe(true);
        expect(alpha_is_off.test()).toBe(false);

        expect(expression.evaluate()).toBe(true);

        expect.assertions(12);
    });

    // test('', function () {
    //     Contextable.
    // });
});

// describe();
