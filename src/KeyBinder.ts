import Contextable from "./Contextable";

export type KeyBinderConfiguration = {}

class KeyBinder {
    private static _modifiers: undefined;

    // private static _

    public static bindAction<T extends Event>(actionId: string, callback: (actionData: any, eventObject?: T) => void) {

    }

    public static dispatchAction(actionId: string, actionData: any, eventObject: any) {

    }

    /**
     * Construct the default KeyBinder handle.
     * @param target the target to apply default handle events
     * @param config defined configuration
     */
    public static construct(target: EventTarget, config?: KeyBinderConfiguration) {
        const interestedModifierKeys = ["Alt", "AltGraph", "Control", "Meta", "Shift"];
        target.addEventListener('keydown', function (event: Event) {
            const kbevent: KeyboardEvent = event as KeyboardEvent;
            const modifier = { code: kbevent.code, key: kbevent.key, alt: kbevent.altKey, meta: kbevent.metaKey, ctrl: kbevent.ctrlKey, shift: kbevent.shiftKey, location: kbevent.location };
            let modif: { [key: string]: boolean } = {};
            for (const mod of interestedModifierKeys) {
                modif[mod] = kbevent.getModifierState(mod);
            }
            console.log(modifier, kbevent, modif);
        }, { capture: true });
    }
    /**
     * Browser Events will be dispatched here.
     * e.g. keydown event with alt and 
     */
    public static event<T extends {} | Event>(eventName: string, eventObject: T, additionalContext?: string): void {

    }

}
namespace KeyBinder {
    type DecidorData = { id: string, eventName: string, handler: TranslationHandler, context?: Contextable.ContextExpression | undefined };
    export type TranslationHandler = (eventName: string, eventData: Event) => (undefined | { actionId: string, actionData: any });

    export class Translator {
        private _globalDecidors: Map<string, (eventName: string, eventData: Event) => boolean> = new Map();
        private _eventDecidors: Map<string, DecidorData> = new Map();
        private _idToEventMap: Map<string, string> = new Map();

        // private static () { }

        public static addGlobal(uniqueCustomId: string, handler: (eventName: string, eventData: Event) => boolean): void {
            // todo ; add 
        }
        public static removeGlobal() { }
        public static removeAllGlobal() { }
        public static addEvent() { }
        public static modifyEvent() { }
        public static removeEvent() { }
        public static removeAllEvents() { }
        public static addKey() { }
        public static removeKey() { }
    }
}

export default KeyBinder;
