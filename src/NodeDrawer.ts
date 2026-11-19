type Contexts = RenderingContext | OffscreenRenderingContext;

type NodeDrawerConfig = {
    /** below 1 = infinite chunk size */
    worldChunkSize?: number,
    initialScale?: number,
    initialX?: number,
    initialY?: number,
    draggableView?: boolean,
    draggableNodes?: boolean,
    zoomable?: boolean,
    world?: NodeDrawer.World<NodeDrawer.World.Chunk>,
    /** should the render automatically update based on the requestAnimationFrame()? */
    hookAsAnimation?: boolean
};

/** 
 * Update Event. On Start the location in "target" is stored and all other calculations are made based on that.
 * 
 * you can mutate any values for "target" or "origin", any other change must have no effect
 */
type DraggableUpdateEvent = {
    /** absolute position in "target" space */
    positionInTargetSpace: NodeDrawer.Location,
    /** relative position in "origin" space calculated from "target" space */
    differenceInOriginSpace: NodeDrawer.Location,
    /** the space which should affect the space "target"; example: WorldSpace */
    target: NodeDrawer.TransformationSpace,
    /** the space in which the event is calculated upon; example: ScreenSpace */
    origin: NodeDrawer.TransformationSpace
}

function NodeDrawer(element: HTMLCanvasElement | string): NodeDrawer.NodeDrawingContext<Contexts> {
    return NodeDrawer.getContext(element);
}
namespace NodeDrawer {
    export function getContext(canvas: HTMLCanvasElement | string): NodeDrawingContext<Contexts> {
        if (typeof canvas === 'string') {
            if (canvas in NodeDrawingContext.data)
                return NodeDrawingContext.getData(canvas);
            else throw new Error("Context not initialized!");
        }
        return NodeDrawingContext.getData(NodeDrawingContext.getId(canvas));
    }

    export function init(canvas: HTMLCanvasElement, key: string, options: any | undefined, callback: (nd: typeof NodeDrawer, context: NodeDrawingContext<Contexts>) => void): NodeDrawingContext<Contexts> | null {
        let element = NodeDrawingContext.getData(NodeDrawingContext.getId(canvas));
        if (typeof element !== "undefined") {
            return element;
        }

        const ctx = canvas.getContext(key, options);
        if (ctx != null) {
            element = new NodeDrawingContext(canvas, ctx);
            element.setup(callback);
            return element;
        } else {
            return null;
        }
    }

    /**
     * Creates a basic NodeDrawing Context
     * 
     * @param canvas the element ; if a instance already is present on the Element, then a "Error" is thrown.
     * @param config (optional) settings
     * @returns the Container Context
     */
    export function construct(canvas?: HTMLCanvasElement, config?: NodeDrawerConfig): NodeDrawer.NodeDrawingContext<Contexts> {
        let element = NodeDrawingContext.getData(NodeDrawingContext.getId(canvas));
        if (element != undefined || canvas == undefined) {
            return element;
            // throw new Error("NodeDrawer already Constructed on Canvas");
        }

        const ctx = canvas.getContext("2d");
        if (ctx == null)
            throw new Error("Context creation on Element failed!");

        element = new NodeDrawingContext(canvas, ctx);

        const worldInitialScale: number = config?.initialScale || 1;
        const worldInitialX: number = config?.initialX || 0;
        const worldInitialY: number = config?.initialY || 0;

        element.getWorldSpace().setLocation(worldInitialX, worldInitialY, worldInitialScale);
        element.getWorldSpace().normalize();

        let world: World<World.Chunk>;
        if (config?.world === undefined) {
            const worldChunkSize: number = config?.worldChunkSize || 1e+4;
            if (worldChunkSize < 1) {
                world = new NodeDrawer.OneChunkWorld();
            } else {
                world = new NodeDrawer.DefaultWorld(worldChunkSize);
            }
        } else {
            world = config.world;
        }
        element.setWorld(world);

        if (config?.draggableView === true || config?.draggableNodes === true) {
            let currentDraggingNode: undefined | NodeDrawer.Node = undefined;
            let currentDraggingNodeOffset: undefined | Point = undefined;
            element.event.drag = new NodeDrawer.Event.Draggable(canvas, element.getCurrentViewport().getScreenSpace(), element.getCurrentViewport().getWorldSpace(),
                function (value) {
                    if (value != undefined) {
                        if (config?.draggableNodes === true && currentDraggingNode != undefined && currentDraggingNodeOffset != undefined) {
                            world.updateNodeLocation(currentDraggingNode, NodeDrawer.Location.of(value.positionInTargetSpace.x + currentDraggingNodeOffset.x, value.positionInTargetSpace.y + currentDraggingNodeOffset.y));
                            currentDraggingNode.updatePos();
                        }
                        if (config?.draggableView === true && currentDraggingNode == undefined) {
                            value.target.x -= value.differenceInOriginSpace.x;
                            value.target.y -= value.differenceInOriginSpace.y;
                        }
                        element.getCurrentViewport().render();
                    }

                }, function (value) {
                    const _world = element.getWorld();
                    if (config?.draggableNodes === true && _world != undefined) {
                        console.log(value.positionInTargetSpace);
                        const nodes = _world.getNodesAt(value.positionInTargetSpace);
                        if (nodes.length > 0) {
                            currentDraggingNode = nodes[0];
                        } else {
                            currentDraggingNode = undefined;
                        }
                        if (currentDraggingNode != undefined) {
                            currentDraggingNodeOffset = NodeDrawer.Location.of(currentDraggingNode.x - value.positionInTargetSpace.x, currentDraggingNode.y - value.positionInTargetSpace.y);
                        }
                    }
                });
            element.event.drag.on();
        }
        if (config?.zoomable === true) {
            element.event.zoom = new NodeDrawer.Event.Zoomable(element, element.getCurrentViewport().getScreenSpace(), element.getCurrentViewport().getWorldSpace());
            element.event.zoom.on();
        }
        if (config?.hookAsAnimation === true) {
            element.event.animation = new NodeDrawer.Event.RequestAnimationFrame(function () {
                element.getCurrentViewport().render();
            });
            element.event.animation.on();
        }

        return element;
    }

    export interface NodeDrawingContainer<T extends Contexts> {
        context(): T;

        getWorld(): World<World.Chunk> | undefined;

        setWorld(world: World<World.Chunk> | undefined): void;

        getCurrentViewport(): Viewport<T>;

        mapOntoNode(node: NodeDrawer.Node): Collisions2D.BoundingBox;
    }

    /* type CanvasLikeRenderingContextMap = {
        "2d": {options:CanvasRenderingContext2DSettings,returnValue:CanvasRenderingContext2D},
        "bitmaprenderer": {options:ImageBitmapRenderingContextSettings,returnValue:ImageBitmapRenderingContext},
        "webgl":{options:WebGLContextAttributes,returnValue:WebGLRenderingContext},
        "webgl2":{options:WebGLContextAttributes,returnValue:WebGL2RenderingContext},
        [other:string]:{options:any,returnValue:RenderingContext|OffscreenRenderingContext}
    } */
    /**
     * A NodeDrawingContext can be explained as a connection between the DOM Lifecycle and RenderingElement 
     */
    export class NodeDrawingContext<T extends Contexts> implements NodeDrawingContainer<T>, Viewport<T> {

