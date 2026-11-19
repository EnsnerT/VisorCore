export type KeyBinderConfiguration = {};
declare class KeyBinder {
    private static _modifiers;
    static bindAction<T extends Event>(actionId: string, callback: (actionData: any, eventObject?: T) => void): void;
    static dispatchAction(actionId: string, actionData: any, eventObject: any): void;
    /**
     * Construct the default KeyBinder handle.
     * @param target the target to apply default handle events
     * @param config defined configuration
     */
    static construct(target: EventTarget, config?: KeyBinderConfiguration): void;
    /**
     * Browser Events will be dispatched here.
     * e.g. keydown event with alt and
     */
    static event<T extends {} | Event>(eventName: string, eventObject: T, additionalContext?: string): void;
}
declare namespace KeyBinder {
    type TranslationHandler = (eventName: string, eventData: Event) => (undefined | {
        actionId: string;
        actionData: any;
    });
    class Translator {
        private _globalDecidors;
        private _eventDecidors;
        private _idToEventMap;
        static addGlobal(uniqueCustomId: string, handler: (eventName: string, eventData: Event) => boolean): void;
        static removeGlobal(): void;
        static removeAllGlobal(): void;
        static addEvent(): void;
        static modifyEvent(): void;
        static removeEvent(): void;
        static removeAllEvents(): void;
        static addKey(): void;
        static removeKey(): void;
    }
}
export default KeyBinder;
