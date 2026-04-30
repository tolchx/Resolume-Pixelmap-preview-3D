# Resolume Pixelmap Preview 3D (Web)

Una aplicación web interactiva que permite importar exportaciones XML/JSON de Resolume Arena, previsualizar la composición en un entorno 3D, ajustar las posiciones espaciales de los slices (pantallas) y generar el mapeo CSV para Unreal Engine.

Ahora incluye **Soporte Spout In**, permitiendo visualizar en tiempo real el contenido de Resolume directamente sobre las mallas 3D del navegador.

## Características Principales

- **[NUEVO] Integración Spout In**: Servidor Node.js integrado que recibe la señal de video de Resolume vía Spout y la transmite en tiempo real a los screens del entorno 3D mediante WebSockets.
- **[NUEVO] Transformación Grupal**: Selecciona múltiples pantallas con `Ctrl + Clic` y edita sus posiciones o rotaciones de forma conjunta. La rotación grupal es ahora más estable y precisa.
- **[NUEVO] Rotación con Snapping (Shift)**: Mantén presionada la tecla `Shift` mientras usas el gizmo de rotación para ajustar los ángulos en pasos de **45 grados**.
- **Importación Flexible**: Soporte de drag & drop para archivos XML y JSON de Resolume.
- **Visor 3D Interactivo**: Visualización de "Input" (origen de composición) y "Output" (posición final de las pantallas).
- **Herramientas de Edición 3D**:
  - Manipulador (Gizmo) de Traslación y Rotación.
  - Ajuste manual de coordenadas (X, Y, Z) a través del panel lateral (soporta comas y puntos).
  - Snap to grid (10cm).
  - Undo / Redo para transformaciones (Ctrl+Z / Ctrl+Y).
  - Guardado automático local en el navegador.
- **Exportación Unreal Engine**: Genera un archivo CSV con las posiciones (en Unreal Units / centímetros), rotaciones y resoluciones, listo para ser consumido por Data Tables o Blueprints en UE.

## Requisitos del Sistema

Para la funcionalidad base de importación y visor 3D, basta con cualquier navegador moderno.
Para usar la **integración Spout en tiempo real**, necesitas:
- **Windows 10/11** (Spout es exclusivo de Windows).
- **Node.js** (v16 o superior).
- **Resolume Arena/Avenue** (u otro software que envíe señal por Spout).

## Instalación y Ejecución

Para facilitar la configuración, se han incluido scripts automatizados:

1. **Instalación Inicial**:
   - Descarga o clona el proyecto.
   - **Extrae todos los archivos** del ZIP/RAR (no lo ejecutes desde dentro del compresor).
   - Ejecuta `install_dependencies.bat`. Este script verificará si tienes Node.js e instalará todo lo necesario.
   - *Nota: El script detecta automáticamente si se ejecuta como Administrador y ajusta las rutas.*

2. **Ejecución**:
   - Una vez instaladas las dependencias, ejecuta `run_locally.bat`.
   - El script abrirá automáticamente tu navegador en `http://localhost:8080/` e iniciará el servidor Spout.

## Atajos de Teclado y Controles

- **Cámara**: Clic izquierdo para rotar. Rueda para Zoom. Clic derecho para paneo.
- **Selección múltiple**: Usa `Ctrl + Clic` sobre las pantallas o en la lista lateral.
- **Snapping de Rotación**: Mantén **Shift** mientras rotas para saltos de 45°.
- **Navegación FPS**: Pulsa la tecla `N` para entrar en modo vuelo (WASD + Mouse).
- **Panel Lateral**: Pulsa la tecla `P` para abrir/cerrar el panel de control rápidamente.
- **Centrar Cámara**: Botón de "Fit" (o tecla `F`) para centrar la vista en las pantallas seleccionadas.
- **Deshacer/Rehacer**: `Ctrl + Z` y `Ctrl + Y`.

## Resolución de Problemas (FAQ)

**¿El archivo .bat se cierra solo al abrirlo?**
- Asegúrate de haber **extraído** la carpeta del ZIP. Los archivos .bat no pueden trabajar correctamente si están dentro de un archivo comprimido.
- Verifica que tienes **Node.js** instalado. El instalador te dará el link si no lo encuentra.

**¿Error "Cannot find package.json" al ejecutar como Administrador?**
- Este error ha sido corregido en la última versión. Asegúrate de usar los archivos actualizados que incluyen el comando `cd /d "%~dp0"`.

**¿No veo la señal de Spout en el navegador?**
- Asegúrate de que el servidor está corriendo (la ventana negra de `run_locally.bat` debe estar abierta).
- En Resolume, comprueba que la salida (Output) está enviando señal a "Spout".

## Tecnologías Utilizadas

- **Three.js** (Renderizado 3D)
- **Tailwind CSS** (UI moderna y responsive)
- **Node.js + Express + WS** (Servidor Backend)
- **Sharp** (Procesamiento de imagen de alta velocidad)
- **@napolab/texture-bridge** (Captura Spout nativa)
