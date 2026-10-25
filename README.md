# Universo 21 · espacio 3D

Escena de espacio exterior para el cumpleaños 21 de Stacy. En esta etapa solo incluye el universo, la cámara y 21 galaxias con un deseo en cada una.

## Interacción

- Arrastrar: orbitar la cámara en tres dimensiones.
- Rueda del ratón o gesto de dos dedos: acercar y alejar.
- Clic o toque en una galaxia: viaje de cámara y deseo.
- Selector de galaxias: acceso directo y mediante teclado a las 21 galaxias.
- Controles de zoom, vista inicial y pausa del movimiento.

Las galaxias tienen brazos de polvo con textura procedural, bulbo estelar, halo de estrellas en volumen, orientaciones diferentes y giro propio. Están separadas por un mínimo de 250 unidades en un volumen tridimensional. El zoom selecciona una galaxia bajo el cursor o en la dirección de la cámara y viaja hacia ella; el deseo se revela al llegar. El encuadre inicial se adapta al formato vertical. El movimiento se puede pausar. La animación deja de renderizar cuando la pestaña está oculta.

## Desarrollo

```sh
npm ci
npm run dev
npm run build
```

Requiere Node.js 20.19+ o 22.12+. Publicar `dist/`; sus rutas son relativas. Sin servidor, registro, micrófono ni claves.

React + Vite + Three.js + OrbitControls. Renderizado WebGL; partículas y texturas generadas localmente, sin fotografías externas. Fuente DM Sans de Google Fonts con alternativa local; iconos Lucide.

## Revisión

https://drop.app.runonflux.io/feliz-cumpleanos/

Flux Drop conserva publicaciones sin cuenta durante 7 días desde la última actualización. El historial permanece en GitHub.

