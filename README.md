# Universo 21

Escena de cumpleaños 3D con 21 galaxias y 21 deseos. Toda la imagen espacial se genera en el navegador: estrellas, gas, polvo y galaxias. La imagen aportada por el usuario orientó la paleta y la iluminación; no se muestra ni se carga como fondo. No hay planetas.

## Interacción

Rueda o pellizco: vuelo suave. Arrastrar: girar alrededor del destino. Seleccionar galaxia: acercarse y descubrir su deseo. Al entrar y salir se mantiene el entorno estrellado, con capas de gas y estrellas cercanas. Botones para zoom, reinicio y pausa.

## Desarrollo

```sh
npm ci
npm run dev
npm run build
```

Publicar `dist/`. React, Vite, Three.js y OrbitControls. `src/environment.js` genera ruido para las nubes y los campos estelares. `src/galaxy.js` genera los discos y brazos de las galaxias. `src/main.jsx` controla el vuelo y los deseos.

## Revisión

https://drop.app.runonflux.io/feliz-cumpleanos/

Flux Drop conserva la publicación sin cuenta durante 7 días desde la última actualización. El historial permanece en GitHub.