        // region static
        static data: { [contextId: string]: NodeDrawingContext<Contexts> } = {};
        static observer?: ResizeObserver = undefined;
        static contextId = 0;

        public static getId(canvas?: any): string {
            let id = canvas?.id;
            if (id == undefined) {
                id = "NodeDrawer_" + (++NodeDrawingContext.contextId);
            }
            if (canvas && "id" in canvas && id != canvas.id) {
                canvas.id = id;
            }
            return id;
        }

        public static getData<F extends NodeDrawingContext<Contexts>>(contextId: string): F {
            return NodeDrawingContext.data[contextId] as F;
        }
        // endregion static

        // region NodeDrawingContainer
        ctx: T;
        canvasId: string | undefined;
        canvas: HTMLCanvasElement | OffscreenCanvas;
        parent: HTMLElement | null = null;
        public event: EventList = {};

        public constructor(viewer: HTMLCanvasElement | OffscreenCanvas, ctx: T) {
            this.ctx = ctx;
            this.screenSpace = new NodeDrawer.TransformationSpace(0, 0, 1); // static!
            this.worldSpace = new NodeDrawer.TransformationSpace(0, 0, 1); // static!
            this.canvas = viewer;
            this.canvasId = NodeDrawingContext.getId(viewer);

            if (typeof NodeDrawingContext.observer === "undefined") {
                NodeDrawingContext.observer = new ResizeObserver(NodeDrawer.resizeHandler);
            }

            if ("parentElement" in viewer)
                this.parent = viewer.parentElement;

            if (this.parent != null) {
                NodeDrawingContext.observer.observe(this.parent);
            }
            this.boundingBox = Collisions2D.BoundingBox.fromRelative(Location.of(0, 0), 0, 0);

            this.updateScreenBounds();

            NodeDrawingContext.data[this.canvasId] = this;
        }

        public setup(callback: (ND: typeof NodeDrawer, context: this) => void) {
            if (typeof callback === "function") {
                callback(NodeDrawer, this);
            }
            this.getCurrentViewport().render();
        }

        public updateScreenBounds(): void {
            if (this.parent == null)
                return;
            const element_viewport_size = this.parent.getBoundingClientRect();
            this.screenSpace.setLocation(element_viewport_size.x, element_viewport_size.y, 1);
            this.getCurrentViewport().updateSize(element_viewport_size.width, element_viewport_size.height);
            this.boundingBox.updateRelative(this.screenSpace.x, this.screenSpace.y, element_viewport_size.width, element_viewport_size.height);
        }

        public context(): T {
            return this.ctx;
        }

        public setWorld(world: World<World.Chunk> | undefined): void {
            this.world = world;
        }

        public getWorld(): World<World.Chunk> | undefined {
            return this.world;
        }

        public getScreenSpace(): TransformationSpace {
            return this.screenSpace;
        }

        public getCurrentViewport(): Viewport<T> {
            return this as Viewport<T>;
        }

        // endregion NodeDrawingContainer

        // region ViewPort
        boundingBox: NodeDrawer.Collisions2D.BoundingBox;
        screenSpace: TransformationSpace;
        worldSpace: TransformationSpace;
        world: World<World.Chunk> | undefined;

        /**
         * Get the Position of a POINT on GLOBAL_SCREEN, converted from the WORLD 
         * 
         * Where is Point A on Browser Screen if Point A describes a location in the World?
         */
        public getPositionInWorld(pos: Point, offset?: Partial<Point>): Point {
            if (this.world == undefined) {
                return { x: 0, y: 0 };
            }
            let position = { x: pos.x, y: pos.y };
            if (offset != undefined) {
                if (typeof offset.x === 'number') {
                    position.x += offset.x;
                }
                if (typeof offset.y === 'number') {
                    position.y += offset.y;
                }
            }
            return this.getCurrentViewport().getWorldSpace().getInGlobalSpace(Location.of(position.x, position.y));
        }

        /**
         * 
         * @param node the node to map
         * @returns this
         */
        public mapOntoNode(node: NodeDrawer.Node): Collisions2D.BoundingBox {
            // const start = this.getCurrentViewport().getWorldSpace().getInSpace(this.getCurrentViewport().getScreenSpace(), node.getLocation());
            // const end = this.getCurrentViewport().getWorldSpace().getInSpace(this.getCurrentViewport().getScreenSpace(), Location.of(node.x + node.w, node.y + node.h));
            const start = this.getCurrentViewport().getWorldSpace().getInGlobalSpace(node.getLocation());
            const end = this.getCurrentViewport().getWorldSpace().getInGlobalSpace(Location.of(node.x + node.w, node.y + node.h));
            return Collisions2D.BoundingBox.fromAbsolute(start, end.x, end.y);
        }

        getWorldSpace(): TransformationSpace {
            return this.worldSpace;
        }

        updateSize(w: number, h: number): void {
            if (this.canvas != undefined) {
                this.canvas.width = w;
                this.canvas.height = h;
            }
        }

        getScreenBoundingBox(): Collisions2D.BoundingBox {
            return this.boundingBox;
        }

