# Stacy · Edición 21

Una sorpresa de cumpleaños breve y responsive para Stacy Brigitte Valenzuela Rios, por sus 21 años el 30 de octubre de 2026.

## Recorrido

1. Abre la caja ilustrada.
2. Pide un deseo y apaga las 21 velitas con un toque.
3. Abre la tarjeta de cumpleaños y vuelve a celebrar si quieres.

Sin juegos, frases románticas, micrófono, registro ni base de datos. Sonido opcional mediante Web Audio, apagado inicialmente. Respeta la preferencia de movimiento reducido.

## Desarrollo

Requiere Node.js 20.19+ o 22.12+.

```sh
npm ci
npm run dev
```

## Producción

```sh
npm run build
npm run preview
```

Publicar el contenido de `dist/` en un alojamiento estático. No se necesitan claves ni variables de entorno.

## Personalización

- `src/main.jsx`: nombre, edad, fecha, mensajes y secuencia.
- `src/style.css`: paleta, ilustraciones CSS, animaciones y tamaños responsive.
- `index.html`: título y metadatos.

Las ilustraciones de caja y pastel están hechas con CSS. Las fuentes DM Sans y Playfair Display se solicitan a Google Fonts y tienen alternativas locales. Iconos de Lucide.

## Verificación

Compilación de producción y revisión manual del recorrido: abrir regalo, apagar velitas, tarjeta final y reinicio. Diseño con puntos de adaptación a 850, 600 y 370 px.
