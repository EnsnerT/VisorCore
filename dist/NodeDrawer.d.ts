type Contexts = RenderingContext | OffscreenRenderingContext;
type NodeDrawerConfig = {
    /** below 1 = infinite chunk size */
    worldChunkSize?: number;
    initialScale?: number;
    initialX?: number;
    initialY?: number;
    draggableView?: boolean;
    draggableNodes?: boolean;
    zoomable?: boolean;
    world?: NodeDrawer.World<NodeDrawer.World.Chunk>;
    /** should the render automatically update based on the requestAnimationFrame()? */
    hookAsAnimation?: boolean;
};
/**
 * Update Event. On Start the location in "target" is stored and all other calculations are made based on that.
 *
 * you can mutate any values for "target" or "origin", any other change must have no effect
 */
type DraggableUpdateEvent = {
    /** absolute position in "target" space */
    positionInTargetSpace: NodeDrawer.Location;
    /** relative position in "origin" space calculated from "target" space */
    differenceInOriginSpace: NodeDrawer.Location;
    /** the space which should affect the space "target"; example: WorldSpace */
    target: NodeDrawer.TransformationSpace;
    /** the space in which the event is calculated upon; example: ScreenSpace */
    origin: NodeDrawer.TransformationSpace;
};
declare function NodeDrawer(element: HTMLCanvasElement | string): NodeDrawer.NodeDrawingContext<Contexts>;
declare namespace NodeDrawer {
    export function getContext(canvas: HTMLCanvasElement | string): NodeDrawingContext<Contexts>;
    export function init(canvas: HTMLCanvasElement, key: string, options: any | undefined, callback: (nd: typeof NodeDrawer, context: NodeDrawingContext<Contexts>) => void): NodeDrawingContext<Contexts> | null;
    /**
     * Creates a basic NodeDrawing Context
     *
     * @param canvas the element ; if a instance already is present on the Element, then a "Error" is thrown.
     * @param config (optional) settings
     * @returns the Container Context
     */
    export function construct(canvas?: HTMLCanvasElement, config?: NodeDrawerConfig): NodeDrawer.NodeDrawingContext<Contexts>;
    export interface NodeDrawingContainer<T extends Contexts> {
        context(): T;
        getWorld(): World<World.Chunk> | undefined;
        setWorld(world: World<World.Chunk> | undefined): void;
        getCurrentViewport(): Viewport<T>;
        mapOntoNode(node: NodeDrawer.Node): Collisions2D.BoundingBox;
    }
    /**
     * A NodeDrawingContext can be explained as a connection between the DOM Lifecycle and RenderingElement
     */
    export class NodeDrawingContext<T extends Contexts> implements NodeDrawingContainer<T>, Viewport<T> {
        static data: {
            [contextId: string]: NodeDrawingContext<Contexts>;
        };
        static observer?: ResizeObserver;
        static contextId: number;
        static getId(canvas?: any): string;
        static getData<F extends NodeDrawingContext<Contexts>>(contextId: string): F;
        ctx: T;
        canvasId: string | undefined;
        canvas: HTMLCanvasElement | OffscreenCanvas;
        parent: HTMLElement | null;
        event: EventList;
        constructor(viewer: HTMLCanvasElement | OffscreenCanvas, ctx: T);
        setup(callback: (ND: typeof NodeDrawer, context: this) => void): void;
        updateScreenBounds(): void;
        context(): T;
        setWorld(world: World<World.Chunk> | undefined): void;
        getWorld(): World<World.Chunk> | undefined;
        getScreenSpace(): TransformationSpace;
        getCurrentViewport(): Viewport<T>;
        boundingBox: NodeDrawer.Collisions2D.BoundingBox;
        screenSpace: TransformationSpace;
        worldSpace: TransformationSpace;
        world: World<World.Chunk> | undefined;
        /**
         * Get the Position of a POINT on GLOBAL_SCREEN, converted from the WORLD
         *
         * Where is Point A on Browser Screen if Point A describes a location in the World?
         */
        getPositionInWorld(pos: Point, offset?: Partial<Point>): Point;
        /**
         *
         * @param node the node to map
         * @returns this
         */
        mapOntoNode(node: NodeDrawer.Node): Collisions2D.BoundingBox;
        getWorldSpace(): TransformationSpace;
        updateSize(w: number, h: number): void;
        getScreenBoundingBox(): Collisions2D.BoundingBox;
        static master: NodeDrawingContext<any> | undefined;
        render(): void;
        private inSpace;
        sample_clickHandler(event: MouseEvent): void;
    }
    type EventList = {
        [key: string]: NodeDrawer.EventContainer<any>;
    };
    export interface EventContainer<T> {
        on(): T;
        off(): T;
    }
    export class Event implements EventContainer<Event> {
        element: EventTarget;
        handler: (...arg: any) => void;
        name: string;
        constructor(element: typeof this.element, eventName: string, handler: typeof this.handler);
        on(): this;
        off(): this;
    }
    export namespace Event {
        /**
         * This Class handles the Dragging; events
         */
        class Draggable implements EventContainer<Draggable> {
            protected select: HTMLElement;
            protected readonly cursorSpace: TransformationSpace;
            protected readonly interactionSpace: TransformationSpace;
            protected readonly cb_update: (update: DraggableUpdateEvent) => void;
            protected readonly cb_end: undefined | ((update: DraggableUpdateEvent | undefined) => void);
            protected readonly cb_start: undefined | ((update: DraggableUpdateEvent) => void);
            protected event: EventList;
            private pointerId;
            protected startPointInInteractionSpace: Location | undefined;
            /**
             *
             * @param select the Element to apply Handlers
             * @param cursorSpace
             * @param interactionSpace
             * @param update if value is undefined; then the method is called as an event chain for CANCEL
             * @param start called on first interaction
             */
            constructor(select: typeof this.select, cursorSpace: TransformationSpace, interactionSpace: TransformationSpace, update: typeof this.cb_update, start: typeof this.cb_start, end?: typeof this.cb_end);
            inInteractionSpace(loc: Location): Location;
            inCursorSpace(loc: Location): Location;
            protected ev_end(pointerEvent: PointerEvent): void;
            protected ev_update(pointerEvent: PointerEvent): void;
            protected ev_start(pointerEvent: PointerEvent): void;
            protected ev_pointerdown(pointerEvent: PointerEvent): void;
            protected ev_pointermove(pointerEvent: PointerEvent): void;
            protected ev_pointerup(pointerEvent: PointerEvent): void;
            protected ev_pointercancel(pointerEvent: PointerEvent): void;
            discard(): void;
            off(): typeof this;
            on(): typeof this;
        }
        class Zoomable implements EventContainer<Zoomable> {
            protected readonly cursorSpace: TransformationSpace;
            protected readonly interactionSpace: TransformationSpace;
            protected element: NodeDrawingContext<Contexts>;
            protected event: EventList;
            protected zoomspeed: number;
            constructor(element: typeof this.element, cursorSpace: typeof this.cursorSpace, interactionSpace: typeof this.interactionSpace);
            protected ev_wheel(wheel: WheelEvent): void;
            on(): typeof this;
            off(): typeof this;
        }
        class RequestAnimationFrame implements EventContainer<RequestAnimationFrame> {
            handler: (timeDelta?: number) => void;
            callback: (delta: number) => void;
            private lastHandleId;
            constructor(handler: typeof this.handler);
            run(delta: number): void;
            on(): RequestAnimationFrame;
            off(): RequestAnimationFrame;
        }
    }
    export function resizeHandler(entries: ResizeObserverEntry[]): void;
    export class Location {
        x: number;
        y: number;
        constructor(x: number, y: number);
        static of(x: number, y: number): Location;
        copy(): Location;
        copyAndAdd(other: Location): Location;
        copyAndSubtract(other: Location): Location;
        static ZERO(): Location;
    }
    export class TransformationSpace {
        static readonly globalSpace: TransformationSpace;
        x: number;
        y: number;
        scale: number;
        constructor();
        constructor(x: number, y: number, scale: number);
        setLocation(x: number, y: number, scale: number | undefined): void;
        getInSpace(targetSpace: TransformationSpace, location: Point): Location;
        getInGlobalSpace(location: Point): Location;
        normalize(): void;
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
    export interface World<T extends World.Chunk> {
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
        chunks: {
            [chunkIndex: string]: World.Positioned_Chunk;
        };
        constructor(chunkSize: number);
        hasChunk(chunk_location: Location): boolean;
        getChunkLocation(world_location: Location): Location;
        getChunk<T extends boolean>(create: T, chunk_location: Location): T extends true ? World.Positioned_Chunk : (World.Positioned_Chunk | undefined);
        getChunkAt(world_location: Location): World.Positioned_Chunk;
        addNode(node: NodeDrawer.Node): void;
        getNodesInArea(create: boolean, world_area: Collisions2D.BoundingBox): NodeDrawer.Node[];
        updateNodeLocation(node: NodeDrawer.Node, new_world_location: Location): void;
        getNodesAt(world_location: Location): Array<NodeDrawer.Node>;
    }
    export class OneChunkWorld implements World<World.Chunk> {
        the_chunk: World.Chunk;
        constructor();
        hasChunk(location: Location): boolean;
        getChunk<F extends boolean>(create: F, location: Location): F extends true ? World.Chunk : World.Chunk | undefined;
        getChunkAt(location: Location): World.Chunk;
        getChunkLocation(world_location: Location): Location;
        addNode(node: NodeDrawer.Node): void;
        updateNodeLocation(node: NodeDrawer.Node, new_loc: Location): void;
        getNodesAt(world_location: Location): Array<NodeDrawer.Node>;
        getNodesInArea(create: boolean, world_area: Collisions2D.BoundingBox): NodeDrawer.Node[];
    }
    export namespace World {
        class Chunk {
            nodes: {
                [id: number | string]: Node;
            };
            addNode(node: NodeDrawer.Node): void;
            getNodes(): NodeDrawer.Node[];
            dropNode(node: NodeDrawer.Node): void;
        }
        class Positioned_Chunk extends Chunk {
            x: number;
            y: number;
            chunksize: number;
            constructor(x: number, y: number, chunksize: number);
        }
    }
    export class Node {
        static staticNodeId: number;
        nodeID: number;
        x: number;
        y: number;
        w: number;
        h: number;
        nodeTypeId: string;
        metadata: {
            [key: string]: any;
        };
        constructor(x: number, y: number, w: number, h: number, nodeTypeId: string);
        setLocation(loc: Location): void;
        getLocation(): Location;
        getCollision(): NodeDrawer.Collision2D;
        /** this method will update the collision of the Node! */
        updatePos(): void;
        getMetadata(): typeof this.metadata;
        mergeMetadata(merger: {
            [key: string]: any;
        }): void;
    }
    export class NodeRenderFactory {
        static renderers: {
            [id: string]: NodeRenderer | NodeRendererRenderingMethod;
        };
        static colliders: {
            [id: string]: NodeRenderer | NodeRendererCollisionMethod;
        };
        static default_renderer: NodeRenderer;
        static add(id: string, renderer: NodeRenderer): void;
        static addRenderer(id: string, renderer: NodeRenderer | NodeRendererRenderingMethod): void;
        static addCustomCollision(id: string, collisionCalculator: NodeRenderer | NodeRendererCollisionMethod): void;
        static revoke(id: string): void;
        static render(id: string, node: NodeDrawer.Node, context: NodeDrawingContainer<Contexts>): void;
        static getCollision(id: string, node: NodeDrawer.Node): Collision2D;
        static hasRenderer(id: string): boolean;
        static hasCustomCollision(id: string): boolean;
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
    type Point = {
        x: number;
        y: number;
    } | Location;
    /**
     * A 2D connected Polyline (Approximation)
     * i think of a list of dots wound in a clockwise order of filling.
     * example topRight, bottomRight, bottomLeft, topLeft, topRight makes a inside filled box. Reversing the order makes the box hollow.
     */
    export class Geometry2D {
        lines: Array<Point>;
        constructor(lines?: typeof this.lines);
        addPoint(point: Point): typeof this;
        static intersection(geo1: Geometry2D, geo2: Geometry2D): Geometry2D[];
        static union(geo1: Geometry2D, geo2: Geometry2D): Geometry2D[];
        static complement(geo1: Geometry2D, geo2: Geometry2D): Geometry2D[];
    }
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
    }
    export namespace Collisions2D {
        class BoundingBox {
            x: number;
            y: number;
            mx: number;
            my: number;
            private constructor();
            isValid(): boolean;
            static fromRelative(world_location: Point, width: number, heigth: number): Collisions2D.BoundingBox;
            static fromAbsolute(world_location: Point, max_x: number, max_y: number): Collisions2D.BoundingBox;
            /**
             * Round the boundingbox by a specific amount; Modifies SELF!
             * @param by precisicion points, otherwise 0, also works with negative numbers; example 123.456: 0 = 123; 1 = 123.4; -1 = 120; -2= 100
             * @param inwards false = topleft is rounded down, bottomright is rounded up; true = topleft is rounded up, bottomright is rounded down; undefined = false
             * @returns self; but updated
             */
            round(by: number | undefined, inwards: boolean | undefined): BoundingBox;
            updateRelative(world_location: Point, max_x: number, max_y: number): void;
            updateRelative(x: number, y: number, max_x: number, max_y: number): void;
            updateAbsolute(world_location: Point, max_x: number, max_y: number): void;
            updateAbsolute(x: number, y: number, max_x: number, max_y: number): void;
            doBoundBoxCollide(boundingBox: Collisions2D.BoundingBox): Collisions2D.BoundingBox | false;
            /** x,mx - y,my inclusive */
            isPointTouching(point: Point): boolean;
            static doBoundBoxCollide(bb: Collisions2D.BoundingBox, bb2: Collisions2D.BoundingBox): Collisions2D.BoundingBox | false;
        }
        class Box implements Collision2D {
            x: number;
            y: number;
            w: number;
            h: number;
            constructor(x: number, y: number, w: number, h: number);
            getBoundingBox(): Collisions2D.BoundingBox;
            intersects(other: Collision2D): boolean;
            getGeometry(): Geometry2D;
        }
        class Line implements Collision2D {
            start: Point;
            end: Point;
            constructor(start: Point, end: Point);
            constructor(start_x: number, start_y: number, end_x: number, end_y: number);
            static lineIntersection(l1_start_x: number, l1_start_y: number, l1_end_x: number, l1_end_y: number, l2_start_x: number, l2_start_y: number, l2_end_x: number, l2_end_y: number): Point | false;
            static distance(a: Point, b: Point): number;
            /**
             * Standing on Point:L1_start facing towards Point:L1_end, is the Point:L2_start to my Left / CounterClockwise?
             * Only Call this method, if the lines actually hit
             */
            static windingIntersection(line_a: Line, line_b: Line, intersection: Point): void;
            static isPointToMyRight(self_start_x: number, self_start_y: number, self_end_x: number, self_end_y: number, point_x: number, point_y: number): boolean;
            getBoundingBox(): Collisions2D.BoundingBox;
            getGeometry(): Geometry2D;
            intersects(other: Collision2D): boolean;
        }
    }
    export {};
}
export default NodeDrawer;