        static master: NodeDrawingContext<any> | undefined = undefined;
        render(): void {
            if (NodeDrawingContext.master == undefined && this.canvasId == 'master') {
                NodeDrawingContext.master = this;
            }
            if ("fill" in this.ctx) {
                this.ctx.reset();
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }

            const world = this.getWorld()
            if (world) {
                const env = (NodeDrawingContext.master || this);
                const viewport_BB_global = env.getScreenBoundingBox();
                const world_view_BB_start = this.inSpace(env.screenSpace, env.worldSpace, { x: viewport_BB_global.x, y: viewport_BB_global.y });
                const world_view_BB_end = this.inSpace(env.screenSpace, env.worldSpace, { x: viewport_BB_global.mx, y: viewport_BB_global.my });
                const world_view_BB = NodeDrawer.Collisions2D.BoundingBox.fromAbsolute(world_view_BB_start, world_view_BB_end.x, world_view_BB_end.y);
                const nodes = world.getNodesInArea(false, world_view_BB);
                if (world instanceof DefaultWorld && NodeRenderFactory.hasRenderer("#chunk")) {
                    for (const chunk in world.chunks) {
                        const c = world.chunks[chunk];
                        const coord = chunk.split("_").map(parseFloat);
                        NodeRenderFactory.render("#chunk", new NodeDrawer.Node(c.x * world.chunkSize, c.y * world.chunkSize, world.chunkSize, world.chunkSize, "#chunk"), this);
                    }
                }
                for (const node of nodes) {
                    NodeRenderFactory.render(node.nodeTypeId, node, this);
                }
                // const ctx = this.context();
                // if (ctx instanceof CanvasRenderingContext2D) {

                // if (world instanceof DefaultWorld && NodeDrawingContext.master !== undefined) {
                //     const start = NodeDrawingContext.master.getScreenBoundingBox()

                //     const screen_to_world_left_top = this.inSpace(NodeDrawingContext.master.getScreenSpace(), NodeDrawingContext.master.getWorldSpace(), start);
                //     const screen_to_world_right_bottom = this.inSpace(NodeDrawingContext.master.getScreenSpace(), NodeDrawingContext.master.getWorldSpace(), { x: start.mx, y: start.my });

                //     // const topLeft = NodeDrawingContext.master.getScreenSpace().getInSpace(NodeDrawingContext.master.getWorldSpace(),Location.of(start.x,start.y));
                //     // const bottomRight = NodeDrawingContext.master.getScreenSpace().getInSpace(NodeDrawingContext.master.getWorldSpace(),Location.of(start.mx,start.my));

                //     const world_to_my_screen_left_top = this.inSpace(this.worldSpace, TransformationSpace.globalSpace, screen_to_world_left_top);
                //     const world_to_my_screen_right_bottom = this.inSpace(this.worldSpace, TransformationSpace.globalSpace, screen_to_world_right_bottom);

                //     // const end = this.getCurrentViewport().getScreenSpace().getInSpace(world.getSpace(), { x: viewport_BB.mx - 10, y: viewport_BB.my - 10 });

                //     ctx.beginPath()
                //     ctx.strokeStyle = "#0aa";

                //     // ctx.fillRect(world_to_my_screen_left_top.x, world_to_my_screen_left_top.y, 10, 10);
                //     ctx.moveTo(world_to_my_screen_left_top.x, world_to_my_screen_left_top.y);
                //     ctx.lineTo(world_to_my_screen_right_bottom.x, world_to_my_screen_left_top.y);
                //     ctx.lineTo(world_to_my_screen_right_bottom.x, world_to_my_screen_right_bottom.y);
                //     ctx.lineTo(world_to_my_screen_left_top.x, world_to_my_screen_right_bottom.y);
                //     ctx.lineTo(world_to_my_screen_left_top.x, world_to_my_screen_left_top.y);
                //     ctx.stroke();
                //     // ctx.strokeRect(world_to_my_screen_left_top.x, world_to_my_screen_left_top.y,world_to_my_screen_right_bottom.x, world_to_my_screen_right_bottom.y,)
                //     ctx.closePath();

                //     // ctx.fillRect(start.x, start.y, end.x - start.x, end.y - start.y);
                // }
                // }
            }
        }

        private inSpace(src: TransformationSpace, des: TransformationSpace, point: Point): Point;
        private inSpace(src: TransformationSpace, des: TransformationSpace, x: number, y: number): Point;
        private inSpace(src: TransformationSpace, des: TransformationSpace, p1: Point | number, p2?: number): Point {
            const loc: Location = typeof p1 !== 'number' ? ("copyAndAdd" in p1 ? p1 : (Location.of(p1.x, p1.y))) : Location.of(p1, p2 || 0);

            return src.getInSpace(des, loc);
        }

        // endregion ViewPort


        // this.event["click"] = new NodeDrawer.Event(canvas, "click", this.sample_clickHandler);

        public sample_clickHandler(event: MouseEvent) {
            if (!event.shiftKey)
                return;
            const cursorLocation = new Location(event.clientX, event.clientY);
            const sourceWorld = this.getWorld()
            if (sourceWorld === undefined || this.getCurrentViewport() === undefined) { return; }

            const worldPoint = this.getCurrentViewport().getScreenSpace().getInSpace(this.getCurrentViewport().getWorldSpace(), cursorLocation);
            const node = new NodeDrawer.Node(worldPoint.x, worldPoint.y, 10, 10, "default");
            // temp
            const nodepool = sourceWorld.getChunkAt(Location.of(node.x, node.y)).getNodes();
            if (nodepool !== undefined && nodepool.length > 10) {
                nodepool.shift();
            }
            // /temp
            sourceWorld.addNode(node);

            this.getCurrentViewport().render();
        }

    }

    type EventList = { [key: string]: NodeDrawer.EventContainer<any> };

    export interface EventContainer<T> {
        on(): T;
        off(): T;
    }

    export class Event implements EventContainer<Event> {
        element: EventTarget;
        handler: (...arg: any) => void;
        name: string;

        constructor(element: typeof this.element, eventName: string, handler: typeof this.handler) {
            this.element = element;
            this.name = eventName;
            this.handler = handler;
        }
        public on() {
            this.element.addEventListener(this.name, this.handler);
            return this;
        }
        public off() {
            this.element.removeEventListener(this.name, this.handler);
            return this;
        }
    }

    export namespace Event {

        /**
         * This Class handles the Dragging; events 
         */
        export class Draggable implements EventContainer<Draggable> {
            protected select: HTMLElement;
            protected readonly cursorSpace: TransformationSpace; // screen space
            protected readonly interactionSpace: TransformationSpace; // world space
            protected readonly cb_update: (update: DraggableUpdateEvent) => void;
            protected readonly cb_end: undefined | ((update: DraggableUpdateEvent | undefined) => void);
            protected readonly cb_start: undefined | ((update: DraggableUpdateEvent) => void);
            protected event: EventList = {};
            private pointerId: number | undefined;

            protected startPointInInteractionSpace: Location | undefined;

            /**
             * 
             * @param select the Element to apply Handlers
             * @param cursorSpace 
             * @param interactionSpace 
             * @param update if value is undefined; then the method is called as an event chain for CANCEL
             * @param start called on first interaction
             */
            constructor(select: typeof this.select, cursorSpace: TransformationSpace, interactionSpace: TransformationSpace, update: typeof this.cb_update, start: typeof this.cb_start, end?: typeof this.cb_end) {
                this.select = select;
                this.cursorSpace = cursorSpace;
                this.interactionSpace = interactionSpace;
                this.cb_update = update;
                this.cb_start = start;
                this.cb_end = end;

                this.event["pointerdown"] = new NodeDrawer.Event(this.select, "pointerdown", this.ev_pointerdown.bind(this));
                this.event["pointermove"] = new NodeDrawer.Event(this.select, "pointermove", this.ev_pointermove.bind(this));
                this.event["pointerup"] = new NodeDrawer.Event(this.select, "pointerup", this.ev_pointerup.bind(this));
                this.event["pointercancel"] = new NodeDrawer.Event(this.select, "pointercancel", this.ev_pointercancel.bind(this));

                this.event["pointerdown"].on();
            }

            public inInteractionSpace(loc: Location): Location {
                return this.cursorSpace.getInSpace(this.interactionSpace, loc);
            }

