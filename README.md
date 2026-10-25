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


## Escalas y referencias visuales

La entrada usa la imagen de nebulosa aportada por el usuario (`public/nebula-reference.png`), como presentación visual, no como mapa científico del universo. Al acercarse se desvanece para revelar las galaxias 3D. El interior muestra un entorno artístico de planetas y estrellas; los tamaños y distancias se comprimen para que se puedan explorar.

Referencias consultadas para estrellas, polvo y brillo:
- NASA / Hubble, Andrómeda: https://science.nasa.gov/missions/hubble/nasas-hubble-traces-hidden-history-of-andromeda-galaxy/
- NASA, polvo de la nebulosa Hélice: https://www.nasa.gov/image-article/dust-helix-nebula/

`src/environment.js` crea el fondo y el sistema planetario. La cámara usa amortiguación continua con tiempo entre fotogramas; los eventos de zoom actualizan el destino sin reiniciar curvas de animación.

Los mapas de Tierra, Marte, Luna, Neptuno, anillos y cielo de la Vía Láctea son de Solar System Scope / INOVE (basados en datos NASA), CC BY 4.0: https://www.solarsystemscope.com/textures/ . Se conservan como recursos locales y se acredita al autor en pantalla. El gigante con anillos usa una superficie procedural ficticia; los entornos son composiciones artísticas, no reconstrucciones de sistemas observados.
