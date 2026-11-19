/// <reference no-default-lib="true" />
/// <reference lib="es2024.promise" />
/// <reference lib="webworker" />
// ts: target: ES5, JSX:none, Module: ES2020, declaration
// node "C:\Users\Thomas\AppData\Roaming\npm\tsc" WorkerAPI.ts -d -m commonjs --lib webworker

// @ts-ignore
type SupportedWorkerKinds = DedicatedWorkerGlobalScope | Worker | SharedWorker;
type MessageAPI = { [command: string]: (...args: any) => any };
type WorkerCallback = { id: string, callback: Promise<any>, resolver: (returnValue: any) => void }

type ResponseMessage = { type: "response", id: string, value: any }
type CallMessage = { type: "call", id: string, name: string, arguments: Array<any> }
type MessagePacket = ResponseMessage | CallMessage;

class WorkerAPI {

    private workerSupplier: SupportedWorkerKinds;
    private messageAPIRef: MessageAPI;
    private uuid: string;
    private id: number;

    private callbacks: { [id: string]: WorkerCallback } = {};

    /**
     * Create a Worker API and start it with {@link start()}. <br/>
     * @param worker The *Worker Object* you get by calling "new Worker(url)" or "new SharedWorker(url)"
     * @param messageAPI Object to bind "message" events to. Define `{"ping":function(){return 1;}}` and let yourself be called with `call('ping')().then(function(result){console.log(result); // 1})`
     */
    constructor(worker: SupportedWorkerKinds, messageAPI: MessageAPI) {
        this.workerSupplier = worker;
        this.messageAPIRef = messageAPI;
        this.id = Date.now();
        this.uuid = crypto.randomUUID();
    }

    /**
     * Start the Message Handler.
     */
    public start(): WorkerAPI {
        this.workerSupplier.addEventListener("message", this.handleEvent.bind(this));
        return this;
    }

    /**
     * This is the Handler which processes Incomming Messages.
     * @param event The MessageEvent to be handled
     */
    public handleEvent(event: MessageEvent | Event): void {
        let data;
        if ("data" in event) {
            if (typeof event.data === "string") {
                try {
                    data = JSON.parse((event as MessageEvent).data);
                } catch (e) {
                }
            } else {
                data = event.data;
            }
        }
        if (typeof data === "object" && "type" in data) {
            let packet = data as MessagePacket;

            if (packet.type === "response") {
                let target = packet.id;
                if (target in this.callbacks) {
                    this.callbacks[target].resolver(packet.value);
                }
                return;
            }
            if (typeof this.messageAPIRef !== "undefined") {
                if (packet.type === "call") {
                    let target = packet.id;
                    let method = packet.name;
                    let args = packet.arguments;
                    if (typeof method === "string" && method in this.messageAPIRef && typeof this.messageAPIRef[method] === "function") {
                        let value = this.messageAPIRef[method](...args);
                        let source = "source" in event ? event.source : this.workerSupplier;
                        if (source == undefined) {
                            source = this.workerSupplier;
                        }
                        if (value == undefined)
                            value = 0;
                        var outMessage: ResponseMessage = { "type": "response", "id": target, "value": value };
                        try {
                            if ("port" in source)
                                source.port.postMessage(outMessage);
                            else {
                                source.postMessage(outMessage);
                            }
                        } catch (e) {
                            console.error(e, value, target);
                            throw e;
                        }
                        return;
                    } else {
                        console.warn("can not find " + method + " in " + this.messageAPIRef);
                    }
                }
            }
        }
    }

    /**
     * 
     * @param method Method Name to call on the Oposing Worker API
     * @param args Arguments to provide to the Method on the Oposing Worker
     * @returns Function you have to call and pass a LIST of all Transferables within the `args` parameter separatly; <br/> after that you receive a Promise which resolves to the Return Value of the 
     */
    public call(method: string, ...args: any): (tr?: Transferable[]) => Promise<any> {
        const ID = this.uuid + (++this.id);
        if (this.workerSupplier === undefined) {
            return function () { return Promise.reject("No worker found"); };
        }
        const _this = this;

        return function (tr?: Transferable[]) {
            const creator = Promise.withResolvers<any>();

            const callback = creator.promise;
            const resolve = function (value: any) {
                creator.resolve(value);
                delete _this.callbacks[ID];
            };

            _this.callbacks[ID] = {
                "id": ID,
                "resolver": resolve,
                "callback": callback
            }

            const message: CallMessage = { "type": "call", "id": ID, "name": method, "arguments": args };

            if ("port" in _this.workerSupplier)
                _this.workerSupplier.port.postMessage(message, { transfer: tr });
            else
                _this.workerSupplier.postMessage(message, { transfer: tr })

            console.log("Request Sent:" + message);

            return callback;
        }
    }
}

export default WorkerAPI;
(globalThis as any).WorkerAPI = WorkerAPI;

// Unsupported actions:
// - Transferables can not be Received back and can not be a Return Value yet!
// - Logs are Static and not shutoff currently.
// - The File name starts with a Small Letter!
