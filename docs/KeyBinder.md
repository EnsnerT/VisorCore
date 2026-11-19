

# Base Idea
The Library has 4 Important Entrypoints:
1. **Action**: Attach a Callback to an Action Name
	- *API*: `KeyBinder.bindAction(actionId,callback:(data:any,eventObject?:any)=>void)`
	- *API*: `KeyBinder.dispatchAction(actionId,actionData,eventObject?):void`
2. **Events**: Here the Browser and Library Handlers will post the Events in.
	- *API*: `KeyBinder.event(eventName:string,data:{[key:string]:any},context?:context);`
3. **Preview**: Binds All Events to an *echo* like function to allow the binding of custom Keyboards.
	- *API*:  `KeyBinder.preview(inputElement).when(eventName:'complete|preview|cancel',do:function(){}).when(...)`
4. **Translator**: Map Events (and optional Contexts) to Actions 
	- **Requires Library**: [Contextable](docs/Contextable.md) to be able to make Context dependencies.
	- *API*: `KeyBinder.Translator.addGlobal(uniqueCustomID:string,(context?,eventName?)=>boolean)` - This is intended to *disable* all Bindings when in *Settings Panel* and in *KeyBinder/Preview* mode. 
	- *API*: `KeyBinder.Translator.removeGlobal(uniqueCustomID:string)`
	- *API*: `KeyBinder.Translator.removeAllGlobal()`
	- *API*: `KeyBinder.Translator.addEvent(uniqueCustomID:string,eventName,context:string|undefined,(eventName,eventData)=>undefined|{actionId:string,actionData:any},targets:Element[],selector:undefined|string)`
	- *API*: `KeyBinder.Translator.modifyEvent(uniqueCustomID:string,{context:string|undefined,addTargets:Element[],filterTargets:(e:element)=>boolean,rerunSelector:boolean})`
	- *API*: `KeyBinder.Translator.removeEvent(uniqueCustomID:string)`
	- *API*: `KeyBinder.Translator.removeAllEvents(filter:(uniqueCustomID:string,data:storedEventData)=>boolean)`
	- *API*: `KeyBinder.Translator.addKey(uniqueCustomID:string,context:string|undefined,keys:string[],)`

Note that `{capture:true}` results into window activating first and then document. `false` (default) will invert this behaviour. 
If you have an event bound to window and document, 

| capture | stopPropagation | first runner | second runner |
| ------- | --------------- | ------------ | ------------- |
| false   | false           | document     | window        |
| true    | false           | window       | document      |
| false   | true            | document     | -             |
| true    | true            | window       | -             |
`{passive:true}` disables the `event.preventDefault()` check until the end. Therefore if an event like Scroll takes quite a time, and still does not prevent Default, the scroll for DOM only happens after the check is complete.
