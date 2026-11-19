# Overview
The `NodeDrawer` library provides a flexible framework for rendering interactive 2D nodes on an HTML canvas, with support for collision detection, dynamic scaling, and custom rendering logic. It is designed for applications requiring visual representation of spatial data such as maps, graphs, or grid-based systems.
## Common Usecases
- Visualizing grid-based maps or terrains.
- Debugging spatial algorithms (e.g., pathfinding).
- Interactive data dashboards with dynamic scaling.
## Key Features
- **Canvas Integration**: Seamlessly integrates with HTML5 `<canvas>` elements for rendering.
- **Collision Detection**: Built-in support for 2D collision detection using bounding boxes. (*unsupported at 2026-11-16*)
- **Custom Renderers**: Extendable `NodeRenderer` interface for tailored visual styles (e.g., colored boxes, images, or custom shapes).
- **Dynamic Scaling & Zooming**: Supports zoomable and draggable views for exploring large datasets.
- **Chunked Rendering**: Optimized for large node counts via world-space chunking.

---
# Usage Example

```jsx
// 1. Create a canvas element in HTML:
<canvas id="master" width="800" height="600"></canvas> 

// 2. Initialize NodeDrawer with configuration:
NodeDrawer.construct(document.querySelector("canvas#master"), {
	draggableView: true,
	zoomable: true,
	initialScale: 1,
	worldChunkSize: 100, // Optimize rendering for large worlds
});

// 3. Define a custom renderer (e.g., SimpleBoxRenderer):
class SimpleBoxRenderer {
	render(node, context) {
		const ctx = context.context();
		if ("fill" in ctx) { // this checks for the context to be a Canvas2D Context or the offsceen Variant.
			ctx.fillStyle = node.color; // Use dynamic color properties
			const start = context.getPositionInWorld({ x: node.x, y: node.y });
			const end = context.getPositionInWorld({ x: node.x + node.w, y: node.y + node.h });
			// render directly onto the canvas element.
			ctx.fillRect(Math.floor(start.x), Math.floor(start.y), Math.ceil(end.x - start.x), Math.ceil(end.y - start.y)); 
		}
	}
}

// 4. Register the renderer and add nodes:
const renderer = new SimpleBoxRenderer();
NodeDrawer.NodeRenderFactory.add("default", renderer); // parameter 0 is the nodeID, for which the renderer applies to

const world = NodeDrawer(document.querySelector("canvas#master")).getWorld();
const myData = [[0,0],[0,1],[1,0],[1,1]];
myData.forEach(([x, y]) => {
  const node = new NodeDrawer.Node(x * size, y * size, size, size, "default"); // "default" is the nodeID; the same id used to render the node
  world.addNode(node);
});
```

## Advantages of Using NodeDrawer

1. **Modularity**:
    - Separates rendering logic from data management via the `NodeRenderer` interface.
    - Allows swapping renderers (e.g., switching between colored boxes and icons).
2. **Performance**:
    - Chunked rendering (`worldChunkSize`) reduces redraw overhead for large datasets.
    - Efficient collision detection with `Collisions2D.Box`.
3. **Flexibility**:
    - Customizable via methods like `mapRange` for dynamic color/size scaling.
    - Supports drag-and-zoom interactions for user exploration.
4. **Extensibility**:
    - Add new renderers or modify existing ones (e.g., `ChunkRenderer` for grid patterns).
    - Integrate with external libraries (e.g., drawing images via `ctx.drawImage`).
# API Reference
## NodeDrawer.construct
Usage `NodeDrawer.construct(HTMLCanvasElement,options);`.
Options: 
```typescript
type NodeDrawerConfig = {
    worldChunkSize?: number, /* amount of units for a chunk (nodes must fit within a chunk); unit = Screen Pixels, if initialScale = 1.00; numbers <1 result into a single world chunk (renders all nodes at once). */
    initialScale?: number, /* zoom scale on initial render; 1.00 default; World Untis to Screen Pixel at a scale of 1.00 is 1 Pixel; 1 World Unit = {scale} Pixels; this scale is applied to the World Transformation Space */
    initialX?: number, /* horizontal offset; positive X = down; this number is applied to the World Transformation Space, which is set on the NodeDrawingContext */
    initialY?: number, /* vertical offset; positive Y = right; this number is applied to the World Transformation Space, which is set on the NodeDrawingContext */
    draggableView?: boolean, /* set to `true` to enable the modification of Offset between Screen and World X,Y using the pointer */
    draggableNodes?: boolean, /* set to `true` to enable the modification of Nodes X,Y within the World using the pointer and the Node's Collision */
    zoomable?: boolean, /* set to `true` to enable the modification of World scale using the scroll wheel */
    world?: NodeDrawer.World<NodeDrawer.World.Chunk>, /* in case you already have a world, you can use the */
    hookAsAnimation?: boolean /* set to `true` to enable automatic rendering at the Browsers framerate; based on `requestAnimationFrame()` */
};
```

