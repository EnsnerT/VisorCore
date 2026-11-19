type SupportedWorkerKinds = DedicatedWorkerGlobalScope | Worker | SharedWorker;
type MessageAPI = {
    [command: string]: (...args: any) => any;
};
declare class WorkerAPI {
    private workerSupplier;
    private messageAPIRef;
    private uuid;
    private id;
    private callbacks;
    constructor(worker: SupportedWorkerKinds, messageAPI: MessageAPI);
    /**
     * start
     */
    start(): WorkerAPI;
    handleEvent(event: MessageEvent | Event): void;
    call(method: string, ...args: any): (tr?: Transferable[]) => Promise<any>;
}
export default WorkerAPI;
