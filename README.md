# Resolume Pixelmap preview 3D

Webapp para importar exports XML/JSON de Resolume, visualizar las pantallas/slices en 3D, editar transformaciones y exportar a CSV (incluyendo rotación) con mapeo compatible con Unreal.

## Características

- Importación de XML y JSON (drag & drop o click).
- Extracción automática de `InputRect` y `OutputRect` por pantalla/slice.
- Alternancia de rect de referencia: `Output` / `Input`.
- Vista 3D interactiva con selección y edición:
  - Selección simple y múltiple (Ctrl+Click) desde la lista o desde el 3D.
  - Selección sincronizada lista ↔ 3D (resalta y enfoca).
  - Manipulación con gizmo: mover / rotar.
  - Transformación grupal (centroide) cuando hay multi-selección.
  - Resaltado visual de selección (material + borde/edge del grupo).
- Panel lateral (drawer) con:
  - Import, progreso y estado.
  - Lista de pantallas con filtro/buscador y botón de enfoque.
  - Inspector para editar Pos/Rot (simple) y controles de grupo (múltiple).
- Historial y persistencia:
  - Undo/Redo (Ctrl+Z / Ctrl+Y o Ctrl+Shift+Z).
  - Autosave periódico de transformaciones.
  - Validación básica (límites/solapamiento) con revert automático al detectar una transformación inválida.
- Vista XML:
  - Alterna 3D/XML sin perder estado.
  - Resaltado simple de sintaxis para lectura rápida.
- Export CSV:
  - Incluye rotación.
  - Mapeo Unreal: `Loc3D = (x, z, y)`.

## Controles

- Vista/Panel
  - `P`: abrir/cerrar panel.
  - `Esc`: cerrar panel; en modo navegación también libera el pointer lock.
- Selección
  - Click: seleccionar pantalla.
  - Ctrl+Click: selección múltiple (toggle).
  - Doble click en la grilla (2 clicks seguidos, sin tocar una pantalla): deseleccionar.
  - Click en el gizmo (flechas XYZ): no deselecciona.
- Cámara
  - Orbit (por defecto): clic + arrastre para orbitar; rueda para zoom.
  - Navegación (icono): modo FPS con pointer lock.
    - Movimiento: `W A S D`
    - Subir/Bajar: `Q / E`
    - Mirar: mouse

## Opciones

- Grid: muestra/oculta la grilla.
- Snap: al mover (translate), ajusta la posición a incrementos de 10 unidades.
- Output/Input: define qué rect se usa para tamaño y layout inicial.
- 3D/XML: alterna entre el visor 3D y el texto del XML.

## Ejecutar localmente

Los módulos ES (Three.js) requieren servir el proyecto por HTTP (no `file://`).

1. En la carpeta del proyecto:
   - `python -m http.server 8000`
2. Abrir:
   - `http://localhost:8000/`

## Estructura

- `index.html`: markup y referencias a CSS/JS.
- `css/app.css`: estilos y helpers de tema.
- `js/tailwind-config.js`: configuración de Tailwind (CDN).
- `js/app.js`: UI, import/parsing, lista/inspector, export CSV, vista XML.
- `js/three-viewer.js`: visor 3D (Three.js), selección, gizmo, navegación, historial.