## NodeDrawer.TransformationSpace
> [!note]
> For the **Conversion** samples, we can assume, you have a NodeDrawerContext stored with `const cv=NodeDrawer('canvas').getCurrentViewport();`
### Screen
**Element**: Canvas
**Base**: Screen Space 0,0 is the Browser's Screen at 0,0
This changes based on the Canvas location. E.g. if the canvas has an offset 100 pixels from the left screen edge, the Screen Tranformation Space is 100,0; 
**Purpose**: The Transformation Space for the offset of Canvas and Browser/Screen;
**Conversion**:
- *Browser/Screen* to *Global/Canvas* Location: `cv.getScreenSpace().getInGlobalSpace(x,y)`
- *Browser/Screen* to *World* Location: `cv.getScreenSpace().getInSpace(cv.getWorldSpace(),x,y)`
### Global
**Element**: none (is always 0,0, with scale of 1.00)
**Base**: Global Space 0,0 is meant to be the transformation for Canvas. ; Since the Offset for Canvas to itself is always 0,0 and the scale difference is also always 1.00 **do never modify the Global Space!**;
**Purpose**: The Transformation Space is a Helper to convert between to and from the Canvas.
> [!info]
> You will never encounter a situation, where you need to calculate from **globalSpace**. The Global Space is only meant as an Dummy Transformation Space.

**Conversion**:
- *Global* to *Browser/Screen* Location: `NodeDrawer.TransformationSpace.globalSpace.getInSpace(NodeDrawer('canvas').getCurrentViewport().getScreenSpace(),x,y)`
- *Global* to *World* Location: `NodeDrawer.TransformationSpace.globalSpace.getInSpace(NodeDrawer('canvas').getCurrentViewport().getWorldSpace(),x,y)`
### World
**Element**: none (virtual)
**Base**: World Space 0,0 is the Virtual Offset from Canvas to the Simulated World. 
**Purpose**: 0,0 in WORLD SPACE means a node starting from 0,0 is rendered in the Canvas top 0,0 Offset; and -100,-100 makes the 0,0 Node offset by 100 Units from the top left INWARDS, making the NODE appear with 100 units padding from the top and left.
**Conversion**:
- *World* to *Browser/Screen* Location: `cv.getWorldSpace().getInSpace(cv.getScreenSpace(),x,y)`
- *World* to *Global/Canvas* Location: `cv.getWorldSpace().getInGlobalSpace(x,y)`

### Common Uses
- **Browser Event** in the *Virtual World*: `cv.getScreenSpace().getInSpace(cv.getWorldSpace(),eventX,eventY) => World Position`
- **Find World Location** on *Screen*: `cv.getWorldSpace().getInSpace(cv.getScreenSpace(),worldX,worldY) => Screen Position`
- **Draw Node Location** on *Canvas*: `cv.getWorldSpace().getInGlobalSpace(worldX,worldY) => Canvas Position`

# Cross Integrations
The `Settings` Library *requires* following Libraries:
- *unimplemented* [Contextable](docs/Contextable.md) - Provides Contexts
- *unimplemented* [KeyBinder](docs/KeyBinder.md) - Actions based on Keyboard input.

- [NodeDrawer](docs/NodeDrawer.md) - Rendering Library (Category: UI & Controller)
- [Contextable](docs/Contextable.md) - Context Library (Category: Controller)
- [Groupable](docs/Groupable.md) - Data Manipulation Library (Category: Data)
- [KeyBinder](docs/KeyBinder.md) - Keyboard Handler Library (Category: UX & Controller)
- [MenuBuilder](docs/MenuBuilder.md) - UI Library (Category: UI)
- [Settings](docs/Settings.md) - Dynamic Configuration Modification Handler Library (Category: UI, Data & Controller)
# Todos
