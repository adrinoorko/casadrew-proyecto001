// CASADREW · Estudio — editor de diseño (fase 1).
// El "documento" es una página de doc.w × doc.h px dibujada en el lienzo de Fabric.js;
// lo que queda fuera se ve atenuado y no sale al exportar.
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const F = fabric;

// Propiedades propias que se guardan con cada elemento.
const EXTRA = ['id', 'nombre', 'bloqueado', 'lockMovementX', 'lockMovementY', 'lockScalingX', 'lockScalingY', 'lockRotation', 'hasControls'];
const FORMATOS = [
  { n: 'Instagram cuadrado', w: 1080, h: 1080 }, { n: 'Instagram vertical', w: 1080, h: 1350 },
  { n: 'Historia / Reel', w: 1080, h: 1920 }, { n: 'Presentación 16:9', w: 1920, h: 1080 },
  { n: 'Facebook / enlace', w: 1200, h: 630 }, { n: 'Banner web', w: 1920, h: 600 },
  { n: 'A4 vertical', w: 2480, h: 3508 }, { n: 'A4 horizontal', w: 3508, h: 2480 },
  { n: 'A3 vertical', w: 3508, h: 4961 }, { n: 'Carta (Letter)', w: 2550, h: 3300 },
  { n: 'Legal', w: 2550, h: 4200 }, { n: 'Postal 10×15', w: 1181, h: 1772 },
];
const FUENTES = ['system-ui', 'Arial', 'Helvetica', 'Verdana', 'Trebuchet MS', 'Segoe UI', 'Georgia', 'Times New Roman',
  'Palatino Linotype', 'Garamond', 'Courier New', 'Impact', 'Brush Script MT', 'Comic Sans MS'];
const NOMBRES_TIPO = { textbox: 'Texto', 'i-text': 'Texto', rect: 'Rectángulo', ellipse: 'Círculo', triangle: 'Triángulo',
  line: 'Línea', polygon: 'Forma', image: 'Imagen', group: 'Grupo', path: 'Trazo' };

const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
let doc = { id: nuevoId(), nombre: 'Sin título', w: 1080, h: 1080, fondo: '#ffffff' };
let exportando = false, rejilla = false, iman = true, herramienta = 'seleccion';
let guias = [];

// ---------- Lienzo ----------
Object.assign(F.InteractiveFabricObject.ownDefaults, {
  borderColor: '#c8643b', cornerColor: '#ffffff', cornerStrokeColor: '#c8643b', cornerStyle: 'circle',
  transparentCorners: false, cornerSize: 12, touchCornerSize: 34, borderScaleFactor: 1.5, padding: 2,
});
const canvas = new F.Canvas('lienzo', {
  preserveObjectStacking: true, fireRightClick: true, stopContextMenu: true, controlsAboveOverlay: true,
  selectionColor: 'rgba(200,100,59,.08)', selectionBorderColor: '#c8643b', selectionLineWidth: 1,
});
const mesa = $('#mesa');
const colorMesa = () => getComputedStyle(document.documentElement).getPropertyValue('--mesa').trim() || '#e9e2d8';

// Página: fondo (o cuadros si es transparente) y, encima de todo, la mesa tapando lo que sale de la página.
canvas._renderBackground = function (ctx) {
  const v = this.viewportTransform;
  ctx.save();
  ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
  if (!exportando) { ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = 24; }
  if (doc.fondo) { ctx.fillStyle = doc.fondo; ctx.fillRect(0, 0, doc.w, doc.h); }
  else if (!exportando) {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, doc.w, doc.h); ctx.shadowColor = 'transparent';
    const t = 16 / v[0]; ctx.fillStyle = '#e6e6e6';
    for (let y = 0; y < doc.h; y += t) for (let x = (Math.round(y / t) % 2) * t; x < doc.w; x += 2 * t)
      ctx.fillRect(x, y, Math.min(t, doc.w - x), Math.min(t, doc.h - y));
  }
  ctx.restore();
};
canvas._renderOverlay = function (ctx) {
  if (exportando) return;
  const v = this.viewportTransform;
  ctx.save();
  ctx.fillStyle = colorMesa(); ctx.globalAlpha = .82;
  ctx.beginPath();
  ctx.rect(0, 0, this.width, this.height);
  ctx.rect(v[4] + doc.w * v[0], v[5], -doc.w * v[0], doc.h * v[3]);
  ctx.fill('evenodd');
  ctx.restore();
};
canvas.on('after:render', ({ ctx }) => {
  if (exportando) return;
  const v = canvas.viewportTransform, z = v[0];
  ctx.save();
  ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
  if (rejilla) {
    const paso = pasoRejilla();
    ctx.strokeStyle = 'rgba(200,100,59,.22)'; ctx.lineWidth = 1 / z; ctx.beginPath();
    for (let x = paso; x < doc.w; x += paso) { ctx.moveTo(x, 0); ctx.lineTo(x, doc.h); }
    for (let y = paso; y < doc.h; y += paso) { ctx.moveTo(0, y); ctx.lineTo(doc.w, y); }
    ctx.stroke();
  }
  if (guias.length) {
    ctx.strokeStyle = '#e0368a'; ctx.lineWidth = 1 / z; ctx.setLineDash([4 / z, 3 / z]); ctx.beginPath();
    for (const g of guias) {
      if (g.x !== undefined) { ctx.moveTo(g.x, -1e5); ctx.lineTo(g.x, 1e5); }
      else { ctx.moveTo(-1e5, g.y); ctx.lineTo(1e5, g.y); }
    }
    ctx.stroke();
  }
  ctx.restore();
});
const pasoRejilla = () => { const p = Math.max(doc.w, doc.h) / 24; const m = 10 ** Math.floor(Math.log10(p)); return [1, 2, 5, 10].map(k => k * m).find(k => k >= p); };

function medirMesa() {
  canvas.setDimensions({ width: mesa.clientWidth, height: mesa.clientHeight });
  canvas.requestRenderAll();
}
new ResizeObserver(() => { const primera = !canvas.width || canvas.width === 300; medirMesa(); if (primera) ajustarVista(); }).observe(mesa);