            public inCursorSpace(loc: Location): Location {
                return this.interactionSpace.getInSpace(this.cursorSpace, loc);
            }

            protected ev_end(pointerEvent: PointerEvent): void {
                if (typeof this.cb_end === 'function' && typeof this.startPointInInteractionSpace !== 'undefined') {
                    const startPointOnCursorSpace = this.inCursorSpace(this.startPointInInteractionSpace);
                    const differenceInCursorSpace = Location.of(pointerEvent.clientX - startPointOnCursorSpace.x, pointerEvent.clientY - startPointOnCursorSpace.y);
                    const realPos: DraggableUpdateEvent = {
                        positionInTargetSpace: this.inInteractionSpace(differenceInCursorSpace.copyAndAdd(startPointOnCursorSpace)),
                        differenceInOriginSpace: differenceInCursorSpace, // difference 
                        target: this.interactionSpace, // world space
                        origin: this.cursorSpace // screen Space
                    }

                    this.cb_end(realPos);
                    this.startPointInInteractionSpace = undefined;
                }
            }

            protected ev_update(pointerEvent: PointerEvent): void {
                if (typeof this.startPointInInteractionSpace !== 'undefined') {
                    const startPointInCursorSpace = this.inCursorSpace(this.startPointInInteractionSpace);
                    const differenceInCursorSpace = Location.of(pointerEvent.clientX - startPointInCursorSpace.x, pointerEvent.clientY - startPointInCursorSpace.y);
                    const realPos: DraggableUpdateEvent = {
                        positionInTargetSpace: this.inInteractionSpace(differenceInCursorSpace.copyAndAdd(startPointInCursorSpace)),
                        differenceInOriginSpace: differenceInCursorSpace,
                        target: this.interactionSpace,
                        origin: this.cursorSpace
                    }

                    this.cb_update(realPos);
                }
            }
            protected ev_start(pointerEvent: PointerEvent): void {
                if (typeof this.startPointInInteractionSpace === "undefined")
                    return;

                const realPos: DraggableUpdateEvent = {
                    positionInTargetSpace: this.startPointInInteractionSpace.copy(),
                    differenceInOriginSpace: Location.of(0, 0),
                    target: this.interactionSpace,
                    origin: this.cursorSpace
                }
                if (typeof this.cb_start === 'function') {
                    this.cb_start(realPos);
                }
            }

            protected ev_pointerdown(pointerEvent: PointerEvent): void {
                if (pointerEvent.shiftKey)
                    return;

                this.select.setPointerCapture(pointerEvent.pointerId);
                this.pointerId = pointerEvent.pointerId;
                this.startPointInInteractionSpace = this.inInteractionSpace(Location.of(pointerEvent.clientX, pointerEvent.clientY));

                this.ev_start(pointerEvent);

                this.event["pointermove"].on();
                this.event["pointerup"].on();
                this.event["pointercancel"].on();
            }
            protected ev_pointermove(pointerEvent: PointerEvent): void {
                this.ev_update(pointerEvent);
            }
            protected ev_pointerup(pointerEvent: PointerEvent): void {
                this.select.releasePointerCapture(pointerEvent.pointerId);
                this.pointerId = undefined;

                this.event["pointermove"].off();
                this.event["pointerup"].off();
                this.event["pointercancel"].off();
                this.ev_update(pointerEvent);
                this.ev_end(pointerEvent);
            }
            protected ev_pointercancel(pointerEvent: PointerEvent): void {
                this.select.releasePointerCapture(pointerEvent.pointerId);
                this.pointerId = undefined;

                this.event["pointermove"].off();
                this.event["pointerup"].off();
                this.event["pointercancel"].off();
                this.ev_update(pointerEvent);
                this.ev_end(pointerEvent);
            }

            public discard(): void {
                if (typeof this.pointerId !== 'undefined') {
                    this.select.releasePointerCapture(this.pointerId);
                    this.pointerId = undefined;
                }
                this.event["pointerdown"].off();
                this.event["pointermove"].off();
                this.event["pointerup"].off();
                this.event["pointercancel"].off();
            }

            public off(): typeof this {
                if (typeof this.pointerId !== 'undefined') {
                    this.select.releasePointerCapture(this.pointerId);
                    this.pointerId = undefined;
                }
                this.event["pointerdown"].off();
                this.event["pointermove"].off();
                this.event["pointerup"].off();
                this.event["pointercancel"].off();
                if (typeof this.cb_end === 'function')
                    this.cb_end(undefined);
                return this;
            }

            public on(): typeof this {
                this.event["pointerdown"].on();
                return this;
            }
        }

        export class Zoomable implements EventContainer<Zoomable> {
            protected readonly cursorSpace: TransformationSpace;
            protected readonly interactionSpace: TransformationSpace;
            protected element: NodeDrawingContext<Contexts>;
            protected event: EventList = {};
            protected zoomspeed: number = 1.2; // limit: >1.00

            constructor(element: typeof this.element, cursorSpace: typeof this.cursorSpace, interactionSpace: typeof this.interactionSpace) {
                this.element = element;
                this.cursorSpace = cursorSpace;
                this.interactionSpace = interactionSpace;

                // const p = this.element.canvas as HTMLCanvasElement;
                // p.addEventListener

                if ("addEventListener" in this.element.canvas) {
                    // this.element.canvas
                }

                this.event["wheel"] = new NodeDrawer.Event(this.element.canvas, "wheel", this.ev_wheel.bind(this));
            }

            protected ev_wheel(wheel: WheelEvent): void {
                let zoomLevel = this.interactionSpace.scale;
                const wheelLocation = Location.of(wheel.clientX, wheel.clientY)
                const interactionPosition = this.cursorSpace.getInSpace(this.interactionSpace, wheelLocation);

                // let level = 0;
                // if (zoomLevel >= 1) {
                //     level = Math.round(2 * (zoomLevel - 1));
                // } else {
                //     level = Math.round(1 - (1 / zoomLevel));
                // }
                if (wheel.deltaY < 0) { // zoomout
                    zoomLevel = zoomLevel / this.zoomspeed;
                    // level--;
                } else if (wheel.deltaY > 0) { // zoomin
                    // level++;
                    zoomLevel = zoomLevel * this.zoomspeed;
                }
                // if (level >= 0) {
                //     zoomLevel = Math.floor(level) / 2 + 1;
                // } else {
                //     zoomLevel = 1 / (1 - level);
                // }

                this.interactionSpace.scale = zoomLevel;
                const reverseSearchOfOldPosition = this.interactionSpace.getInSpace(this.cursorSpace, interactionPosition);
                const difference = wheelLocation.copyAndSubtract(reverseSearchOfOldPosition);

                this.interactionSpace.setLocation(this.interactionSpace.x - difference.x, this.interactionSpace.y - difference.y, zoomLevel);
                this.element.updateScreenBounds();
                this.element.getCurrentViewport().render();
            }

            public on(): typeof this {
                this.event["wheel"].on();
                return this;
            }

