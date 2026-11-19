# VisorCore

> A modular TypeScript framework for building visual editors with JSON-driven configuration and minimal JavaScript. Designed for developers and configurators who need rapid prototyping of interactive graph-based interfaces.

### Core Features
- **Modular Architecture**: Six independent yet interoperable libraries for rendering, data manipulation, keyboard interactions, and dynamic configuration.
- **Browser Runtime**: Built with Webpack for seamless browser deployment.
- **Progressive Development**: Libraries like `NodeDrawer` and `Groupable` provide immediate value, while `KeyBinder` and `Settings` are in early development.
- **Extensible UI**: Supports custom renderers, collision detection, and context-aware keybindings through `NodeDrawer` and `KeyBinder`.

### Key Libraries
- [**NodeDrawer**](docs/NodeDrawer.md): High-performance rendering with collision checks and pointer event handling.
- [**Groupable**](docs/Groupable.md): Data manipulation for graph structures and transformations.
- [**KeyBinder**](docs/KeyBinder.md): Contextual keyboard shortcuts with input element integration.

### Roadmap
- Complete `Settings` system for context-dependent configurations.
- Implement worker-based rendering in `NodeDrawer`.
- Add mouse gesture support for enhanced interactivity.
More in [Todos](#Todos).

# Libraries
- [NodeDrawer](docs/NodeDrawer.md) - HTML Canvas Rendering Library
    - **Category**: Canvas UI
    - **Optional Support**: *Contextable*, *KeyBinder*, *Gestures*
    - **Progress**: 80%
- [Contextable](docs/Contextable.md) - Context Management Library
    - **Category**: Functionality
    - **Progress**: 10%
- [Groupable](docs/Groupable.md) - Data Manipulation Library
    - **Category**: Data
    - **Progress**: 95%
- [KeyBinder](docs/KeyBinder.md) - Keyboard Handling
    - **Category**: UX
    - **Requires**: 
    - **Optional Support**: *Contextable*
    - **Progress**: 5%
- [MenuBuilder](docs/MenuBuilder.md) - Create GUI from JSON Data
    - **Category**: UI
    - **Requires**: *Groupable*
    - **Optional Support**: *KeyBinder*
    - **Progress**: 0%
- [Settings](docs/Settings.md) - Dynamic Configuration Modification Handler Library
    - **Category**: UI, UX, Data, Functionality & Controller
    - **Requires**: *MenuBuilder*
    - **Optional Support**: *KeyBinder*, *Contextable*, *Groupable*
    - **Progress**: 0%
- [Gestures](docs/Gestures.md) - Touch and Pointer Support for more than just Clicks and Mice
    - **Category**: UX, Functionality
    - **Requires**:
    - **Optional Support**: *Contextable*
    - **Progress**: 0%

# Todos

## Importance - High
- Configuration / package.json
    - Is it possible to make a Package, that does not need a `server.js` as `main` and does also just export the `js` as packages, aswell as support the server as runnable? 
    - [x] `server.js` is not the `main` anymore, therefore the Project can be a Package.
    - [x] The Package has a single entrypoint : `index.ts/js`
    - [x] Project now has a *build* goal.
    - [ ] `server.js` is not needed anymore, all files are Statically readable without parent traversal.
- [x] Update `.editorconfig`
- [ ] GitHub
	- [x] Upload the Project to GitHub.
	- [ ] Add Workflows (GitHub Actions) to build the Environment and Static Files.
## Importance - Low
- NodeDrawer
    - Make Worker capable!
        - Maybe add WorkSections ( Work split by section mapped onto Environments)
        - *OR* make Specific Renderin parts that get auto loaded by the Worker. (somehow)
    - Allow Drag Move to bind to a different keyset. -> Needs *Mouse Gestures*
        - For this, it might be easy to implement : EventProxy; `touch to pointerdown, move to pointermove, click to pointerdown then pointerup`
    - Hover Events ( intersection testing for cursor )
    - Collision / Rendering Issue: 
        - Implement Collision Checks; mostly the `@windingIntersection`
    - [x] Change the `NodeDrawer.NodeRenderFactory` to only add either `addRenderer(id,function|class)` and `addCustomCollision(id,function|class)`.

- KeyBinder
    - Allows to create Keybindings and to be able to change them over an Input Element. (`KeyBinder.binder(inputElement).on('complete|preview|cancel')`)
    - Allow Context for Keybindings and allow them to integrate with 
    - Keyboard Hotkeys
  
- Mouse Gestures
    - *description*: a TypeScript, to make mouse and pointer interactions be tested and created: `Gestures.binder(panelElement).on('complete|preview|cancel')`
    - *Samples*: Long Press / Short Press, Two / Three / Four Press / Pointers, swipe, Drag, Positional

- Settings
    - Interacts with Keyboard Hotkeys
    - Interacts with MenuBuilder
    - Make the Keyboard Hotkeys and Mouse Gestures Context Dependent (AKA create a context system!)
