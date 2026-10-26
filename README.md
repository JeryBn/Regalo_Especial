# Universo 21

Escena de cumpleaños 3D con 21 galaxias y deseos. Estrellas, gas, polvo y galaxias se generan en el navegador. Sin planetas ni fotografías como fondo.

## Explorar

- Ratón: arrastrar para girar; rueda para viajar en la dirección del cursor. Al apuntar una galaxia visible, el acercamiento se orienta hacia ella. El botón derecho permite desplazar la vista.
- Celular: un dedo gira; pellizco acerca o aleja alrededor del punto medio; mover dos dedos desplaza la vista.
- Un único botón restaura la vista general. No hay selector: las galaxias se descubren explorando. Al señalar una galaxia visible, un halo suave indica el destino.
- La cámara se aproxima de manera amortiguada y continua; el deseo se revela al llegar.

## Desarrollo

```sh
npm ci
npm run dev
npm run build
```

Publicar `dist/`. React, Vite, Three.js y OrbitControls. `src/starfield.js` genera el cielo envolvente, paralaje y estelas de vuelo; `src/environment.js` genera el gas y la luz; `src/galaxy.js`, las galaxias; `src/main.jsx`, la navegación y los deseos.

## Revisión

Abre http://127.0.0.1:5173 después de ejecutar npm run dev.

Esta versión se desarrolla y revisa localmente. Los cambios se guardan en GitHub; no se publica automáticamente en Drop.

## Meteoros y estrellas fugaces

`src/meteors.js` crea estelas, núcleos luminosos, rocas irregulares y fragmentos con geometría y texturas generadas. Las fotografías del usuario solo orientaron colores y formas; no se cargan en la página. Las apariciones usan probabilidad dependiente del tiempo, con parámetros nuevos elegidos con Math.random en cada evento, sin bucle de trayectorias ni cronograma fijo. Se limita la cantidad simultánea a cinco y se liberan geometrías/materiales al terminar. El tamaño del fenómeno se adapta a la escala de la cámara.

## Deseos de polvo estelar

Los 21 mensajes son breves y se muestrean como partículas individuales. Al descansar dentro de una galaxia se reúnen, forman palabras y después se dispersan. Volver a mover o girar la cámara disuelve el texto. No hay tarjeta, fondo rectangular ni botón de cerrar. La frase mantiene una alternativa accesible para lectores de pantalla.

Las estelas azules periféricas se calculan a partir de la velocidad real de traslación. Se atenúan al frenar y no se activan por el giro ambiental lento.

La celebración final se desbloquea al terminar los fragmentos de las 21 galaxias.
El progreso se guarda en el navegador (en este dispositivo); las galaxias leídas se marcan en dorado.
Incluye constelación 21, velitas táctiles, estrella del deseo y postal PNG descargable.
Para revisar el cierre en desarrollo sin completar el recorrido: http://127.0.0.1:5173/?celebracion=1.
Esta vista previa solo funciona con el servidor local de desarrollo y no cambia el progreso guardado.

La lectura de fragmentos es manual: flechas anterior/siguiente, sin avance por tiempo.
Cada cambio dispersa el texto y reúne el fragmento siguiente con polvo estelar.
En el último fragmento, «Leído ✓» confirma la lectura y registra la galaxia en el progreso.

Se puede regresar a la galaxia anterior desde los controles de lectura.
El fragmento de cada galaxia se conserva en el navegador, incluso al recargar, y se restaura al regresar.