            public off(): typeof this {
                this.event["wheel"].off();
                return this;
            }

        }

        export class RequestAnimationFrame implements EventContainer<RequestAnimationFrame> {
            handler: (timeDelta?: number) => void;
            callback: (delta: number) => void;
            private lastHandleId: number | undefined = undefined;

            constructor(handler: typeof this.handler) {
                this.handler = handler;
                this.callback = this.run.bind(this);
            }
            run(delta: number) {
                this.handler();
                this.lastHandleId = requestAnimationFrame(this.callback);
            }

            on(): RequestAnimationFrame {
                if (this.lastHandleId == undefined) {
                    this.lastHandleId = requestAnimationFrame(this.callback);
                }

                return this;
            }
            off(): RequestAnimationFrame {
                if (this.lastHandleId != undefined) {
                    cancelAnimationFrame(this.lastHandleId);
                    this.lastHandleId = undefined;
                }
                return this;
            }
        }
    }

    // export interface EventListenable {
    //     event:{[name:K extends keyof HTMLElementEventMap]:(event:HTMLElementEventMap[K])=>void}
    // }

    export function resizeHandler(entries: ResizeObserverEntry[]) {
        if (typeof entries !== "undefined" && entries.length >= 1) {
            for (const entry of entries) {
                const canvas = entry.target.querySelector("canvas");
                if (canvas != undefined) {
                    const context = NodeDrawer.getContext(canvas);
                    context.updateScreenBounds();
                    context.getCurrentViewport().render();
                }
            }
        }
    }

    export class Location {
        public x: number = 0;
        public y: number = 0;
        constructor(x: number, y: number) {
            this.x = x;
            this.y = y;
        }

        static of(x: number, y: number): Location {
            return new Location(x, y);
        }

        public copy() {
            return Location.of(this.x, this.y);
        }
        public copyAndAdd(other: Location) {
            return Location.of(this.x + other.x, this.y + other.y);
        }

        public copyAndSubtract(other: Location) {
            return Location.of(this.x - other.x, this.y - other.y);
        }

        static ZERO(): Location { return Location.of(0, 0); }
    }

    export class TransformationSpace {
        static readonly globalSpace: TransformationSpace = new TransformationSpace();
        x: number;
        y: number;
        scale: number;

        constructor();
        constructor(x: number, y: number, scale: number);
        constructor(x?: number, y?: number, scale?: number) {
            this.x = x || 0;
            this.y = y || 0;
            this.scale = scale || 1;
        }

        public setLocation(x: number, y: number, scale: number | undefined): void {
            this.x = x;
            this.y = y;
            if (typeof scale !== "undefined") {
                this.scale = scale;
            }
            this.normalize();
        }

        public getInSpace(targetSpace: TransformationSpace, location: Point): Location {
            const globalSpace_x = (location.x / this.scale) - this.x;
            const globalSpace_y = (location.y / this.scale) - this.y;
            return new Location((globalSpace_x + targetSpace.x) * targetSpace.scale, (globalSpace_y + targetSpace.y) * targetSpace.scale)
        }

        public getInGlobalSpace(location: Point): Location {
            return this.getInSpace(TransformationSpace.globalSpace, location);
        }

        public normalize() {
            if (this.scale <= 0) {
                this.scale = 1e-8;
            }
        }
    }

    /**
     * A Viewport can be explained as a connection between an RenderingElement and the virtual RenderingContext of NodeDrawer.
     */
    export interface Viewport<T extends Contexts> {
        getScreenSpace(): TransformationSpace;
        getWorldSpace(): TransformationSpace;

        getScreenBoundingBox(): Collisions2D.BoundingBox;

        setWorld(world: World<World.Chunk> | undefined): void;

        /** 
         * force an size change on the viewport element!
         */
        updateSize(w: number, h: number): void;

        render(): void;
    }

    // export class OffscreenViewport extends Viewport {
    //     public render(): void { }
    // }

    export interface World<T extends World.Chunk> {
        // getSpace(): TransformationSpace;
        hasChunk(chunk_location: Location): boolean;
        getChunk<F extends boolean>(create: F, chunk_location: Location): F extends true ? T : (T | undefined);
        getChunkLocation(world_location: Location): Location;
        getChunkAt(world_location: Location): T;
        addNode(node: NodeDrawer.Node): void;
        updateNodeLocation(node: NodeDrawer.Node, new_world_location: Location): void;
        getNodesAt(world_location: Location): NodeDrawer.Node[];
        getNodesInArea(create: boolean, world_area: Collisions2D.BoundingBox): NodeDrawer.Node[];
    }

    export class DefaultWorld implements World<World.Positioned_Chunk> {
        chunkSize: number;
        chunks: { [chunkIndex: string]: World.Positioned_Chunk } = {};

        constructor(chunkSize: number) {
            this.chunkSize = Math.round(chunkSize);
        }

        /// currently this is only for 2D
        public hasChunk(chunk_location: Location): boolean {
            return (chunk_location.x + "_" + chunk_location.y) in this.chunks;
        }
        public getChunkLocation(world_location: Location): Location {
            return Location.of(Math.floor(world_location.x / this.chunkSize), Math.floor(world_location.y / this.chunkSize));
        }
        public getChunk<T extends boolean>(create: T, chunk_location: Location): T extends true ? World.Positioned_Chunk : (World.Positioned_Chunk | undefined) {
            let chunk = this.chunks[chunk_location.x + "_" + chunk_location.y];
            if (typeof chunk === "undefined" && create) {
                chunk = this.chunks[chunk_location.x + "_" + chunk_location.y] = new NodeDrawer.World.Positioned_Chunk(chunk_location.x, chunk_location.y, this.chunkSize);
            }
            return chunk;
        }
        public getChunkAt(world_location: Location): World.Positioned_Chunk {
            return this.getChunk(true, this.getChunkLocation(world_location));
        }
        public addNode(node: NodeDrawer.Node): void {
            this.getChunkAt(node.getLocation()).addNode(node);
        }

        public getNodesInArea(create: boolean, world_area: Collisions2D.BoundingBox): NodeDrawer.Node[] {
            const result: NodeDrawer.Node[] = [];
            // here we can just calculate the Chunk sizes and based on that, load the chunks.
            const chunk_TopLeft: Point = { x: Math.floor(world_area.x / this.chunkSize), y: Math.floor(world_area.y / this.chunkSize) };
            const chunk_BottomRight: Point = { x: Math.floor(world_area.mx / this.chunkSize), y: Math.floor(world_area.my / this.chunkSize) };
            // const width: number = Math.floor((world_area.mx - world_area.x) / this.chunkSize);
            // const height: number = Math.floor((world_area.my - world_area.y) / this.chunkSize);
            for (let x = chunk_TopLeft.x; x <= chunk_BottomRight.x; x++) {
                for (let y = chunk_TopLeft.y; y <= chunk_BottomRight.y; y++) {
                    const loc = Location.of(x, y);
                    const currentChunk = this.getChunk(create, loc);
                    if (currentChunk != undefined) {
                        const nodesInChunk = currentChunk.getNodes();
                        for (const node of nodesInChunk) {
                            if (node.getCollision().getBoundingBox().doBoundBoxCollide(world_area) !== false) {
                                result.push(node);
                            }
                        }
                    }
                }
            }
            return result;
        }

