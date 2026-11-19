/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	const __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	// define getter/value functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop));
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ 	
/************************************************************************/
let __webpack_exports__ = {};
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
function NodeDrawer(element) {
    return NodeDrawer.getContext(element);
}
(function (NodeDrawer) {
    function getContext(canvas) {
        if (typeof canvas === 'string') {
            if (canvas in NodeDrawingContext.data)
                return NodeDrawingContext.getData(canvas);
            else
                throw new Error("Context not initialized!");
        }
        return NodeDrawingContext.getData(NodeDrawingContext.getId(canvas));
    }
    NodeDrawer.getContext = getContext;
    function init(canvas, key, options, callback) {
        let element = NodeDrawingContext.getData(NodeDrawingContext.getId(canvas));
        if (typeof element !== "undefined") {
            return element;
        }
        const ctx = canvas.getContext(key, options);
        if (ctx != null) {
            element = new NodeDrawingContext(canvas, ctx);
            element.setup(callback);
            return element;
        }
        else {
            return null;
        }
    }
    NodeDrawer.init = init;
    /**
     * Creates a basic NodeDrawing Context
     *
     * @param canvas the element ; if a instance already is present on the Element, then a "Error" is thrown.
     * @param config (optional) settings
     * @returns the Container Context
     */
    function construct(canvas, config) {
        let element = NodeDrawingContext.getData(NodeDrawingContext.getId(canvas));
        if (element != undefined || canvas == undefined) {
            return element;
            // throw new Error("NodeDrawer already Constructed on Canvas");
        }
        const ctx = canvas.getContext("2d");
        if (ctx == null)
            throw new Error("Context creation on Element failed!");
        element = new NodeDrawingContext(canvas, ctx);
        const worldInitialScale = (config === null || config === void 0 ? void 0 : config.initialScale) || 1;
        const worldInitialX = (config === null || config === void 0 ? void 0 : config.initialX) || 0;
        const worldInitialY = (config === null || config === void 0 ? void 0 : config.initialY) || 0;
        element.getWorldSpace().setLocation(worldInitialX, worldInitialY, worldInitialScale);
        element.getWorldSpace().normalize();
        let world;
        if ((config === null || config === void 0 ? void 0 : config.world) === undefined) {
            const worldChunkSize = (config === null || config === void 0 ? void 0 : config.worldChunkSize) || 1e+4;
            if (worldChunkSize < 1) {
                world = new NodeDrawer.OneChunkWorld();
            }
            else {
                world = new NodeDrawer.DefaultWorld(worldChunkSize);
            }
        }
        else {
            world = config.world;
        }
        element.setWorld(world);
        if ((config === null || config === void 0 ? void 0 : config.draggableView) === true || (config === null || config === void 0 ? void 0 : config.draggableNodes) === true) {
            let currentDraggingNode = undefined;
            let currentDraggingNodeOffset = undefined;
            element.event.drag = new NodeDrawer.Event.Draggable(canvas, element.getCurrentViewport().getScreenSpace(), element.getCurrentViewport().getWorldSpace(), function (value) {
                if (value != undefined) {
                    if ((config === null || config === void 0 ? void 0 : config.draggableNodes) === true && currentDraggingNode != undefined && currentDraggingNodeOffset != undefined) {
                        world.updateNodeLocation(currentDraggingNode, NodeDrawer.Location.of(value.positionInTargetSpace.x + currentDraggingNodeOffset.x, value.positionInTargetSpace.y + currentDraggingNodeOffset.y));
                        currentDraggingNode.updatePos();
                    }
                    if ((config === null || config === void 0 ? void 0 : config.draggableView) === true && currentDraggingNode == undefined) {
                        value.target.x -= value.differenceInOriginSpace.x;
                        value.target.y -= value.differenceInOriginSpace.y;
                    }
                    element.getCurrentViewport().render();
                }
            }, function (value) {
                const _world = element.getWorld();
                if ((config === null || config === void 0 ? void 0 : config.draggableNodes) === true && _world != undefined) {
                    console.log(value.positionInTargetSpace);
                    const nodes = _world.getNodesAt(value.positionInTargetSpace);
                    if (nodes.length > 0) {
                        currentDraggingNode = nodes[0];
                    }
                    else {
                        currentDraggingNode = undefined;
                    }
                    if (currentDraggingNode != undefined) {
                        currentDraggingNodeOffset = NodeDrawer.Location.of(currentDraggingNode.x - value.positionInTargetSpace.x, currentDraggingNode.y - value.positionInTargetSpace.y);
                    }
                }
            });
            element.event.drag.on();
        }
        if ((config === null || config === void 0 ? void 0 : config.zoomable) === true) {
            element.event.zoom = new NodeDrawer.Event.Zoomable(element, element.getCurrentViewport().getScreenSpace(), element.getCurrentViewport().getWorldSpace());
            element.event.zoom.on();
        }
        if ((config === null || config === void 0 ? void 0 : config.hookAsAnimation) === true) {
            element.event.animation = new NodeDrawer.Event.RequestAnimationFrame(function () {
                element.getCurrentViewport().render();
            });
            element.event.animation.on();
        }
        return element;
    }
    NodeDrawer.construct = construct;
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
    class NodeDrawingContext {
        static getId(canvas) {
            let id = canvas === null || canvas === void 0 ? void 0 : canvas.id;
            if (id == undefined) {
                id = "NodeDrawer_" + (++NodeDrawingContext.contextId);
            }
            if (canvas && "id" in canvas && id != canvas.id) {
                canvas.id = id;
            }
            return id;
        }
        static getData(contextId) {
            return NodeDrawingContext.data[contextId];
        }
        constructor(viewer, ctx) {
            this.parent = null;
            this.event = {};
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
        setup(callback) {
            if (typeof callback === "function") {
                callback(NodeDrawer, this);
            }
            this.getCurrentViewport().render();
        }
        updateScreenBounds() {
            if (this.parent == null)
                return;
            const element_viewport_size = this.parent.getBoundingClientRect();
            this.screenSpace.setLocation(element_viewport_size.x, element_viewport_size.y, 1);
            this.getCurrentViewport().updateSize(element_viewport_size.width, element_viewport_size.height);
            this.boundingBox.updateRelative(this.screenSpace.x, this.screenSpace.y, element_viewport_size.width, element_viewport_size.height);
        }
        context() {
            return this.ctx;
        }
        setWorld(world) {
            this.world = world;
        }
        getWorld() {
            return this.world;
        }
        getScreenSpace() {
            return this.screenSpace;
        }
        getCurrentViewport() {
            return this;
        }
        /**
         * Get the Position of a POINT on GLOBAL_SCREEN, converted from the WORLD
         *
         * Where is Point A on Browser Screen if Point A describes a location in the World?
         */
        getPositionInWorld(pos, offset) {
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
        mapOntoNode(node) {
            // const start = this.getCurrentViewport().getWorldSpace().getInSpace(this.getCurrentViewport().getScreenSpace(), node.getLocation());
            // const end = this.getCurrentViewport().getWorldSpace().getInSpace(this.getCurrentViewport().getScreenSpace(), Location.of(node.x + node.w, node.y + node.h));
            const start = this.getCurrentViewport().getWorldSpace().getInGlobalSpace(node.getLocation());
            const end = this.getCurrentViewport().getWorldSpace().getInGlobalSpace(Location.of(node.x + node.w, node.y + node.h));
            return Collisions2D.BoundingBox.fromAbsolute(start, end.x, end.y);
        }
        getWorldSpace() {
            return this.worldSpace;
        }
        updateSize(w, h) {
            if (this.canvas != undefined) {
                this.canvas.width = w;
                this.canvas.height = h;
            }
        }
        getScreenBoundingBox() {
            return this.boundingBox;
        }
        render() {
            if (NodeDrawingContext.master == undefined && this.canvasId == 'master') {
                NodeDrawingContext.master = this;
            }
            if ("fill" in this.ctx) {
                this.ctx.reset();
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
            const world = this.getWorld();
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
        inSpace(src, des, p1, p2) {
            const loc = typeof p1 !== 'number' ? ("copyAndAdd" in p1 ? p1 : (Location.of(p1.x, p1.y))) : Location.of(p1, p2 || 0);
            return src.getInSpace(des, loc);
        }
        // endregion ViewPort
        // this.event["click"] = new NodeDrawer.Event(canvas, "click", this.sample_clickHandler);
        sample_clickHandler(event) {
            if (!event.shiftKey)
                return;
            const cursorLocation = new Location(event.clientX, event.clientY);
            const sourceWorld = this.getWorld();
            if (sourceWorld === undefined || this.getCurrentViewport() === undefined) {
                return;
            }
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
    // region static
    NodeDrawingContext.data = {};
    NodeDrawingContext.observer = undefined;
    NodeDrawingContext.contextId = 0;
    NodeDrawingContext.master = undefined;
    NodeDrawer.NodeDrawingContext = NodeDrawingContext;
    class Event {
        constructor(element, eventName, handler) {
            this.element = element;
            this.name = eventName;
            this.handler = handler;
        }
        on() {
            this.element.addEventListener(this.name, this.handler);
            return this;
        }
        off() {
            this.element.removeEventListener(this.name, this.handler);
            return this;
        }
    }
    NodeDrawer.Event = Event;
    (function (Event) {
        /**
         * This Class handles the Dragging; events
         */
        class Draggable {
            /**
             *
             * @param select the Element to apply Handlers
             * @param cursorSpace
             * @param interactionSpace
             * @param update if value is undefined; then the method is called as an event chain for CANCEL
             * @param start called on first interaction
             */
            constructor(select, cursorSpace, interactionSpace, update, start, end) {
                this.event = {};
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
            inInteractionSpace(loc) {
                return this.cursorSpace.getInSpace(this.interactionSpace, loc);
            }
            inCursorSpace(loc) {
                return this.interactionSpace.getInSpace(this.cursorSpace, loc);
            }
            ev_end(pointerEvent) {
                if (typeof this.cb_end === 'function' && typeof this.startPointInInteractionSpace !== 'undefined') {
                    const startPointOnCursorSpace = this.inCursorSpace(this.startPointInInteractionSpace);
                    const differenceInCursorSpace = Location.of(pointerEvent.clientX - startPointOnCursorSpace.x, pointerEvent.clientY - startPointOnCursorSpace.y);
                    const realPos = {
                        positionInTargetSpace: this.inInteractionSpace(differenceInCursorSpace.copyAndAdd(startPointOnCursorSpace)),
                        differenceInOriginSpace: differenceInCursorSpace, // difference 
                        target: this.interactionSpace, // world space
                        origin: this.cursorSpace // screen Space
                    };
                    this.cb_end(realPos);
                    this.startPointInInteractionSpace = undefined;
                }
            }
            ev_update(pointerEvent) {
                if (typeof this.startPointInInteractionSpace !== 'undefined') {
                    const startPointInCursorSpace = this.inCursorSpace(this.startPointInInteractionSpace);
                    const differenceInCursorSpace = Location.of(pointerEvent.clientX - startPointInCursorSpace.x, pointerEvent.clientY - startPointInCursorSpace.y);
                    const realPos = {
                        positionInTargetSpace: this.inInteractionSpace(differenceInCursorSpace.copyAndAdd(startPointInCursorSpace)),
                        differenceInOriginSpace: differenceInCursorSpace,
                        target: this.interactionSpace,
                        origin: this.cursorSpace
                    };
                    this.cb_update(realPos);
                }
            }
            ev_start(pointerEvent) {
                if (typeof this.startPointInInteractionSpace === "undefined")
                    return;
                const realPos = {
                    positionInTargetSpace: this.startPointInInteractionSpace.copy(),
                    differenceInOriginSpace: Location.of(0, 0),
                    target: this.interactionSpace,
                    origin: this.cursorSpace
                };
                if (typeof this.cb_start === 'function') {
                    this.cb_start(realPos);
                }
            }
            ev_pointerdown(pointerEvent) {
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
            ev_pointermove(pointerEvent) {
                this.ev_update(pointerEvent);
            }
            ev_pointerup(pointerEvent) {
                this.select.releasePointerCapture(pointerEvent.pointerId);
                this.pointerId = undefined;
                this.event["pointermove"].off();
                this.event["pointerup"].off();
                this.event["pointercancel"].off();
                this.ev_update(pointerEvent);
                this.ev_end(pointerEvent);
            }
            ev_pointercancel(pointerEvent) {
                this.select.releasePointerCapture(pointerEvent.pointerId);
                this.pointerId = undefined;
                this.event["pointermove"].off();
                this.event["pointerup"].off();
                this.event["pointercancel"].off();
                this.ev_update(pointerEvent);
                this.ev_end(pointerEvent);
            }
            discard() {
                if (typeof this.pointerId !== 'undefined') {
                    this.select.releasePointerCapture(this.pointerId);
                    this.pointerId = undefined;
                }
                this.event["pointerdown"].off();
                this.event["pointermove"].off();
                this.event["pointerup"].off();
                this.event["pointercancel"].off();
            }
            off() {
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
            on() {
                this.event["pointerdown"].on();
                return this;
            }
        }
        Event.Draggable = Draggable;
        class Zoomable {
            constructor(element, cursorSpace, interactionSpace) {
                this.event = {};
                this.zoomspeed = 1.2; // limit: >1.00
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
            ev_wheel(wheel) {
                let zoomLevel = this.interactionSpace.scale;
                const wheelLocation = Location.of(wheel.clientX, wheel.clientY);
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
                }
                else if (wheel.deltaY > 0) { // zoomin
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
            on() {
                this.event["wheel"].on();
                return this;
            }
            off() {
                this.event["wheel"].off();
                return this;
            }
        }
        Event.Zoomable = Zoomable;
        class RequestAnimationFrame {
            constructor(handler) {
                this.lastHandleId = undefined;
                this.handler = handler;
                this.callback = this.run.bind(this);
            }
            run(delta) {
                this.handler();
                this.lastHandleId = requestAnimationFrame(this.callback);
            }
            on() {
                if (this.lastHandleId == undefined) {
                    this.lastHandleId = requestAnimationFrame(this.callback);
                }
                return this;
            }
            off() {
                if (this.lastHandleId != undefined) {
                    cancelAnimationFrame(this.lastHandleId);
                    this.lastHandleId = undefined;
                }
                return this;
            }
        }
        Event.RequestAnimationFrame = RequestAnimationFrame;
    })(Event = NodeDrawer.Event || (NodeDrawer.Event = {}));
    // export interface EventListenable {
    //     event:{[name:K extends keyof HTMLElementEventMap]:(event:HTMLElementEventMap[K])=>void}
    // }
    function resizeHandler(entries) {
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
    NodeDrawer.resizeHandler = resizeHandler;
    class Location {
        constructor(x, y) {
            this.x = 0;
            this.y = 0;
            this.x = x;
            this.y = y;
        }
        static of(x, y) {
            return new Location(x, y);
        }
        copy() {
            return Location.of(this.x, this.y);
        }
        copyAndAdd(other) {
            return Location.of(this.x + other.x, this.y + other.y);
        }
        copyAndSubtract(other) {
            return Location.of(this.x - other.x, this.y - other.y);
        }
        static ZERO() { return Location.of(0, 0); }
    }
    NodeDrawer.Location = Location;
    class TransformationSpace {
        constructor(x, y, scale) {
            this.x = x || 0;
            this.y = y || 0;
            this.scale = scale || 1;
        }
        setLocation(x, y, scale) {
            this.x = x;
            this.y = y;
            if (typeof scale !== "undefined") {
                this.scale = scale;
            }
            this.normalize();
        }
        getInSpace(targetSpace, location) {
            const globalSpace_x = (location.x / this.scale) - this.x;
            const globalSpace_y = (location.y / this.scale) - this.y;
            return new Location((globalSpace_x + targetSpace.x) * targetSpace.scale, (globalSpace_y + targetSpace.y) * targetSpace.scale);
        }
        getInGlobalSpace(location) {
            return this.getInSpace(TransformationSpace.globalSpace, location);
        }
        normalize() {
            if (this.scale <= 0) {
                this.scale = 1e-8;
            }
        }
    }
    TransformationSpace.globalSpace = new TransformationSpace();
    NodeDrawer.TransformationSpace = TransformationSpace;
    class DefaultWorld {
        constructor(chunkSize) {
            this.chunks = {};
            this.chunkSize = Math.round(chunkSize);
        }
        /// currently this is only for 2D
        hasChunk(chunk_location) {
            return (chunk_location.x + "_" + chunk_location.y) in this.chunks;
        }
        getChunkLocation(world_location) {
            return Location.of(Math.floor(world_location.x / this.chunkSize), Math.floor(world_location.y / this.chunkSize));
        }
        getChunk(create, chunk_location) {
            let chunk = this.chunks[chunk_location.x + "_" + chunk_location.y];
            if (typeof chunk === "undefined" && create) {
                chunk = this.chunks[chunk_location.x + "_" + chunk_location.y] = new NodeDrawer.World.Positioned_Chunk(chunk_location.x, chunk_location.y, this.chunkSize);
            }
            return chunk;
        }
        getChunkAt(world_location) {
            return this.getChunk(true, this.getChunkLocation(world_location));
        }
        addNode(node) {
            this.getChunkAt(node.getLocation()).addNode(node);
        }
        getNodesInArea(create, world_area) {
            const result = [];
            // here we can just calculate the Chunk sizes and based on that, load the chunks.
            const chunk_TopLeft = { x: Math.floor(world_area.x / this.chunkSize), y: Math.floor(world_area.y / this.chunkSize) };
            const chunk_BottomRight = { x: Math.floor(world_area.mx / this.chunkSize), y: Math.floor(world_area.my / this.chunkSize) };
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
        updateNodeLocation(node, new_world_location) {
            const oldLocation = node.getLocation();
            this.getChunkAt(oldLocation).dropNode(node);
            node.setLocation(new_world_location);
            this.getChunkAt(new_world_location).addNode(node);
        }
        getNodesAt(world_location) {
            const returnValue = [];
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
    NodeDrawer.DefaultWorld = DefaultWorld;
    class OneChunkWorld {
        constructor() {
            this.the_chunk = new World.Chunk();
        }
        hasChunk(location) {
            return true;
        }
        getChunk(create, location) {
            return this.the_chunk;
        }
        getChunkAt(location) {
            return this.the_chunk;
        }
        /// currently this is only for 2D
        getChunkLocation(world_location) {
            return Location.of(0, 0);
        }
        addNode(node) {
            this.the_chunk.addNode(node);
        }
        updateNodeLocation(node, new_loc) {
            node.setLocation(new_loc);
        }
        getNodesAt(world_location) {
            const result = [];
            const nodes = this.the_chunk.getNodes();
            for (const node of nodes) {
                if (node.getCollision().getBoundingBox().isPointTouching(world_location)) {
                    result.push(node);
                }
            }
            return result;
        }
        getNodesInArea(create, world_area) {
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
    NodeDrawer.OneChunkWorld = OneChunkWorld;
    let World;
    (function (World) {
        class Chunk {
            constructor() {
                this.nodes = {};
            }
            addNode(node) {
                this.nodes[node.nodeID] = node;
            }
            getNodes() {
                const value = [];
                for (const node in this.nodes) {
                    value.push(this.nodes[node]);
                }
                return value;
            }
            dropNode(node) {
                delete this.nodes[node.nodeID];
            }
        }
        World.Chunk = Chunk;
        class Positioned_Chunk extends Chunk {
            constructor(x, y, chunksize) {
                super();
                this.x = x;
                this.y = y;
                this.chunksize = chunksize;
            }
        }
        World.Positioned_Chunk = Positioned_Chunk;
    })(World = NodeDrawer.World || (NodeDrawer.World = {}));
    class Node {
        constructor(x, y, w, h, nodeTypeId) {
            this.metadata = {};
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.nodeTypeId = nodeTypeId;
            this.nodeID = ++Node.staticNodeId;
        }
        setLocation(loc) {
            this.x = loc.x;
            this.y = loc.y;
        }
        getLocation() {
            return Location.of(this.x, this.y);
        }
        getCollision() {
            return NodeRenderFactory.getCollision(this.nodeTypeId, this);
        }
        /** this method will update the collision of the Node! */
        updatePos() {
        }
        getMetadata() {
            return this.metadata;
        }
        mergeMetadata(merger) {
            this.metadata = Object.assign(this.metadata, merger);
        }
    }
    Node.staticNodeId = 0;
    NodeDrawer.Node = Node;
    class NodeRenderFactory {
        static add(id, renderer) {
            NodeRenderFactory.renderers[id] = renderer;
            NodeRenderFactory.colliders[id] = renderer;
        }
        static addRenderer(id, renderer) {
            NodeRenderFactory.renderers[id] = renderer;
        }
        static addCustomCollision(id, collisionCalculator) {
            NodeRenderFactory.renderers[id] = collisionCalculator;
        }
        static revoke(id) {
            delete NodeRenderFactory.renderers[id];
        }
        static render(id, node, context) {
            const val = NodeRenderFactory.renderers[id];
            if (typeof val === 'undefined')
                NodeRenderFactory.default_renderer.render(node, context);
            else if (typeof val === 'function')
                val(node, context);
            else
                val.render(node, context);
        }
        static getCollision(id, node) {
            const val = NodeRenderFactory.colliders[id];
            if (typeof val === 'undefined')
                return NodeRenderFactory.default_renderer.evalCollision(node);
            else if (typeof val === 'function')
                return val(node);
            else
                return val.evalCollision(node);
        }
        static hasRenderer(id) {
            return typeof NodeRenderFactory.renderers[id] !== 'undefined';
        }
        static hasCustomCollision(id) {
            return typeof NodeRenderFactory.colliders[id] !== 'undefined';
        }
    }
    NodeRenderFactory.renderers = {};
    NodeRenderFactory.colliders = {};
    NodeDrawer.NodeRenderFactory = NodeRenderFactory;
    class DefaultNodeRenderer {
        evalCollision(node) {
            return new NodeDrawer.Collisions2D.Box(node.x, node.y, node.w, node.h);
        }
        render(node, context) {
            const ctx = context.context();
            if ("fill" in ctx) {
                ctx.beginPath();
                const location = context.mapOntoNode(node).round(0, undefined);
                ctx.fillStyle = "#ff00ff";
                ctx.fillRect(location.x, location.y, location.mx, location.my);
            }
        }
    }
    /**
     * A 2D connected Polyline (Approximation)
     * i think of a list of dots wound in a clockwise order of filling.
     * example topRight, bottomRight, bottomLeft, topLeft, topRight makes a inside filled box. Reversing the order makes the box hollow.
     */
    class Geometry2D {
        constructor(lines) {
            if (lines == undefined)
                this.lines = [];
            else
                this.lines = lines;
        }
        addPoint(point) {
            this.lines.push(point);
            return this;
        }
        static intersection(geo1, geo2) {
            return [];
        }
        static union(geo1, geo2) {
            return [];
        }
        static complement(geo1, geo2) {
            return [];
        }
    } // todo unimplemented!
    NodeDrawer.Geometry2D = Geometry2D;
    let Collisions2D;
    (function (Collisions2D) {
        class BoundingBox {
            constructor(x, y, mx, my) {
                this.x = x;
                this.y = y;
                this.mx = mx;
                this.my = my;
            }
            isValid() {
                return this.x < this.mx && this.y < this.my;
            }
            static fromRelative(world_location, width, heigth) {
                return new Collisions2D.BoundingBox(world_location.x, world_location.y, world_location.x + width, world_location.y + heigth);
            }
            static fromAbsolute(world_location, max_x, max_y) {
                return new Collisions2D.BoundingBox(world_location.x, world_location.y, max_x, max_y);
            }
            /**
             * Round the boundingbox by a specific amount; Modifies SELF!
             * @param by precisicion points, otherwise 0, also works with negative numbers; example 123.456: 0 = 123; 1 = 123.4; -1 = 120; -2= 100
             * @param inwards false = topleft is rounded down, bottomright is rounded up; true = topleft is rounded up, bottomright is rounded down; undefined = false
             * @returns self; but updated
             */
            round(by, inwards) {
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
                }
                else {
                    bounds.x = Math.floor(bounds.x) / multiplier;
                    bounds.y = Math.floor(bounds.y) / multiplier;
                    bounds.mx = Math.ceil(bounds.mx) / multiplier;
                    bounds.my = Math.ceil(bounds.my) / multiplier;
                }
                return BoundingBox.fromAbsolute(bounds, bounds.mx, bounds.my);
            }
            updateRelative(location_or_x, max_x_or_y, max_y_or_max_x, none_or_max_y) {
                if (typeof location_or_x == 'number' && typeof none_or_max_y == 'number') {
                    this.x = location_or_x;
                    this.y = max_x_or_y;
                    this.mx = location_or_x + max_y_or_max_x;
                    this.my = max_x_or_y + none_or_max_y;
                }
                else if (typeof location_or_x !== 'number' && typeof location_or_x.x == 'number') {
                    this.x = location_or_x.x;
                    this.y = location_or_x.y;
                    this.mx = location_or_x.x + max_x_or_y;
                    this.my = location_or_x.y + max_y_or_max_x;
                }
                else {
                    console.error("ERROR");
                }
            }
            updateAbsolute(location_or_x, max_x_or_y, max_y_or_max_x, none_or_max_y) {
                if (typeof location_or_x == 'number' && typeof none_or_max_y == 'number') {
                    this.x = location_or_x;
                    this.y = max_x_or_y;
                    this.mx = max_y_or_max_x;
                    this.my = none_or_max_y;
                }
                else if (typeof location_or_x !== 'number' && typeof location_or_x.x == 'number') {
                    this.x = location_or_x.x;
                    this.y = location_or_x.y;
                    this.mx = max_x_or_y;
                    this.my = max_y_or_max_x;
                }
                else {
                    console.error("ERROR");
                }
            }
            doBoundBoxCollide(boundingBox) {
                return Collisions2D.BoundingBox.doBoundBoxCollide(this, boundingBox);
            }
            /** x,mx - y,my inclusive */
            isPointTouching(point) {
                return this.x <= point.x && point.x <= this.mx && this.y <= point.y && point.y <= this.my;
            }
            static doBoundBoxCollide(bb, bb2) {
                const colBox = new BoundingBox(Math.min(bb.x, bb2.x), Math.min(bb.y, bb2.y), Math.max(bb.mx, bb2.mx), Math.max(bb.my, bb2.my));
                if (colBox.isValid()) {
                    return colBox;
                }
                else
                    return false;
            }
        }
        Collisions2D.BoundingBox = BoundingBox;
        class Box {
            constructor(x, y, w, h) {
                this.x = x;
                this.y = y;
                this.w = w;
                this.h = h;
            }
            getBoundingBox() {
                return Collisions2D.BoundingBox.fromRelative(Location.of(this.x, this.y), this.w, this.h);
            }
            intersects(other) {
                if (other instanceof Line) {
                    const bb2 = other.getBoundingBox();
                    if (this.getBoundingBox().doBoundBoxCollide(other.getBoundingBox()) === false)
                        return false;
                    return false; // todo incomplete
                }
                else if (other instanceof Box) {
                    return this.getBoundingBox().doBoundBoxCollide(other.getBoundingBox()) !== false;
                }
                else
                    return other.intersects(this);
            }
            getGeometry() {
                return new Geometry2D().addPoint({ x: this.x, y: this.y }).addPoint({ x: this.x, y: this.y + this.h }).addPoint({ x: this.x + this.w, y: this.y + this.h }).addPoint({ x: this.x + this.w, y: this.y });
            }
        }
        Collisions2D.Box = Box;
        class Line {
            constructor(first, second, third, fourth) {
                if (typeof first == 'number' && typeof second == 'number' && typeof third == 'number' && typeof fourth == 'number') {
                    this.start = { x: first, y: second };
                    this.end = { x: third, y: fourth };
                }
                else if (typeof first == 'object' && 'x' in first && 'y' in first && typeof second == 'object' && 'x' in second && 'y' in second) {
                    this.start = first;
                    this.end = second;
                }
                else {
                    throw new Error("Invalid arguments, either use a (Point,Point) or (number,number,number,number) to construct a line");
                }
            }
            static lineIntersection(l1_start_x, l1_start_y, l1_end_x, l1_end_y, l2_start_x, l2_start_y, l2_end_x, l2_end_y) {
                const r1 = l1_end_x - l1_start_x;
                const r2 = l1_end_y - l1_start_y;
                const r3 = l2_end_x - l2_start_x;
                const r4 = l2_end_y - l2_start_y;
                const a1 = l1_start_x;
                const a2 = l1_start_y;
                const a3 = l2_start_x;
                const a4 = l2_start_y;
                // note, maybe the start and end of either line is clipping, count this too!
                if (r3 * r2 - r4 * r1 == 0 || r4 * r1 - r3 * r2 == 0)
                    return false;
                return {
                    x: (a1 * r3 * r2 - a3 * r4 * r1 + a4 * r1 * r3 - a2 * r1 * r3) / (r3 * r2 - r4 * r1),
                    y: (a2 * r4 * r1 - a4 * r3 * r2 + a3 * r2 * r4 - a1 * r2 * r4) / (r4 * r1 - r3 * r2)
                };
            }
            static distance(a, b) {
                return Math.hypot(b.x - a.x, b.y - a.y);
            }
            /**
             * Standing on Point:L1_start facing towards Point:L1_end, is the Point:L2_start to my Left / CounterClockwise?
             * Only Call this method, if the lines actually hit
             */
            static windingIntersection(line_a, line_b, intersection) {
                // https://youtu.be/yyJ-hdISgnw?t=194
                let BASE;
                let END_START;
                if (Line.isPointToMyRight(line_a.start.x, line_a.start.y, line_a.end.x, line_a.end.y, line_b.start.x, line_b.start.y)) {
                    END_START = line_a;
                    BASE = line_b;
                    // meaning: i am the END_START and line_b is the BASE
                }
                else {
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
            static isPointToMyRight(self_start_x, self_start_y, self_end_x, self_end_y, point_x, point_y) {
                return ((self_end_x - self_start_x) * (point_y - self_start_y) - (self_end_y - self_start_y) * (point_x - self_start_x)) > 0;
            }
            getBoundingBox() {
                return BoundingBox.fromAbsolute(Location.of(Math.min(this.start.x, this.end.x), Math.min(this.start.y, this.end.y)), Math.max(this.start.x, this.end.x), Math.max(this.start.y, this.end.y));
            }
            getGeometry() {
                return new Geometry2D([this.start, this.end]);
            }
            intersects(other) {
                if (other instanceof Line) {
                    return Line.lineIntersection(this.start.x, this.start.y, this.end.x, this.end.y, other.start.x, other.start.y, other.end.x, other.end.y) !== false;
                }
                else {
                    return false; // todo add logic again.
                }
            }
        }
        Collisions2D.Line = Line;
        // export class Polyline implements Collision2D { }
    })(Collisions2D = NodeDrawer.Collisions2D || (NodeDrawer.Collisions2D = {}));
})(NodeDrawer || (NodeDrawer = {}));
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (NodeDrawer);
globalThis.NodeDrawer = NodeDrawer;

/******/ })()
;