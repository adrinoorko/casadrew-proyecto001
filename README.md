# CASADREW · Proyecto 001

Proyecto personal de Adriana. Se abre en el móvil, la tablet y el ordenador desde GitHub Pages.

Ahora mismo es una página de «en construcción»; el programa de verdad va aquí.

## Estudio (fase 1)

`estudio/` es el editor de diseño: lienzo con capas, texto, formas, imágenes (botón, arrastrar o pegar), alinear y repartir, agrupar, bloquear, degradados, sombras, modos de fusión, deshacer/rehacer y guardado automático en el aparato (IndexedDB). Exporta PNG, JPG, SVG y el proyecto editable `.casadrew`.

Usa Fabric.js 6.7.1 (licencia MIT), copiado en `estudio/lib/` para que funcione sin conexión.

## Estudio (fase 2)

- Pincel en el editor (tecla B): lápiz, tinta, rotulador, pincel y marcador, con presión e inclinación del Apple Pencil, estabilización y opción "solo el lápiz dibuja" (los dedos mueven y acercan la vista). Cada trazo es un elemento vectorial.
- Borrador de trazos (tecla X): quita trazos enteros.
- `estudio/firma.html`: creador de firmas; exporta PNG transparente recortado (alta resolución) y SVG, o la pasa al diseño abierto.

Usa perfect-freehand 1.2.2 (licencia MIT), en `estudio/lib/`.