        public updateNodeLocation(node: NodeDrawer.Node, new_world_location: Location): void {
            const oldLocation = node.getLocation();
            this.getChunkAt(oldLocation).dropNode(node);
            node.setLocation(new_world_location);
            this.getChunkAt(new_world_location).addNode(node);
        }

        public getNodesAt(world_location: Location): Array<NodeDrawer.Node> {
            const returnValue: NodeDrawer.Node[] = [];

            // min search radius is 2 chunks;
            const root_location = this.getChunkLocation(world_location);
            const radius = [[-1, -1], [0, -1], [-1, 0], [0, 0]];
            for (const [offset_x, offset_y] of radius) {
                const chunk = this.getChunk(false, root_location.copyAndAdd(Location.of(offset_x, offset_y)));
                if (typeof chunk !== 'undefined') {
                    for (const node of chunk.getNodes()) {
                        // todo ! here collision must be checked with geometry, not with bounding box!
                        if (node.getCollision().getBoundingBox().isPointTouching(world_location)) {
                            returnValue.push(node);
                        }
                    }
                }
            }

            return returnValue;
        }
    }
    export class OneChunkWorld implements World<World.Chunk> {
        the_chunk: World.Chunk;
        constructor() {
            this.the_chunk = new World.Chunk();
        }
        hasChunk(location: Location): boolean {
            return true;
        }
        getChunk<F extends boolean>(create: F, location: Location): F extends true ? World.Chunk : World.Chunk | undefined {
            return this.the_chunk;
        }
        getChunkAt(location: Location): World.Chunk {
            return this.the_chunk;
        }
        /// currently this is only for 2D

        getChunkLocation(world_location: Location): Location {
            return Location.of(0, 0);
        }
        public addNode(node: NodeDrawer.Node) {
            this.the_chunk.addNode(node);
        }
        public updateNodeLocation(node: NodeDrawer.Node, new_loc: Location): void {
            node.setLocation(new_loc);
        }

        getNodesAt(world_location: Location): Array<NodeDrawer.Node> {
            const result = [];
            const nodes = this.the_chunk.getNodes();
            for (const node of nodes) {
                if (node.getCollision().getBoundingBox().isPointTouching(world_location)) {
                    result.push(node);
                }
            }
            return result;
        }
        getNodesInArea(create: boolean, world_area: Collisions2D.BoundingBox): NodeDrawer.Node[] {
            const result = [];
            const nodes = this.the_chunk.getNodes();
            for (const node of nodes) {
                if (node.getCollision().getBoundingBox().doBoundBoxCollide(world_area) !== false) {
                    result.push(node);
                }
            }
            return result;
        }
    }
    export namespace World {
        export class Chunk {
            nodes: { [id: number | string]: Node } = {};
            public addNode(node: NodeDrawer.Node) {
                this.nodes[node.nodeID] = node;
            }
            public getNodes(): NodeDrawer.Node[] {
                const value = [];
                for (const node in this.nodes) {
                    value.push(this.nodes[node]);
                }
                return value;
            }
            public dropNode(node: NodeDrawer.Node): void {
                delete this.nodes[node.nodeID];
            }
        }

        export class Positioned_Chunk extends Chunk {
            x: number;
            y: number;
            chunksize: number;
            constructor(x: number, y: number, chunksize: number) {
                super();
                this.x = x;
                this.y = y;
                this.chunksize = chunksize;
            }
        }
    }
    export class Node {
        static staticNodeId = 0;
        nodeID: number;
        x: number;
        y: number;
        w: number;
        h: number;
        nodeTypeId: string;
        metadata: { [key: string]: any } = {};
        constructor(x: number, y: number, w: number, h: number, nodeTypeId: string) {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.nodeTypeId = nodeTypeId;
            this.nodeID = ++Node.staticNodeId;
        }

        public setLocation(loc: Location) {
            this.x = loc.x;
            this.y = loc.y;
        }
        public getLocation(): Location {
            return Location.of(this.x, this.y);
        }

        public getCollision(): NodeDrawer.Collision2D {
            return NodeRenderFactory.getCollision(this.nodeTypeId, this);
        }

        /** this method will update the collision of the Node! */
        public updatePos(): void {
        }

        public getMetadata(): typeof this.metadata {
            return this.metadata;
        }
        public mergeMetadata(merger: { [key: string]: any }): void {
            this.metadata = Object.assign(this.metadata, merger);
        }
    }

    export class NodeRenderFactory {
        static renderers: { [id: string]: NodeRenderer | NodeRendererRenderingMethod } = {};
        static colliders: { [id: string]: NodeRenderer | NodeRendererCollisionMethod } = {};
        static default_renderer: NodeRenderer;

        public static add(id: string, renderer: NodeRenderer) {
            NodeRenderFactory.renderers[id] = renderer;
            NodeRenderFactory.colliders[id] = renderer;
        }

        public static addRenderer(id: string, renderer: NodeRenderer | NodeRendererRenderingMethod) {
            NodeRenderFactory.renderers[id] = renderer;
        }
        public static addCustomCollision(id: string, collisionCalculator: NodeRenderer | NodeRendererCollisionMethod) {
            NodeRenderFactory.renderers[id] = collisionCalculator;
        }

        public static revoke(id: string) {
            delete NodeRenderFactory.renderers[id];
        }

        public static render(id: string, node: NodeDrawer.Node, context: NodeDrawingContainer<Contexts>): void {
            const val = NodeRenderFactory.renderers[id];
            if (typeof val === 'undefined')
                NodeRenderFactory.default_renderer.render(node, context);
            else if (typeof val === 'function')
                val(node, context);
            else
                val.render(node, context);
        }

        public static getCollision(id: string, node: NodeDrawer.Node): Collision2D {
            const val = NodeRenderFactory.colliders[id];
            if (typeof val === 'undefined')
                return NodeRenderFactory.default_renderer.evalCollision(node);
            else if (typeof val === 'function')
                return val(node);
            else
                return val.evalCollision(node);
        }

        public static hasRenderer(id: string): boolean {
            return typeof NodeRenderFactory.renderers[id] !== 'undefined';
        }

        public static hasCustomCollision(id: string): boolean {
            return typeof NodeRenderFactory.colliders[id] !== 'undefined';
        }
    }

