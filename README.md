# Resolume Pixelmap Preview 3D (Web)

Una aplicación web interactiva que permite importar exportaciones XML/JSON de Resolume Arena, previsualizar la composición en un entorno 3D, ajustar las posiciones espaciales de los slices (pantallas) y generar el mapeo CSV para Unreal Engine.

Ahora incluye **Soporte Spout In**, permitiendo visualizar en tiempo real el contenido de Resolume directamente sobre las mallas 3D del navegador.

## Características Principales

- **[NUEVO] Integración Spout In**: Servidor Node.js integrado que recibe la señal de video de Resolume vía Spout y la transmite en tiempo real a los slides/pantallas del entorno 3D mediante WebSockets. Cuenta con mapeo UV dinámico, auto-reconexión y métricas de FPS/Resolución en pantalla.
- **Importación Flexible**: Soporte de drag & drop para archivos XML y JSON de Resolume.
- **Visor 3D Interactivo**: Visualización de "Input" (origen de composición) y "Output" (posición final de las pantallas).
- **Herramientas de Edición 3D**:
  - Manipulador (Gizmo) de Traslación y Rotación.
  - Ajuste manual de coordenadas (X, Y, Z) a través del panel lateral.
  - Snap to grid (10cm).
  - Undo / Redo para transformaciones.
  - Guardado automático local en el navegador.
- **Exportación Unreal Engine**: Genera un archivo CSV con las posiciones (en Unreal Units / centímetros), rotaciones y resoluciones, listo para ser consumido por Data Tables o Blueprints en UE.

## Requisitos del Sistema

Para la funcionalidad base de importación y visor 3D, basta con cualquier navegador moderno.
Para usar la **integración Spout en tiempo real**, necesitas:
- **Windows 10/11** (Spout es una tecnología exclusiva de DirectX/OpenGL en Windows).
- **Node.js** (v16 o superior).
- **Resolume Arena/Avenue** (u otro software que envíe señal por Spout).

## Instalación y Ejecución

1. Clona o descarga este repositorio.
2. Abre una terminal en la carpeta del proyecto e instala las dependencias de Node.js:
   ```bash
   npm install
   ```
3. Ejecuta el archivo por lotes incluido:
   ```cmd
   run_locally.bat
   ```
   *(Alternativamente, puedes ejecutar `node spout_server.js` de forma manual).*
4. Abre tu navegador en `http://localhost:8080/`.

## Cómo usar Spout con Resolume

1. Abre **Resolume**.
2. Ve a `Output > Advanced` (Salida Avanzada).
3. Crea un nuevo *Screen* (Pantalla) y asigna su salida (`Device`) a **Spout**.
4. Asegúrate de tener el servidor local Node corriendo (`run_locally.bat`).
5. En la aplicación web, verás que el indicador en la esquina superior izquierda cambiará de "Buscando..." a **"Spout: Conectado"**.
6. Arrastra tu archivo XML/JSON exportado de Resolume a la web. Los planos 3D se alinearán y empezarán a mostrar el video en tiempo real de forma sincronizada con tus recortes (Slices).

> **Nota:** Para detalles técnicos sobre pruebas, rendimiento y resolución de problemas de Spout, consulta el archivo [TESTING_SPOUT.md](./TESTING_SPOUT.md).

## Uso General (Edición 3D)

- **Cámara**: Clic izquierdo + Arrastrar para rotar. Rueda del ratón para hacer Zoom. Clic derecho + Arrastrar para paneo.
- **Seleccionar pantallas**: Haz clic sobre una pantalla. Usa `Ctrl + Clic` para selección múltiple.
- **Modo Input/Output**: Alterna entre ver la posición original de las pantallas en la composición 2D (Input) y su posición en el mundo 3D (Output).
- **Transformar**: Usa los botones superiores para cambiar entre mover y rotar, o edita los valores directamente en el panel lateral derecho.
- **Exportar**: Usa el botón verde de "Descargar CSV (Unreal)" en el panel lateral para obtener el archivo de mapeo final.

## Tecnologías Utilizadas

- **Three.js** (Renderizado 3D)
- **Tailwind CSS** (Estilos y UI)
- **Vanilla JavaScript** (Lógica Frontend)
- **Node.js + Express + WS** (Servidor Backend y WebSockets)
- **Sharp** (Compresión de video ultra-rápida)
- **@napolab/texture-bridge** (Librería de captura Spout nativa para Node.js)

## Estructura

- `index.html`: markup y referencias a CSS/JS.
- `css/app.css`: estilos y helpers de tema.
- `js/tailwind-config.js`: configuración de Tailwind (CDN).
- `js/app.js`: UI, import/parsing, lista/inspector, export CSV, vista XML.
- `js/three-viewer.js`: visor 3D (Three.js), selección, gizmo, navegación, historial.
