# Documentación y Pruebas: Integración Spout a Web

## 1. Requisitos del Sistema
- **Sistema Operativo**: Windows 10/11 (Spout es exclusivo de Windows y DirectX/OpenGL).
- **Software**: Resolume Avenue o Arena (u otro software compatible con Spout) enviando la salida por Spout.
- **Entorno de Ejecución**: Node.js v16+ instalado.
- **Hardware**: GPU dedicada recomendada para el procesamiento de Spout y WebGL.

## 2. Configuración y Uso
1. **Instalar dependencias**: Ejecuta `npm install` en la carpeta del proyecto.
2. **Iniciar Resolume**:
   - Abre Resolume y ve a `Output > Advanced`.
   - Crea un nuevo `Screen` y en la salida (Device) selecciona `Spout`.
   - Asegúrate de que el nombre del remitente sea válido (por defecto Resolume lo expone automáticamente).
3. **Iniciar el servidor**:
   - Haz doble clic en `run_locally.bat` o ejecuta `node spout_server.js`.
   - El servidor buscará automáticamente fuentes Spout activas.
4. **Ver la web**:
   - Abre `http://localhost:8080/`.
   - Importa un XML/JSON de Resolume. Las pantallas mostrarán en tiempo real la porción exacta de la textura Spout según su `InputRect`.

## 3. Suite de Pruebas Exhaustivas

### A. Prueba de Conectividad y Autodescubrimiento
- **Objetivo**: Validar que el servidor detecta y se conecta automáticamente al remitente Spout.
- **Paso**: Inicia el servidor *antes* de abrir Resolume. Luego, abre Resolume y activa la salida Spout.
- **Resultado Esperado**: El indicador en la UI de la web debe pasar de "Spout: Buscando..." a "Spout: Conectado" sin necesidad de recargar la página.

### B. Prueba de Latencia
- **Objetivo**: Asegurar que la latencia visual sea mínima.
- **Paso**: En Resolume, pon un clip con un código de tiempo o un metrónomo rápido. Graba con un teléfono a 60fps la pantalla de Resolume y la ventana del navegador una al lado de la otra.
- **Resultado Esperado**: La diferencia de tiempo visual entre Resolume y el navegador debe ser inferior a 100ms.

### C. Prueba de Resolución de Video y Mapeo UV
- **Objetivo**: Validar que la resolución del frame entrante se actualiza dinámicamente y el mapeo UV (InputRect) se mantiene preciso.
- **Paso**: Cambia la resolución de la composición en Resolume (ej. de 1920x1080 a 1280x720).
- **Resultado Esperado**: La UI web debe mostrar la nueva resolución instantáneamente (`1280x720`). Los slides en 3D deben ajustar su textura y seguir mostrando la sección correcta de la imagen.

### D. Prueba de Tasa de Frames (FPS) y Carga
- **Objetivo**: Comprobar el rendimiento bajo diferentes resoluciones.
- **Paso**: Manda una textura Spout 4K desde Resolume. Observa el indicador de FPS en la web.
- **Resultado Esperado**: El sistema debería mantener ~30 FPS estables. Si baja drásticamente, ajustar la variable `quality` de compresión JPEG en `spout_server.js`.

### E. Prueba de Estabilidad (Desconexión/Pérdida de Señal)
- **Objetivo**: Validar la resiliencia del sistema ante interrupciones.
- **Paso**: Mientras se envían frames, cierra Resolume repentinamente.
- **Resultado Esperado**: El servidor Node.js no debe crashear. La UI web pasará a "Buscando...". Al reabrir Resolume, se debe restaurar el flujo de video automáticamente.

## 4. Troubleshooting (Solución de Problemas)

- **El indicador dice "Spout: Buscando..." indefinidamente**:
  - Asegúrate de que Resolume está enviando la señal por Spout (`Output -> Advanced -> Device: Spout`).
  - Verifica que usas la misma tarjeta gráfica para Resolume y para el entorno de Node.js/navegador (común en laptops con doble GPU).
- **Los FPS en la web son muy bajos (<10 FPS)**:
  - El proceso de codificación JPEG a resoluciones muy altas (ej. 8K) consume mucha CPU. Baja la resolución de composición de Resolume o modifica `spout_server.js` para redimensionar la textura (`.resize({ width: 1920 })`) antes de comprimir.
- **Las texturas se ven desplazadas o incorrectas**:
  - Verifica que el archivo XML/JSON cargado corresponda exactamente a la composición actual de Resolume, ya que las coordenadas `InputRect` dependen de esta correspondencia.