    export interface NodeRenderer {
        /** 
         * use "context.getPositionInWorld({x:number,y:number});" to get a position from the world inside the canvas.
         */
        render(node: NodeDrawer.Node, context: NodeDrawingContainer<Contexts>): void;
        evalCollision(node: NodeDrawer.Node): Collision2D;
    }
    export type NodeRendererRenderingMethod = (node: NodeDrawer.Node, context: NodeDrawingContainer<Contexts>) => void;
    export type NodeRendererCollisionMethod = (node: NodeDrawer.Node) => Collision2D;

    class DefaultNodeRenderer implements NodeRenderer {
        evalCollision(node: NodeDrawer.Node): Collision2D {
            return new NodeDrawer.Collisions2D.Box(node.x, node.y, node.w, node.h);
        }
        render(node: NodeDrawer.Node, context: NodeDrawingContainer<Contexts>): void {
            const ctx = context.context();
            if ("fill" in ctx) {
                ctx.beginPath();
                const location = context.mapOntoNode(node).round(0,undefined);
                ctx.fillStyle = "#ff00ff";
                ctx.fillRect(location.x,location.y,location.mx,location.my);
            }
        }
    }

    type Point = { x: number, y: number } | Location;
    /**
     * A 2D connected Polyline (Approximation) 
     * i think of a list of dots wound in a clockwise order of filling. 
     * example topRight, bottomRight, bottomLeft, topLeft, topRight makes a inside filled box. Reversing the order makes the box hollow.
     */
    export class Geometry2D {
        lines: Array<Point>;
        constructor(lines?: typeof this.lines) {
            if (lines == undefined)
                this.lines = [];
            else
                this.lines = lines;
        }
        public addPoint(point: Point): typeof this {
            this.lines.push(point);
            return this;
        }
        public static intersection(geo1: Geometry2D, geo2: Geometry2D): Geometry2D[] {
            return [];
        }
        public static union(geo1: Geometry2D, geo2: Geometry2D): Geometry2D[] {
            return [];
        }
        public static complement(geo1: Geometry2D, geo2: Geometry2D): Geometry2D[] {
            return [];
        }
    } // todo unimplemented!


    export interface Collision2D {
        getBoundingBox(): Collisions2D.BoundingBox;
        getGeometry(): Geometry2D;
        /**
         * Order of Collision Check :
         * - Line
         * - Box
         * - Polyline
         * - others
         * 
         * Meaning
         * - Comparing 2 Lines will be resolved by **Line**.
         * - Comparing a Box and a Line will be resolved by **Box**.
         * - Comparing 2 Boxes will be resolved by **Box**.  
         * - Comparing a Box and a Polyline will be resolved by **Polyline**.
         * - Comparing a any of the above with an "other" will ask the "other" to resolve the Collision.
         */
        intersects(other: Collision2D): boolean;
        // getGeometry():Geometry;
    }
    export namespace Collisions2D {
        export class BoundingBox {
            x: number; y: number; mx: number; my: number;
            private constructor(x: number, y: number, mx: number, my: number) {
                this.x = x;
                this.y = y;
                this.mx = mx;
                this.my = my;
            }

            public isValid(): boolean {
                return this.x < this.mx && this.y < this.my;
            }

            public static fromRelative(world_location: Point, width: number, heigth: number): Collisions2D.BoundingBox {
                return new Collisions2D.BoundingBox(world_location.x, world_location.y, world_location.x + width, world_location.y + heigth);
            }
            public static fromAbsolute(world_location: Point, max_x: number, max_y: number): Collisions2D.BoundingBox {
                return new Collisions2D.BoundingBox(world_location.x, world_location.y, max_x, max_y);
            }

            /**
             * Round the boundingbox by a specific amount; Modifies SELF!
             * @param by precisicion points, otherwise 0, also works with negative numbers; example 123.456: 0 = 123; 1 = 123.4; -1 = 120; -2= 100
             * @param inwards false = topleft is rounded down, bottomright is rounded up; true = topleft is rounded up, bottomright is rounded down; undefined = false
             * @returns self; but updated
             */
            public round(by: number | undefined, inwards: boolean | undefined): BoundingBox {
                const multiplier = Math.pow(10, 0 - (by || 0));
                const bounds = {
                    x: this.x * multiplier,
                    y: this.y * multiplier,
                    mx: this.mx * multiplier,
                    my: this.my * multiplier
                };
                if (inwards === true) {
                    bounds.x = Math.ceil(bounds.x) / multiplier;
                    bounds.y = Math.ceil(bounds.y) / multiplier;
                    bounds.mx = Math.floor(bounds.mx) / multiplier;
                    bounds.my = Math.floor(bounds.my) / multiplier;
                } else {
                    bounds.x = Math.floor(bounds.x) / multiplier;
                    bounds.y = Math.floor(bounds.y) / multiplier;
                    bounds.mx = Math.ceil(bounds.mx) / multiplier;
                    bounds.my = Math.ceil(bounds.my) / multiplier;
                }
                return BoundingBox.fromAbsolute(bounds, bounds.mx, bounds.my);
            }

            public updateRelative(world_location: Point, max_x: number, max_y: number): void;
            public updateRelative(x: number, y: number, max_x: number, max_y: number): void;
            public updateRelative(location_or_x: Point | number, max_x_or_y: number, max_y_or_max_x: number, none_or_max_y?: number): void {
                if (typeof location_or_x == 'number' && typeof none_or_max_y == 'number') {
                    this.x = location_or_x;
                    this.y = max_x_or_y;
                    this.mx = location_or_x + max_y_or_max_x;
                    this.my = max_x_or_y + none_or_max_y;
                } else if (typeof location_or_x !== 'number' && typeof location_or_x.x == 'number') {
                    this.x = location_or_x.x;
                    this.y = location_or_x.y;
                    this.mx = location_or_x.x + max_x_or_y;
                    this.my = location_or_x.y + max_y_or_max_x;
                } else {
                    console.error("ERROR");
                }
            }
            public updateAbsolute(world_location: Point, max_x: number, max_y: number): void;
            public updateAbsolute(x: number, y: number, max_x: number, max_y: number): void;
            public updateAbsolute(location_or_x: Point | number, max_x_or_y: number, max_y_or_max_x: number, none_or_max_y?: number): void {
                if (typeof location_or_x == 'number' && typeof none_or_max_y == 'number') {
                    this.x = location_or_x;
                    this.y = max_x_or_y;
                    this.mx = max_y_or_max_x;
                    this.my = none_or_max_y;
                } else if (typeof location_or_x !== 'number' && typeof location_or_x.x == 'number') {
                    this.x = location_or_x.x;
                    this.y = location_or_x.y;
                    this.mx = max_x_or_y;
                    this.my = max_y_or_max_x;
                } else {
                    console.error("ERROR");
                }
            }

            public doBoundBoxCollide(boundingBox: Collisions2D.BoundingBox): Collisions2D.BoundingBox | false {
                return Collisions2D.BoundingBox.doBoundBoxCollide(this, boundingBox);
            }

            /** x,mx - y,my inclusive */
            public isPointTouching(point: Point): boolean {
                return this.x <= point.x && point.x <= this.mx && this.y <= point.y && point.y <= this.my;
            }