// ---------- Vista: zoom y desplazamiento ----------
function ajustarVista() {
  const W = canvas.width, H = canvas.height, m = Math.min(48, W * .06);
  const z = Math.max(.02, Math.min((W - 2 * m) / doc.w, (H - 2 * m) / doc.h));
  canvas.setViewportTransform([z, 0, 0, z, (W - doc.w * z) / 2, (H - doc.h * z) / 2]);
  mostrarZoom();
}
function zoomEn(punto, z) {
  canvas.zoomToPoint(punto, Math.max(.02, Math.min(32, z)));
  mostrarZoom();
}
const centroMesa = () => new F.Point(canvas.width / 2, canvas.height / 2);
function mostrarZoom() { $('#bZoom').textContent = Math.round(canvas.getZoom() * 100) + '%'; }
$('#bMas').onclick = () => zoomEn(centroMesa(), canvas.getZoom() * 1.25);
$('#bMenos').onclick = () => zoomEn(centroMesa(), canvas.getZoom() / 1.25);
$('#bZoom').onclick = ajustarVista;

canvas.on('mouse:wheel', opt => {
  const e = opt.e; e.preventDefault(); e.stopPropagation();
  if (e.ctrlKey || e.metaKey) zoomEn(new F.Point(e.offsetX, e.offsetY), canvas.getZoom() * 0.999 ** e.deltaY);
  else { canvas.relativePan(new F.Point(-e.deltaX, -e.deltaY)); canvas.requestRenderAll(); }
});

let espacio = false, arrastreVista = null;
function ponerHerramienta(h) {
  herramienta = h;
  $$('[data-herr]').forEach(b => b.classList.toggle('activo', b.dataset.herr === h));
  aplicarModoMano();
}
function aplicarModoMano() {
  const mano = herramienta === 'mano' || espacio;
  canvas.selection = !mano;
  canvas.skipTargetFind = mano;
  canvas.defaultCursor = mano ? 'grab' : 'default';
  canvas.setCursor(canvas.defaultCursor);
}
canvas.on('mouse:down', opt => {
  const e = opt.e;
  if (e.button === 2) return abrirMenu(opt);
  cerrarMenu();
  if (herramienta === 'mano' || espacio || e.button === 1) {
    arrastreVista = { x: e.clientX, y: e.clientY };
    canvas.setCursor('grabbing');
  }
});
canvas.on('mouse:move', opt => {
  if (!arrastreVista || toques.size > 1) return;
  const e = opt.e;
  canvas.relativePan(new F.Point(e.clientX - arrastreVista.x, e.clientY - arrastreVista.y));
  arrastreVista = { x: e.clientX, y: e.clientY };
  canvas.requestRenderAll();
});
canvas.on('mouse:up', () => {
  arrastreVista = null;
  if (guias.length) { guias = []; canvas.requestRenderAll(); }
  aplicarModoMano();
});

// Pellizcar con dos dedos para acercar (iPad / móvil).
const toques = new Map();
let pellizco = null;
mesa.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') toques.set(e.pointerId, e); }, true);
mesa.addEventListener('pointermove', e => {
  if (!toques.has(e.pointerId)) return;
  toques.set(e.pointerId, e);
  if (toques.size !== 2) return;
  const [a, b] = [...toques.values()], r = mesa.getBoundingClientRect();
  const medio = new F.Point((a.clientX + b.clientX) / 2 - r.left, (a.clientY + b.clientY) / 2 - r.top);
  const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  if (!pellizco) {
    pellizco = { dist, medio, zoom: canvas.getZoom() };
    canvas.discardActiveObject(); canvas.selection = false; canvas.skipTargetFind = true; arrastreVista = null;
    return;
  }
  canvas.relativePan(new F.Point(medio.x - pellizco.medio.x, medio.y - pellizco.medio.y));
  pellizco.medio = medio;
  zoomEn(medio, pellizco.zoom * dist / pellizco.dist);
}, true);
const finToque = e => { toques.delete(e.pointerId); if (toques.size < 2 && pellizco) { pellizco = null; aplicarModoMano(); } };
mesa.addEventListener('pointerup', finToque, true);
mesa.addEventListener('pointercancel', finToque, true);

// ---------- Imán y guías inteligentes ----------
canvas.on('object:moving', ({ target: o }) => {
  guias = [];
  if (!iman) return;
  const umbral = 7 / canvas.getZoom();
  const b = o.getBoundingRect();
  const xs = [0, doc.w / 2, doc.w], ys = [0, doc.h / 2, doc.h];
  const moviendo = new Set(canvas.getActiveObjects());
  for (const otro of canvas.getObjects()) {
    if (otro === o || moviendo.has(otro) || !otro.visible) continue;
    const c = otro.getBoundingRect();
    xs.push(c.left, c.left + c.width / 2, c.left + c.width);
    ys.push(c.top, c.top + c.height / 2, c.top + c.height);
  }
  const ajuste = (propios, objetivos) => {
    let mejor = null;
    for (const p of propios) for (const t of objetivos) {
      const d = t - p;
      if (Math.abs(d) <= umbral && (!mejor || Math.abs(d) < Math.abs(mejor.d))) mejor = { d, t };
    }
    return mejor;
  };
  const ax = ajuste([b.left, b.left + b.width / 2, b.left + b.width], xs);
  const ay = ajuste([b.top, b.top + b.height / 2, b.top + b.height], ys);
  if (ax) { o.set('left', o.left + ax.d); guias.push({ x: ax.t }); }
  if (ay) { o.set('top', o.top + ay.d); guias.push({ y: ay.t }); }
  if (ax || ay) o.setCoords();
});

// ---------- Historial (deshacer / rehacer) ----------
const historia = { pila: [], pos: -1, pausa: false };
function serializar() {
  return { formato: 'casadrew', version: 1, doc: { ...doc }, objetos: canvas.toObject(EXTRA).objects };
}
function registrar() {
  if (historia.pausa) return;
  const s = JSON.stringify(serializar());
  if (s === historia.pila[historia.pos]) return;
  historia.pila.splice(historia.pos + 1);
  historia.pila.push(s);
  if (historia.pila.length > 150) historia.pila.shift();
  historia.pos = historia.pila.length - 1;
  tras();
}
function reiniciarHistoria() { historia.pila = []; historia.pos = -1; registrar(); }
async function irA(pos) {
  if (pos < 0 || pos >= historia.pila.length) return;
  historia.pos = pos;
  await cargarEstado(JSON.parse(historia.pila[pos]), false);
  tras();
}
const deshacer = () => irA(historia.pos - 1);
const rehacer = () => irA(historia.pos + 1);
$('#bDeshacer').onclick = deshacer;
$('#bRehacer').onclick = rehacer;

