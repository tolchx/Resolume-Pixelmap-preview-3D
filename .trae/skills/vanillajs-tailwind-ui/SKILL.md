---
name: "vanillajs-tailwind-ui"
description: "Guidelines for Vanilla JS and Tailwind UI architecture. Invoke when adding UI components, side panels, themes, or DOM interactions."
---

# Vanilla JS & Tailwind UI

This skill provides the structure and conventions for the frontend UI of the application.

## Tech Stack

- **Vanilla JS**: No framework is used. DOM manipulation is direct (`document.getElementById`).
- **Tailwind CSS (CDN)**: Styling is done via Tailwind utility classes defined in `index.html` and configured in `js/tailwind-config.js`.

## UI Components

- **Side Drawer**: The main interaction panel (toggled with `P` or UI button) for settings, importing files, and the inspector.
- **Inspector**: Adapts based on single, multiple, or no selection. Make sure to update the inspector fields whenever selection state changes.
- **Theme**: Supports light/dark theme via CSS classes toggled in `app.js` (`applyTheme`).

## Best Practices

- Keep UI logic decoupled from heavy 3D rendering. Use custom events or simple callback hooks to communicate between `app.js` and `three-viewer.js`.
- Always verify that UI updates (like coordinate inputs) correctly trigger the corresponding 3D scene updates and history state saving.
- When adding new UI elements, style them using existing Tailwind patterns found in the HTML to maintain visual consistency.
