// CASADREW · Estudio — exportar: «Exprés» (un clic, la mejor opción para tu diseño) y «Avanzada» (todo a mano).
// Formatos: PNG, JPG y WebP (con la resolución en ppp guardada dentro del archivo), PDF para imprenta
// (tamaño real en mm, sangrado y marcas de corte), SVG vectorial, GIF y vídeo (si el diseño tiene animación)
// y el proyecto editable .casadrew. Antes de descargar se revisan fuentes, recortes, resolución de fotos y márgenes.
// Exportar nunca cambia el diseño: el proyecto editable queda igual.
'use strict';
const Exportar = (() => {
  const MM = 25.4, PT = 72;
  const esIOS = /iPad|iPhone/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && 'ontouchend' in document);
  const MAX_LADO = 16384, MAX_AREA = esIOS ? 16.7e6 : 140e6;
  const PAPELES = [[210, 297], [297, 420], [148, 210], [215.9, 279.4], [215.9, 355.6], [100, 150], [105, 148]];
  const animada = () => typeof Animacion !== 'undefined' && Animacion.activa();

  // ¿Es un diseño para imprimir? (lo dice el propio diseño o su tamaño coincide con un papel a 300 ppp)
  function pppDelDiseno() {
    if (doc.ppp) return doc.ppp;
    const mm = v => v / 300 * MM;
    const papel = PAPELES.some(([a, b]) => [[a, b], [b, a]].some(([x, y]) => Math.abs(mm(doc.w) - x) < 1.5 && Math.abs(mm(doc.h) - y) < 1.5));
    return papel ? 300 : 0;
  }
  const hayFotos = () => canvas.getObjects().some(o => o.visible && o instanceof F.FabricImage && o.getScaledWidth() * o.getScaledHeight() > doc.w * doc.h * .15);
  const fondoTransparente = () => !doc.fondo && !doc.fondoDeg;

  // ---------- Dibujar la página ----------
  // escala: píxeles de salida por píxel del diseño. sangrado: píxeles del diseño que se añaden por cada lado.
  function renderizar({ escala = 1, sangrado = 0, transparente = false, gris = false, blanco = false } = {}) {
    const vpt = canvas.viewportTransform.slice(), activo = canvas.getActiveObject();
    const fondo = doc.fondo, fondoDeg = doc.fondoDeg;
    canvas.discardActiveObject();
    exportando = true; window.sangradoExport = sangrado;
    if (transparente) { doc.fondo = null; doc.fondoDeg = null; }
    canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
    let c;
    try {
      c = canvas.toCanvasElement(escala, { left: -sangrado, top: -sangrado, width: doc.w + 2 * sangrado, height: doc.h + 2 * sangrado });
    } finally {
      exportando = false; window.sangradoExport = 0;
      doc.fondo = fondo; doc.fondoDeg = fondoDeg;
      canvas.setViewportTransform(vpt);
      if (activo) canvas.setActiveObject(activo);
      canvas.requestRenderAll();
    }
    if (blanco || gris) {
      const b = Object.assign(document.createElement('canvas'), { width: c.width, height: c.height }), x = b.getContext('2d', { willReadFrequently: gris });
      if (blanco) { x.fillStyle = '#ffffff'; x.fillRect(0, 0, b.width, b.height); }
      x.drawImage(c, 0, 0);
      if (gris) {
        const img = x.getImageData(0, 0, b.width, b.height), d = img.data;
        for (let i = 0; i < d.length; i += 4) { const l = Math.round(d[i] * .2126 + d[i + 1] * .7152 + d[i + 2] * .0722); d[i] = d[i + 1] = d[i + 2] = l; }
        x.putImageData(img, 0, 0);
      }
      c = b;
    }
    return c;
  }
  const aBlob = (c, tipo, calidad) => new Promise((ok, mal) => c.toBlob(b => b ? ok(b) : mal(new Error('el aparato no pudo crear la imagen (¿demasiado grande?)')), tipo, calidad));

  // ---------- Resolución (ppp) dentro de los archivos ----------
  const TABLA_CRC = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc32 = bytes => { let c = 0xFFFFFFFF; for (const b of bytes) c = TABLA_CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  async function pngConPpp(blob, ppp) {
    const a = new Uint8Array(await blob.arrayBuffer()), ppm = Math.round(ppp / .0254);
    const trozo = new Uint8Array(21), v = new DataView(trozo.buffer);
    v.setUint32(0, 9); trozo.set([112, 72, 89, 115], 4); v.setUint32(8, ppm); v.setUint32(12, ppm); trozo[16] = 1;
    v.setUint32(17, crc32(trozo.subarray(4, 17)));
    const fin = 8 + 25; // firma + bloque IHDR
    return new Blob([a.subarray(0, fin), trozo, a.subarray(fin)], { type: 'image/png' });
  }
  async function jpgConPpp(blob, ppp) {
    const a = new Uint8Array(await blob.arrayBuffer());
    if (a[2] === 0xFF && a[3] === 0xE0 && String.fromCharCode(...a.subarray(6, 10)) === 'JFIF') {
      a[13] = 1; a[14] = ppp >> 8; a[15] = ppp & 255; a[16] = ppp >> 8; a[17] = ppp & 255;
    }
    return new Blob([a], { type: 'image/jpeg' });
  }

  // ---------- PDF (una página con la imagen a tamaño real) ----------
  async function crearPDF(c, { anchoPt, altoPt, sangradoPt = 0, marcas = false, sinPerdida = false, titulo = '' }) {
    const enc = new TextEncoder(), partes = [], offsets = [];
    let total = 0;
    const poner = p => { const b = typeof p === 'string' ? enc.encode(p) : p; partes.push(b); total += b.length; };
    const objeto = (n, cuerpo, flujo) => {
      offsets[n] = total;
      poner(`${n} 0 obj\n${cuerpo}\n`);
      if (flujo) { poner('stream\n'); poner(flujo); poner('\nendstream\n'); }
      poner('endobj\n');
    };
    const m = marcas ? Math.max(sangradoPt, 10 / MM * PT) : sangradoPt; // margen alrededor del corte
    const W = anchoPt + 2 * m, H = altoPt + 2 * m, n = v => +v.toFixed(3);
    let datos, filtro;
    if (sinPerdida && 'CompressionStream' in window) {
      const d = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data, rgb = new Uint8Array(c.width * c.height * 3);
      for (let i = 0, j = 0; i < d.length; i += 4, j += 3) { const a = d[i + 3] / 255; rgb[j] = d[i] * a + 255 * (1 - a); rgb[j + 1] = d[i + 1] * a + 255 * (1 - a); rgb[j + 2] = d[i + 2] * a + 255 * (1 - a); }
      datos = new Uint8Array(await new Response(new Blob([rgb]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
      filtro = '/FlateDecode';
    } else {
      datos = new Uint8Array(await (await aBlob(c, 'image/jpeg', .95)).arrayBuffer());
      filtro = '/DCTDecode';
    }
    const x0 = m, y0 = m, x1 = m + anchoPt, y1 = m + altoPt, s = sangradoPt;
    let dibujo = `q\n${n(anchoPt + 2 * s)} 0 0 ${n(altoPt + 2 * s)} ${n(m - s)} ${n(m - s)} cm\n/Im0 Do\nQ\n`;
    if (marcas) {
      const sep = Math.max(s, 3 / MM * PT), largo = Math.max(4, m - sep - 1);
      dibujo += '0.25 w 0 0 0 RG\n';
      for (const cx of [x0, x1]) for (const cy of [y0, y1]) {
        const dx = cx === x0 ? -1 : 1, dy = cy === y0 ? -1 : 1;
        dibujo += `${n(cx + dx * sep)} ${n(cy)} m ${n(cx + dx * (sep + largo))} ${n(cy)} l S\n${n(cx)} ${n(cy + dy * sep)} m ${n(cx)} ${n(cy + dy * (sep + largo))} l S\n`;
      }
    }
    const hex = t => '<FEFF' + [...t].map(ch => ch.charCodeAt(0).toString(16).padStart(4, '0')).join('') + '>';
    const ahora = new Date(), fecha = `D:${ahora.getFullYear()}${String(ahora.getMonth() + 1).padStart(2, '0')}${String(ahora.getDate()).padStart(2, '0')}${String(ahora.getHours()).padStart(2, '0')}${String(ahora.getMinutes()).padStart(2, '0')}00`;
    poner('%PDF-1.4\n'); poner(new Uint8Array([0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A]));
    objeto(1, '<< /Type /Catalog /Pages 2 0 R >>');
    objeto(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    objeto(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(W)} ${n(H)}] /TrimBox [${n(x0)} ${n(y0)} ${n(x1)} ${n(y1)}] /BleedBox [${n(x0 - s)} ${n(y0 - s)} ${n(x1 + s)} ${n(y1 + s)}] /Resources << /XObject << /Im0 4 0 R >> /ProcSet [/PDF /ImageC] >> /Contents 5 0 R >>`);
    objeto(4, `<< /Type /XObject /Subtype /Image /Width ${c.width} /Height ${c.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter ${filtro} /Length ${datos.length} >>`, datos);
    const flujo = enc.encode(dibujo);
    objeto(5, `<< /Length ${flujo.length} >>`, flujo);
    objeto(6, `<< /Title ${hex(titulo)} /Producer (CASADREW Estudio) /Creator (CASADREW Estudio) /CreationDate (${fecha}) >>`);
    const inicioXref = total;
    poner(`xref\n0 7\n0000000000 65535 f \n${offsets.slice(1).map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n${inicioXref}\n%%EOF\n`);
    return new Blob(partes, { type: 'application/pdf' });
  }

  // ---------- Revisión antes de exportar ----------
  const medidor = document.createElement('canvas').getContext('2d');
  const PRUEBA = 'mmmmmmmmmmlliWWW áéñ 0123';
  const anchoTexto = f => { medidor.font = `72px ${f}`; return medidor.measureText(PRUEBA).width; };
  const BASES = ['monospace', 'serif', 'sans-serif'].map(b => [b, anchoTexto(b)]);
  const fuenteDisponible = familia => /^(system-ui|sans-serif|serif|monospace|cursive|fantasy|-apple-system)$/i.test(familia.trim())
    || BASES.some(([b, w]) => anchoTexto(`"${familia}", ${b}`) !== w);
  function todos(objs = canvas.getObjects(), lista = []) { for (const o of objs) { lista.push(o); if (o.getObjects && !(o instanceof F.ActiveSelection)) todos(o.getObjects(), lista); } return lista; }
  function revisar(op) {
    const avisos = [], aviso = (nivel, texto) => avisos.push({ nivel, texto });
    const visibles = canvas.getObjects().filter(o => o.visible && !o.excludeFromExport);
    const ocultos = canvas.getObjects().filter(o => !o.visible).length;
    if (!visibles.length && fondoTransparente()) aviso('error', 'El diseño está vacío: no hay nada que exportar.');
    // Fuentes que este aparato no tiene (se verían con otra letra).
    const faltan = [...new Set(todos().filter(esTexto).map(t => t.fontFamily).filter(f => f && !fuenteDisponible(f)))];
    if (faltan.length) aviso('aviso', `Fuentes que no están en este aparato: ${faltan.join(', ')}. Saldrán con otra letra parecida. Instálalas o cambia la letra.`);
    // Lo que se sale de la página.
    const fuera = [], cortados = [];
    for (const o of visibles) {
      const b = o.getBoundingRect();
      if (b.left >= doc.w || b.top >= doc.h || b.left + b.width <= 0 || b.top + b.height <= 0) fuera.push(nombreCapa(o));
      else if (b.left < -1 || b.top < -1 || b.left + b.width > doc.w + 1 || b.top + b.height > doc.h + 1) cortados.push(nombreCapa(o));
    }
    if (fuera.length) aviso('aviso', `Fuera de la página (no saldrá): ${fuera.slice(0, 4).join(', ')}${fuera.length > 4 ? '…' : ''}.`);
    if (cortados.length) aviso('info', `Se cortará por el borde: ${cortados.slice(0, 4).join(', ')}${cortados.length > 4 ? '…' : ''}.` + (op.sangrado ? ' Con sangrado, lo que sale hasta 3 mm se aprovecha.' : ''));
    if (ocultos) aviso('info', `${ocultos} capa${ocultos > 1 ? 's ocultas no saldrán' : ' oculta no saldrá'}.`);
    // Calidad de las fotos y tamaño de los textos al tamaño de salida.
    const impresion = op.ppp >= 150 && ['pdf', 'png', 'jpg', 'webp'].includes(op.formato);
    for (const o of todos().filter(x => x instanceof F.FabricImage && x.visible)) {
      const salida = o.getScaledWidth() * op.escala;
      if (impresion) {
        const efectivo = Math.round(o.width * op.ppp / salida);
        if (efectivo < 150) aviso('aviso', `«${nombreCapa(o)}» se imprimirá a unos ${efectivo} ppp: puede verse pixelada (lo ideal son 300). Hazla más pequeña o usa una foto más grande.`);
      } else if (o.width < salida / 1.5) aviso('info', `«${nombreCapa(o)}» está ampliada ${Math.round(salida / o.width * 10) / 10}×: puede verse algo borrosa.`);
    }
    if (impresion) {
      const pt = px => px * op.escala / op.ppp * PT;
      const pequenos = todos().filter(t => esTexto(t) && t.visible && pt(t.fontSize * (t.scaleY || 1)) < 6).map(nombreCapa);
      if (pequenos.length) aviso('aviso', `Texto muy pequeño para imprimir (menos de 6 pt): ${pequenos.slice(0, 3).join(', ')}.`);
      const margen = 3 / MM * (op.ppp / op.escala);
      const alBorde = visibles.filter(o => esTexto(o) && (() => { const b = o.getBoundingRect(); return b.left < margen || b.top < margen || b.left + b.width > doc.w - margen || b.top + b.height > doc.h - margen; })()).map(nombreCapa);
      if (alBorde.length) aviso('info', `Textos a menos de 3 mm del borde: al cortar el papel podrían quedar justos (${alBorde.slice(0, 3).join(', ')}).`);
    }
    if (op.formato === 'jpg' && op.transparenteDiseno) aviso('info', 'El JPG no admite transparencia: el fondo saldrá blanco. Usa PNG si lo necesitas transparente.');
    if (op.formato === 'webp' && !soportaWebP) aviso('aviso', 'Este aparato no sabe crear WebP: se guardará como PNG.');
    const w = Math.round(doc.w * op.escala), h = Math.round(doc.h * op.escala);
    if (['png', 'jpg', 'webp', 'pdf'].includes(op.formato) && (w > MAX_LADO || h > MAX_LADO || w * h > MAX_AREA))
      aviso('error', `${w} × ${h} px es demasiado grande para ${esIOS ? 'el iPad' : 'este aparato'} (máximo ${esIOS ? '16 megapíxeles' : MAX_LADO + ' px por lado'}). Baja el tamaño o los ppp.`);
    return avisos;
  }
  let soportaWebP = false;
  { const c = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }); soportaWebP = c.toDataURL('image/webp').startsWith('data:image/webp'); }

  // ---------- Crear el archivo ----------
  // op: { formato, escala, ppp, calidad, transparente, gris, sangrado, marcas, sinPerdida }
  async function generar(op) {
    const n = nombreArchivo();
    if (op.formato === 'casadrew') return { blob: new Blob([JSON.stringify(serializarCompleto())], { type: 'application/json' }), nombre: n + '.casadrew' };
    if (op.formato === 'svg') {
      const fondo = doc.fondo, deg = doc.fondoDeg;
      if (op.transparente) { doc.fondo = null; doc.fondoDeg = null; }
      try { return { blob: new Blob([aSVG()], { type: 'image/svg+xml' }), nombre: n + '.svg' }; } finally { doc.fondo = fondo; doc.fondoDeg = deg; }
    }
    if (op.formato === 'gif') return { blob: await Animacion.exportarGIF(op), nombre: n + '.gif' };
    if (op.formato === 'video') { const { blob, ext } = await Animacion.exportarVideo(op); return { blob, nombre: n + '.' + ext }; }
    if (op.formato === 'pdf') {
      const pppSalida = op.ppp || 300, sangradoPx = op.sangrado ? 3 / MM * pppSalida / op.escala : 0;
      const c = renderizar({ escala: op.escala, sangrado: sangradoPx, gris: op.gris, blanco: true });
      const aPt = px => px * op.escala / pppSalida * PT;
      const blob = await crearPDF(c, { anchoPt: aPt(doc.w), altoPt: aPt(doc.h), sangradoPt: aPt(sangradoPx), marcas: op.marcas, sinPerdida: op.sinPerdida, titulo: doc.nombre || '' });
      return { blob, nombre: n + '.pdf' };
    }
    const jpg = op.formato === 'jpg', webp = op.formato === 'webp' && soportaWebP;
    const c = renderizar({ escala: op.escala, transparente: op.transparente && !jpg, gris: op.gris, blanco: jpg });
    let blob = await aBlob(c, jpg ? 'image/jpeg' : webp ? 'image/webp' : 'image/png', jpg || webp ? op.calidad : undefined);
    if (op.ppp && blob.type === 'image/png') blob = await pngConPpp(blob, op.ppp);
    if (op.ppp && blob.type === 'image/jpeg') blob = await jpgConPpp(blob, op.ppp);
    return { blob, nombre: n + (jpg ? '.jpg' : webp ? '.webp' : '.png') };
  }
  async function bajar(op) {
    const { blob, nombre } = await generar(op);
    descargar(nombre, blob, blob.type);
    if (op.copiaProyecto) setTimeout(() => descargar(nombreArchivo() + '.casadrew', JSON.stringify(serializarCompleto()), 'application/json'), 400);
    return { blob, nombre };
  }
  const tamTexto = b => b < 1024 * 1024 ? Math.max(1, Math.round(b / 1024)) + ' KB' : (b / 1024 / 1024).toLocaleString('es-ES', { maximumFractionDigits: 1 }) + ' MB';

  // ---------- Exprés ----------
  const PRESETS = {
    auto: { n: 'La mejor opción para este diseño', d: 'Elige el formato por ti' },
    redes: { n: 'Redes sociales', d: 'JPG de alta calidad, 1080 px de ancho' },
    digital: { n: 'Web y pantallas', d: 'PNG nítido al doble de tamaño' },
    imprimir: { n: 'Imprimir', d: 'PDF a 300 ppp con sangrado y marcas de corte' },
    transparente: { n: 'Sin fondo (logo, sticker)', d: 'PNG transparente' },
  };
  function opcionesExpres(preset) {
    const ppp = pppDelDiseno();
    if (preset === 'auto') {
      if (animada()) return { formato: 'gif', escala: Math.min(1, 720 / Math.max(doc.w, doc.h)), por: 'tiene animación' };
      if (ppp >= 150) return { formato: 'pdf', escala: 1, ppp, por: 'es un diseño para imprimir' };
      if (fondoTransparente()) return { formato: 'png', escala: 1, ppp: 0, transparente: true, por: 'tiene el fondo transparente' };
      if (hayFotos()) return { formato: 'jpg', escala: Math.max(1, Math.min(2, 2160 / Math.max(doc.w, doc.h))), calidad: .92, por: 'tiene fotos' };
      return { formato: 'png', escala: Math.max(1, Math.min(2, 2160 / Math.max(doc.w, doc.h))), por: 'es un diseño gráfico' };
    }
    if (preset === 'redes') return fondoTransparente() ? { formato: 'png', escala: 1080 / doc.w, transparente: true } : { formato: 'jpg', escala: 1080 / doc.w, calidad: .92 };
    if (preset === 'digital') return { formato: 'png', escala: Math.max(1, Math.min(2, 3840 / Math.max(doc.w, doc.h))), transparente: fondoTransparente() };
    if (preset === 'imprimir') { const p = ppp || 300; return { formato: 'pdf', escala: ppp ? 1 : Math.max(1, Math.min(4, 2480 / Math.min(doc.w, doc.h))), ppp: p, sangrado: true, marcas: true }; }
    return { formato: 'png', escala: 1, transparente: true };
  }
  async function expres(preset = 'auto') {
    const op = { calidad: .92, ppp: 0, ...opcionesExpres(preset) };
    const errores = revisar(op).filter(a => a.nivel === 'error');
    if (errores.length) { ponerEstado('No se exportó: ' + errores[0].texto); return null; }
    ponerEstado('Exportando…');
    try {
      const { blob, nombre } = await bajar(op);
      ponerEstado(`Descargado «${nombre}» (${tamTexto(blob.size)})` + (op.por ? ` · elegí ${op.formato.toUpperCase()} porque ${op.por}` : ''));
      return { blob, nombre, op };
    } catch (err) { ponerEstado('No se pudo exportar: ' + (err.message || err)); return null; }
  }

  // ---------- Botones de la barra ----------
  const viejo = $('#bExportar');
  const grupo = document.createElement('div');
  grupo.className = 'grupo-exportar';
  grupo.innerHTML = `
    <button id="bAvanzada" class="borde" title="Exportación avanzada: formato, tamaño en px/mm/cm, ppp, calidad, transparencia, color y revisión antes de descargar">Avanzada</button>
    <div class="partido">
      <button id="bExpres" class="principal" title="Exportación exprés: un clic y descarga con la mejor calidad para tu diseño">⚡ Exportar</button>
      <button id="bExpresMenu" class="principal flecha" title="Elegir para qué es: redes, web, imprimir o sin fondo" aria-label="Opciones de exportación exprés">▾</button>
    </div>
    <div class="menu menu-expres" id="menuExpres" hidden></div>`;
  viejo.replaceWith(grupo);
  $('#dExportar')?.remove();
  const menu = $('#menuExpres');
  menu.append(...Object.entries(PRESETS).map(([id, p]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.innerHTML = `<b></b><small></small>`;
    b.querySelector('b').textContent = p.n; b.querySelector('small').textContent = p.d;
    b.onclick = () => { menu.hidden = true; expres(id); };
    return b;
  }));
  $('#bExpres').onclick = () => expres('auto');
  $('#bExpresMenu').onclick = e => { e.stopPropagation(); menu.hidden = !menu.hidden; };
  document.addEventListener('pointerdown', e => { if (!menu.hidden && !grupo.contains(e.target)) menu.hidden = true; });

  // ---------- Avanzada ----------
  const FORMATOS = [
    ['png', 'PNG', 'Imagen nítida, admite transparencia'], ['jpg', 'JPG', 'Fotos, archivo ligero'], ['webp', 'WebP', 'Para webs: ligero y con transparencia'],
    ['pdf', 'PDF', 'Para imprimir: tamaño real, sangrado y marcas'], ['svg', 'SVG', 'Vectorial: se amplía sin perder calidad'],
    ['gif', 'GIF', 'Animación que se repite'], ['video', 'Vídeo', 'Animación en vídeo (WebM o MP4)'], ['casadrew', 'Proyecto', 'Archivo editable .casadrew'],
  ];
  const dlg = document.createElement('dialog');
  dlg.id = 'dAvanzada'; dlg.className = 'dialogo-ancho';
  dlg.innerHTML = `<form method="dialog">
    <h2>Exportación avanzada</h2>
    <div class="exp-cols">
      <div class="exp-opciones">
        <div class="formatos-exp"></div>
        <div class="exp-bloque" data-para="png jpg webp pdf gif video">
          <div class="fila"><label>Ancho <input id="xAncho" type="number" min="1" step="any"></label><label>Alto <input id="xAlto" type="number" min="1" step="any"></label>
            <select id="xUnidad" aria-label="Unidad"><option value="px">px</option><option value="mm">mm</option><option value="cm">cm</option><option value="in">pulgadas</option></select></div>
          <div class="fila" data-para="png jpg webp pdf"><label title="Puntos por pulgada: cuántos píxeles caben en 2,54 cm de papel. 300 = calidad de imprenta; 72-96 = pantallas">Resolución
            <select id="xPpp"><option value="72">72 ppp (pantalla)</option><option value="96">96 ppp (pantalla)</option><option value="150">150 ppp (impresión rápida)</option><option value="300">300 ppp (imprenta)</option><option value="600">600 ppp (máximo detalle)</option></select></label>
            <span class="ayuda-i" title="Ejemplo: 2480 px a 300 ppp miden 21 cm (un A4). La misma imagen a 150 ppp mediría 42 cm, pero con menos detalle.">?</span></div>
        </div>
        <div class="fila exp-bloque" data-para="jpg webp"><label class="ancho" title="Más calidad = archivo más pesado. 90 % casi no se distingue del original">Calidad <input id="xCalidad" type="range" min="50" max="100" value="92"><output id="xCalidadT">92 %</output></label></div>
        <div class="fila exp-bloque" data-para="png webp svg gif"><label class="chk" title="Quita el fondo de la página: ideal para logos y stickers"><input id="xTransp" type="checkbox"> Fondo transparente</label></div>
        <div class="fila exp-bloque" data-para="png jpg webp pdf"><label title="sRGB es el color estándar de pantallas, móviles e imprentas digitales">Color
          <select id="xColor"><option value="srgb">Color (sRGB)</option><option value="gris">Escala de grises</option></select></label>
          <span class="ayuda-i" title="CMYK (el color de las imprentas offset) no se puede crear desde el navegador. Si tu imprenta lo pide, envíales este PDF en sRGB: ellos lo convierten con su perfil.">?</span></div>
        <div class="exp-bloque" data-para="pdf">
          <div class="fila"><label class="chk" title="Añade 3 mm de imagen por fuera del borde para que, al cortar el papel, no quede una raya blanca"><input id="xSangrado" type="checkbox"> Sangrado de 3 mm</label>
            <label class="chk" title="Pequeñas líneas en las esquinas que indican a la imprenta por dónde cortar"><input id="xMarcas" type="checkbox"> Marcas de corte</label></div>
          <div class="fila"><label class="chk" title="Sin compresión con pérdida: máxima calidad, archivo bastante más pesado"><input id="xSinPerdida" type="checkbox"> Sin pérdida (máxima calidad)</label></div>
        </div>
        <div class="fila exp-bloque" data-para="png jpg webp pdf svg gif video"><label class="chk" title="Descarga también el proyecto editable, por si quieres cambiar algo más adelante"><input id="xCopia" type="checkbox"> Descargar también el proyecto editable</label></div>
      </div>
      <div class="exp-vista">
        <div class="vista-exp"><img id="xVista" alt="Vista previa"></div>
        <p class="exp-medidas" id="xMedidas"></p>
        <ul class="avisos-exp" id="xAvisos"></ul>
      </div>
    </div>
    <div class="pie-dialogo"><button value="cancelar" class="texto">Cancelar</button><button value="exportar" class="principal" id="xDescargar">Descargar</button></div>
  </form>`;
  document.body.append(dlg);
  const x = s => dlg.querySelector(s);
  let formato = 'png', escala = 1;
  x('.formatos-exp').append(...FORMATOS.map(([id, n, d]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.f = id; b.title = d;
    b.innerHTML = `<b>${n}</b><small>${d}</small>`;
    b.onclick = () => { formato = id; if (id === 'pdf' && +x('#xPpp').value < 150) x('#xPpp').value = '300'; actualizar(); };
    return b;
  }));
  const PULG = { mm: MM, cm: 2.54, in: 1 };
  const ppp = () => +x('#xPpp').value;
  const aUnidad = px => { const u = x('#xUnidad').value; return u === 'px' ? Math.round(px) : +(px / ppp() * PULG[u]).toFixed(u === 'mm' ? 1 : 2); };
  const dePx = v => { const u = x('#xUnidad').value; return u === 'px' ? v : v / PULG[u] * ppp(); };
  function ponerMedidas() { x('#xAncho').value = aUnidad(doc.w * escala); x('#xAlto').value = aUnidad(doc.h * escala); }
  x('#xAncho').addEventListener('change', () => { const v = +x('#xAncho').value; if (v > 0) { escala = dePx(v) / doc.w; ponerMedidas(); actualizar(); } });
  x('#xAlto').addEventListener('change', () => { const v = +x('#xAlto').value; if (v > 0) { escala = dePx(v) / doc.h; ponerMedidas(); actualizar(); } });
  x('#xUnidad').addEventListener('change', () => { ponerMedidas(); actualizar(); });
  // Cambiar los ppp con medidas en papel mantiene el tamaño en papel (más ppp = más píxeles); en px, mantiene los píxeles.
  let pppPrevio = 300;
  x('#xPpp').addEventListener('change', () => { if (x('#xUnidad').value !== 'px') escala *= ppp() / pppPrevio; pppPrevio = ppp(); ponerMedidas(); actualizar(); });
  x('#xCalidad').addEventListener('input', () => { x('#xCalidadT').textContent = x('#xCalidad').value + ' %'; actualizar(); });
  ['#xTransp', '#xColor', '#xSangrado', '#xMarcas', '#xSinPerdida'].forEach(s => x(s).addEventListener('change', actualizar));

  const opciones = () => ({ formato, escala, ppp: ['png', 'jpg', 'webp', 'pdf'].includes(formato) ? ppp() : 0, calidad: +x('#xCalidad').value / 100,
    transparente: x('#xTransp').checked, gris: x('#xColor').value === 'gris', sangrado: x('#xSangrado').checked, marcas: x('#xMarcas').checked,
    sinPerdida: x('#xSinPerdida').checked, copiaProyecto: x('#xCopia').checked, transparenteDiseno: fondoTransparente() });
  let espera = null, turno = 0;
  function actualizar() {
    dlg.querySelectorAll('[data-f]').forEach(b => {
      b.classList.toggle('activo', b.dataset.f === formato);
      b.hidden = ['gif', 'video'].includes(b.dataset.f) && !animada();
    });
    dlg.querySelectorAll('[data-para]').forEach(b => b.hidden = !b.dataset.para.split(' ').includes(formato));
    const op = opciones(), w = Math.round(doc.w * escala), h = Math.round(doc.h * escala);
    const papel = op.ppp ? ` · ${(w / op.ppp * 2.54).toLocaleString('es-ES', { maximumFractionDigits: 1 })} × ${(h / op.ppp * 2.54).toLocaleString('es-ES', { maximumFractionDigits: 1 })} cm a ${op.ppp} ppp` : '';
    x('#xMedidas').textContent = ['svg', 'casadrew'].includes(formato) ? (formato === 'svg' ? 'Vectorial: sin tamaño fijo.' : 'Guarda el diseño completo para seguir editándolo.') : `${w} × ${h} px${papel} · calculando peso…`;
    const avisos = revisar(op);
    x('#xAvisos').replaceChildren(...(avisos.length ? avisos : [{ nivel: 'ok', texto: 'Todo listo: no hay problemas.' }]).map(a => Object.assign(document.createElement('li'), { className: a.nivel, textContent: a.texto })));
    x('#xDescargar').disabled = avisos.some(a => a.nivel === 'error');
    clearTimeout(espera);
    const mio = ++turno;
    espera = setTimeout(() => vistaPrevia(op, mio), 250);
  }
  // Vista previa y peso aproximado (se calcula con una versión pequeña y se escala al tamaño real).
  async function vistaPrevia(op, mio) {
    try {
      const k = Math.min(op.escala, 420 / Math.max(doc.w, doc.h));
      if (['gif', 'video'].includes(op.formato)) {
        x('#xVista').src = renderizar({ escala: k }).toDataURL();
        const est = Animacion.estimar(op);
        if (mio === turno) x('#xMedidas').textContent = x('#xMedidas').textContent.replace('calculando peso…', `${est.fotogramas} fotogramas · ${est.segundos.toLocaleString('es-ES')} s`);
        return;
      }
      const jpg = ['jpg', 'pdf'].includes(op.formato);
      const c = renderizar({ escala: k, transparente: op.transparente && !jpg, gris: op.gris, blanco: jpg, sangrado: op.formato === 'pdf' && op.sangrado ? 3 / MM * (op.ppp || 300) / op.escala : 0 });
      if (mio !== turno) return;
      x('#xVista').src = c.toDataURL();
      let peso = 0;
      if (op.formato === 'svg') peso = aSVG().length;
      else if (op.formato === 'casadrew') peso = JSON.stringify(serializarCompleto()).length;
      else {
        const tipo = jpg && !(op.formato === 'pdf' && op.sinPerdida) ? 'image/jpeg' : op.formato === 'webp' ? 'image/webp' : 'image/png';
        const b = await aBlob(c, tipo, op.formato === 'pdf' ? .95 : op.calidad);
        peso = b.size * (op.escala / k) ** 2 * (op.formato === 'pdf' && op.sinPerdida ? .9 : 1);
      }
      if (mio === turno) x('#xMedidas').textContent = x('#xMedidas').textContent.replace('calculando peso…', `≈ ${tamTexto(peso)}`).replace(/^Vectorial: sin tamaño fijo\.$|^Guarda el diseño completo para seguir editándolo\.$/, m => `${m} ≈ ${tamTexto(peso)}`);
    } catch (err) { if (mio === turno) x('#xMedidas').textContent += ' (' + (err.message || err) + ')'; }
  }
  function avanzada(predef = {}) {
    const p = pppDelDiseno();
    formato = predef.formato || (animada() ? 'gif' : p ? 'pdf' : 'png');
    escala = predef.escala || 1;
    x('#xPpp').value = String(predef.ppp || p || 300); pppPrevio = ppp();
    x('#xUnidad').value = p ? 'mm' : 'px';
    x('#xTransp').checked = fondoTransparente();
    x('#xSangrado').checked = x('#xMarcas').checked = !!p;
    ponerMedidas(); actualizar();
    dlg.showModal();
  }
  dlg.addEventListener('close', async () => {
    if (dlg.returnValue !== 'exportar') return;
    ponerEstado('Exportando…');
    try { const { blob, nombre } = await bajar(opciones()); ponerEstado(`Descargado «${nombre}» (${tamTexto(blob.size)}). Tu proyecto editable no ha cambiado.`); }
    catch (err) { ponerEstado('No se pudo exportar: ' + (err.message || err)); }
  });
  $('#bAvanzada').onclick = () => avanzada();

  return { expres, avanzada, generar, revisar, renderizar, crearPDF, PRESETS, aBlob, tamTexto };
})();