            public static doBoundBoxCollide(bb: Collisions2D.BoundingBox, bb2: Collisions2D.BoundingBox): Collisions2D.BoundingBox | false {
                const colBox = new BoundingBox(Math.min(bb.x, bb2.x), Math.min(bb.y, bb2.y), Math.max(bb.mx, bb2.mx), Math.max(bb.my, bb2.my));

                if (colBox.isValid()) {
                    return colBox;
                } else return false;
            }
        }

        export class Box implements Collision2D {
            x: number; y: number; w: number; h: number;
            constructor(x: number, y: number, w: number, h: number) {
                this.x = x;
                this.y = y;
                this.w = w;
                this.h = h;
            }
            getBoundingBox(): Collisions2D.BoundingBox {
                return Collisions2D.BoundingBox.fromRelative(Location.of(this.x, this.y), this.w, this.h);
            }
            intersects(other: Collision2D): boolean {
                if (other instanceof Line) {
                    const bb2 = other.getBoundingBox();
                    if (this.getBoundingBox().doBoundBoxCollide(other.getBoundingBox()) === false)
                        return false;
                    return false; // todo incomplete
                } else if (other instanceof Box) {
                    return this.getBoundingBox().doBoundBoxCollide(other.getBoundingBox()) !== false;
                }
                else return other.intersects(this);
            }
            getGeometry(): Geometry2D {
                return new Geometry2D().addPoint({ x: this.x, y: this.y }).addPoint({ x: this.x, y: this.y + this.h }).addPoint({ x: this.x + this.w, y: this.y + this.h }).addPoint({ x: this.x + this.w, y: this.y });
            }
        }
        export class Line implements Collision2D {
            start: Point;
            end: Point;

            constructor(start: Point, end: Point);
            constructor(start_x: number, start_y: number, end_x: number, end_y: number);
            constructor(first: Point | number, second: Point | number, third?: number, fourth?: number) {
                if (typeof first == 'number' && typeof second == 'number' && typeof third == 'number' && typeof fourth == 'number') {
                    this.start = { x: first, y: second };
                    this.end = { x: third, y: fourth };
                } else if (typeof first == 'object' && 'x' in first && 'y' in first && typeof second == 'object' && 'x' in second && 'y' in second) {
                    this.start = first;
                    this.end = second;
                } else {
                    throw new Error("Invalid arguments, either use a (Point,Point) or (number,number,number,number) to construct a line");
                }
            }

            public static lineIntersection(l1_start_x: number, l1_start_y: number, l1_end_x: number, l1_end_y: number, l2_start_x: number, l2_start_y: number, l2_end_x: number, l2_end_y: number): Point | false {
                const r1 = l1_end_x - l1_start_x;
                const r2 = l1_end_y - l1_start_y;
                const r3 = l2_end_x - l2_start_x;
                const r4 = l2_end_y - l2_start_y;
                const a1 = l1_start_x;
                const a2 = l1_start_y;
                const a3 = l2_start_x;
                const a4 = l2_start_y;
                // note, maybe the start and end of either line is clipping, count this too!
                if (r3 * r2 - r4 * r1 == 0 || r4 * r1 - r3 * r2 == 0) return false;
                return {
                    x: (a1 * r3 * r2 - a3 * r4 * r1 + a4 * r1 * r3 - a2 * r1 * r3) / (r3 * r2 - r4 * r1),
                    y: (a2 * r4 * r1 - a4 * r3 * r2 + a3 * r2 * r4 - a1 * r2 * r4) / (r4 * r1 - r3 * r2)
                };
            }

            public static distance(a: Point, b: Point): number {
                return Math.hypot(b.x - a.x, b.y - a.y);
            }

            /**
             * Standing on Point:L1_start facing towards Point:L1_end, is the Point:L2_start to my Left / CounterClockwise?
             * Only Call this method, if the lines actually hit
             */
            public static windingIntersection(line_a: Line, line_b: Line, intersection: Point) {
                // https://youtu.be/yyJ-hdISgnw?t=194
                let BASE: Line;
                let END_START: Line;
                if (Line.isPointToMyRight(line_a.start.x, line_a.start.y, line_a.end.x, line_a.end.y, line_b.start.x, line_b.start.y)) {
                    END_START = line_a;
                    BASE = line_b;
                    // meaning: i am the END_START and line_b is the BASE
                } else {
                    BASE = line_a;
                    END_START = line_b;
                    // meaning: i am the BASE and line_b is the END_START
                }

                const length_end = Line.distance(END_START.start, intersection) / Line.distance(END_START.start, END_START.end);

                const value = { from: BASE, towards: END_START, crosspoint: intersection, inset: Math.floor(length_end * 100) / 100 };

                // based on observation, for 2 lines intersecting in A->B and C->D 
                // - the line A->B or B->A which has its point C to its RIGHT will be the point E;
                // - the line C->D or D->C which has its point A to its RIGHT will be the point F;
                // when going from point F->C or D, if the Point E is on its RIGHT, then F is BASE, otherwise E is BASE and the other is END_START (the starting point/line)
                // i want indexed: {start: BASE, collision: CollisionOf A,B,C,D, end: F-BASE+E, offset: distanceof collision-end / lengthof end }
                //  therefore you can take the last index and search for: 
                //  # if there is an index, where $.end is current.start, take the highest $.offset and the line will be: [$.collision,current.collision] and remove $ and current;
                //  # if there is not, then the line will be: [current.start,current.end]
                //  then for 

                // general idea
                // - i first check if the first point i want to add is inside the geometry.
                // - then for each index entry, 
                // - - i lookup my current line, if there is a intersection up ahead, that originates from the start of my line:
                // - - - take the other referenced line 
            }

            public static isPointToMyRight(self_start_x: number, self_start_y: number, self_end_x: number, self_end_y: number, point_x: number, point_y: number): boolean {
                return ((self_end_x - self_start_x) * (point_y - self_start_y) - (self_end_y - self_start_y) * (point_x - self_start_x)) > 0;
            }

            getBoundingBox(): Collisions2D.BoundingBox {
                return BoundingBox.fromAbsolute(Location.of(Math.min(this.start.x, this.end.x), Math.min(this.start.y, this.end.y)), Math.max(this.start.x, this.end.x), Math.max(this.start.y, this.end.y));
            }
            getGeometry(): Geometry2D {
                return new Geometry2D([this.start, this.end]);
            }
            intersects(other: Collision2D): boolean {
                if (other instanceof Line) {
                    return Line.lineIntersection(this.start.x, this.start.y, this.end.x, this.end.y, other.start.x, other.start.y, other.end.x, other.end.y) !== false;
                } else {
                    return false; // todo add logic again.
                }
            }
        }
        // export class Polyline implements Collision2D { }
    }
}

export default NodeDrawer;
(globalThis as any).NodeDrawer = NodeDrawer;
