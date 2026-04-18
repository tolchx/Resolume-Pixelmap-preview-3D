---
name: "threejs-manipulation"
description: "Guidelines for 3D viewer, gizmo interaction, and undo/redo logic. Invoke when updating 3D visualizations, selection syncing, or camera controls."
---

# Three.js Manipulation & Viewer

This skill provides guidelines for working with the Three.js 3D viewer component (`js/three-viewer.js`).

## Architecture

- **Canvas & Engine**: Uses ES module imports of `THREE` from `three` package.
- **Controls**: Supports both OrbitControls (orbit/zoom) and custom PointerLockControls for FPS-like navigation.
- **Gizmo (TransformControls)**: Used to translate and rotate selected slices.

## Selection & Syncing

- The 3D selection is synchronized with the UI list in `app.js`.
- **Single Selection**: Selects one mesh, allows direct Pos/Rot manipulation.
- **Multi-Selection**: Groups selected meshes via a centroid logic for group transformation.

## History & Undo/Redo

- The viewer maintains a history stack of transformations.
- Any change applied by the gizmo or the inspector UI must push a state to the undo stack.
- Use the established patterns in `three-viewer.js` when modifying transform logic so history doesn't break.
