import KeyBinder from '../KeyBinder';
import { JSDOM } from 'jsdom';

describe('KeyBinder / Action', function () {
});
describe('KeyBinder / Events', function () {

});
describe('KeyBinder / Preview', function () {

});
describe('KeyBinder / Translator', function () {

});
describe('KeyBinder / construct', function () {
    test('plain construct', function () {
        const dom = new JSDOM("<div></div>", {});
        KeyBinder.construct(dom.window, {});
        const prop = {
            X: function X(actionData: any, eventObject: any) {
            }
        }
        const spy = spyOn(prop, "X");
        // KeyBinder.
        KeyBinder.bindAction('success', prop.X);
        // KeyBinder.Translator.addEvent('sample',)
        dom.window.dispatchEvent(new dom.window.KeyboardEvent("keydown", { altKey: true, key: "]", code: "BracketRight" }));
        expect(spy).toHaveBeenCalled();
    })
});
