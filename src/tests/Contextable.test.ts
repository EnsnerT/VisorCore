import Contextable from "../Contextable";

describe('Contextable / Evaluation', function () {
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
describe('Contextable / Decider', function () {
    it('StateChangeListener', function () {
        const F_settings = new Contextable.StateChangeListeners<boolean>(false);
        F_settings.listen(function (value, unhook) {
            expect(value).toBe(true);
        });
        F_settings.change(true);
        expect.assertions(1);
    });

})

// describe();
