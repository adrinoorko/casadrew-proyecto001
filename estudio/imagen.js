// CASADREW · Estudio — herramientas de imagen: recortar, varita mágica y quitar el fondo con IA en tu aparato.
// Nada destruye la foto original: cada imagen recuerda su original (imgOriginal) y se puede restaurar.
'use strict';
const Imagen = (() => {
  const esImagen = o => o instanceof F.FabricImage;
  const imagenSel = () => { const o = canvas.getActiveObject(); return activos().length === 1 && esImagen(o) ? o : null; };
  EXTRA.push('imgOriginal');
  let modo = null; // 'recorte' | 'varita' | null
  const estado = $('#imgEstado');
  const aviso = t => { estado.textContent = t; };

  // ---------- Panel ----------
  function refrescar() {
    const o = imagenSel();
    $('#pImagen').hidden = !o && !modo;
    $('#modoRecorte').hidden = modo !== 'recorte';
    $('#modoVarita').hidden = modo !== 'varita';
    $('#accionesImagen').hidden = !!modo;
    if (!o) return;
    $('#bRestaurar').disabled = !(o.imgOriginal && o.imgOriginal !== o.imgRef) && !(o.cropX || o.cropY);
    $('#modoRecorte').hidden = modo !== 'recorte';
    $('#modoVarita').hidden = modo !== 'varita';
    $('#accionesImagen').hidden = !!modo;
  }
  ['selection:created', 'selection:updated', 'selection:cleared'].forEach(ev => canvas.on(ev, () => setTimeout(refrescar)));

  // Cambia la foto de un elemento conservando su tamaño en la página.
  async function cambiarFoto(o, data, { recorte } = {}) {
    const ancho = o.getScaledWidth(), prev = { cropX: o.cropX, cropY: o.cropY, width: o.width, height: o.height };
    const ref = await registrarImagen(data);
    if (!o.imgOriginal) o.imgOriginal = o.imgRef || ref;
    await o.setSrc(data);
    o.imgRef = ref;
    if (recorte === 'mantener') o.set(prev);
    else o.set({ cropX: 0, cropY: 0, width: o.getElement().naturalWidth, height: o.getElement().naturalHeight });
    o.scaleX = o.scaleY = ancho / o.width;
    o.setCoords(); o.set('dirty', true);
    canvas.requestRenderAll();
    registrar();
  }
  // Píxeles de la foto completa (sin recorte), como lienzo.
  function lienzoDe(o, maxLado = Infinity) {
    const el = o.getElement(), w = el.naturalWidth, h = el.naturalHeight, k = Math.min(1, maxLado / Math.max(w, h));
    const c = Object.assign(document.createElement('canvas'), { width: Math.round(w * k), height: Math.round(h * k) });
    c.getContext('2d', { willReadFrequently: true }).drawImage(el, 0, 0, c.width, c.height);
    return { c, k, w, h };
  }
  // Punto del lienzo -> píxel de la foto original.
  function aPixel(o, e) {
    const p = canvas.getScenePoint(e), local = F.util.transformPoint(p, F.util.invertTransform(o.calcTransformMatrix()));
    return { x: local.x + o.width / 2 + o.cropX, y: local.y + o.height / 2 + o.cropY };
  }

  $('#bRestaurar').onclick = async () => {
    const o = imagenSel(); if (!o) return;
    const data = o.imgOriginal ? (imagenes.get(o.imgOriginal) || await Almacen.leerImagen(o.imgOriginal)) : null;
    if (data && o.imgOriginal !== o.imgRef) { const orig = o.imgOriginal; await cambiarFoto(o, data); o.imgOriginal = orig; aviso('Foto original restaurada.'); }
    else { quitarRecorte(o); aviso('Recorte quitado.'); }
    refrescar();
  };

  // ---------- Recortar ----------
  const PROPORCIONES = [['Libre', 0], ['1:1', 1], ['4:5', 4 / 5], ['3:4', 3 / 4], ['2:3', 2 / 3], ['16:9', 16 / 9], ['9:16', 9 / 16], ['A4', 210 / 297]];
  let marco = null, recorteDe = null, previo = null, proporcion = 0;
  $('#proporciones').append(...PROPORCIONES.map(([n, r]) => {
    const b = Object.assign(document.createElement('button'), { type: 'button', className: 'chip-p', textContent: n, title: r ? `Recorte con forma ${n}` : 'Cualquier forma' });
    b.onclick = () => { proporcion = r; $$('#proporciones button').forEach(x => x.classList.toggle('activo', x === b)); if (marco) ajustarProporcion(true); };
    return b;
  }));
  function quitarRecorte(o) {
    o.set({ left: o.left - o.cropX * o.scaleX, top: o.top - o.cropY * o.scaleY, cropX: 0, cropY: 0,
      width: o.getElement().naturalWidth, height: o.getElement().naturalHeight });
    o.setCoords(); canvas.requestRenderAll(); registrar();
  }
  $('#bRecortar').onclick = () => {
    const o = imagenSel(); if (!o) return;
    if (o.angle % 360 || o.flipX || o.flipY) return aviso('Para recortar, quita antes el giro o el volteo (Elemento › Girar › Quitar el giro).');
    modo = 'recorte'; recorteDe = o;
    previo = { left: o.left, top: o.top, cropX: o.cropX, cropY: o.cropY, width: o.width, height: o.height };
    // Se muestra la foto entera para poder ampliar el recorte; el marco empieza en lo que se veía.
    o.set({ left: o.left - o.cropX * o.scaleX, top: o.top - o.cropY * o.scaleY, cropX: 0, cropY: 0, width: o.getElement().naturalWidth, height: o.getElement().naturalHeight, selectable: false, evented: false });
    marco = new F.Rect({ left: previo.left, top: previo.top, width: previo.width * o.scaleX, height: previo.height * o.scaleY, fill: 'rgba(0,0,0,0)',
      stroke: '#ffffff', strokeWidth: 2, strokeUniform: true, strokeDashArray: [8, 6], lockRotation: true, noScaleCache: true, transparentCorners: false,
      cornerColor: '#ffffff', cornerStrokeColor: '#1a1a1a', excludeFromExport: true });
    marco.setControlVisible('mtr', false);
    // Mientras se recorta no se apunta nada en el historial; al aplicar queda un solo paso.
    historia.pausa = true; canvas.add(marco);
    canvas.setActiveObject(marco);
    medidasMarco(); refrescar();
    aviso('Ajusta el marco y pulsa «Aplicar recorte».');
  };
  function limitarMarco() {
    const o = recorteDe, b = { l: o.left, t: o.top, r: o.left + o.width * o.scaleX, b: o.top + o.height * o.scaleY };
    let w = marco.width * marco.scaleX, h = marco.height * marco.scaleY;
    w = Math.min(w, b.r - b.l); h = Math.min(h, b.b - b.t);
    marco.set({ width: w, height: h, scaleX: 1, scaleY: 1 });
    marco.set({ left: Math.min(Math.max(marco.left, b.l), b.r - w), top: Math.min(Math.max(marco.top, b.t), b.b - h) });
    marco.setCoords();
  }
  function ajustarProporcion(centrar) {
    if (!proporcion) return limitarMarco();
    let w = marco.width * marco.scaleX, h = w / proporcion;
    const o = recorteDe, maxW = o.width * o.scaleX, maxH = o.height * o.scaleY;
    if (h > maxH) { h = maxH; w = h * proporcion; }
    if (w > maxW) { w = maxW; h = w / proporcion; }
    const cx = marco.left + marco.width * marco.scaleX / 2, cy = marco.top + marco.height * marco.scaleY / 2;
    marco.set({ width: w, height: h, scaleX: 1, scaleY: 1 });
    if (centrar) marco.set({ left: cx - w / 2, top: cy - h / 2 });
    limitarMarco(); medidasMarco(); canvas.requestRenderAll();
  }
  canvas.on('object:scaling', ({ target }) => { if (target === marco) { ajustarProporcion(false); } });
  canvas.on('object:moving', ({ target }) => { if (target === marco) { limitarMarco(); medidasMarco(); } });
  canvas.on('object:modified', ({ target }) => { if (target === marco) { ajustarProporcion(false); } });
  function medidasMarco() {
    if (!marco) return;
    $('#rAncho').value = Math.round(marco.width * marco.scaleX / recorteDe.scaleX);
    $('#rAlto').value = Math.round(marco.height * marco.scaleY / recorteDe.scaleY);
  }
  ['#rAncho', '#rAlto'].forEach(s => $(s).addEventListener('change', () => {
    if (!marco) return;
    const o = recorteDe;
    if (s === '#rAncho') marco.set({ width: +$(s).value * o.scaleX, scaleX: 1 }); else marco.set({ height: +$(s).value * o.scaleY, scaleY: 1 });
    if (proporcion && s === '#rAlto') marco.set({ width: marco.height * proporcion });
    ajustarProporcion(false); canvas.requestRenderAll();
  }));
  function terminarRecorte(aplicar) {
    const o = recorteDe;
    if (!o) return;
    if (aplicar) {
      const x = (marco.left - o.left) / o.scaleX, y = (marco.top - o.top) / o.scaleY;
      o.set({ cropX: Math.max(0, x), cropY: Math.max(0, y), width: marco.width * marco.scaleX / o.scaleX, height: marco.height * marco.scaleY / o.scaleY, left: marco.left, top: marco.top });
    } else o.set(previo);
    o.set({ selectable: true, evented: true }); o.setCoords();
    canvas.remove(marco); historia.pausa = false;
    marco = null; recorteDe = null; modo = null;
    canvas.setActiveObject(o); canvas.requestRenderAll();
    if (aplicar) { registrar(); aviso('Recortado. «Restaurar original» devuelve la foto entera.'); }
    refrescar();
  }
  $('#bAplicarRecorte').onclick = () => terminarRecorte(true);
  $('#bCancelarRecorte').onclick = () => terminarRecorte(false);
  // Fuera del marco se oscurece la foto, para ver qué se quedará.
  canvas.on('after:render', ({ ctx }) => {
    if (!marco || exportando) return;
    const v = canvas.viewportTransform, o = recorteDe;
    ctx.save(); ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath();
    ctx.rect(o.left, o.top, o.width * o.scaleX, o.height * o.scaleY);
    ctx.rect(marco.left + marco.width * marco.scaleX, marco.top, -marco.width * marco.scaleX, marco.height * marco.scaleY);
    ctx.fill('evenodd'); ctx.restore();
  });

  // ---------- Varita mágica ----------
  let varita = null; // { o, c, k, mascara: Uint8Array, capa: canvas }
  $('#bVarita').onclick = () => {
    const o = imagenSel(); if (!o) return;
    const { c, k } = lienzoDe(o, 1600);
    const datos = c.getContext('2d').getImageData(0, 0, c.width, c.height);
    varita = { o, c, k, datos, mascara: new Uint8Array(c.width * c.height), capa: Object.assign(document.createElement('canvas'), { width: c.width, height: c.height }) };
    modo = 'varita'; o.set({ selectable: false, evented: false });
    canvas.discardActiveObject(); canvas.defaultCursor = 'crosshair';
    refrescar();
    aviso('Toca el color que quieras seleccionar. Mayúsculas + clic añade más zonas.');
  };
  function seleccionarEn(px, py, sumar) {
    const { c, datos, mascara } = varita, W = c.width, H = c.height, d = datos.data;
    const x0 = Math.floor(px * varita.k), y0 = Math.floor(py * varita.k);
    if (x0 < 0 || y0 < 0 || x0 >= W || y0 >= H) return;
    if (!sumar) mascara.fill(0);
    const tol = +$('#vTol').value * 2.55, i0 = (y0 * W + x0) * 4, r0 = d[i0], g0 = d[i0 + 1], b0 = d[i0 + 2], a0 = d[i0 + 3];
    const parecido = i => Math.max(Math.abs(d[i] - r0), Math.abs(d[i + 1] - g0), Math.abs(d[i + 2] - b0), Math.abs(d[i + 3] - a0)) <= tol;
    if ($('#vContigua').checked) {
      const pila = [y0 * W + x0], visto = new Uint8Array(W * H);
      while (pila.length) {
        const p = pila.pop();
        if (visto[p]) continue;
        visto[p] = 1;
        if (!parecido(p * 4)) continue;
        mascara[p] = 255;
        const x = p % W;
        if (x > 0) pila.push(p - 1); if (x < W - 1) pila.push(p + 1);
        if (p >= W) pila.push(p - W); if (p < W * (H - 1)) pila.push(p + W);
      }
    } else for (let p = 0; p < W * H; p++) if (parecido(p * 4)) mascara[p] = 255;
    pintarMascara();
  }
  function pintarMascara() {
    const { capa, mascara } = varita, x = capa.getContext('2d'), img = x.createImageData(capa.width, capa.height);
    const acento = getComputedStyle(document.documentElement).getPropertyValue('--acento').trim() || '#c8643b';
    const n = parseInt(new F.Color(acento).toHex().slice(0, 6), 16);
    for (let p = 0; p < mascara.length; p++) if (mascara[p]) { img.data[p * 4] = n >> 16; img.data[p * 4 + 1] = (n >> 8) & 255; img.data[p * 4 + 2] = n & 255; img.data[p * 4 + 3] = 140; }
    x.putImageData(img, 0, 0);
    const total = mascara.reduce((s, v) => s + (v ? 1 : 0), 0);
    aviso(total ? `Seleccionado: ${Math.round(total / mascara.length * 100)} % de la foto.` : 'Nada seleccionado.');
    canvas.requestRenderAll();
  }
  canvas.on('after:render', ({ ctx }) => {
    if (!varita || exportando) return;
    const v = canvas.viewportTransform, o = varita.o, k = varita.k;
    ctx.save(); ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
    const m = o.calcTransformMatrix(); ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
    ctx.drawImage(varita.capa, o.cropX * k, o.cropY * k, o.width * k, o.height * k, -o.width / 2, -o.height / 2, o.width, o.height);
    ctx.restore();
  });
  // Clic sobre la foto con la varita (antes que cualquier otra herramienta).
  mesa.addEventListener('pointerdown', e => {
    if (modo !== 'varita' || e.button > 0) return;
    e.stopPropagation(); e.preventDefault();
    const { x, y } = aPixel(varita.o, e);
    seleccionarEn(x, y, e.shiftKey || $('#vSumar').checked);
  }, true);
  $('#vInvertir').onclick = () => { if (varita) { varita.mascara.forEach((v, i, a) => { a[i] = v ? 0 : 255; }); pintarMascara(); } };
  $('#vLimpiar').onclick = () => { if (varita) { varita.mascara.fill(0); pintarMascara(); } };
  // Difumina el borde de la máscara (suavizado) con dos pasadas de desenfoque de caja.
  function suavizar(m, W, H, r) {
    if (r < 1) return Float32Array.from(m, v => v / 255);
    let a = Float32Array.from(m, v => v / 255), b = new Float32Array(a.length);
    for (let pasada = 0; pasada < 2; pasada++) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        let s = 0, n = 0;
        for (let k = -r; k <= r; k++) { const xx = x + k; if (xx >= 0 && xx < W) { s += a[y * W + xx]; n++; } }
        b[y * W + x] = s / n;
      }
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        let s = 0, n = 0;
        for (let k = -r; k <= r; k++) { const yy = y + k; if (yy >= 0 && yy < H) { s += b[yy * W + x]; n++; } }
        a[y * W + x] = s / n;
      }
    }
    return a;
  }
  // Aplica una máscara de transparencia (0 = se borra, 1 = se queda) a la foto a tamaño completo.
  async function aplicarTransparencia(o, alfa, W, H, mensaje) {
    const { c, w, h } = lienzoDe(o), x = c.getContext('2d');
    const m = Object.assign(document.createElement('canvas'), { width: W, height: H }), mx = m.getContext('2d'), img = mx.createImageData(W, H);
    for (let p = 0; p < alfa.length; p++) img.data[p * 4 + 3] = Math.round((1 - alfa[p]) * 255);
    mx.putImageData(img, 0, 0);
    x.globalCompositeOperation = 'destination-out';
    x.imageSmoothingQuality = 'high';
    x.drawImage(m, 0, 0, w, h);
    await cambiarFoto(o, c.toDataURL('image/png'), { recorte: 'mantener' });
    aviso(mensaje);
  }
  async function terminarVarita(accion) {
    const v = varita;
    if (!v) return;
    if (accion) {
      const W = v.c.width, H = v.c.height, sel = suavizar(v.mascara, W, H, Math.round(+$('#vSuave').value * v.k));
      const alfa = accion === 'borrar' ? sel.map(s => 1 - s) : sel;
      if (!v.mascara.some(Boolean)) return aviso('Primero toca una zona de la foto.');
      await aplicarTransparencia(v.o, alfa, W, H, accion === 'borrar' ? 'Zona borrada. «Restaurar original» la recupera.' : 'Fondo borrado. «Restaurar original» lo recupera.');
    }
    v.o.set({ selectable: true, evented: true });
    varita = null; modo = null; canvas.defaultCursor = 'default';
    canvas.setActiveObject(v.o); canvas.requestRenderAll(); refrescar();
  }
  $('#vBorrar').onclick = () => terminarVarita('borrar');
  $('#vDejar').onclick = () => terminarVarita('dejar');
  $('#vCancelar').onclick = () => terminarVarita(null);

  function salir() {
    if (modo === 'recorte' && marco) terminarRecorte(false);
    if (modo === 'varita' && varita) terminarVarita(null);
  }

  // ---------- Quitar fondo con IA (U²-Net pequeño, en tu aparato) ----------
  const MOTOR = { nombre: 'U²-Net pequeño (u2netp)', archivo: 'modelos/u2netp.onnx', tam: '4,4 MB', licencia: 'Apache 2.0 (Xuebin Qin y otros, 2020)',
    origen: 'Copia oficial del proyecto rembg en GitHub', requisitos: 'Cualquier ordenador o iPad reciente. No necesita internet ni tarjeta gráfica.' };
  let sesion = null;
  async function cargarMotor() {
    if (sesion) return sesion;
    if (!window.ort) await new Promise((ok, mal) => { const s = Object.assign(document.createElement('script'), { src: 'lib/ort/ort.wasm.min.js', onload: ok, onerror: () => mal(new Error('no se pudo cargar el motor')) }); document.head.append(s); });
    ort.env.wasm.wasmPaths = new URL('lib/ort/', location.href).href;
    ort.env.wasm.numThreads = 1;
    const r = await fetch(MOTOR.archivo);
    if (!r.ok) throw new Error('no se encontró el modelo');
    sesion = await ort.InferenceSession.create(await r.arrayBuffer(), { executionProviders: ['wasm'] });
    return sesion;
  }
  // Devuelve una máscara 0..1 del objeto principal de la foto, al tamaño W × H.
  async function mascaraIA(fuente, W, H) {
    const s = await cargarMotor(), N = 320;
    const c = Object.assign(document.createElement('canvas'), { width: N, height: N }), x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(fuente, 0, 0, N, N);
    const d = x.getImageData(0, 0, N, N).data, entrada = new Float32Array(3 * N * N);
    let max = 1; for (let i = 0; i < d.length; i += 4) max = Math.max(max, d[i], d[i + 1], d[i + 2]);
    const media = [.485, .456, .406], desv = [.229, .224, .225];
    for (let p = 0; p < N * N; p++) for (let k = 0; k < 3; k++) entrada[k * N * N + p] = (d[p * 4 + k] / max - media[k]) / desv[k];
    const salida = await s.run({ [s.inputNames[0]]: new ort.Tensor('float32', entrada, [1, 3, N, N]) });
    const m = salida[s.outputNames[0]].data;
    let lo = Infinity, hi = -Infinity; for (const v of m) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    const pequena = Object.assign(document.createElement('canvas'), { width: N, height: N }), px = pequena.getContext('2d'), img = px.createImageData(N, N);
    for (let p = 0; p < N * N; p++) { img.data[p * 4 + 3] = Math.round((m[p] - lo) / (hi - lo || 1) * 255); }
    px.putImageData(img, 0, 0);
    const grande = Object.assign(document.createElement('canvas'), { width: W, height: H }), gx = grande.getContext('2d', { willReadFrequently: true });
    gx.imageSmoothingQuality = 'high'; gx.drawImage(pequena, 0, 0, W, H);
    const gd = gx.getImageData(0, 0, W, H).data, alfa = new Float32Array(W * H);
    for (let p = 0; p < W * H; p++) alfa[p] = gd[p * 4 + 3] / 255;
    return alfa;
  }
  $('#bQuitarFondo').onclick = async () => {
    const o = imagenSel(); if (!o) return;
    const b = $('#bQuitarFondo'); b.disabled = true;
    aviso('Quitando el fondo… (la primera vez tarda unos segundos en preparar el motor)');
    try {
      const { c } = lienzoDe(o, 1600);
      const t0 = performance.now();
      const alfa = await mascaraIA(c, c.width, c.height);
      await aplicarTransparencia(o, alfa, c.width, c.height, `Fondo quitado en ${((performance.now() - t0) / 1000).toFixed(1)} s. «Restaurar original» lo recupera.`);
    } catch (err) { aviso('No se pudo quitar el fondo: ' + (err.message || err)); }
    b.disabled = false;
  };

  // Ventana de motores de IA: qué hay instalado, su licencia y una prueba real.
  $('#mIaNombre').textContent = MOTOR.nombre; $('#mIaTam').textContent = MOTOR.tam; $('#mIaLic').textContent = MOTOR.licencia;
  $('#mIaOrigen').textContent = MOTOR.origen; $('#mIaReq').textContent = MOTOR.requisitos;
  $('#bProbarIA').onclick = async () => {
    const r = $('#mIaPrueba'); r.textContent = 'Probando…'; r.className = 'nota';
    try {
      // Foto de prueba: un círculo de color sobre un fondo liso. La máscara debe quedarse con el círculo.
      const c = Object.assign(document.createElement('canvas'), { width: 320, height: 320 }), x = c.getContext('2d');
      x.fillStyle = '#d9e4f2'; x.fillRect(0, 0, 320, 320); x.fillStyle = '#c8643b'; x.beginPath(); x.arc(160, 160, 80, 0, 7); x.fill();
      const t0 = performance.now(), m = await mascaraIA(c, 320, 320), centro = m[160 * 320 + 160], esquina = m[10 * 320 + 10];
      const bien = centro > .5 && esquina < .5;
      r.textContent = bien ? `✓ Funciona: distingue el objeto del fondo (${Math.round(performance.now() - t0)} ms).` : `✗ La prueba no salió bien (centro ${centro.toFixed(2)}, fondo ${esquina.toFixed(2)}).`;
      r.className = 'nota ' + (bien ? 'ok' : 'mal');
    } catch (err) { r.textContent = '✗ No funciona en este aparato: ' + (err.message || err); r.className = 'nota mal'; }
  };
  return { refrescar, salir, mascaraIA, cargarMotor };
})();
