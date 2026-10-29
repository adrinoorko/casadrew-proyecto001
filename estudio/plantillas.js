// CASADREW · Estudio — plantillas editables (diseños originales hechos con formas y textos, sin imágenes de terceros).
// Cada plantilla crea elementos de verdad: al abrirla, todo se puede mover, cambiar de color y reescribir.
'use strict';
const Plantillas = (() => {
  const F = fabric;
  const T = (texto, o) => new F.Textbox(texto, { fontFamily: 'Segoe UI', fill: '#1a1a1a', textAlign: 'left', lineHeight: 1.2, ...o, nombre: o.nombre || texto.split('\n')[0].slice(0, 28) });
  const R = o => new F.Rect({ strokeWidth: 0, ...o, nombre: o.nombre || 'Rectángulo' });
  const C = o => new F.Circle({ strokeWidth: 0, ...o, nombre: o.nombre || 'Círculo' });
  const E = o => new F.Ellipse({ strokeWidth: 0, ...o, nombre: o.nombre || 'Elipse' });
  const L = (x1, y1, x2, y2, o) => new F.Line([x1, y1, x2, y2], { stroke: '#1a1a1a', strokeWidth: 3, ...o, nombre: o?.nombre || 'Línea' });
  const deg = (c1, c2, ang = 90, tipo = 'linear') => {
    const a = ang * Math.PI / 180, x = Math.cos(a) / 2, y = Math.sin(a) / 2;
    return new F.Gradient(tipo === 'radial'
      ? { type: 'radial', gradientUnits: 'percentage', coords: { x1: .5, y1: .5, r1: 0, x2: .5, y2: .5, r2: .7 }, colorStops: [{ offset: 0, color: c1 }, { offset: 1, color: c2 }] }
      : { type: 'linear', gradientUnits: 'percentage', coords: { x1: .5 - x, y1: .5 - y, x2: .5 + x, y2: .5 + y }, colorStops: [{ offset: 0, color: c1 }, { offset: 1, color: c2 }] });
  };
  const sombra = (blur = 30, y = 12, c = 'rgba(0,0,0,.18)') => new F.Shadow({ color: c, blur, offsetX: 0, offsetY: y });

  const LISTA = [
    { id: 'ig-coleccion', n: 'Lanzamiento de colección', cat: 'grafico', tags: ['Redes'], w: 1080, h: 1080, fondo: '#f4ece4', crear: () => [
      R({ left: 0, top: 0, width: 1080, height: 1080, fill: deg('#f7d9c4', '#e9a7b8', 135), nombre: 'Fondo degradado' }),
      C({ left: 640, top: -160, radius: 330, fill: 'rgba(255,255,255,.35)', nombre: 'Círculo decorativo' }),
      C({ left: -140, top: 720, radius: 260, fill: 'rgba(200,100,59,.18)', nombre: 'Círculo decorativo' }),
      T('NUEVA\nCOLECCIÓN', { left: 90, top: 300, width: 900, fontSize: 150, fontWeight: 'bold', fontFamily: 'Georgia', fill: '#2a1a14', lineHeight: 1 }),
      T('Otoño · Invierno 2026', { left: 96, top: 640, width: 800, fontSize: 52, fill: '#5b3a2e' }),
      R({ left: 96, top: 780, width: 380, height: 110, rx: 55, ry: 55, fill: '#2a1a14', nombre: 'Botón' }),
      T('Descúbrela', { left: 96, top: 808, width: 380, fontSize: 44, fill: '#ffffff', textAlign: 'center', fontWeight: 'bold' }),
    ] },
    { id: 'historia-frase', n: 'Historia con frase', cat: 'grafico', tags: ['Redes'], w: 1080, h: 1920, fondo: '#151217', crear: () => [
      R({ left: 0, top: 0, width: 1080, height: 1920, fill: deg('#1d1622', '#3a1f3d', 160), nombre: 'Fondo' }),
      T('“', { left: 90, top: 380, width: 300, fontSize: 400, fontFamily: 'Georgia', fill: '#e86fa3' }),
      T('La moda pasa, el estilo permanece.', { left: 110, top: 760, width: 860, fontSize: 96, fontFamily: 'Georgia', fontStyle: 'italic', fill: '#ffffff' }),
      L(110, 1240, 330, 1240, { stroke: '#e86fa3', strokeWidth: 6 }),
      T('THE NOORKO', { left: 110, top: 1290, width: 700, fontSize: 44, fill: '#e9d9e6', charSpacing: 300 }),
    ] },
    { id: 'cv', n: 'Currículum moderno', cat: 'grafico', tags: ['Impresión'], w: 2480, h: 3508, fondo: '#ffffff', crear: () => [
      R({ left: 0, top: 0, width: 820, height: 3508, fill: '#2b2f3a', nombre: 'Columna lateral' }),
      C({ left: 210, top: 260, radius: 200, fill: '#c8643b', nombre: 'Foto (pon aquí tu imagen)' }),
      T('CONTACTO', { left: 140, top: 820, width: 560, fontSize: 56, fill: '#f0b48f', fontWeight: 'bold', charSpacing: 200 }),
      T('tu@correo.com\n+34 600 000 000\nMadrid, España\nportfolio.com', { left: 140, top: 920, width: 600, fontSize: 48, fill: '#e8e8ee', lineHeight: 1.6 }),
      T('HABILIDADES', { left: 140, top: 1420, width: 560, fontSize: 56, fill: '#f0b48f', fontWeight: 'bold', charSpacing: 200 }),
      T('Diseño de moda\nPatronaje\nIllustrator y Photoshop\nIlustración digital\nDirección de arte', { left: 140, top: 1520, width: 600, fontSize: 48, fill: '#e8e8ee', lineHeight: 1.7 }),
      T('Adriana López', { left: 980, top: 250, width: 1400, fontSize: 170, fontFamily: 'Georgia', fill: '#1a1a1a', fontWeight: 'bold' }),
      T('Diseñadora de moda y gráfica', { left: 985, top: 470, width: 1400, fontSize: 70, fill: '#c8643b' }),
      L(985, 640, 2340, 640, { stroke: '#e3dcd3', strokeWidth: 6 }),
      T('EXPERIENCIA', { left: 985, top: 720, width: 1300, fontSize: 64, fontWeight: 'bold', charSpacing: 200 }),
      T('Diseñadora principal · Estudio Ejemplo\n2022 — Actualidad\nDirección de colecciones cápsula, fichas técnicas y seguimiento de producción.\n\nDiseñadora junior · Marca Ejemplo\n2019 — 2022\nDesarrollo de estampados, moodboards y presentaciones de temporada.', { left: 985, top: 840, width: 1350, fontSize: 50, fill: '#3b3b3b', lineHeight: 1.45 }),
      T('FORMACIÓN', { left: 985, top: 1900, width: 1300, fontSize: 64, fontWeight: 'bold', charSpacing: 200 }),
      T('Grado en Diseño de Moda · Escuela Ejemplo\n2015 — 2019\n\nCurso de ilustración digital · 2020', { left: 985, top: 2020, width: 1350, fontSize: 50, fill: '#3b3b3b', lineHeight: 1.45 }),
    ] },
    { id: 'carta', n: 'Carta personalizada', cat: 'grafico', tags: ['Impresión'], w: 2480, h: 3508, fondo: '#fffdf9', crear: () => [
      R({ left: 0, top: 0, width: 2480, height: 40, fill: '#c8643b', nombre: 'Franja superior' }),
      T('CASADREW', { left: 200, top: 220, width: 1200, fontSize: 110, fontWeight: 'bold', charSpacing: 250 }),
      T('Calle Ejemplo 12 · Madrid · hola@correo.com', { left: 200, top: 370, width: 2000, fontSize: 44, fill: '#7a6f63' }),
      T('29 de octubre de 2026', { left: 200, top: 700, width: 1200, fontSize: 52, fill: '#3b3b3b' }),
      T('Querida Marta:', { left: 200, top: 900, width: 2000, fontSize: 60, fontFamily: 'Georgia' }),
      T('Escribe aquí tu carta. Este bloque de texto se adapta al ancho de la página y puedes cambiar la letra, el tamaño y el color desde el panel de la derecha.\n\nAñade tantos párrafos como necesites. Para imprimir, exporta en PDF o PNG a tamaño A4.', { left: 200, top: 1060, width: 2080, fontSize: 56, fontFamily: 'Georgia', fill: '#2b2b2b', lineHeight: 1.6 }),
      T('Un abrazo,', { left: 200, top: 2500, width: 1200, fontSize: 56, fontFamily: 'Georgia' }),
      T('Adriana', { left: 200, top: 2620, width: 1200, fontSize: 130, fontFamily: 'Brush Script MT', fill: '#2b2f3a' }),
    ] },
    { id: 'postal', n: 'Postal 10 × 15', cat: 'grafico', tags: ['Impresión'], w: 1772, h: 1181, fondo: '#fff8ef', crear: () => [
      R({ left: 0, top: 0, width: 886, height: 1181, fill: deg('#ffb36b', '#e8577a', 120), nombre: 'Mitad de color' }),
      C({ left: 260, top: 300, radius: 180, fill: '#fff1c9', nombre: 'Sol' }),
      T('Saludos\ndesde el\nMediterráneo', { left: 120, top: 760, width: 700, fontSize: 92, fontFamily: 'Georgia', fill: '#ffffff', fontWeight: 'bold', lineHeight: 1 }),
      L(1330, 120, 1330, 1060, { stroke: '#d9cbb8', strokeWidth: 4 }),
      R({ left: 1500, top: 120, width: 170, height: 210, fill: 'transparent', stroke: '#d9cbb8', strokeWidth: 6, strokeDashArray: [16, 10], nombre: 'Sello' }),
      ...[600, 720, 840].map(y => L(1390, y, 1680, y, { stroke: '#d9cbb8', strokeWidth: 4 })),
      T('Escribe aquí tu mensaje…', { left: 960, top: 300, width: 320, fontSize: 44, fontFamily: 'Georgia', fontStyle: 'italic', fill: '#7a6f63' }),
    ] },
    { id: 'invitacion', n: 'Invitación elegante', cat: 'grafico', tags: ['Impresión'], w: 1500, h: 2100, fondo: '#fbf7f0', crear: () => [
      R({ left: 70, top: 70, width: 1360, height: 1960, fill: 'transparent', stroke: '#b8975a', strokeWidth: 6, nombre: 'Marco' }),
      R({ left: 100, top: 100, width: 1300, height: 1900, fill: 'transparent', stroke: '#b8975a', strokeWidth: 2, nombre: 'Marco fino' }),
      T('TE INVITAMOS A CELEBRAR', { left: 150, top: 420, width: 1200, fontSize: 52, textAlign: 'center', charSpacing: 300, fill: '#7a6a4f' }),
      T('Marta & Daniel', { left: 150, top: 620, width: 1200, fontSize: 170, textAlign: 'center', fontFamily: 'Brush Script MT', fill: '#2f2a22' }),
      L(600, 960, 900, 960, { stroke: '#b8975a', strokeWidth: 3 }),
      T('Sábado, 14 de junio de 2027\n19:00 h', { left: 150, top: 1040, width: 1200, fontSize: 64, textAlign: 'center', fontFamily: 'Georgia', fill: '#2f2a22', lineHeight: 1.5 }),
      T('Finca Ejemplo · Toledo', { left: 150, top: 1320, width: 1200, fontSize: 54, textAlign: 'center', fill: '#7a6a4f' }),
    ] },
    { id: 'presentacion', n: 'Portada de presentación', cat: 'grafico', tags: ['Presentación'], w: 1920, h: 1080, fondo: '#101a2b', crear: () => [
      R({ left: 0, top: 0, width: 1920, height: 1080, fill: deg('#101a2b', '#1f3b63', 135), nombre: 'Fondo' }),
      R({ left: 1180, top: 0, width: 740, height: 1080, fill: 'rgba(255,255,255,.06)', nombre: 'Panel derecho' }),
      C({ left: 1330, top: 260, radius: 280, fill: deg('#3fa4ff', '#8a5cf6', 135), nombre: 'Esfera' }),
      T('Plan de temporada 2027', { left: 140, top: 380, width: 1000, fontSize: 104, fontWeight: 'bold', fill: '#ffffff', lineHeight: 1.05 }),
      T('Presentación de colección · Equipo de diseño', { left: 145, top: 640, width: 950, fontSize: 40, fill: '#a9c2e6' }),
      R({ left: 145, top: 760, width: 120, height: 10, fill: '#3fa4ff', nombre: 'Detalle' }),
    ] },
    { id: 'marca', n: 'Tablero de marca', cat: 'grafico', tags: ['Marca'], w: 1920, h: 1080, fondo: '#f7f4ef', crear: () => [
      C({ left: 140, top: 200, radius: 220, fill: '#1a1a1a', nombre: 'Logotipo' }),
      T('N', { left: 140, top: 270, width: 440, fontSize: 280, textAlign: 'center', fontFamily: 'Georgia', fill: '#f7f4ef' }),
      T('THE NOORKO', { left: 120, top: 720, width: 520, fontSize: 64, textAlign: 'center', fontWeight: 'bold', charSpacing: 300 }),
      T('COLORES', { left: 780, top: 200, width: 600, fontSize: 40, fontWeight: 'bold', charSpacing: 300, fill: '#7a6f63' }),
      ...['#1a1a1a', '#c8643b', '#e9c9a8', '#7d8c6a', '#f7f4ef'].map((c, i) => R({ left: 780 + i * 200, top: 280, width: 170, height: 170, rx: 20, ry: 20, fill: c, stroke: '#e0d8cc', strokeWidth: 2, nombre: 'Color ' + c })),
      ...['#1a1a1a', '#c8643b', '#e9c9a8', '#7d8c6a', '#f7f4ef'].map((c, i) => T(c.toUpperCase(), { left: 780 + i * 200, top: 470, width: 170, fontSize: 28, textAlign: 'center', fill: '#5b5249' })),
      T('TIPOGRAFÍAS', { left: 780, top: 600, width: 600, fontSize: 40, fontWeight: 'bold', charSpacing: 300, fill: '#7a6f63' }),
      T('Georgia — Títulos', { left: 780, top: 680, width: 1000, fontSize: 72, fontFamily: 'Georgia' }),
      T('Segoe UI — Textos y detalles', { left: 780, top: 800, width: 1000, fontSize: 48 }),
    ] },
    { id: 'etiqueta', n: 'Etiqueta de precio', cat: 'grafico', tags: ['Impresión'], w: 1181, h: 591, fondo: '#ffffff', crear: () => [
      R({ left: 0, top: 0, width: 1181, height: 591, fill: '#1a1a1a', nombre: 'Fondo' }),
      C({ left: 60, top: 255, radius: 40, fill: '#ffffff', nombre: 'Agujero' }),
      T('VESTIDO LINO', { left: 220, top: 110, width: 900, fontSize: 70, fontWeight: 'bold', fill: '#ffffff', charSpacing: 150 }),
      T('Ref. 2026-014 · Talla M', { left: 220, top: 210, width: 900, fontSize: 40, fill: '#bdb5aa' }),
      T('59,90 €', { left: 220, top: 320, width: 900, fontSize: 140, fontFamily: 'Georgia', fill: '#e9b47c' }),
    ] },
    { id: 'ficha-tecnica', n: 'Ficha técnica de prenda', cat: 'moda', tags: ['Impresión'], w: 3508, h: 2480, fondo: '#ffffff', crear: () => [
      R({ left: 0, top: 0, width: 3508, height: 260, fill: '#1a1a1a', nombre: 'Cabecera' }),
      T('FICHA TÉCNICA', { left: 120, top: 70, width: 1600, fontSize: 110, fill: '#ffffff', fontWeight: 'bold', charSpacing: 250 }),
      T('Prenda: Vestido midi · Temporada: OI 2026 · Ref.: 014', { left: 1650, top: 105, width: 1750, fontSize: 52, fill: '#d8d2c8', textAlign: 'right' }),
      R({ left: 120, top: 360, width: 1050, height: 1500, fill: '#faf8f5', stroke: '#c9c0b4', strokeWidth: 4, nombre: 'Delantero' }),
      R({ left: 1250, top: 360, width: 1050, height: 1500, fill: '#faf8f5', stroke: '#c9c0b4', strokeWidth: 4, nombre: 'Espalda' }),
      T('DELANTERO', { left: 160, top: 400, width: 900, fontSize: 48, fontWeight: 'bold', fill: '#7a6f63' }),
      T('ESPALDA', { left: 1290, top: 400, width: 900, fontSize: 48, fontWeight: 'bold', fill: '#7a6f63' }),
      T('Dibuja aquí el plano con el pincel', { left: 160, top: 1050, width: 970, fontSize: 44, fill: '#b5aa9c', textAlign: 'center' }),
      T('Dibuja aquí el plano con el pincel', { left: 1290, top: 1050, width: 970, fontSize: 44, fill: '#b5aa9c', textAlign: 'center' }),
      T('MEDIDAS (cm)', { left: 2400, top: 360, width: 1000, fontSize: 56, fontWeight: 'bold' }),
      ...['Contorno pecho', 'Cintura', 'Cadera', 'Largo total', 'Largo manga', 'Ancho espalda'].flatMap((m, i) => [
        T(m, { left: 2400, top: 470 + i * 110, width: 650, fontSize: 44, fill: '#3b3b3b' }),
        T('—', { left: 3100, top: 470 + i * 110, width: 280, fontSize: 44, textAlign: 'right' }),
        L(2400, 545 + i * 110, 3380, 545 + i * 110, { stroke: '#e3dcd3', strokeWidth: 3 }),
      ]),
      T('TEJIDOS Y FORNITURAS', { left: 2400, top: 1220, width: 1000, fontSize: 56, fontWeight: 'bold' }),
      T('Tejido principal: lino 100 %\nForro: viscosa\nCremallera invisible 40 cm\nBotones: 4 × nácar 12 mm', { left: 2400, top: 1320, width: 1000, fontSize: 44, fill: '#3b3b3b', lineHeight: 1.5 }),
      T('COLORES', { left: 120, top: 1960, width: 800, fontSize: 56, fontWeight: 'bold' }),
      ...['#d9c3a5', '#6f7d5c', '#2f3540'].map((c, i) => R({ left: 120 + i * 260, top: 2060, width: 220, height: 220, rx: 16, ry: 16, fill: c, nombre: 'Color' })),
      T('OBSERVACIONES', { left: 1250, top: 1960, width: 1000, fontSize: 56, fontWeight: 'bold' }),
      T('Costuras francesas en laterales. Bajo con dobladillo de 3 cm.', { left: 1250, top: 2060, width: 2100, fontSize: 44, fill: '#3b3b3b' }),
    ] },
    { id: 'moodboard', n: 'Moodboard de colección', cat: 'moda', tags: ['Presentación'], w: 1920, h: 1080, fondo: '#efe9e1', crear: () => [
      T('MOODBOARD · OTOÑO', { left: 80, top: 60, width: 1200, fontSize: 64, fontWeight: 'bold', charSpacing: 250 }),
      ...[[80, 180, 560, 820], [680, 180, 520, 400], [680, 600, 250, 400], [950, 600, 250, 400], [1240, 180, 600, 520]].map(([x, y, w, h], i) =>
        R({ left: x, top: y, width: w, height: h, rx: 18, ry: 18, fill: ['#c9a98a', '#8c9a7a', '#d8c3b0', '#5d4a3f', '#b9b2a8'][i], nombre: 'Foto ' + (i + 1) + ' (arrastra aquí tu imagen)' })),
      ...['#5d4a3f', '#c9a98a', '#8c9a7a', '#d8c3b0', '#efe9e1'].map((c, i) => C({ left: 1250 + i * 120, top: 760, radius: 50, fill: c, stroke: '#ffffff', strokeWidth: 6, nombre: 'Color' })),
      T('Texturas naturales, tonos tierra y siluetas amplias.', { left: 1250, top: 900, width: 590, fontSize: 40, fontFamily: 'Georgia', fontStyle: 'italic', fill: '#5b5249' }),
    ] },
    { id: 'lineup', n: 'Presentación de looks', cat: 'moda', tags: ['Presentación'], w: 1920, h: 1080, fondo: '#faf7f2', crear: () => [
      T('COLECCIÓN CÁPSULA', { left: 80, top: 60, width: 1300, fontSize: 64, fontWeight: 'bold', charSpacing: 300 }),
      ...[0, 1, 2, 3, 4].flatMap(i => [
        R({ left: 80 + i * 360, top: 180, width: 320, height: 760, rx: 24, ry: 24, fill: '#ffffff', stroke: '#e3dcd3', strokeWidth: 3, shadow: sombra(24, 10, 'rgba(0,0,0,.08)'), nombre: `Look 0${i + 1}` }),
        E({ left: 200 + i * 360, top: 230, rx: 40, ry: 50, fill: '#efe3d6', nombre: 'Cabeza (croquis)' }),
        new F.Polygon([{ x: 0, y: 0 }, { x: 120, y: 0 }, { x: 170, y: 470 }, { x: -50, y: 470 }], { left: 180 + i * 360, top: 350, fill: ['#c8643b', '#2f3540', '#8c9a7a', '#d9c3a5', '#5d4a3f'][i], nombre: 'Silueta' }),
        T(`LOOK 0${i + 1}`, { left: 80 + i * 360, top: 870, width: 320, fontSize: 36, textAlign: 'center', fontWeight: 'bold', charSpacing: 200 }),
      ]),
    ] },
    { id: 'estampado', n: 'Módulo de estampado', cat: 'moda', tags: ['Textil'], w: 2000, h: 2000, fondo: '#f6efe6', crear: () => {
      const objs = [];
      for (let f = 0; f < 4; f++) for (let c = 0; c < 4; c++) {
        const x = c * 500 + (f % 2) * 250, y = f * 500;
        objs.push(C({ left: x + 150, top: y + 150, radius: 100, fill: '#c8643b', nombre: 'Motivo' }));
        objs.push(C({ left: x + 205, top: y + 205, radius: 45, fill: '#f6efe6', nombre: 'Motivo centro' }));
        objs.push(new F.Polygon([{ x: 0, y: -60 }, { x: 20, y: 0 }, { x: 0, y: 60 }, { x: -20, y: 0 }], { left: x + 30, top: y + 370, fill: '#2f3540', nombre: 'Hoja' }));
      }
      return objs;
    } },
    { id: 'web-landing', n: 'Página web de inicio', cat: 'web', tags: ['Escritorio'], w: 1440, h: 1024, fondo: '#ffffff', crear: () => [
      R({ left: 0, top: 0, width: 1440, height: 84, fill: '#ffffff', stroke: '#eeeeee', strokeWidth: 2, nombre: 'Barra de navegación' }),
      T('NOORKO', { left: 60, top: 24, width: 300, fontSize: 32, fontWeight: 'bold', charSpacing: 200 }),
      T('Colección     Sobre mí     Tienda     Contacto', { left: 760, top: 30, width: 620, fontSize: 22, fill: '#555555', textAlign: 'right' }),
      R({ left: 0, top: 84, width: 1440, height: 520, fill: deg('#fbe3d6', '#f3c6d6', 135), nombre: 'Portada' }),
      T('Moda hecha a mano,\npensada para durar', { left: 100, top: 210, width: 800, fontSize: 64, fontWeight: 'bold', fontFamily: 'Georgia', lineHeight: 1.1 }),
      T('Prendas de edición limitada diseñadas en Madrid.', { left: 104, top: 380, width: 700, fontSize: 24, fill: '#5b4a44' }),
      R({ left: 104, top: 450, width: 240, height: 64, rx: 32, ry: 32, fill: '#1a1a1a', nombre: 'Botón' }),
      T('Ver colección', { left: 104, top: 468, width: 240, fontSize: 22, fill: '#ffffff', textAlign: 'center', fontWeight: 'bold' }),
      ...[0, 1, 2].flatMap(i => [
        R({ left: 100 + i * 420, top: 660, width: 380, height: 300, rx: 20, ry: 20, fill: '#f6f2ee', nombre: 'Tarjeta ' + (i + 1) }),
        R({ left: 120 + i * 420, top: 680, width: 340, height: 180, rx: 12, ry: 12, fill: ['#d9c3a5', '#8c9a7a', '#2f3540'][i], nombre: 'Imagen' }),
        T(['Vestidos', 'Chaquetas', 'Accesorios'][i], { left: 120 + i * 420, top: 885, width: 340, fontSize: 26, fontWeight: 'bold' }),
      ]),
    ] },
    { id: 'web-movil', n: 'Pantalla de app móvil', cat: 'web', tags: ['Móvil'], w: 390, h: 844, fondo: '#f7f5f2', crear: () => [
      T('Hola, Adriana', { left: 24, top: 70, width: 340, fontSize: 30, fontWeight: 'bold' }),
      T('¿Qué diseñamos hoy?', { left: 24, top: 112, width: 340, fontSize: 17, fill: '#7a6f63' }),
      R({ left: 24, top: 160, width: 342, height: 48, rx: 24, ry: 24, fill: '#ffffff', stroke: '#e6e0d8', strokeWidth: 1, nombre: 'Buscador' }),
      T('Buscar…', { left: 50, top: 174, width: 200, fontSize: 16, fill: '#a39a90' }),
      R({ left: 24, top: 236, width: 342, height: 180, rx: 22, ry: 22, fill: deg('#c8643b', '#e8577a', 135), nombre: 'Destacado' }),
      T('Nueva colección', { left: 44, top: 350, width: 300, fontSize: 24, fontWeight: 'bold', fill: '#ffffff' }),
      ...[0, 1, 2, 3].map(i => R({ left: 24 + (i % 2) * 177, top: 440 + Math.floor(i / 2) * 177, width: 165, height: 165, rx: 18, ry: 18, fill: ['#e9dfd3', '#d7e3d8', '#e3dbef', '#f3dcd9'][i], nombre: 'Tarjeta' })),
      R({ left: 0, top: 778, width: 390, height: 66, fill: '#ffffff', stroke: '#eeeeee', strokeWidth: 1, nombre: 'Barra inferior' }),
    ] },
    { id: 'ilustracion', n: 'Lienzo de ilustración', cat: 'ilustracion', tags: ['Dibujo'], w: 2048, h: 2048, fondo: '#fffdf8', crear: () => [
      R({ left: 60, top: 60, width: 1928, height: 1928, fill: 'transparent', stroke: '#eadfce', strokeWidth: 4, strokeDashArray: [20, 14], nombre: 'Margen' }),
      T('Paleta', { left: 1790, top: 90, width: 180, fontSize: 32, fill: '#b5aa9c', textAlign: 'center' }),
      ...['#2b2f3a', '#c8643b', '#e9b47c', '#8c9a7a', '#7b5cd6', '#e86fa3'].map((c, i) => C({ left: 1830, top: 150 + i * 120, radius: 45, fill: c, nombre: 'Color de la paleta' })),
    ] },
    { id: 'escena-producto', n: 'Escena 3D de producto', cat: '3d', tags: ['Presentación'], w: 1920, h: 1080, fondo: '#e9e4f5', crear: () => [
      R({ left: 0, top: 0, width: 1920, height: 1080, fill: deg('#f2eefb', '#cfc4ec', 90), nombre: 'Fondo' }),
      E({ left: 560, top: 820, rx: 420, ry: 70, fill: 'rgba(60,40,110,.25)', nombre: 'Sombra' }),
      R({ left: 600, top: 640, width: 720, height: 230, fill: deg('#ffffff', '#d8cff2', 90), nombre: 'Pedestal' }),
      E({ left: 600, top: 570, rx: 360, ry: 70, fill: deg('#ffffff', '#ebe6fa', 90), nombre: 'Tapa del pedestal' }),
      C({ left: 780, top: 250, radius: 180, fill: deg('#ffd6e8', '#7b5cd6', 135, 'radial'), shadow: sombra(60, 30, 'rgba(60,40,110,.35)'), nombre: 'Esfera (tu producto)' }),
      T('PRODUCTO', { left: 120, top: 120, width: 700, fontSize: 90, fontWeight: 'bold', fill: '#2c2148' }),
      T('Coloca tu imagen sobre el pedestal', { left: 124, top: 240, width: 700, fontSize: 36, fill: '#5d5180' }),
    ] },
    { id: 'calendario', n: 'Calendario mensual', cat: 'grafico', tags: ['Impresión'], w: 2480, h: 3508, fondo: '#ffffff', crear: () => {
      const objs = [T('NOVIEMBRE 2026', { left: 160, top: 220, width: 2160, fontSize: 150, fontWeight: 'bold', fontFamily: 'Georgia', textAlign: 'center' })];
      'LMXJVSD'.split('').forEach((d, i) => objs.push(T(d, { left: 160 + i * 310, top: 560, width: 300, fontSize: 64, textAlign: 'center', fill: '#c8643b', fontWeight: 'bold' })));
      for (let n = 1; n <= 30; n++) {
        const i = n + 5 - 1, c = i % 7, f = Math.floor(i / 7);
        objs.push(R({ left: 165 + c * 310, top: 700 + f * 420, width: 290, height: 400, rx: 16, ry: 16, fill: '#faf6f1', nombre: 'Día ' + n }));
        objs.push(T(String(n), { left: 190 + c * 310, top: 720 + f * 420, width: 200, fontSize: 60, fill: '#3b3b3b' }));
      }
      return objs;
    } },
  ];
  const CATEGORIAS = [
    { id: 'grafico', n: 'Diseño gráfico', color: '#c8643b' }, { id: 'moda', n: 'Moda', color: '#d63d86' },
    { id: 'ilustracion', n: 'Ilustración', color: '#7b5cd6' }, { id: 'web', n: 'Diseño web', color: '#2f7fe0' },
    { id: '3d', n: '3D', color: '#1f9e74' },
  ];

  const porId = id => LISTA.find(p => p.id === id);
  // Diseño listo para el editor: { doc, objetos } con los elementos ya convertidos a datos.
  function diseno(id, extra) {
    const p = porId(id);
    if (!p) return null;
    return { doc: { nombre: p.n, w: p.w, h: p.h, fondo: p.fondo }, objetos: p.crear().map(o => o.toObject(extra)) };
  }
  // Miniatura (se dibuja una vez y se recuerda mientras la página está abierta).
  const miniaturas = new Map();
  function miniatura(id, ancho = 360) {
    if (miniaturas.has(id)) return miniaturas.get(id);
    const p = porId(id), k = ancho / Math.max(p.w, p.h);
    const c = new F.StaticCanvas(undefined, { width: Math.round(p.w * k), height: Math.round(p.h * k), backgroundColor: p.fondo, enableRetinaScaling: false, renderOnAddRemove: false });
    c.setZoom(k);
    c.add(...p.crear());
    c.renderAll();
    const url = c.toDataURL({ format: 'png' });
    c.dispose();
    miniaturas.set(id, url);
    return url;
  }
  return { LISTA, CATEGORIAS, porId, diseno, miniatura };
})();