async function cargarEstado(e, recolocar = true) {
  historia.pausa = true;
  try {
    canvas.discardActiveObject();
    doc = { ...doc, ...e.doc };
    await canvas.loadFromJSON({ objects: e.objetos || [] });
    canvas.getObjects().forEach(o => { if (!o.id) o.id = nuevoId(); });
  } finally {
    historia.pausa = false;
  }
  if (recolocar) ajustarVista();
  canvas.requestRenderAll();
  refrescarTodo();
}

// Después de cada cambio: botones, panel, capas y guardado automático.
function tras() {
  $('#bDeshacer').disabled = historia.pos <= 0;
  $('#bRehacer').disabled = historia.pos >= historia.pila.length - 1;
  refrescarTodo();
  autoguardar();
}
canvas.on('object:added', ({ target }) => { if (!historia.pausa && !target.id) target.id = nuevoId(); registrar(); });
canvas.on('object:removed', registrar);
canvas.on('object:modified', registrar);
canvas.on('text:editing:exited', registrar);

// ---------- Guardado automático ----------
let temporizador = null;
function autoguardar() {
  ponerEstado('Guardando…');
  clearTimeout(temporizador);
  temporizador = setTimeout(guardarYa, 700);
}
async function guardarYa() {
  clearTimeout(temporizador);
  try {
    await Almacen.guardar({ id: doc.id, nombre: doc.nombre, actualizado: Date.now(), datos: serializar(), miniatura: miniatura() });
    Almacen.recordarUltimo(doc.id);
    ponerEstado('Guardado en este aparato · ' + new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
  } catch (err) {
    ponerEstado('No se pudo guardar: ' + err.message);
  }
}
window.addEventListener('pagehide', guardarYa);
document.addEventListener('visibilitychange', () => { if (document.hidden) guardarYa(); });
function ponerEstado(t) { $('#estado').textContent = t; }

// ---------- Exportar ----------
function aCanvasDePagina(escala = 1) {
  const vpt = canvas.viewportTransform.slice(), activo = canvas.getActiveObject();
  canvas.discardActiveObject();
  exportando = true;
  canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
  try {
    return canvas.toCanvasElement(escala, { left: 0, top: 0, width: doc.w, height: doc.h });
  } finally {
    exportando = false;
    canvas.setViewportTransform(vpt);
    if (activo) canvas.setActiveObject(activo);
    canvas.requestRenderAll();
  }
}
function miniatura() {
  try { return aCanvasDePagina(Math.min(1, 320 / Math.max(doc.w, doc.h))).toDataURL('image/jpeg', .7); } catch { return ''; }
}
function aSVG() {
  const vpt = canvas.viewportTransform.slice();
  exportando = true;
  canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
  try {
    let svg = canvas.toSVG({ width: doc.w, height: doc.h, viewBox: { x: 0, y: 0, width: doc.w, height: doc.h } });
    if (doc.fondo) svg = svg.replace('</defs>', `</defs>\n<rect x="0" y="0" width="${doc.w}" height="${doc.h}" fill="${doc.fondo}"/>`);
    return svg;
  } finally {
    exportando = false;
    canvas.setViewportTransform(vpt);
  }
}
function descargar(nombre, contenido, tipo) {
  const url = typeof contenido === 'string' && contenido.startsWith('data:') ? contenido : URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
  document.body.append(a); a.click(); a.remove();
  if (!url.startsWith('data:')) setTimeout(() => URL.revokeObjectURL(url), 5000);
}
const nombreArchivo = () => (doc.nombre || 'diseño').replace(/[\\/:*?"<>|]+/g, '').trim() || 'diseño';
function infoExportar() {
  const f = $('#eFormato').value, k = +$('#eEscala').value;
  $('#eFilaEscala').hidden = f === 'svg' || f === 'casadrew';
  $('#eInfo').textContent =
    f === 'casadrew' ? 'Guarda todo el diseño para seguir editándolo en otro aparato o como copia de seguridad.'
    : f === 'svg' ? 'Vectorial: se puede ampliar sin perder calidad. Las fotos van dentro tal cual.'
    : `Saldrá de ${Math.round(doc.w * k)} × ${Math.round(doc.h * k)} px.` + (f === 'jpg' && !doc.fondo ? ' El JPG no admite transparencia: el fondo saldrá blanco.' : '');
}
$('#eFormato').onchange = $('#eEscala').onchange = infoExportar;
$('#bExportar').onclick = () => { infoExportar(); $('#dExportar').showModal(); };
$('#dExportar').addEventListener('close', () => {
  if ($('#dExportar').returnValue !== 'exportar') return;
  const f = $('#eFormato').value, k = +$('#eEscala').value, n = nombreArchivo();
  if (f === 'casadrew') return descargar(n + '.casadrew', JSON.stringify(serializar()), 'application/json');
  if (f === 'svg') return descargar(n + '.svg', aSVG(), 'image/svg+xml');
  let c = aCanvasDePagina(k);
  if (f === 'jpg') {
    const b = Object.assign(document.createElement('canvas'), { width: c.width, height: c.height }), x = b.getContext('2d');
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, b.width, b.height); x.drawImage(c, 0, 0); c = b;
    return descargar(n + '.jpg', c.toDataURL('image/jpeg', .95));
  }
  descargar(n + '.png', c.toDataURL('image/png'));
});

// ---------- Crear elementos ----------
function colocar(o, nombre) {
  o.set({ nombre: nombre || o.nombre });
  o.setPositionByOrigin(new F.Point(doc.w / 2, doc.h / 2), 'center', 'center');
  canvas.add(o);
  canvas.setActiveObject(o);
  canvas.requestRenderAll();
  if (window.innerWidth <= 900) cerrarPanel();
}
const lado = () => Math.round(Math.min(doc.w, doc.h) * .35);
function puntosEstrella(n, rExt, rInt) {
  const p = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? rInt : rExt, a = Math.PI * i / n - Math.PI / 2;
    p.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
  }
  return p;
}
function puntosPoligono(n, r) {
  return Array.from({ length: n }, (_, i) => { const a = 2 * Math.PI * i / n - Math.PI / 2; return { x: r * Math.cos(a), y: r * Math.sin(a) }; });
}
const CREAR = {
  texto: () => new F.Textbox('Escribe aquí', { width: Math.round(doc.w * .6), fontSize: Math.round(Math.min(doc.w, doc.h) * .07),
    fontFamily: 'system-ui', fill: '#1a1a1a', textAlign: 'center', nombre: 'Texto' }),
  rect: () => new F.Rect({ width: lado(), height: lado(), fill: '#c8643b', rx: 0, ry: 0, strokeWidth: 0, nombre: 'Rectángulo' }),
  elipse: () => new F.Ellipse({ rx: lado() / 2, ry: lado() / 2, fill: '#3b7dc8', strokeWidth: 0, nombre: 'Círculo' }),
  triangulo: () => new F.Triangle({ width: lado(), height: lado(), fill: '#2e9e6b', strokeWidth: 0, nombre: 'Triángulo' }),
  linea: () => new F.Line([0, 0, lado() * 1.5, 0], { stroke: '#1a1a1a', strokeWidth: Math.max(2, Math.round(lado() / 40)), strokeLineCap: 'round', nombre: 'Línea' }),
  estrella: () => new F.Polygon(puntosEstrella(5, lado() / 2, lado() / 4.6), { fill: '#e8b730', strokeWidth: 0, nombre: 'Estrella' }),
  hexagono: () => new F.Polygon(puntosPoligono(6, lado() / 2), { fill: '#8a5cc8', strokeWidth: 0, nombre: 'Hexágono' }),
};
$$('[data-crear]').forEach(b => b.onclick = () => { ponerHerramienta('seleccion'); colocar(CREAR[b.dataset.crear]()); });
$$('[data-herr]').forEach(b => b.onclick = () => ponerHerramienta(b.dataset.herr));

// Imágenes: botón, arrastrar desde el ordenador y pegar.
$('#bImagen').onclick = () => $('#fImagen').click();
$('#fImagen').onchange = e => { importarArchivos([...e.target.files]); e.target.value = ''; };
const leer = (archivo, como) => new Promise((ok, mal) => {
  const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => mal(r.error);
  como === 'texto' ? r.readAsText(archivo) : r.readAsDataURL(archivo);
});
async function importarArchivos(archivos) {
  for (const a of archivos) {
    try {
      if (/\.casadrew$|\.json$/i.test(a.name)) { await abrirProyecto(a); continue; }
      let o;
      if (a.type === 'image/svg+xml' || /\.svg$/i.test(a.name)) {
        const { objects, options } = await F.loadSVGFromString(await leer(a, 'texto'));
        o = F.util.groupSVGElements(objects.filter(Boolean), options);
      } else if (a.type.startsWith('image/')) {
        o = await F.FabricImage.fromURL(await leer(a, 'url'));
      } else { ponerEstado(`«${a.name}» no es una imagen que pueda abrir todavía.`); continue; }
      const k = Math.min(1, (doc.w * .8) / o.width, (doc.h * .8) / o.height);
      o.scale(k);
      colocar(o, a.name.replace(/\.[^.]+$/, ''));
    } catch (err) {
      ponerEstado(`No se pudo abrir «${a.name}»: ${err.message || err}`);
    }
  }
}
['dragenter', 'dragover'].forEach(t => mesa.addEventListener(t, e => {
  if (![...e.dataTransfer.types].includes('Files')) return;
  e.preventDefault(); mesa.classList.add('arrastrando');
}));
mesa.addEventListener('dragleave', e => { if (!mesa.contains(e.relatedTarget)) mesa.classList.remove('arrastrando'); });
mesa.addEventListener('drop', e => {
  e.preventDefault(); mesa.classList.remove('arrastrando');
  importarArchivos([...e.dataTransfer.files]);
});

// ---------- Selección y acciones ----------
const activos = () => canvas.getActiveObjects();
function reseleccionar(objs) {
  canvas.discardActiveObject();
  if (objs.length === 1) canvas.setActiveObject(objs[0]);
  else if (objs.length > 1) canvas.setActiveObject(new F.ActiveSelection(objs, { canvas }));
  canvas.requestRenderAll();
}

const MARCA = 'casadrew:elementos';
let portapapeles = null;
async function copiar() { const o = canvas.getActiveObject(); if (o) portapapeles = await o.clone(EXTRA); }
async function pegarDe(origen, desplazar = 24) {
  const c = await origen.clone(EXTRA);
  canvas.discardActiveObject();
  c.set({ left: c.left + desplazar, top: c.top + desplazar });
  historia.pausa = true;
  const nuevos = c instanceof F.ActiveSelection ? c.removeAll() : [c];
  nuevos.forEach(o => { o.id = nuevoId(); canvas.add(o); });
  historia.pausa = false;
  reseleccionar(nuevos);
  registrar();
}
async function pegar() { if (portapapeles) { await pegarDe(portapapeles); portapapeles.set({ left: portapapeles.left + 24, top: portapapeles.top + 24 }); } }

function sinBloqueados(objs) { return objs.filter(o => !o.bloqueado); }
const ACCIONES = {
  async duplicar() { const o = canvas.getActiveObject(); if (o) await pegarDe(o); },
  copiar, pegar,
  borrar() {
    const objs = activos(); if (!objs.length) return;
    canvas.discardActiveObject();
    historia.pausa = true; canvas.remove(...objs); historia.pausa = false;
    registrar();
  },
  frente() { activos().forEach(o => canvas.bringObjectToFront(o)); registrar(); },
  fondo() { activos().reverse().forEach(o => canvas.sendObjectToBack(o)); registrar(); },
  adelante() { activos().reverse().forEach(o => canvas.bringObjectForward(o)); registrar(); },
  atras() { activos().forEach(o => canvas.sendObjectBackwards(o)); registrar(); },
  agrupar() {
    const objs = activos(); if (objs.length < 2) return;
    const orden = canvas.getObjects();
    objs.sort((a, b) => orden.indexOf(a) - orden.indexOf(b));
    const pos = orden.indexOf(objs[objs.length - 1]) - objs.length + 1;
    canvas.discardActiveObject();
    historia.pausa = true;
    canvas.remove(...objs);
    const g = new F.Group(objs, { nombre: 'Grupo', id: nuevoId() });
    canvas.insertAt(Math.max(0, pos), g);
    historia.pausa = false;
    canvas.setActiveObject(g);
    registrar();
  },
  desagrupar() {
    const g = canvas.getActiveObject();
    if (!(g instanceof F.Group) || g instanceof F.ActiveSelection) return;
    const pos = canvas.getObjects().indexOf(g);
    canvas.discardActiveObject();
    historia.pausa = true;
    const objs = g.removeAll();
    canvas.remove(g);
    canvas.insertAt(pos, ...objs);
    historia.pausa = false;
    reseleccionar(objs);
    registrar();
  },
  bloquear() {
    const objs = activos(); if (!objs.length) return;
    const valor = !objs.every(o => o.bloqueado);
    objs.forEach(o => ponerBloqueo(o, valor));
    registrar();
  },
  voltearH() { activos().forEach(o => o.set('flipX', !o.flipX)); canvas.requestRenderAll(); registrar(); },
  voltearV() { activos().forEach(o => o.set('flipY', !o.flipY)); canvas.requestRenderAll(); registrar(); },
};
function ponerBloqueo(o, valor) {
  o.set({ bloqueado: valor, lockMovementX: valor, lockMovementY: valor, lockScalingX: valor, lockScalingY: valor,
          lockRotation: valor, hasControls: !valor });
  canvas.requestRenderAll();
}
$$('[data-accion]').forEach(b => b.addEventListener('click', () => { cerrarMenu(); ACCIONES[b.dataset.accion](); }));

function alinear(modo) {
  const objs = activos(); if (!objs.length) return;
  canvas.discardActiveObject();
  const cajas = objs.map(o => o.getBoundingRect());
  const ref = objs.length === 1 ? { left: 0, top: 0, width: doc.w, height: doc.h } : unirCajas(cajas);
  objs.forEach((o, i) => {
    if (o.bloqueado) return;
    const b = cajas[i];
    const dx = { izq: ref.left - b.left, ch: ref.left + ref.width / 2 - (b.left + b.width / 2), der: ref.left + ref.width - (b.left + b.width) }[modo] || 0;
    const dy = { arr: ref.top - b.top, cv: ref.top + ref.height / 2 - (b.top + b.height / 2), aba: ref.top + ref.height - (b.top + b.height) }[modo] || 0;
    o.set({ left: o.left + dx, top: o.top + dy }); o.setCoords();
  });
  reseleccionar(objs);
  registrar();
}
function unirCajas(cajas) {
  const l = Math.min(...cajas.map(c => c.left)), t = Math.min(...cajas.map(c => c.top));
  const r = Math.max(...cajas.map(c => c.left + c.width)), b = Math.max(...cajas.map(c => c.top + c.height));
  return { left: l, top: t, width: r - l, height: b - t };
}
function distribuir(eje) {
  const objs = activos(); if (objs.length < 3) return ponerEstado('Para repartir, selecciona 3 elementos o más.');
  canvas.discardActiveObject();
  const [pos, tam] = eje === 'h' ? ['left', 'width'] : ['top', 'height'];
  const items = objs.map(o => ({ o, b: o.getBoundingRect() })).sort((a, b) => a.b[pos] - b.b[pos]);
  const inicio = items[0].b[pos], fin = Math.max(...items.map(i => i.b[pos] + i.b[tam]));
  const hueco = (fin - inicio - items.reduce((s, i) => s + i.b[tam], 0)) / (items.length - 1);
  let cursor = inicio;
  for (const { o, b } of items) {
    if (!o.bloqueado) { o.set(pos, o[pos] + cursor - b[pos]); o.setCoords(); }
    cursor += b[tam] + hueco;
  }
  reseleccionar(objs);
  registrar();
}
$$('[data-alinear]').forEach(b => b.onclick = () => alinear(b.dataset.alinear));
$$('[data-distribuir]').forEach(b => b.onclick = () => distribuir(b.dataset.distribuir));

$('#bRejilla').onclick = () => { rejilla = !rejilla; $('#bRejilla').classList.toggle('activo', rejilla); canvas.requestRenderAll(); };
$('#bIman').onclick = () => { iman = !iman; $('#bIman').classList.toggle('activo', iman); };

// ---------- Menú contextual ----------
function abrirMenu(opt) {
  if (opt.target && !activos().includes(opt.target)) canvas.setActiveObject(opt.target);
  canvas.requestRenderAll();
  const m = $('#menu'), hay = activos().length > 0;
  m.querySelectorAll('[data-accion]').forEach(b => b.disabled = b.dataset.accion === 'pegar' ? !portapapeles : !hay);
  m.hidden = false;
  const x = Math.min(opt.e.clientX, innerWidth - m.offsetWidth - 8), y = Math.min(opt.e.clientY, innerHeight - m.offsetHeight - 8);
  m.style.left = x + 'px'; m.style.top = y + 'px';
}
function cerrarMenu() { $('#menu').hidden = true; }
document.addEventListener('pointerdown', e => { if (!$('#menu').contains(e.target)) cerrarMenu(); });

// ---------- Teclado y portapapeles del sistema ----------
const escribiendo = e => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
document.addEventListener('keydown', e => {
  if (escribiendo(e) || document.querySelector('dialog[open]')) return;
  const ctrl = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  const hacer = f => { e.preventDefault(); f(); };
  if (e.key === ' ' && !espacio) { espacio = true; aplicarModoMano(); return e.preventDefault(); }
  if (ctrl && k === 'z') return hacer(e.shiftKey ? rehacer : deshacer);
  if (ctrl && k === 'y') return hacer(rehacer);
  if (ctrl && k === 'd') return hacer(ACCIONES.duplicar);
  if (ctrl && k === 'g') return hacer(e.shiftKey ? ACCIONES.desagrupar : ACCIONES.agrupar);
  if (ctrl && k === 'a') return hacer(() => reseleccionar(canvas.getObjects().filter(o => o.visible)));
  if (ctrl && (e.key === ']' || e.code === 'BracketRight')) return hacer(e.shiftKey ? ACCIONES.frente : ACCIONES.adelante);
  if (ctrl && (e.key === '[' || e.code === 'BracketLeft')) return hacer(e.shiftKey ? ACCIONES.fondo : ACCIONES.atras);
  if (ctrl && (k === '0' || k === '1')) return hacer(ajustarVista);
  if (ctrl && (k === '+' || k === '=')) return hacer(() => zoomEn(centroMesa(), canvas.getZoom() * 1.25));
  if (ctrl && k === '-') return hacer(() => zoomEn(centroMesa(), canvas.getZoom() / 1.25));
  if (ctrl) return;
  if (e.key === 'Delete' || e.key === 'Backspace') return hacer(ACCIONES.borrar);
  if (e.key === 'Escape') { canvas.discardActiveObject(); canvas.requestRenderAll(); return cerrarMenu(); }
  const flechas = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
  if (flechas && activos().length) {
    const paso = e.shiftKey ? 10 : 1, o = canvas.getActiveObject();
    if (o.lockMovementX) return;
    o.set({ left: o.left + flechas[0] * paso, top: o.top + flechas[1] * paso }); o.setCoords();
    canvas.requestRenderAll();
    return hacer(registrarLuego);
  }
  const atajo = { v: () => ponerHerramienta('seleccion'), h: () => ponerHerramienta('mano'),
    t: () => colocar(CREAR.texto()), r: () => colocar(CREAR.rect()), e: () => colocar(CREAR.elipse()), l: () => colocar(CREAR.linea()) }[k];
  if (atajo) hacer(atajo);
});
document.addEventListener('keyup', e => { if (e.key === ' ') { espacio = false; aplicarModoMano(); } });
let tFlechas = null;
function registrarLuego() { clearTimeout(tFlechas); tFlechas = setTimeout(registrar, 400); refrescarPanel(); }

const editandoTexto = () => canvas.getActiveObject()?.isEditing;
document.addEventListener('copy', e => {
  if (escribiendo(e) || editandoTexto() || !activos().length) return;
  e.preventDefault(); e.clipboardData.setData('text/plain', MARCA); copiar();
});
document.addEventListener('cut', e => {
  if (escribiendo(e) || editandoTexto() || !activos().length) return;
  e.preventDefault(); e.clipboardData.setData('text/plain', MARCA); copiar().then(ACCIONES.borrar);
});
document.addEventListener('paste', e => {
  if (escribiendo(e) || editandoTexto() || document.querySelector('dialog[open]')) return;
  const archivos = [...e.clipboardData.files];
  e.preventDefault();
  if (archivos.length) return importarArchivos(archivos);
  const texto = e.clipboardData.getData('text/plain');
  if (texto === MARCA || (!texto && portapapeles)) return pegar();
  if (texto.trim()) { const t = CREAR.texto(); t.set('text', texto.slice(0, 5000)); colocar(t); }
});

// ---------- Panel de propiedades ----------
const esTexto = o => o instanceof F.IText;
const aHex = c => {
  if (!c || typeof c !== 'string') return '#000000';
  try { return '#' + new F.Color(c).toHex().slice(0, 6); } catch { return '#000000'; }
};
function refrescarTodo() { refrescarPanel(); refrescarCapas(); $('#nombreDoc').value = doc.nombre; $('#infoDoc').textContent = `${doc.w} × ${doc.h} px`; }

function refrescarPanel() {
  const objs = activos(), o = canvas.getActiveObject();
  $('#pObjeto').hidden = !o; $('#pOrganizar').hidden = !o; $('#pDoc').hidden = !!o;
  $('#dAncho').value = doc.w; $('#dAlto').value = doc.h;
  $('#dFondo').value = aHex(doc.fondo || '#ffffff'); $('#dTransp').checked = !doc.fondo;
  if (!o) return;
  const varios = objs.length > 1;
  $('#tObjeto').textContent = varios ? `${objs.length} elementos` : (o.nombre || NOMBRES_TIPO[o.type] || 'Elemento');
  $('#notaAlinear').textContent = varios ? 'Se alinean entre ellos.' : 'Se alinea con la página.';
  $('#pOrganizar [data-accion=bloquear]').textContent = objs.every(x => x.bloqueado) ? 'Desbloquear' : 'Bloquear';
  $('#oX').value = Math.round(o.left); $('#oY').value = Math.round(o.top);
  $('#oAn').value = Math.round(o.getScaledWidth()); $('#oAl').value = Math.round(o.getScaledHeight());
  $('#oGiro').value = Math.round(o.angle || 0);

  const unico = !varios ? o : null;
  $('#gTexto').hidden = !(unico && esTexto(unico));
  if (unico && esTexto(unico)) {
    $('#tFuente').value = unico.fontFamily; $('#tTam').value = Math.round(unico.fontSize);
    $('#tNegrita').classList.toggle('activo', unico.fontWeight === 'bold' || unico.fontWeight >= 600);
    $('#tCursiva').classList.toggle('activo', unico.fontStyle === 'italic');
    $('#tSubr').classList.toggle('activo', !!unico.underline);
    $('#tAlinear').value = unico.textAlign; $('#tInter').value = unico.lineHeight; $('#tEsp').value = unico.charSpacing;
  }
  const conRelleno = unico && !(unico instanceof F.Line) && !(unico instanceof F.FabricImage) && !(unico instanceof F.Group);
  $('#gRelleno').hidden = !conRelleno;
  if (conRelleno) {
    const f = unico.fill;
    const tipo = !f ? 'ninguno' : f instanceof F.Gradient ? 'degradado' : 'solido';
    $('#oTipoRelleno').value = tipo;
    $('#oRelleno').value = tipo === 'degradado' ? aHex(f.colorStops[0].color) : aHex(f);
    $('#oRelleno2').value = tipo === 'degradado' ? aHex(f.colorStops[f.colorStops.length - 1].color) : '#ffffff';
    $('#oRelleno').hidden = tipo === 'ninguno';
    $('#oRelleno2').hidden = $('#oGradAng').hidden = tipo !== 'degradado';
    if (tipo === 'degradado') $('#oGradAng').value = Math.round(unico.anguloDegradado ?? 90);
  }
  const ref = unico || o;
  $('#oBorde').value = aHex(ref.stroke || '#000000'); $('#oGrosor').value = ref.strokeWidth || 0;
  $('#lRadio').hidden = !(unico instanceof F.Rect);
  if (unico instanceof F.Rect) $('#oRadio').value = Math.round(unico.rx || 0);
  $('#oOpac').value = Math.round((ref.opacity ?? 1) * 100);
  $('#oFusion').value = ref.globalCompositeOperation || 'source-over';
  const s = ref.shadow;
  $('#oSombra').checked = !!s;
  $('#oSombraCol').value = aHex(s?.color || '#000000');
  $('#oSombraBlur').value = s ? s.blur : 20; $('#oSombraDesp').value = s ? s.offsetY : 8;
}

// Aplica un cambio a la selección: "vivo" redibuja mientras arrastras; al soltar se apunta en el historial.
function enlazar(sel, aplicar, evento = 'input') {
  const el = $(sel);
  el.addEventListener(evento, () => { activos().forEach(o => aplicar(o, el)); canvas.requestRenderAll(); });
  el.addEventListener('change', () => { registrar(); });
}
enlazar('#oX', (o, el) => { o.set('left', +el.value); o.setCoords(); }, 'change');
enlazar('#oY', (o, el) => { o.set('top', +el.value); o.setCoords(); }, 'change');
enlazar('#oAn', (o, el) => { if (+el.value > 0) { o.set('scaleX', +el.value / o.width); o.setCoords(); } }, 'change');
enlazar('#oAl', (o, el) => { if (+el.value > 0) { o.set('scaleY', +el.value / o.height); o.setCoords(); } }, 'change');
enlazar('#oGiro', (o, el) => { o.rotate(+el.value % 360); o.setCoords(); }, 'change');
enlazar('#oOpac', (o, el) => o.set('opacity', el.value / 100));
enlazar('#oFusion', (o, el) => o.set('globalCompositeOperation', el.value), 'change');
enlazar('#oBorde', (o, el) => { o.set('stroke', el.value); if (!o.strokeWidth) o.set('strokeWidth', 2); $('#oGrosor').value = o.strokeWidth; });
enlazar('#oGrosor', (o, el) => o.set('strokeWidth', Math.max(0, +el.value)));
enlazar('#oRadio', (o, el) => { if (o instanceof F.Rect) o.set({ rx: +el.value, ry: +el.value }); });

function aplicarRelleno(o) {
  const tipo = $('#oTipoRelleno').value, c1 = $('#oRelleno').value, c2 = $('#oRelleno2').value;
  if (tipo === 'ninguno') return o.set('fill', null);
  if (tipo === 'solido') return o.set('fill', c1);
  const ang = (+$('#oGradAng').value || 0) * Math.PI / 180, cx = Math.cos(ang) / 2, cy = Math.sin(ang) / 2;
  o.set({ anguloDegradado: +$('#oGradAng').value || 0, fill: new F.Gradient({
    type: 'linear', gradientUnits: 'percentage', coords: { x1: .5 - cx, y1: .5 - cy, x2: .5 + cx, y2: .5 + cy },
    colorStops: [{ offset: 0, color: c1 }, { offset: 1, color: c2 }] }) });
}
EXTRA.push('anguloDegradado');
['#oRelleno', '#oRelleno2', '#oGradAng'].forEach(s => enlazar(s, aplicarRelleno));
$('#oTipoRelleno').addEventListener('change', () => {
  if ($('#oTipoRelleno').value === 'degradado' && !$('#oGradAng').value) $('#oGradAng').value = 90;
  activos().forEach(aplicarRelleno); canvas.requestRenderAll(); registrar();
});

function aplicarSombra(o) {
  o.set('shadow', $('#oSombra').checked ? new F.Shadow({ color: $('#oSombraCol').value + '66',
    blur: +$('#oSombraBlur').value || 0, offsetX: 0, offsetY: +$('#oSombraDesp').value || 0 }) : null);
}
['#oSombraCol', '#oSombraBlur', '#oSombraDesp'].forEach(s => enlazar(s, o => { if ($('#oSombra').checked) aplicarSombra(o); }));
enlazar('#oSombra', aplicarSombra, 'change');

$('#fuentes').append(...FUENTES.map(f => Object.assign(document.createElement('option'), { value: f })));
const soloTexto = f => (o, el) => { if (esTexto(o)) f(o, el); };
enlazar('#tFuente', soloTexto((o, el) => o.set('fontFamily', el.value || 'system-ui')), 'change');
enlazar('#tTam', soloTexto((o, el) => +el.value > 0 && o.set('fontSize', +el.value)));
enlazar('#tAlinear', soloTexto((o, el) => o.set('textAlign', el.value)), 'change');
enlazar('#tInter', soloTexto((o, el) => +el.value > 0 && o.set('lineHeight', +el.value)));
enlazar('#tEsp', soloTexto((o, el) => o.set('charSpacing', +el.value)));
const alternar = (sel, f) => $(sel).onclick = () => { activos().filter(esTexto).forEach(f); canvas.requestRenderAll(); registrar(); };
alternar('#tNegrita', o => o.set('fontWeight', o.fontWeight === 'bold' ? 'normal' : 'bold'));
alternar('#tCursiva', o => o.set('fontStyle', o.fontStyle === 'italic' ? 'normal' : 'italic'));
alternar('#tSubr', o => o.set('underline', !o.underline));

// Documento: tamaño y fondo.
function cambiarDoc(cambios) { Object.assign(doc, cambios); canvas.requestRenderAll(); registrar(); }
$('#dAncho').onchange = e => +e.target.value > 0 && cambiarDoc({ w: Math.min(20000, +e.target.value) });
$('#dAlto').onchange = e => +e.target.value > 0 && cambiarDoc({ h: Math.min(20000, +e.target.value) });
$('#dFondo').oninput = e => { doc.fondo = e.target.value; $('#dTransp').checked = false; canvas.requestRenderAll(); };
$('#dFondo').onchange = () => registrar();
$('#dTransp').onchange = e => cambiarDoc({ fondo: e.target.checked ? null : $('#dFondo').value });
$('#nombreDoc').onchange = e => { doc.nombre = e.target.value.trim() || 'Sin título'; registrar(); };

canvas.on('selection:created', refrescarTodo);
canvas.on('selection:updated', refrescarTodo);
canvas.on('selection:cleared', refrescarTodo);
canvas.on('object:scaling', refrescarPanel);
canvas.on('object:rotating', refrescarPanel);
canvas.on('object:moving', refrescarPanel);

// ---------- Capas ----------
function refrescarCapas() {
  const lista = $('#capas'), sel = new Set(activos());
  const objs = canvas.getObjects().slice().reverse();
  $('#sinCapas').hidden = objs.length > 0;
  lista.replaceChildren(...objs.map(o => {
    const li = document.createElement('li');
    li.classList.toggle('sel', sel.has(o)); li.classList.toggle('oculta', !o.visible);
    const nom = Object.assign(document.createElement('span'), { className: 'nom', textContent: o.nombre || NOMBRES_TIPO[o.type] || o.type });
    nom.title = 'Doble clic para cambiar el nombre';
    const ojo = boton(o.visible ? 'i-ojo' : 'i-ojo-no', o.visible ? 'Ocultar' : 'Mostrar', !o.visible);
    const can = boton(o.bloqueado ? 'i-candado' : 'i-candado-no', o.bloqueado ? 'Desbloquear' : 'Bloquear', o.bloqueado);
    ojo.onclick = e => { e.stopPropagation(); o.set('visible', !o.visible); if (!o.visible) canvas.discardActiveObject(); canvas.requestRenderAll(); registrar(); };
    can.onclick = e => { e.stopPropagation(); ponerBloqueo(o, !o.bloqueado); registrar(); };
    li.onclick = e => {
      if (!o.visible) return;
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        const actual = activos(), siguiente = actual.includes(o) ? actual.filter(x => x !== o) : [...actual, o];
        reseleccionar(canvas.getObjects().filter(x => siguiente.includes(x)));
      } else reseleccionar([o]);
    };
    nom.ondblclick = () => {
      const n = prompt('Nombre de la capa', nom.textContent);
      if (n && n.trim()) { o.set('nombre', n.trim().slice(0, 60)); registrar(); }
    };
    li.append(nom, ojo, can);
    return li;
  }));
}
function boton(icono, titulo, on) {
  const b = document.createElement('button');
  b.title = titulo; b.classList.toggle('on', !!on);
  b.innerHTML = `<svg><use href="#${icono}"/></svg>`;
  return b;
}

