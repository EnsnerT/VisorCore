(function NodeDrawer(_g){
    // "use strict";
    const _u = {
        getAll:function(s){return Array.from(document.querySelectorAll(s))},
        getSolo:function(s){return document.querySelector(s)},
        extendObject:function(b,e){return Object.defineProperties(b,Object.fromEntries(e.map(function(i){return Object.entries(Object.getOwnPropertyDescriptors(i));}).reduce(function(p,c){return(c.forEach(function(d){p.push(d);})),p;},[])));},
        defineClass:function(ns,s,c,p,u){u=_u.extendObject(u||{},[Object.fromEntries(Object.entries(s||{})),{'super':s}]);_u.extendObject((ns[c.name]=_u.extendObject(c,[u||{}])).prototype,[p||{},s&&Object.fromEntries(Object.entries(s.prototype))||{},{'static':u}])['super']=_u.extendObject((s||function(){}).bind(c.prototype),[s&&s.prototype||{}]);},
        // defineClass:function(ns,c,p,u){Object.assign((ns[c.name]=Object.assign(c,u||{})).prototype,p);},
        /** 
         * @param {{x:number,y:number}} location (unscaled)
         * @param {{x:number,y:number,scale:number}} transform (scaled optional) 
         * @param {{x:number,y:number}} offset (unscaled)
         */
        applyTransform:function(location,transform,offset){offset=offset||{x:0,y:0};transform=transform||{x:0,y:0,scale:1};return {
            x: ( (location.x - (offset.x + (transform.x * transform.scale))) / transform.scale),
            y: ( (location.y - (offset.y + (transform.y * transform.scale))) / transform.scale)
        }},
    };
    /** @import ND */
    const NodeDrawer = _g['NodeDrawer'] = Object.assign(function(element){
        return NodeDrawer.getContext(element);
    },{rendertypes:{},data:{}});

    NodeDrawer.setup = function(cb) {
        // context: always NodeDrawer;
        cb.call(NodeDrawer);
        
        if (typeof cb.context !== "undefined") {
            cb.context.getCurrentViewport().render();
        }
    };
    NodeDrawer.addNodeType = function (nodeTypeId,renderingOption,dataOption){
        NodeDrawer.rendertypes[nodeTypeId] = {
            rendering: renderingOption,
            data: dataOption,
        };
    };
    NodeDrawer.getContext = function(canvas){
        if (canvas === undefined) {
            const i = Object.entries(NodeDrawer.data);
            if (i.length == 1){
                return toContextual(i[0][1]);
            }
            return {};
        }
        const context = NodeDrawer.data[canvas.id];
        if(context == undefined)
            return toContextual(NodeDrawer.data[canvas.id]={canvas}); // this is a dummy, since setup -> init does the rest.
        return toContextual(NodeDrawer.data[canvas.id]);
    };

    const toContextual = function(c){
        const obj = {}

        obj.setup = function(cb) {
            // context: always NodeDrawer;
            cb.context = NodeDrawer.init(c.canvas);
            cb.call(NodeDrawer,cb.context);
            

            if (typeof cb.context !== "undefined") {
                cb.context.getCurrentViewport().render();
            }
        };

        obj.getCurrentViewport = function(){
            return c.viewport;
            // return NodeDrawer.data.viewport;
        };
        obj.setWorld = function (world) {
            c.world = world;
            // NodeDrawer.data.world = world;
            obj.getCurrentViewport().setWorld(world);
            // NodeDrawer.getCurrent
        };
        obj.getWorld = function () {
            return c.world;
        };
        obj.getCanvas = function () {
            return c.canvas;
        };
        obj.render = function () {
            obj.getCurrentViewport().render();
        };
        
        obj.addNodeType = function (nodeTypeId,renderingOption,dataOption){
            obj.rendertypes[nodeTypeId] = {
                rendering: renderingOption,
                data: dataOption,
            };
        };

        return Object.assign({},obj,c);
    }

    let contextId=0;
    NodeDrawer.init = function (canvas) {
        if (typeof canvas.id === "undefined") {
            canvas.id = "NodeDrawer_" + contextId++;
        }
        var canvasId = canvas.id;

        var context = NodeDrawer.data[canvasId];
        if (context == undefined) {
            NodeDrawer.data[canvasId] = context = {canvas};
        }
        
        let observer = arguments.callee.observer;
        if (typeof observer === "undefined") {
            observer = arguments.callee.observer = new ResizeObserver(NodeDrawer.resize);
        }
        
        const parent = canvas.parentElement;

        context.parent = parent;

        observer.observe(parent);

        /** @type {CanvasRenderingContext2D} */
        const ctx = context.ctx = canvas.getContext("2d");
        
        if (typeof context.screenSpace === "undefined") {
            context.screenSpace = new NodeDrawer.TransformationSpace(0,0,1); // only x & y
        }
        if (typeof context.viewport === "undefined") {
            context.viewport = new NodeDrawer.Viewport(canvas,ctx,context.screenSpace);
        }

        // #region setup canvas 
        let canvasLocation = parent.getBoundingClientRect();
        context.screenSpace.setLocation(canvasLocation.x,canvasLocation.y,1);

        if (typeof context.events === "undefined")
        {
            context.events = {
                "click": new NodeDrawer.Event(canvas,"click",(function(event){
                    if (!event.shiftKey)
                        return;
                    let pos = {
                        x:event.clientX,
                        y:event.clientY,
                        scale:1
                    };
                    let eventContext = NodeDrawer.getContext(canvas);
        
                    // the click is done on screenSpace
                    if (eventContext.getWorld() === undefined || eventContext.getCurrentViewport() === undefined){return;}
                    const worldPoint = eventContext.getCurrentViewport().getScreenSpace().getInSpace(eventContext.getWorld().getSpace(),pos.x,pos.y);
        
                    const node = new this.Node(worldPoint.x,worldPoint.y,10,10);
                    if (eventContext.getWorld().nodes.length > 10)
                        eventContext.getWorld().nodes.shift();
                    eventContext.getWorld().addNode(node);
                    // console.log(pos,NodeDrawer.data.screenSpace);
                    // ctx.fillRect(worldPoint.x-5,worldPoint.y-5,10,10);
                    eventContext.getCurrentViewport().render();
                }).bind(NodeDrawer)).on(),
            }
        }
        // #endregion
        return toContextual(context);
    }
    /** @param {ResizeObserverEntry[]} changedEntries */
    NodeDrawer.resize = function (changedEntries){
        if (typeof changedEntries !== "undefined" && changedEntries.length >= 1) {
            for (const entry of changedEntries) {
                const realSize = entry.target.getBoundingClientRect();
                const context = NodeDrawer.getContext(entry.target.querySelector("canvas"));
                context.getCurrentViewport().getScreenSpace().setLocation(Math.floor(realSize.x),Math.floor(realSize.y),1);
                context.getCurrentViewport().updateSize(Math.floor(realSize.width),Math.floor(realSize.height));
                context.render();
            }
        }
        // console.log(changedEntries[0].target);
    }
    _u.defineClass(NodeDrawer,function World(space,chunkSize){
        this.chunkSize = chunkSize;
        this.space = space;
        this.chunks = {};
        this.nodes = []; // removable
    },{
        getSpace(){
            return this.space;
        },
        addNode:function (node) {
            this.nodes.push(node);
        },
        testChunk:function (idX,idY) {
            return (idX+"_"+idY) in this.chunks;
        },
        getChunk:function (idX,idY) {
            let chunk = this.chunks[idX+"_"+idY];
            if (!chunk) {
                chunk = this.chunks[idX+"_"+idY] = new NodeDrawer.World.Chunk(idX,idY,this.chunkSize);
            }
        },
        getChunkAtPos:function (x,y) {
            return this.getChunk(x*this.chunkSize,y*this.chunkSize);
        },
        getNodeAtPos:function (x,y) {
            for (const node of this.nodes){
                if (node.getCollision() && node.getCollision().isPointInBoundingBox(undefined,{x,y})){
                    return node;
                }
            }
            return undefined;
        },
    });
    _u.defineClass(NodeDrawer.World,function Chunk(idX,idY,chunksSize){
        this.chunkIdX = idX;
        this.chunkIdY = idY;
        this.chunkSize = chunksSize;
        this.nodes=[];
    },{
        isPosInSection:function (x,y){
            return this.chunkIdX * this.chunkSize <= x 
            && x < (this.chunkIdX + 1) * this.chunkSize 
            && this.chunkIdY * this.chunkSize <= y
            && y < (this.chunkIdY + 1) * this.chunkSize;
        }
    });
    _u.defineClass(NodeDrawer,function Draggable(select,cursorSpace,interactionSpace,update,start) {
            this.element = select;
            this.cursorSpace = cursorSpace;
            this.interactionSpace = interactionSpace;
            this.update = update;
            this.start = start;
            // this.storageCallback = storageCallback;
            // this.element.addEventListener("pointerdown",this.startEvent.bind(this));
            this.events={
                "pointerdown":new NodeDrawer.Event(select,"pointerdown",this.startEvent.bind(this)),
                "pointermove":new NodeDrawer.Event(select,"pointermove",this.liveEvent.bind(this)),
                "pointerup":new NodeDrawer.Event(select,"pointerup",this.endEvent.bind(this)),
                "pointercancel":new NodeDrawer.Event(select,"pointercancel",this.cancelEvent.bind(this)),
            };
            this.events["pointerdown"].on();
        },{
            getPos:function(x,y) {
                return this.cursorSpace.getInSpace(this.interactionSpace,x,y);
            },
            searchPos:function(x,y) {
                return this.interactionSpace.getInSpace(this.cursorSpace,x,y);
            },
            doCalcAndUpdate(pointerEvent){
                const startPointOnCursorSpace = this.searchPos(this.startPointInInteractionSpace.x,this.startPointInInteractionSpace.y); // startPos[W] -> currentPoint[S]

                const differenceInCursorSpace = {
                    x: pointerEvent.clientX - startPointOnCursorSpace.x,
                    y: pointerEvent.clientY - startPointOnCursorSpace.y
                } // difference[S]

                const realPos = {
                    posInTargetSpace: this.getPos(differenceInCursorSpace.x + startPointOnCursorSpace.x,differenceInCursorSpace.y + startPointOnCursorSpace.y), // difference[S] -> [W]
                    differenceInTargetSpace: differenceInCursorSpace, // difference[S]
                    target: this.interactionSpace, // [W]
                    origin: this.cursorSpace, // [S]
                }

                this.update(realPos);
            },
            doCalcAndStart:function(pointerEvent){
                const realPos = {
                    posInTargetSpace: this.startPointInInteractionSpace,
                    differenceInTargetSpace: {x:0,y:0},
                    target: this.interactionSpace, // [W]
                    origin: this.cursorSpace, // [S]
                }
                if (typeof this.start === "function"){
                    this.start(realPos);
                }
            },
            startEvent:function(pointerEvent){
                if (pointerEvent.shiftKey)
                    return;

                this.element.setPointerCapture(pointerEvent.pointerId);
                this.pointerId = pointerEvent.pointerId;
                // in world space
                this.startPointInInteractionSpace = this.getPos(pointerEvent.clientX,pointerEvent.clientY);
                
                this.doCalcAndStart(pointerEvent);

                this.events["pointermove"].on();
                this.events["pointerup"].on();
                this.events["pointercancel"].on();
            },
            liveEvent:function(pointerEvent){
                this.doCalcAndUpdate(pointerEvent);
            },
            endEvent:function(pointerEvent){
                this.element.releasePointerCapture(pointerEvent.pointerId);
                this.pointerId = 0;
                this.events["pointermove"].off();
                this.events["pointerup"].off();
                this.events["pointercancel"].off();
                this.doCalcAndUpdate(pointerEvent);
            },
            cancelEvent:function(pointerEvent){
                this.element.releasePointerCapture(pointerEvent.pointerId);
                this.pointerId = 0;
                this.events["pointermove"].off();
                this.events["pointerup"].off();
                this.events["pointercancel"].off();
                this.doCalcAndUpdate(pointerEvent);
            },
            discard:function(){
                this.element.releasePointerCapture(this.pointerId);
                this.pointerId = 0;
                this.events["pointerdown"].off();
                this.events["pointermove"].off();
                this.events["pointerup"].off();
                this.events["pointercancel"].off();
            },
            off:function(){
                this.element.releasePointerCapture(pointerEvent.pointerId);
                this.pointerId = 0;
                this.events["pointerdown"].off();
                this.events["pointermove"].off();
                this.events["pointerup"].off();
                this.events["pointercancel"].off();
                this.update();
                return this;
            },
            on:function(){
                this.events["pointerdown"].on();
                return this;
            },
        }
    );
    _u.defineClass(NodeDrawer,function Event(element,name,event){
        this.element = element;
        this.action = event;
        this.name = name;
    },{
        on(){
            this.element.addEventListener(this.name,this.action);
        },
        off(){
            this.element.removeEventListener(this.name,this.action);
        },
    });
    _u.defineClass(NodeDrawer,function Zoomable(selection,cursorSpace,interactionSpace){
        this.cursorSpace = cursorSpace;
        this.interactionSpace = interactionSpace;
        this.selection = selection;
        this.event = new NodeDrawer.Event(selection,"mousewheel",this.action.bind(this));
    },{
        action:function(mwheel){
            let zoomLevel = this.interactionSpace.scale;
            const interactionPosition = this.cursorSpace.getInSpace(this.interactionSpace,mwheel.clientX,mwheel.clientY);

            let level = 0;
            if (zoomLevel >= 1) {
                level = Math.round(2*(zoomLevel-1));
            } else {
                level = Math.round(1 - (1/zoomLevel));
            }
            if (mwheel.wheelDeltaY < 0) {
                level++;
            } else if (mwheel.wheelDeltaY > 0) {
                level--;
            }
            if (level >= 0){
                zoomLevel = Math.floor(level)/2 + 1;
            } else {
                zoomLevel = 1 / (1 - level);
            }
            this.interactionSpace.scale = zoomLevel;

            const reverseSearchOfOldPosition = this.interactionSpace.getInSpace(this.cursorSpace,interactionPosition.x,interactionPosition.y);
            const difference = {
                x: mwheel.clientX - reverseSearchOfOldPosition.x,
                y: mwheel.clientY - reverseSearchOfOldPosition.y,
            }

            this.interactionSpace.setLocation(
                this.interactionSpace.x-difference.x,
                this.interactionSpace.y-difference.y,
                zoomLevel);
            
            NodeDrawer.getContext(this.selection).getCurrentViewport().render();
        },
        off:function(){
            this.event.off();
            return this;
        },
        on:function(){
            this.event.on();
            return this;
        },
    });
    let node_id=0;
    _u.defineClass(NodeDrawer,function Node(x,y,w,h,nodeTypeId){
        this.pos = {x,y};
        this.size = {w,h};
        /** @type {NodeDrawer.Node.ConnectionSocket} */
        this.sockets = [];
        this.nodeTypeId = nodeTypeId;
        this.id=node_id++;
        this.collision = new NodeDrawer.Collision(NodeDrawer.Collision["T_BOX"],{x,y,w,h},null);
    },{
        setPos:function(x,y){
            this.pos.x = x;
            this.pos.y = y;

        },
        updatePos(){
            this.sockets.forEach(socket => socket.updatePos());
            this.collision.data.x = this.pos.x;
            this.collision.data.y = this.pos.y;
            this.collision.data.w = this.size.w;
            this.collision.data.h = this.size.h;
        },
        getCollision(){
            return this.collision;
        },
        ['#updateInternal']:function (context){
            const info = context.rendertypes[this.nodeTypeId] || NodeDrawer.data.rendertypes[this.nodeTypeId];
        },
        renderNode:function(context){
            this['#updateInternal'](context);
        },
    });
    _u.defineClass(NodeDrawer.Node,function ConnectionSocket(parentNode,edge,offset){
        /*** edge = ""|"w"|"h"|"wh" ; add this to the offset*/
        this.edge = edge;

    },{
        updatePos(){
            this.pos = {
                x: parentNode.pos.x+(this.edge.includes("w")?parent.size.w:0)+offset.x,
                y: parentNode.pos.y+(this.edge.includes("h")?parent.size.h:0)+offset.y,
            }
        },
    });
    _u.defineClass(NodeDrawer,function Collision(type,data,pos) {
        this.type = type;
        this.data = data;
        /** @type Pos */
        this.transfromation = pos;
    },{
        getType(name){return this.__proto__.constructor['T_'+name];},
        intersects:function(other){
            // step 1: check for if the bounding box overlap:
            // this.transfromation
            if (this.type == this.getType('LINE') && other.type == this.getType('LINE')) {
                /** @type LINE_DATA */
                let myLine = this.data;
                /** @type LINE_DATA */
                let otherLine = other.data;
                return this.doLinesCollide(myLine,otherLine);
            }
        },
        isPointInBoundingBox:function(_bb,point){
            const bb = _bb || this.getBoundingBox();
            return bb.x<=point.x&&point.x<=bb.mx&&bb.y<=point.y&&point.y<=bb.my;
        },
        doLinesCollide:function(line1,line2){
            // step 1: check bb
            const bb_line1 = this.getBoundingBox(line1.type,line1.data);
            const bb_line2 = this.getBoundingBox(line2.type,line2.data);
            const bb_intersection = this.doBoundBoxCollide(bb_line1,bb_line2);
            // console.log(bb_intersection);
            if (!bb_intersection)
                return false;
            const hitPoint = this.lineHitCoords(line1,line2);
            if (!hitPoint)
                return false;
            if (!this.isPointInBoundingBox(bb_line1,hitPoint))
                return false;
            if (!this.isPointInBoundingBox(bb_line2,hitPoint))
                return false;
            return hitPoint;
        },
        lineMeta:function(line1,line2){
            return {
                r1: line1.end.x-line1.start.x,
                r2: line1.end.y-line1.start.y,
                r3: line2.end.x-line2.start.x,
                r4: line2.end.y-line2.start.y,
                a1: line1.start.x,
                a2: line1.start.y,
                a3: line2.start.x,
                a4: line2.start.y
            }
        },
        lineHitCoords: function(line1,line2){
            const {r1,r2,r3,r4,a1,a2,a3,a4} = this.lineMeta(line1.data,line2.data);
            if (r3*r2-r4*r1 == 0 || r4*r1-r3*r2 == 0){return false;}
            return {
                x:(a1*r3*r2 - a3*r4*r1 + a4*r1*r3 - a2*r1*r3) / (r3*r2 - r4*r1),
                y:(a2*r4*r1 - a4*r3*r2 + a3*r2*r4 - a1*r2*r4) / (r4*r1 - r3*r2),
            }
        },
        /** @param {LINE_DATA|BOX_DATA} _geometry */
        getBoundingBox(_type=undefined,_geometry=undefined){
            const type = _type || this.type;
            const geometry = _geometry || this.data;
            if (type === this.getType('LINE')) {
                return {
                    x:Math.min(geometry.start.x,geometry.end.x),
                    y:Math.min(geometry.start.y,geometry.end.y),
                    mx:Math.max(geometry.start.x,geometry.end.x),
                    my:Math.max(geometry.start.y,geometry.end.y)
                };
            } else if (type === this.getType('BOX')) {
                return {
                    x: geometry.x,
                    y: geometry.y,
                    mx:geometry.x+geometry.w,
                    my:geometry.y+geometry.h
                };
            }
            // if (geometry.)
        },
        /** @returns {{x:number,y:number,mx:number,my:number}|false} */
        doBoundBoxCollide:function(bb1,bb2=undefined){
            if (bb2 === undefined) {
                bb2 = this.getBoundingBox(this.type,this.data);
            }
            if (bb2.x === undefined) {
                throw new Error("BoundBoxCollide(?,*) argument 2 invalid");
            }
            const colBox = {
                x: Math.min(bb1.x,bb2.x),
                y: Math.min(bb1.y,bb2.y),
                mx: Math.max(bb1.mx,bb2.mx),
                my: Math.max(bb1.my,bb2.my),
            }
            return colBox.x<colBox.mx&&colBox.y<colBox.my?colBox:false;
        }
    },{
        T_LINE:Symbol.for("T_LINE"),
        T_BOX:Symbol.for("T_BOX"),
        T_POLYLINE:Symbol.for("T_POLYLINE"),
        doBoundBoxCollide:function(bb1,bb2={}){return this.prototype.doBoundBoxCollide(bb1,bb2);},
    });
    _u.defineClass(NodeDrawer,function Viewport(element,ctx,screenSpace){
        this.canvas = element;
        this.ctx = ctx;
        this.spaceRef = screenSpace;
        this.world = undefined;
        // this.space = new NodeDrawer.TransformationSpace(0,0,1);
        this.additionalRenderer=[];
    },{
        getElement(){
            return this.canvas;
        },
        getScreenSpace(){
            return this.spaceRef;
        },
        setWorld(world){
            this.world = world;
        },
        updateSize:function (w,h){
            this.ctx.canvas.setAttribute("width",w);
            this.ctx.canvas.setAttribute("height",h);
            // this.space.setLocation(-this.spaceRef.x)
        },
        getPosInWorld(pos,offset){
            if (this.world == undefined)
                return {x:0,y:0}
            let realPos = {...pos};
            if (offset){
                realPos.x += offset.x;
                realPos.y += offset.y;
            }
            
            // return this.world.space.getInSpace(this.space,realPos.x,realPos.y);
            return this.world.space.getInGlobalSpace(realPos.x,realPos.y);
        },
        render:function (){
            this.ctx.reset();
            this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
            this.ctx.fillStyle = "red";
            this.ctx.strokeStyle = "red";
            if (this.world == undefined) {
                return;
            }
            
            for (let node of this.world.nodes) {
                const pos = this.getPosInWorld(node.pos);
                const endPos = this.getPosInWorld(node.pos,{x:node.size.w,y:node.size.h});
                // roundRect
                // todo : do specific Rendering Pipeline here->
                this.ctx.fillRect(pos.x,pos.y,endPos.x-pos.x, endPos.y-pos.y);
            }
            for (let cb of this.additionalRenderer){
                cb();
            }
            this.ctx.stroke();
        },
        addRenderer:function(cb){
            this.additionalRenderer.push(cb.bind(this));
        },
        clearRenderer:function(){
            this.additionalRenderer = [];
        },
        m:function(){
            return this;
        },
    });
    /** order of transformation : pos -> scale | */
    _u.defineClass(NodeDrawer,function TransformationSpace(x,y,scale){
        this.x = x;
        this.y = y;
        this.scale = scale;
        this['#normalize']();
    },{
        // getPosInSpace:function(x,y){},
        /** getInSpace: convert this to global then to target space */
        getInSpace:function(ts,x,y) { /* expect: screenSpace.getInSpace(worldSpace,xOfScreenSpace,yOfScreenSpace) */
            // const offset_global_space = {
            //     x:(x-this.x)*this.scale,
            //     y:(y-this.y)*this.scale
            // };
            const offset_global_space = {
                x:(x/this.scale)-this.x,
                y:(y/this.scale)-this.y
            };
            // var globalX = aX - (spaceX * scale)
            // var globalX + (spaceX * scale) = aX | + (spaceX * scale)
            // var spaceX * scale = aX - globalX | - globalX
            // var spaceX = (aX - globalX) / scale | / scale
            return {
                x:(offset_global_space.x+ts.x)*ts.scale,
                y:(offset_global_space.y+ts.y)*ts.scale
            };
            // return {
            //     x:(offset_global_space.x-ts.x)/ts.scale,
            //     y:(offset_global_space.y-ts.y)/ts.scale
            // };
        },
        /**
         * Global Space is Always 0,0 with x1. Global Space can also be called the "CanvasSpace".
         */
        getInGlobalSpace:function(x,y){
            return this.getInSpace(this.__proto__.constructor.globalSpace,x,y);
        }, 
        ['#normalize']:function(){
            if (this.scale == 0){
                this.scale = 1e-8;
            }
        },
        setLocation:function(x,y,scale){
            this.x = x;
            this.y = y;
            if (scale != undefined){
                this.scale = scale;
            }
            this['#normalize']();
        },
    },{
        globalSpace:null, // prepare for next line
    });
    NodeDrawer.TransformationSpace.globalSpace = new NodeDrawer.TransformationSpace(0,0,1);
})(window||globalThis)
