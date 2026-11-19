/// <reference no-default-lib="true" />
/// <reference lib="webworker" />
/// <reference path="../src/WorkerAPI.ts" />

const truster = trustedTypes.createPolicy("script-url-policy", { 
    createScriptURL: function (url) { 
        if (url === "dist/WorkerAPI.js") 
            return url; 
        return ""; 
    }
})

var exports={};

importScripts(truster.createScriptURL("dist/WorkerAPI.js"));
// import { WorkerAPI } from "./WorkerAPI.js";

let controller;

/** @type {OffscreenCanvas} */
let canvas;
/** @type {OffscreenCanvasRenderingContext2D} */
let ctx;
let animationId = undefined;


const methods = {
    "version": function () { return Date.now(); },
    "log": function () { console.warn(arguments); },
    "modify": function (doc) { console.log(doc.body.querySelectorAll("script")); },
    "setCanvas": function (offscreenCanvas) {
        console.log("rendered");
        canvas = offscreenCanvas;
        ctx = canvas.getContext("2d");
        if (typeof animationId !== "number")
            animationId = requestAnimationFrame(renderer);
    }
}

controller = new WorkerAPI(self, methods);
controller.start();

/** @typedef {{pos:[number,number],velocity:[number,number],color:string,radius:number}} WorldNode */

/** @type {WorldNode[]} */
const world = [];

const worldNodeCount = 20;
const worldNodeSpeed = [1,5];
const worldBoundaryTraversePadding = 600;
const worldBoundarySpawnPadding = 800;
var canvasBlur = 600;
const worldNodeSize = [50,180];
var blurred = true;

const start = function () {
    const w = ctx.canvas.width, h = ctx.canvas.height;

    const rangeX = [-worldBoundarySpawnPadding, w+worldBoundarySpawnPadding], rangeY = [-worldBoundarySpawnPadding, h+worldBoundarySpawnPadding];
    function mapRange(valueA, minA, maxA, minB, maxB) {
        return minB + ((valueA - minA) * (maxB - minB)) / (maxA - minA);
    }
    function mapRandom(minB, maxB) {
        return mapRange(Math.random(), 0, 1, minB, maxB);
    }
    function mapRandomRange(range){
        return mapRandom(range[0],range[1]);
    }
    function getRandomDirection(length) {
        const angle = Math.random() * Math.PI * 2;
        return [Math.cos(angle) * length, Math.sin(angle) * length];
    }
    ",".repeat(worldNodeCount).split("").map(function (v, i ,a) {
        /** @type {WorldNode} */
        const item = {
            pos: [mapRandomRange(rangeX), mapRandomRange(rangeY)],
            velocity: getRandomDirection(mapRandomRange(worldNodeSpeed)),
            radius: mapRandomRange(worldNodeSize),
            color: [mapRange(i, 0, a.length, 0, 359),50,50]
        };
        world.push(item);
    });
}


const update = function (timedelta) {
    const w = ctx.canvas.width, h = ctx.canvas.height;

    const expected_delta = 1000 / 30; // = 30 fps
    const delta = timedelta / expected_delta; // aka .5 for half the distance and 2 for twice the distance

    if (delta > 10){
        return; // skip this frame. else it could cause the Objects to teleport into OOB, and they might take a long time to return.
    }

    // Die Update-Schleife für deine Welt
    world.forEach(function (val, idx) {
        // 1. Position mit der aktuellen Geschwindigkeit aktualisieren
        val.pos[0] += val.velocity[0] * delta;
        val.pos[1] += val.velocity[1] * delta;

        // 2. Grenzen berechnen (unter Einbeziehung des Radius, damit sie am Rand nicht clippen)
        const minX = -worldBoundaryTraversePadding + val.radius;
        const maxX = w + worldBoundaryTraversePadding - val.radius;
        const minY = -worldBoundaryTraversePadding + val.radius;
        const maxY = h + worldBoundaryTraversePadding - val.radius;

        // 3. X-Achsen Kollision (Links / Rechts)
        if (val.pos[0] < minX) {
            val.pos[0] = minX;
            val.velocity[0] = Math.abs(val.velocity[0]); // Sicher nach rechts lenken
        } else if (val.pos[0] > maxX) {
            val.pos[0] = maxX;
            val.velocity[0] = -Math.abs(val.velocity[0]); // Sicher nach links lenken
        }

        // 4. Y-Achsen Kollision (Oben / Unten)
        if (val.pos[1] < minY) {
            val.pos[1] = minY;
            val.velocity[1] = Math.abs(val.velocity[1]); // Sicher nach unten lenken
        } else if (val.pos[1] > maxY) {
            val.pos[1] = maxY;
            val.velocity[1] = -Math.abs(val.velocity[1]); // Sicher nach oben lenken
        }
    });

}

var lasttimestamp = 0;

const renderer = function (timestamp) {
    const w = ctx.canvas.width, h = ctx.canvas.height;

    if (lasttimestamp == 0) {
        start();
    } else {
        update(Math.floor(timestamp - lasttimestamp));
    }
    lasttimestamp = timestamp;


    // console.log("rendered");
    // ctx.restore();
    // ctx.reset()
    // ctx.fillStyle = "#fff";
    // ctx.fillRect(0,0,ctx.canvas.width, ctx.canvas.height);
    ctx.clearRect(0, 0, w, h);
    // ctx.fill();
    // if (blurred)
        // ctx.filter = "blur("+canvasBlur+"px)";
    world.forEach(function (node) {
        
        // Der sichtbare Radius des "Glows" entspricht deinem ursprünglichen Radius + Blur
        const glowRadius = node.radius + (blurred?canvasBlur:0); // simulierter Blur-Radius

        // Erstelle den radialen Verlauf (Zentrum X, Zentrum Y, Start-Radius, Ziel X, Ziel Y, End-Radius)
        const gradient = ctx.createRadialGradient(
            node.pos[0], node.pos[1], node.radius * 0.1, // Startet fast im Zentrum
            node.pos[0], node.pos[1], glowRadius         // Endet am äusseren Rand des Blurs
        );

        const fullcolor = `hsl(${node.color[0]},${node.color[1]}%, ${node.color[2]}%)`;

        // Farb-Stopps definieren (Hier nutzen wir deine richtungsbasierten Farben)
        // node.color muss z.B. ein HSL- oder RGB-String sein
        gradient.addColorStop(0, fullcolor); // Kernfarbe im Zentrum
        gradient.addColorStop(0.2, fullcolor); // Hält die Farbe im Kern noch etwas stabil
        
        // Sanfter Übergang ins Nichts (Alpha = 0). Wichtig: Nutze dieselbe Farbe für saubere Transparenz!
        // Wenn node.color z.B. "hsl(120, 50%, 50%)" ist, wandeln wir es in "hsla(...)" um:
        const transparentColor = `hsla(${node.color[0]},${node.color[1]}%, ${node.color[2]}%, 0)`;
        gradient.addColorStop(1, (blurred?transparentColor:fullcolor));
        
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(Math.floor(node.pos[0]), Math.floor(node.pos[1]),glowRadius,0,Math.PI * 2);
        // ctx.ellipse(Math.floor(node.pos[0]), Math.floor(node.pos[1]), node.radius, node.radius, 0, 0, Math.PI * 2);

        ctx.fill();
    });

    ctx.filter = "none";
    // ctx.drawImage(ctx.canvas,0,0);

    animationId = requestAnimationFrame(renderer);
}