// ---------- Panel en tablet / móvil ----------
const panel = $('#panel');
function cerrarPanel() { panel.classList.remove('abierto'); }
$('#bPanel').onclick = () => panel.classList.toggle('abierto');

// ---------- Nuevo, mis diseños y abrir archivo ----------
let formatoElegido = null;
$('#formatos').append(...FORMATOS.map(f => {
  const b = document.createElement('button');
  b.type = 'button';
  b.innerHTML = `<span>${f.n}</span><small>${f.w} × ${f.h} px</small>`;
  b.onclick = () => { $$('#formatos button').forEach(x => x.classList.toggle('activo', x === b)); $('#nAncho').value = f.w; $('#nAlto').value = f.h; formatoElegido = f; };
  return b;
}));
$('#bNuevo').onclick = () => $('#dNuevo').showModal();
$('#dNuevo').addEventListener('close', async () => {
  if ($('#dNuevo').returnValue !== 'crear') return;
  const w = Math.min(20000, Math.max(1, +$('#nAncho').value || 1080)), h = Math.min(20000, Math.max(1, +$('#nAlto').value || 1080));
  await guardarYa();
  doc = { id: nuevoId(), nombre: formatoElegido ? formatoElegido.n : 'Sin título', w, h, fondo: '#ffffff' };
  await cargarEstado({ doc, objetos: [] });
  reiniciarHistoria();
  guardarYa();
});

