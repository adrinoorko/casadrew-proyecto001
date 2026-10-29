# Procedencia y licencias de los recursos de CASADREW Estudio

Revisado el 29 de octubre de 2026.

| Recurso | Dónde está | Origen | Licencia | ¿Atribución obligatoria? |
|---|---|---|---|---|
| ~2.500 iconos (25 categorías: naturaleza, comida, tienda, lavado/etiquetas de ropa, flechas, caras…) | `recursos/iconos-tabler.js` | Tabler Icons 3.50.0 (paquete npm `@tabler/icons`), https://tabler.io/icons | MIT (`recursos/tabler-LICENSE.txt`) | No (basta conservar el aviso de licencia, ya incluido). Uso comercial permitido. |
| Formas, moda (prendas planas, detalles, accesorios), marcos, stickers, ilustraciones, neón, 3D, degradados, texturas y tejidos, fondos, efectos, líneas y componentes web | `elementos.js` | Diseño original de CASADREW (dibujado en código) | Propia | No |
| Plantillas | `plantillas.js` | Diseño original de CASADREW | Propia | No |
| Motor para quitar el fondo (U²-Net pequeño, `u2netp.onnx`) | `modelos/` | Proyecto rembg (copia oficial del modelo de Xuebin Qin y otros) | Apache 2.0 | No |
| Motor de IA en el navegador (onnxruntime-web) | `lib/ort/` | Microsoft, paquete npm `onnxruntime-web` | MIT | No |
| Creador de GIF (gifenc 1.0.3) | `lib/gifenc-1.0.3.js` | Matt DesLauriers, paquete npm `gifenc` | MIT (`lib/gifenc-LICENSE.txt`) | No |
| Fabric.js 6.7.1, perfect-freehand 1.2.2, qrcode-generator 1.4.4, jsQR 1.4.0 | `lib/` | npm | MIT / Apache 2.0 (jsQR) | No |

## Por qué no se usa Freepik dentro del programa

La licencia gratuita de Freepik exige atribución en cada uso y **prohíbe** redistribuir sus recursos
o incluirlos en aplicaciones, plantillas o bibliotecas que otras personas puedan descargar.
Meterlos en la biblioteca de CASADREW incumpliría esa licencia. Si quieres usar un recurso concreto de
Freepik en un diseño tuyo, descárgalo tú desde su web y arrástralo al lienzo: así queda bajo tu propia licencia
de uso (recuerda poner la atribución que pidan).

## Cómo añadir recursos tuyos

Arrastra tus imágenes, SVG o PNG al lienzo, o pégalos. Para que formen parte fija de la biblioteca,
pásame la carpeta con los archivos y te los organizo con su categoría y su origen.
