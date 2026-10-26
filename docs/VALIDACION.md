# Validación local — 26 de octubre de 2026

## Pruebas automáticas

`npm test`: 5 pruebas aprobadas, 0 fallos.

- Los 21 mensajes conservan íntegramente sus palabras y se distribuyen en páginas de máximo tres líneas, en dos anchos de prueba.
- No hay avance automático tras 90 segundos simulados; funcionan límites, anterior/siguiente y bloqueo de clics durante la transición.
- Las galaxias conservan su fragmento al salir, regresar y recrear la escena; el índice guardado se limita al rango válido.
- Datos de progreso incorrectos no impiden abrir el sistema.
- Las 21 galaxias pueden confirmarse una sola vez cada una, sin duplicar el progreso.

Estas pruebas usan Three.js real y un lienzo simulado para verificar la lógica, no la calidad visual.

## Recorrido en el navegador local

- Galaxia 01: regreso al fragmento 4 de 4.
- Galaxia 02: regreso al fragmento 2 de 4, después de viajar a la 01 y volver.
- Celebración en la vista previa local: constelación, 21 velitas apagadas, estrella del deseo, descarga de postal PNG y vuelta al universo.
- La descarga generó `Stacy-universo-21 (2).png`.
- Sin errores en la consola de la pestaña nueva de celebración.
- Compilación de producción correcta. Sigue existiendo la advertencia de tamaño del paquete JavaScript, sin impedir la compilación.

La celebración se recorrió mediante su vista previa de desarrollo; no se marcó artificialmente todo el progreso del navegador como leído. No se probó en un teléfono físico.
