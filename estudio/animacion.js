// CASADREW · Estudio — animación fotograma a fotograma.
// · Cada fotograma tiene sus propias capas. Las capas marcadas como «fijas» (📌) se ven en todos (fondos, escenarios).
// · En el lienzo solo está el fotograma actual; los demás se guardan aparte, una sola vez cada versión
//   (igual que las fotos), para que deshacer y el guardado automático no copien la animación entera en cada paso.
// · Papel cebolla: el fotograma anterior (rojizo) y el siguiente (verdoso) se ven en transparencia, detrás.
// · Reproducir, cambiar velocidad y repetir; movimientos automáticos; exportar GIF o vídeo.
'use strict';
const Animacion = (() => {
  EXTRA.push('fijo');
  const nuevoFot = () => ({ id: nuevoId(), ref: null });
  const a = () => doc.anim;
  const activa = () => !!doc.anim;
  const MAX_PREVIA = 1024;

  // ---------- Guardar y leer fotogramas ----------
  // Objetos del fotograma actual (sin las capas fijas), en formato de datos y con las fotos como referencia.
  function datosActuales() {
    const lista = canvas.getObjects().filter(o => !o.fijo && !o.excludeFromExport).map(o => o.toObject(EXTRA));
    recorrerImagenes(lista, o => { if (o.imgRef && imagenes.has(o.imgRef)) o.src = REF + o.imgRef; });
    return lista;
  }
  async function guardarDatos(lista) { return registrarImagen(JSON.stringify(lista)); }
  async function leerDatos(ref) {
    if (!ref) return [];
    if (!imagenes.has(ref)) imagenes.set(ref, await Almacen.leerImagen(ref));
    try { return JSON.parse(imagenes.get(ref) || '[]'); } catch { return []; }
  }
  // Al abrir: los fotogramas que vienen dentro de un archivo .casadrew pasan a guardarse aparte;
  // los guardados se cargan en memoria (con sus fotos) para poder exportar y dibujar miniaturas.
  async function prepararDoc(d) {
    for (const f of d.anim.fotogramas) {
      if (f.objetos) { f.ref = await registrarImagen(JSON.stringify(f.objetos)); delete f.objetos; }
      if (f.ref) { const lista = await leerDatos(f.ref); await prepararImagenes(lista); }
    }
    d.anim.fotogramas[d.anim.actual] && (d.anim.fotogramas[d.anim.actual].ref = null);
  }
  // Para el archivo .casadrew: todo dentro, con las fotos incluidas.
  function enLinea(anim) {
    const copia = JSON.parse(JSON.stringify(anim));
    copia.fotogramas = copia.fotogramas.map(f => {
      if (!f.ref) return { id: f.id, objetos: [] };
      const lista = JSON.parse(imagenes.get(f.ref) || '[]');
      recorrerImagenes(lista, o => { if (typeof o.src === 'string' && o.src.startsWith(REF)) o.src = imagenes.get(o.src.slice(REF.length)) || ''; });
      return { id: f.id, objetos: lista };
    });
    return copia;
  }
  async function aObjetos(lista) {
    const copia = JSON.parse(JSON.stringify(lista));
    await prepararImagenes(copia);
    return F.util.enlivenObjects(copia);
  }

  // ---------- Activar y moverse entre fotogramas ----------
  function activar() {
    if (activa()) return mostrarLinea(true);
    doc.anim = { fps: 12, bucle: true, piel: true, pielAntes: 1, pielDespues: 1, pielOpac: 35, actual: 0, fotogramas: [nuevoFot()] };
    registrar(); mostrarLinea(true);
    ponerEstado('Animación activada. Fotograma 1: dibuja y pulsa «+» para el siguiente. Las capas con 📌 se ven en todos los fotogramas.');
  }
  async function quitar() {
    if (!activa() || !confirm('¿Quitar la animación? Se queda solo el fotograma que estás viendo (puedes deshacerlo).')) return;
    delete doc.anim; registrar(); mostrarLinea(false);
  }
  let cambiando = false;
  async function irA(n, { guardarActual = true, registrarCambio = true } = {}) {
    if (!activa() || cambiando) return;
    const an = a();
    n = Math.max(0, Math.min(an.fotogramas.length - 1, n));
    if (n === an.actual && guardarActual) return;
    cambiando = true;
    parar();
    try {
      if (guardarActual) an.fotogramas[an.actual].ref = await guardarDatos(datosActuales());
      const destino = an.fotogramas[n];
      const objs = await aObjetos(await leerDatos(destino.ref));
      historia.pausa = true;
      canvas.discardActiveObject();
      const r = canvas.renderOnAddRemove; canvas.renderOnAddRemove = false;
      canvas.remove(...canvas.getObjects().filter(o => !o.fijo));
      objs.forEach(o => { if (!o.id) o.id = nuevoId(); });
      canvas.add(...objs);
      ordenarFijas();
      canvas.renderOnAddRemove = r;
      historia.pausa = false;
      an.actual = n; destino.ref = null;
      canvas.requestRenderAll();
      if (registrarCambio) registrar(); else refrescarTodo();
    } finally { cambiando = false; }
  }
  async function anadir(copiar) {
    const an = a();
    const datos = copiar ? datosActuales() : [];
    const nuevo = nuevoFot();
    nuevo.ref = await guardarDatos(datos);
    an.fotogramas.splice(an.actual + 1, 0, nuevo);
    await irA(an.actual + 1);
  }
  async function borrar(i = a().actual) {
    const an = a();
    if (an.fotogramas.length < 2) return ponerEstado('Una animación necesita al menos un fotograma.');
    if (i === an.actual) {
      const vecino = i > 0 ? i - 1 : 1;
      await irA(vecino, { registrarCambio: false });
      an.fotogramas.splice(i, 1);
      if (an.actual > i) an.actual--;
    } else { an.fotogramas.splice(i, 1); if (an.actual > i) an.actual--; }
    registrar();
  }
  function mover(de, a_) {
    const an = a();
    if (de === a_) return;
    const [f] = an.fotogramas.splice(de, 1);
    an.fotogramas.splice(a_, 0, f);
    if (an.actual === de) an.actual = a_;
    else if (de < an.actual && a_ >= an.actual) an.actual--;
    else if (de > an.actual && a_ <= an.actual) an.actual++;
    registrar();
  }

  // Las capas fijas quedan siempre detrás de las del fotograma (conservando su orden entre ellas).
  function ordenarFijas() { canvas.getObjects().filter(o => o.fijo).reverse().forEach(o => canvas.sendObjectToBack(o)); }
  function fijar(o) {
    o.fijo = !o.fijo;
    historia.pausa = true; ordenarFijas(); historia.pausa = false;
    canvas.requestRenderAll(); registrar();
    ponerEstado(o.fijo ? `«${nombreCapa(o)}» se verá en todos los fotogramas (queda detrás).` : `«${nombreCapa(o)}» ahora pertenece solo a este fotograma.`);
  }

  // ---------- Dibujar fotogramas fuera del lienzo ----------
  const cacheMini = new Map(), cachePiel = new Map();
  function pintarFondo(ctx, transparente) {
    if (transparente) return;
    if (doc.fondoDeg) { ctx.fillStyle = Degradados.enContexto(ctx, doc.fondoDeg, doc.w, doc.h); ctx.fillRect(0, 0, doc.w, doc.h); }
    else if (doc.fondo) { ctx.fillStyle = doc.fondo; ctx.fillRect(0, 0, doc.w, doc.h); }
  }
  // Dibuja los fotogramas pedidos (con las capas fijas y el fondo si se piden) a escala k. Devuelve lienzos.
  async function dibujarFotogramas(indices, { k, fijas = true, fondo = true, transparente = false }) {
    const an = a(), w = Math.max(1, Math.round(doc.w * k)), h = Math.max(1, Math.round(doc.h * k));
    const sc = new F.StaticCanvas(undefined, { width: w, height: h, enableRetinaScaling: false, renderOnAddRemove: false });
    sc.setZoom(k);
    sc._renderBackground = ctx => { if (!fondo) return; ctx.save(); ctx.transform(...sc.viewportTransform); pintarFondo(ctx, transparente); ctx.restore(); };
    if (fijas) {
      const datosFijos = canvas.getObjects().filter(o => o.fijo && o.visible).map(o => o.toObject(EXTRA));
      recorrerImagenes(datosFijos, o => { if (o.imgRef && imagenes.has(o.imgRef)) o.src = REF + o.imgRef; });
      sc.add(...await aObjetos(datosFijos));
    }
    const vivos = indices.includes(an.actual) ? datosActuales() : null;
    const salida = [];
    for (const i of indices) {
      const objs = await aObjetos(i === an.actual ? vivos : await leerDatos(an.fotogramas[i].ref));
      sc.add(...objs);
      sc.renderAll();
      const c = Object.assign(document.createElement('canvas'), { width: w, height: h });
      c.getContext('2d').drawImage(sc.lowerCanvasEl, 0, 0);
      salida.push(c);
      sc.remove(...objs);
    }
    sc.dispose();
    return salida;
  }
  async function miniatura(i) {
    const f = a().fotogramas[i], clave = f.ref;
    if (clave && cacheMini.has(clave)) return cacheMini.get(clave);
    const [c] = await dibujarFotogramas([i], { k: 96 / Math.max(doc.w, doc.h) });
    const url = c.toDataURL();
    if (clave) cacheMini.set(clave, url);
    return url;
  }

  // ---------- Papel cebolla ----------
  let piel = [];
  async function prepararPiel() {
    piel = [];
    if (!activa() || !a().piel) return canvas.requestRenderAll();
    const an = a(), k = Math.min(1, MAX_PREVIA / Math.max(doc.w, doc.h)), pedidos = [];
    for (let d = 1; d <= an.pielAntes; d++) if (an.actual - d >= 0 || an.bucle) pedidos.push([((an.actual - d) % an.fotogramas.length + an.fotogramas.length) % an.fotogramas.length, -d]);
    for (let d = 1; d <= an.pielDespues; d++) if (an.actual + d < an.fotogramas.length || an.bucle) pedidos.push([(an.actual + d) % an.fotogramas.length, d]);
    for (const [i, d] of pedidos) {
      if (i === an.actual) continue;
      const ref = an.fotogramas[i].ref, clave = ref + (d < 0 ? 'a' : 'd');
      if (!cachePiel.has(clave)) {
        const [c] = await dibujarFotogramas([i], { k, fijas: false, fondo: false });
        const x = c.getContext('2d');
        x.globalCompositeOperation = 'source-atop'; x.fillStyle = d < 0 ? '#e0365a' : '#14a06a'; x.globalAlpha = .8; x.fillRect(0, 0, c.width, c.height);
        cachePiel.set(clave, c);
      }
      piel.push({ c: cachePiel.get(clave), alfa: (an.pielOpac / 100) / Math.abs(d) });
    }
    canvas.requestRenderAll();
  }
  const fondoOriginal = canvas._renderBackground;
  canvas._renderBackground = function (ctx) {
    fondoOriginal.call(this, ctx);
    if (exportando || !piel.length || !activa() || reproduciendo) return;
    const v = this.viewportTransform;
    ctx.save(); ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
    for (const p of piel) { ctx.globalAlpha = p.alfa; ctx.drawImage(p.c, 0, 0, doc.w, doc.h); }
    ctx.restore();
  };

  // ---------- Reproducir ----------
  let reproduciendo = null;
  async function reproducir() {
    if (reproduciendo) return parar();
    const an = a();
    ponerEstado('Preparando la reproducción…');
    const k = Math.min(1, MAX_PREVIA / Math.max(doc.w, doc.h));
    const cuadros = await dibujarFotogramas(an.fotogramas.map((_, i) => i), { k });
    canvas.discardActiveObject();
    const inicio = performance.now();
    reproduciendo = { cuadros, raf: 0 };
    $('#tPlay').classList.add('activo'); $('#tPlay').innerHTML = '⏸';
    ponerEstado(`Reproduciendo a ${an.fps} fotogramas por segundo · pulsa ⏸ o Esc para parar`);
    canvas.requestRenderAll();
    const paso = ahora => {
      if (!reproduciendo) return;
      // La hora del fotograma de pantalla puede ser un poco anterior a «inicio»: nunca negativo.
      let n = Math.max(0, Math.floor((ahora - inicio) / 1000 * an.fps));
      if (!an.bucle && n >= cuadros.length) return parar();
      n %= cuadros.length;
      const ctx = canvas.contextTop, v = canvas.viewportTransform;
      canvas.clearContext(ctx);
      ctx.save(); ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
      ctx.drawImage(cuadros[n], 0, 0, doc.w, doc.h);
      ctx.restore();
      marcarReproduccion(n);
      reproduciendo.raf = requestAnimationFrame(paso);
    };
    reproduciendo.raf = requestAnimationFrame(paso);
  }
  function parar() {
    if (!reproduciendo) return;
    cancelAnimationFrame(reproduciendo.raf);
    reproduciendo = null;
    canvas.clearContext(canvas.contextTop);
    $('#tPlay').classList.remove('activo'); $('#tPlay').innerHTML = '▶';
    marcarReproduccion(-1);
    canvas.requestRenderAll();
    ponerEstado('Reproducción parada.');
  }

  // ---------- Movimientos automáticos ----------
  const suave = t => 1 - (1 - t) ** 3;
  const MOVIMIENTOS = {
    aparecer: { n: 'Aparecer', f: (o, t, b) => o.set('opacity', b.opacity * suave(t)) },
    desaparecer: { n: 'Desaparecer', f: (o, t, b) => o.set('opacity', b.opacity * (1 - t)) },
    izquierda: { n: 'Entrar por la izquierda', f: (o, t, b) => o.set('left', b.left - doc.w * .7 * (1 - suave(t))) },
    derecha: { n: 'Entrar por la derecha', f: (o, t, b) => o.set('left', b.left + doc.w * .7 * (1 - suave(t))) },
    arriba: { n: 'Caer desde arriba', f: (o, t, b) => o.set('top', b.top - doc.h * .7 * (1 - suave(t))) },
    abajo: { n: 'Subir desde abajo', f: (o, t, b) => o.set('top', b.top + doc.h * .7 * (1 - suave(t))) },
    rebote: { n: 'Rebotar', f: (o, t, b) => o.set('top', b.top - Math.abs(Math.sin(t * Math.PI * 3)) * doc.h * .15 * (1 - t)) },
    girar: { n: 'Girar una vuelta', centro: true, f: (o, t, b) => o.set('angle', (b.angle + 360 * t) % 360) },
    latido: { n: 'Latido', centro: true, f: (o, t, b) => { const s = 1 + .14 * Math.max(0, Math.sin(t * Math.PI * 4)); o.set({ scaleX: b.scaleX * s, scaleY: b.scaleY * s }); } },
    zoom: { n: 'Acercarse', centro: true, f: (o, t, b) => { const s = .15 + .85 * suave(t); o.set({ scaleX: b.scaleX * s, scaleY: b.scaleY * s, opacity: b.opacity * Math.min(1, t * 2) }); } },
    temblor: { n: 'Temblar', f: (o, t, b) => o.set({ left: b.left + Math.sin(t * Math.PI * 10) * doc.w * .012 * (1 - t), angle: b.angle + Math.sin(t * Math.PI * 8) * 4 * (1 - t) }) },
    flotar: { n: 'Flotar', f: (o, t, b) => o.set('top', b.top + Math.sin(t * Math.PI * 2) * doc.h * .03) },
  };
  async function aplicarMovimiento(clave, n = 12) {
    const o = canvas.getActiveObject();
    if (!o || activos().length !== 1) return ponerEstado('Selecciona un elemento para darle movimiento.');
    if (o.fijo) return ponerEstado('Las capas fijas (📌) no se animan: quítale el 📌 primero.');
    const m = MOVIMIENTOS[clave], an = a();
    const base = { left: o.left, top: o.top, angle: o.angle || 0, scaleX: o.scaleX, scaleY: o.scaleY, opacity: o.opacity ?? 1 };
    const centro = o.getCenterPoint();
    const fotos = [];
    for (let i = 0; i < n; i++) {
      const t = n > 1 ? i / (n - 1) : 1;
      o.set(base);
      m.f(o, t, base);
      if (m.centro) o.setPositionByOrigin(centro, 'center', 'center');
      o.setCoords();
      fotos.push(await guardarDatos(datosActuales()));
    }
    o.set(base); o.setPositionByOrigin(centro, 'center', 'center'); o.setCoords();
    // El fotograma actual pasa a ser el primero del movimiento y se añaden los demás detrás.
    const nuevos = fotos.map(ref => ({ id: nuevoId(), ref }));
    nuevos[0].id = an.fotogramas[an.actual].id;
    an.fotogramas.splice(an.actual, 1, ...nuevos);
    await irA(an.actual, { guardarActual: false, registrarCambio: true });
    ponerEstado(`Movimiento «${m.n}» creado en ${n} fotogramas. Pulsa ▶ para verlo.`);
  }

  // ---------- Exportar ----------
  function estimar(op = {}) { const an = a(); return { fotogramas: an.fotogramas.length, segundos: Math.round(an.fotogramas.length / an.fps * 10) / 10 }; }
  async function exportarGIF(op = {}) {
    const an = a(), { GIFEncoder, quantize, applyPalette } = gifenc;
    const k = op.escala || Math.min(1, 720 / Math.max(doc.w, doc.h));
    const transparente = !!op.transparente || (!doc.fondo && !doc.fondoDeg);
    const gif = GIFEncoder(), demora = Math.round(1000 / an.fps);
    for (let i = 0; i < an.fotogramas.length; i++) {
      ponerEstado(`Creando el GIF… fotograma ${i + 1} de ${an.fotogramas.length}`);
      const [c] = await dibujarFotogramas([i], { k, transparente });
      const datos = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data;
      const formato = transparente ? 'rgba4444' : 'rgb565';
      const paleta = quantize(datos, 256, { format: formato, oneBitAlpha: transparente });
      const indices = applyPalette(datos, paleta, formato);
      const ti = transparente ? paleta.findIndex(p => p[3] === 0) : -1;
      gif.writeFrame(indices, c.width, c.height, { palette: paleta, delay: demora, repeat: an.bucle ? 0 : -1, transparent: ti >= 0, transparentIndex: Math.max(0, ti), dispose: transparente ? 2 : -1 });
      await new Promise(r => setTimeout(r));
    }
    gif.finish();
    return new Blob([gif.bytes()], { type: 'image/gif' });
  }
  async function exportarVideo(op = {}) {
    const an = a(), k = op.escala || Math.min(1, 1080 / Math.max(doc.w, doc.h));
    const tipos = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    const tipo = tipos.find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
    if (!tipo) throw new Error('este aparato no puede grabar vídeo; exporta un GIF');
    ponerEstado('Preparando el vídeo…');
    const cuadros = await dibujarFotogramas(an.fotogramas.map((_, i) => i), { k });
    const w = cuadros[0].width & ~1, h = cuadros[0].height & ~1;
    const lienzo = Object.assign(document.createElement('canvas'), { width: w, height: h }), x = lienzo.getContext('2d');
    const flujo = lienzo.captureStream(an.fps), grabador = new MediaRecorder(flujo, { mimeType: tipo, videoBitsPerSecond: 8e6 }), trozos = [];
    grabador.ondataavailable = e => e.data.size && trozos.push(e.data);
    const terminado = new Promise(ok => { grabador.onstop = ok; });
    // Al menos 2 segundos de vídeo (las animaciones cortas se repiten).
    const vueltas = an.bucle ? Math.max(1, Math.ceil(2 * an.fps / cuadros.length)) : 1, total = cuadros.length * vueltas;
    const pintar = i => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.drawImage(cuadros[i % cuadros.length], 0, 0, w, h); };
    pintar(0);
    grabador.start();
    for (let i = 0; i < total; i++) {
      pintar(i);
      ponerEstado(`Grabando el vídeo… ${Math.round(i / total * 100)} %`);
      await new Promise(r => setTimeout(r, 1000 / an.fps));
    }
    grabador.stop();
    await terminado;
    return { blob: new Blob(trozos, { type: tipo.split(';')[0] }), ext: tipo.startsWith('video/mp4') ? 'mp4' : 'webm' };
  }

  // ---------- Línea de tiempo ----------
  const linea = document.createElement('section');
  linea.className = 'linea-tiempo'; linea.id = 'lineaTiempo'; linea.hidden = true;
  linea.innerHTML = `
    <div class="lt-controles">
      <button type="button" id="tAnterior" title="Fotograma anterior (tecla ,)">⏮</button>
      <button type="button" id="tPlay" title="Reproducir o parar la animación">▶</button>
      <button type="button" id="tSiguiente" title="Fotograma siguiente (tecla .)">⏭</button>
      <label title="Fotogramas por segundo: 12 es lo típico en dibujo animado; 24, más fluido">
        <select id="tFps">${[4, 6, 8, 10, 12, 15, 18, 24, 30].map(v => `<option value="${v}">${v} fps</option>`).join('')}</select></label>
      <button type="button" id="tBucle" title="Repetir la animación sin parar">🔁</button>
      <button type="button" id="tPiel" title="Papel cebolla: ver el fotograma anterior (rojo) y el siguiente (verde) en transparencia">🧅</button>
      <label class="lt-opac" title="Transparencia del papel cebolla"><input type="range" id="tPielOpac" min="10" max="80"></label>
    </div>
    <div class="lt-tira" id="tTira"></div>
    <div class="lt-acciones">
      <button type="button" id="tNuevo" title="Fotograma nuevo vacío después del actual">＋ Vacío</button>
      <button type="button" id="tDuplicar" title="Copia del fotograma actual, para seguir dibujando sobre él">⧉ Copiar</button>
      <button type="button" id="tBorrar" class="peligro" title="Eliminar el fotograma actual">🗑</button>
      <button type="button" id="tMovimiento" title="Movimientos automáticos para el elemento seleccionado">✨ Movimiento</button>
      <button type="button" id="tCerrar" title="Ocultar la línea de tiempo (la animación se conserva)">✕</button>
    </div>
    <div class="menu" id="menuMovimiento" hidden></div>`;
  $('.pie').before(linea);
  const tira = $('#tTira');

  function mostrarLinea(si) {
    linea.hidden = !si;
    $('#bAnimacion')?.classList.toggle('activo', si);
    medirMesa();
    if (si) pintarLinea();
    prepararPiel();
  }
  let espera = null, esperaLinea = null;
  // Se repinta poco después del último cambio (seleccionar, editar…), no en cada uno.
  function pintarLinea() { clearTimeout(esperaLinea); esperaLinea = setTimeout(pintarLineaYa, 120); }
  function pintarLineaYa() {
    if (!activa()) { linea.hidden = true; $('#bAnimacion')?.classList.remove('activo'); piel = []; return; }
    if (linea.hidden) return;
    const an = a();
    $('#tFps').value = String(an.fps);
    $('#tBucle').classList.toggle('activo', an.bucle); $('#tPiel').classList.toggle('activo', an.piel);
    $('#tPielOpac').value = an.pielOpac; $('#tPielOpac').closest('label').hidden = !an.piel;
    $('#tBorrar').disabled = an.fotogramas.length < 2;
    tira.replaceChildren(...an.fotogramas.map((f, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'fot' + (i === an.actual ? ' actual' : ''); b.dataset.i = i;
      b.title = `Fotograma ${i + 1}` + (i === an.actual ? ' (el que estás editando)' : '. Arrastra para cambiarlo de sitio');
      b.innerHTML = `<img alt=""><span>${i + 1}</span>`;
      const img = b.querySelector('img');
      (i === an.actual ? miniaturaViva() : miniatura(i)).then(u => { img.src = u; });
      b.addEventListener('pointerdown', e => arrastrarFot(e, b, i));
      return b;
    }));
    tira.querySelector('.actual')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    clearTimeout(espera);
    espera = setTimeout(prepararPiel, 60);
  }
  // Miniatura del fotograma que se está editando: se rehace solo cuando cambia algo (no al seleccionar).
  let viva = { pos: -2, url: '' };
  async function miniaturaViva() {
    if (viva.pos === historia.pos && viva.actual === a().actual) return viva.url;
    const [c] = await dibujarFotogramas([a().actual], { k: 96 / Math.max(doc.w, doc.h) });
    viva = { pos: historia.pos, actual: a().actual, url: c.toDataURL() };
    return viva.url;
  }
  function marcarReproduccion(n) { tira.querySelectorAll('.fot').forEach((b, i) => b.classList.toggle('sonando', i === n)); }
  // Tocar = ir a ese fotograma; arrastrar a los lados = cambiarlo de sitio.
  function arrastrarFot(e, b, i) {
    if (e.button > 0) return;
    const x0 = e.clientX; let moviendo = false, destino = i;
    const botones = [...tira.querySelectorAll('.fot')];
    const mover_ = m => {
      if (!moviendo && Math.abs(m.clientX - x0) < 10) return;
      moviendo = true; b.classList.add('arrastrando');
      destino = botones.length - 1;
      for (let k = 0; k < botones.length; k++) { const r = botones[k].getBoundingClientRect(); if (m.clientX < r.left + r.width / 2) { destino = k; break; } }
      botones.forEach((x, k) => x.classList.toggle('hueco', k === destino && k !== i));
    };
    const fin = () => {
      removeEventListener('pointermove', mover_); removeEventListener('pointerup', fin); removeEventListener('pointercancel', fin);
      b.classList.remove('arrastrando'); botones.forEach(x => x.classList.remove('hueco'));
      if (moviendo) { const d = destino > i ? destino - 1 : destino; if (d !== i) mover(i, Math.max(0, d)); }
      else irA(i);
    };
    addEventListener('pointermove', mover_); addEventListener('pointerup', fin); addEventListener('pointercancel', fin);
  }
  const cambiarAnim = c => { Object.assign(a(), c); registrar(); };
  $('#tAnterior').onclick = () => irA(a().actual - 1 < 0 && a().bucle ? a().fotogramas.length - 1 : a().actual - 1);
  $('#tSiguiente').onclick = () => irA(a().actual + 1 >= a().fotogramas.length && a().bucle ? 0 : a().actual + 1);
  $('#tPlay').onclick = reproducir;
  $('#tFps').onchange = e => cambiarAnim({ fps: +e.target.value });
  $('#tBucle').onclick = () => cambiarAnim({ bucle: !a().bucle });
  $('#tPiel').onclick = () => cambiarAnim({ piel: !a().piel });
  $('#tPielOpac').oninput = e => { a().pielOpac = +e.target.value; piel.forEach((p, i) => { p.alfa = (a().pielOpac / 100) / (i < a().pielAntes ? i + 1 : i - a().pielAntes + 1); }); canvas.requestRenderAll(); };
  $('#tPielOpac').onchange = () => registrar();
  $('#tNuevo').onclick = () => anadir(false);
  $('#tDuplicar').onclick = () => anadir(true);
  $('#tBorrar').onclick = () => borrar();
  $('#tCerrar').onclick = () => mostrarLinea(false);
  const menuMov = $('#menuMovimiento');
  menuMov.innerHTML = `<p class="nota">Para el elemento seleccionado. Duración:</p><div class="dur"><button type="button" data-n="6">½ s</button><button type="button" data-n="12" class="activo">1 s</button><button type="button" data-n="24">2 s</button></div>`;
  let duracion = 12;
  menuMov.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { duracion = +b.dataset.n; menuMov.querySelectorAll('[data-n]').forEach(x => x.classList.toggle('activo', x === b)); });
  menuMov.append(...Object.entries(MOVIMIENTOS).map(([clave, m]) => {
    const b = Object.assign(document.createElement('button'), { type: 'button', textContent: m.n });
    b.onclick = () => { menuMov.hidden = true; aplicarMovimiento(clave, Math.max(2, Math.round(duracion * a().fps / 12))); };
    return b;
  }));
  $('#tMovimiento').onclick = e => { e.stopPropagation(); menuMov.hidden = !menuMov.hidden; };
  document.addEventListener('pointerdown', e => { if (!menuMov.hidden && !menuMov.contains(e.target) && e.target !== $('#tMovimiento')) menuMov.hidden = true; });

  // Botón en la barra de herramientas.
  const boton = document.createElement('button');
  boton.id = 'bAnimacion'; boton.title = 'Animación: dibuja fotograma a fotograma, papel cebolla, reproducir y exportar GIF o vídeo';
  boton.innerHTML = '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 9h4M3 15h4M17 9h4M17 15h4M10.5 10l3.5 2-3.5 2z"/></svg>';
  boton.onclick = () => activa() ? mostrarLinea(linea.hidden) : activar();
  $('#bImagen').after(boton);

  document.addEventListener('casadrew:refrescar', () => { if (activa() && linea.hidden && !document.body.dataset.animVista) { document.body.dataset.animVista = 1; mostrarLinea(true); } else pintarLinea(); });
  document.addEventListener('keydown', e => {
    if (!activa() || escribiendo(e) || document.querySelector('dialog[open]') || e.ctrlKey || e.metaKey) return;
    if (e.key === ',') { e.preventDefault(); $('#tAnterior').click(); }
    if (e.key === '.') { e.preventDefault(); $('#tSiguiente').click(); }
    if (e.key === 'Escape' && reproduciendo) parar();
  });
  // Si cambia el fondo de la página o se edita algo, las miniaturas del fotograma actual se rehacen al pintar la línea.
  canvas.on('object:modified', () => { if (activa()) setTimeout(pintarLinea, 50); });

  return { activa, activar, quitar, fijar, irA, anadir, borrar, mover, reproducir, parar, aplicarMovimiento, MOVIMIENTOS, exportarGIF, exportarVideo, estimar, prepararDoc, enLinea, dibujarFotogramas };
})();