$('#bMisDisenos').onclick = async () => {
  await guardarYa();
  const lista = (await Almacen.listar()).sort((a, b) => b.actualizado - a.actualizado);
  $('#galeria').replaceChildren(...lista.map(p => {
    const b = document.createElement('button');
    b.type = 'button'; b.classList.toggle('actual', p.id === doc.id);
    const img = Object.assign(document.createElement('img'), { src: p.miniatura || '', alt: '' });
    const n = Object.assign(document.createElement('span'), { textContent: p.nombre || 'Sin título' });
    const f = Object.assign(document.createElement('small'), { textContent: new Date(p.actualizado).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) });
    b.append(img, n, f);
    b.onclick = async () => { $('#dMis').close(); await abrirGuardado(p.id); };
    return b;
  }));
  if (!lista.length) $('#galeria').textContent = 'Todavía no hay diseños guardados.';
  $('#dMis').showModal();
};
async function abrirGuardado(id) {
  const p = await Almacen.leer(id);
  if (!p) return false;
  await cargarEstado(p.datos);
  reiniciarHistoria();
  Almacen.recordarUltimo(id);
  return true;
}
$('#bAbrirArchivo').onclick = () => $('#fProyecto').click();
$('#fProyecto').onchange = async e => { const a = e.target.files[0]; e.target.value = ''; if (a) { $('#dMis').close(); await abrirProyecto(a); } };
async function abrirProyecto(archivo) {
  try {
    const datos = JSON.parse(await leer(archivo, 'texto'));
    if (datos.formato !== 'casadrew' || !datos.doc) throw new Error('no es un proyecto de CASADREW');
    await guardarYa();
    datos.doc.id = datos.doc.id || nuevoId();
    await cargarEstado(datos);
    reiniciarHistoria();
    guardarYa();
  } catch (err) {
    ponerEstado(`No se pudo abrir «${archivo.name}»: ${err.message}`);
  }
}

// ---------- Arranque ----------
(async () => {
  medirMesa();
  const id = Almacen.ultimo();
  let abierto = false;
  try { abierto = id && await abrirGuardado(id); } catch { abierto = false; }
  if (!abierto) {
    await cargarEstado({ doc, objetos: [] });
    reiniciarHistoria();
    $('#dNuevo').showModal();
  }
  ajustarVista();
  ponerEstado(abierto ? 'Diseño recuperado' : 'Listo');
})();
