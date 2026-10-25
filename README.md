# Universo 21

Escena de cumpleaños 3D con 21 galaxias y deseos. Estrellas, gas, polvo y galaxias se generan en el navegador. Sin planetas ni fotografías como fondo.

## Explorar

- Ratón: arrastrar para girar; rueda para viajar en la dirección del cursor. Al apuntar una galaxia visible, el acercamiento se orienta hacia ella. El botón derecho permite desplazar la vista.
- Celular: un dedo gira; pellizco acerca o aleja alrededor del punto medio; mover dos dedos desplaza la vista.
- Un único botón restaura la vista general. El selector permite visitar cualquiera de las 21 galaxias.
- La cámara se aproxima de manera amortiguada y continua; el deseo se revela al llegar.

## Desarrollo

```sh
npm ci
npm run dev
npm run build
```

Publicar `dist/`. React, Vite, Three.js y OrbitControls. `src/environment.js` genera gas y campos estelares; `src/galaxy.js`, las galaxias; `src/main.jsx`, la navegación y los deseos.

## Revisión

https://drop.app.runonflux.io/feliz-cumpleanos/

Flux Drop conserva la publicación sin cuenta durante 7 días desde su última actualización. El historial permanece en GitHub.
