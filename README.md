# Universo 21 · Stacy

Galaxia interactiva de cumpleaños para Stacy Brigitte Valenzuela Rios: 21 años, 30 de octubre de 2026. Sin romance, tareas ni bloqueos.

## Experiencia

- 21 estrellas conectadas dibujan el número 21 en la vista general.
- Cámara con interpolación y campo de estrellas con profundidad; zoom con rueda, gesto de dos dedos o botones.
- Arrastrar desplaza la galaxia; el botón de encuadre restaura la vista inicial.
- Cada estrella descubre un deseo. Tres destinos principales: deseos, pastel y tarjeta.
- Pastel ilustrado con 21 velas que se apagan con un toque.
- Acceso directo a la sorpresa, navegación con teclado, cierre con Escape y movimiento reducido.

## Ejecutar

Node.js 20.19+ o 22.12+.

```sh
npm ci
npm run dev
npm run build
npm run preview
```

Publicar `dist/`. Vite usa rutas relativas para soportar enlaces con subdirectorios. No requiere servidor, claves, micrófono ni base de datos.

## Archivos

- `src/main.jsx`: motor Canvas, puntos de la constelación, deseos y paneles React.
- `src/style.css`: aspecto del observatorio, pastel y adaptación móvil.
- `vite.config.js`: rutas relativas.

Fuentes de Google Fonts con alternativas locales; iconos de Lucide. Los efectos y las ilustraciones se dibujan con Canvas y CSS.

## Publicación

Enlace para revisión: https://drop.app.runonflux.io/feliz-cumpleanos/

Flux Drop conserva publicaciones sin cuenta durante 7 días. Consultar la fecha de caducidad que muestra el servicio. El código y el historial permanecen en este repositorio.
