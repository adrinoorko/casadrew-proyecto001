// CASADREW · Estudio — pantalla de inicio: proyectos, plantillas, QR, usuarios y ajustes.
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const el = (tag, props = {}, ...hijos) => { const e = Object.assign(document.createElement(tag), props); e.append(...hijos); return e; };
const icono = id => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.innerHTML = `<use href="#${id}"/>`; return s; };
const fecha = t => new Date(t).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ---------- Navegación ----------
const VISTAS = ['inicio', 'proyectos', 'plantillas', 'elementos', 'qr', 'usuarios', 'ajustes'];
const PINTAR = {};
function ir() {
  const [vista, extra] = (location.hash.slice(1) || 'inicio').split('/');
  const v = VISTAS.includes(vista) ? vista : 'inicio';
  $$('[data-vista]').forEach(s => s.hidden = s.dataset.vista !== v);
  $$('#nav a').forEach(a => a.classList.toggle('activo', a.getAttribute('href') === '#' + v));
  $('#contenido').scrollTop = 0;
  PINTAR[v]?.(extra);
}
addEventListener('hashchange', ir);

// ---------- Perfil ----------
function pintarPerfil() {
  const p = Comun.perfilActual();
  $('#perfilColor').style.background = p.color; $('#perfilColor').textContent = p.nombre[0].toUpperCase();
  $('#perfilNombre').textContent = p.nombre;
  $('#saludo').textContent = `Hola, ${p.nombre}`;
}
$('#bPerfil').onclick = () => { location.hash = 'usuarios'; };

// ---------- Crear diseño ----------
const FORMATOS = [
  { n: 'Instagram', d: 'Publicación', w: 1080, h: 1080, c1: '#ff8a3d', c2: '#ff3d7f' },
  { n: 'Historia', d: 'Reel / story', w: 1080, h: 1920, c1: '#7b5cd6', c2: '#ff3d7f' },
  { n: 'Presentación', d: '16:9', w: 1920, h: 1080, c1: '#2f7fe0', c2: '#7b5cd6' },
  { n: 'A4', d: 'Vertical', w: 2480, h: 3508, c1: '#1f9e74', c2: '#2f7fe0', mm: [210, 297] },
  { n: 'A4', d: 'Horizontal', w: 3508, h: 2480, c1: '#1f9e74', c2: '#c99a2e', mm: [297, 210] },
  { n: 'A3', d: 'Vertical', w: 3508, h: 4961, c1: '#c8643b', c2: '#c99a2e', mm: [297, 420] },
  { n: 'Carta', d: 'Letter', w: 2550, h: 3300, c1: '#5f6672', c2: '#2b579a', mm: [215.9, 279.4] },
  { n: 'Legal', d: 'Legal', w: 2550, h: 4200, c1: '#5f6672', c2: '#1f2328', mm: [215.9, 355.6] },
  { n: 'Postal', d: '10 × 15 cm', w: 1772, h: 1181, c1: '#e8577a', c2: '#ffb36b', mm: [150, 100] },
  { n: 'Facebook', d: 'Enlace', w: 1200, h: 630, c1: '#2f7fe0', c2: '#3fa4ff' },
  { n: 'Banner web', d: 'Cabecera', w: 1920, h: 600, c1: '#3d8bff', c2: '#1f9e74' },
  { n: 'Ilustración', d: 'Cuadrado grande', w: 2048, h: 2048, c1: '#7b5cd6', c2: '#e86fa3' },
];
const forma = (f, max) => {
  const k = max / Math.max(f.w, f.h);
  const i = el('i'); i.style.width = Math.round(f.w * k) + 'px'; i.style.height = Math.round(f.h * k) + 'px';
  i.style.setProperty('--c1', f.c1); i.style.setProperty('--c2', f.c2);
  return el('span', { className: 'forma' }, i);
};
function abrirEditor(params) { location.href = 'editor.html?' + new URLSearchParams(params); }
function crear(w, h, nombre, transparente = false) { abrirEditor({ nuevo: 1, w: Math.round(w), h: Math.round(h), nombre, ...(transparente ? { transp: 1 } : {}) }); }

$('#formatosRapidos').append(
  ...FORMATOS.slice(0, 7).map(f => {
    const b = el('button', { className: 'formato-rapido', title: `${f.n} ${f.d}: ${f.w} × ${f.h} px` }, forma(f, 58), el('span', { textContent: f.n }), el('small', { textContent: f.d }));
    b.onclick = () => crear(f.w, f.h, `${f.n} ${f.d}`.trim());
    return b;
  }),
  (() => { const b = el('button', { className: 'formato-rapido', title: 'Elegir tamaño, medidas y resolución' }, forma({ w: 1, h: 1, c1: '#d8d2c8', c2: '#a89c8f' }, 46), el('span', { textContent: 'Personalizado' }), el('small', { textContent: 'px, mm, cm' })); b.onclick = abrirCrear; return b; })(),
);

// Ventana "Nuevo diseño" con unidades reales y explicación de equivalencias.
let unidad = 'px', formatoCrear = null;
const PULGADA = { mm: 25.4, cm: 2.54, in: 1 };
const aPx = (v, ud, ppp) => ud === 'px' ? v : v / PULGADA[ud] * ppp;
const dePx = (px, ud, ppp) => ud === 'px' ? px : px / ppp * PULGADA[ud];
const redondear = (v, ud) => ud === 'px' ? Math.round(v) : Math.round(v * 10) / 10;
function abrirCrear() { formatoCrear = null; $$('#formatosCrear button').forEach(b => b.classList.remove('activo')); equivalencia(); $('#dCrear').showModal(); }
$('#bCrear').onclick = abrirCrear;
$('#formatosCrear').append(...FORMATOS.map(f => {
  const b = el('button', { type: 'button' }, forma(f, 42), el('span', { textContent: `${f.n} · ${f.d}` }), el('small', { textContent: f.mm ? `${f.mm[0]} × ${f.mm[1]} mm` : `${f.w} × ${f.h} px` }));
  b.onclick = () => {
    $$('#formatosCrear button').forEach(x => x.classList.toggle('activo', x === b));
    formatoCrear = f;
    // Los formatos de papel se guardan en mm (tamaño real); los de pantalla, en px.
    const ppp = +$('#cPpp').value;
    const [w, h] = f.mm ? f.mm.map(mm => aPx(mm, 'mm', ppp)) : [f.w, f.h];
    $('#cAncho').value = redondear(dePx(w, unidad, ppp), unidad);
    $('#cAlto').value = redondear(dePx(h, unidad, ppp), unidad);
    equivalencia();
  };
  return b;
}));
$$('#unidades [data-ud]').forEach(b => b.onclick = () => {
  const ppp = +$('#cPpp').value, w = aPx(+$('#cAncho').value, unidad, ppp), h = aPx(+$('#cAlto').value, unidad, ppp);
  unidad = b.dataset.ud;
  $$('#unidades [data-ud]').forEach(x => x.classList.toggle('activo', x === b));
  $('#cUd').textContent = unidad;
  $('#cAncho').value = redondear(dePx(w, unidad, ppp), unidad); $('#cAlto').value = redondear(dePx(h, unidad, ppp), unidad);
  equivalencia();
});
['#cAncho', '#cAlto', '#cPpp'].forEach(s => $(s).addEventListener('input', equivalencia));
function equivalencia() {
  const ppp = +$('#cPpp').value, w = aPx(+$('#cAncho').value || 0, unidad, ppp), h = aPx(+$('#cAlto').value || 0, unidad, ppp);
  const cm = v => (v / ppp * 2.54).toLocaleString('es-ES', { maximumFractionDigits: 1 });
  $('#cEquivale').textContent = w && h ? `Serán ${Math.round(w)} × ${Math.round(h)} px. Impreso a ${ppp} ppp mide ${cm(w)} × ${cm(h)} cm.`
    + (w * h > 60e6 ? ' Es muy grande: el programa puede ir más lento.' : '') : '';
}
$('#dCrear').addEventListener('close', () => {
  if ($('#dCrear').returnValue !== 'crear') return;
  const ppp = +$('#cPpp').value, w = aPx(+$('#cAncho').value, unidad, ppp), h = aPx(+$('#cAlto').value, unidad, ppp);
  if (!(w >= 1 && h >= 1)) return;
  crear(Math.min(20000, w), Math.min(20000, h), formatoCrear ? `${formatoCrear.n} ${formatoCrear.d}` : 'Sin título', $('#cTransp').checked);
});

// ---------- Tarjetas de proyecto ----------
let proyectos = [];
async function cargarProyectos() { proyectos = (await Almacen.listar()).filter(Comun.esDelPerfil).sort((a, b) => b.actualizado - a.actualizado); }
function tarjetaProyecto(p) {
  const fav = el('button', { className: 'fav' + (p.favorito ? ' on' : ''), title: p.favorito ? 'Quitar de favoritos' : 'Marcar como favorito' }, icono('n-estrella'));
  fav.onclick = async e => { e.stopPropagation(); await Almacen.retocar(p.id, { favorito: !p.favorito }); await refrescarVista(); };
  const mas = el('button', { title: 'Más opciones' }, icono('n-puntos'));
  mas.onclick = e => { e.stopPropagation(); menuProyecto(p, e); };
  const t = el('div', { className: 'tarjeta-p', tabIndex: 0, title: 'Abrir ' + (p.nombre || 'Sin título') },
    el('div', { className: 'mini' }, el('img', { src: p.miniatura || '', alt: '', loading: 'lazy' })),
    el('div', { className: 'info' }, el('div', {}, el('b', { textContent: p.nombre || 'Sin título' }), el('small', { textContent: fecha(p.actualizado) })), el('span', { className: 'acciones' }, mas)),
    ...(p.eliminado ? [] : [fav]));
  t.onclick = () => p.eliminado ? menuProyecto(p) : abrirEditor({ id: p.id });
  t.onkeydown = e => { if (e.key === 'Enter') t.click(); };
  return t;
}
function menuProyecto(p, e) {
  const m = $('#menuTarjeta');
  const op = (texto, f, clase = '') => { const b = el('button', { textContent: texto, className: clase }); b.onclick = async () => { m.hidden = true; await f(); await refrescarVista(); }; return b; };
  m.replaceChildren(...(p.eliminado ? [
    op('Recuperar', () => Almacen.retocar(p.id, { eliminado: 0 })),
    op('Borrar para siempre', async () => { if (confirm(`¿Borrar «${p.nombre}» para siempre? No se podrá recuperar.`)) await Almacen.borrarDelTodo(p.id); }, 'peligro'),
  ] : [
    op('Abrir', () => abrirEditor({ id: p.id })),
    op('Cambiar nombre', () => renombrar(p)),
    op('Duplicar', async () => { const c = await Almacen.leer(p.id); c.id = nuevoId(); c.nombre += ' (copia)'; c.favorito = false; c.actualizado = Date.now(); if (c.datos?.doc) { c.datos.doc.id = c.id; c.datos.doc.nombre = c.nombre; } await Almacen.guardar(c); }),
    op(p.favorito ? 'Quitar de favoritos' : 'Añadir a favoritos', () => Almacen.retocar(p.id, { favorito: !p.favorito })),
    op('Mover a la papelera', () => Almacen.retocar(p.id, { eliminado: Date.now() }), 'peligro'),
  ]));
  m.hidden = false;
  const x = e ? e.clientX : innerWidth / 2, y = e ? e.clientY : innerHeight / 2;
  m.style.left = Math.min(x, innerWidth - m.offsetWidth - 8) + 'px'; m.style.top = Math.min(y, innerHeight - m.offsetHeight - 8) + 'px';
}
document.addEventListener('pointerdown', e => { if (!$('#menuTarjeta').contains(e.target)) $('#menuTarjeta').hidden = true; });
function renombrar(p) {
  return new Promise(ok => {
    $('#rNombre').value = p.nombre || '';
    $('#dRenombrar').onclose = async () => { const n = $('#rNombre').value.trim(); if ($('#dRenombrar').returnValue === 'ok' && n) await Almacen.retocar(p.id, { nombre: n.slice(0, 80) }); ok(); };
    $('#dRenombrar').showModal();
  });
}
function tarjetaPlantilla(p) {
  const cat = Plantillas.CATEGORIAS.find(c => c.id === p.cat);
  const t = el('div', { className: 'tarjeta-p', tabIndex: 0, title: `Abrir la plantilla «${p.n}» para editarla` },
    el('div', { className: 'mini' }, el('img', { src: Plantillas.miniatura(p.id), alt: '' })),
    el('div', { className: 'info' }, el('div', {}, el('b', { textContent: p.n }), el('small', { textContent: `${p.w} × ${p.h} px · ${p.tags.join(', ')}` }))),
    el('span', { className: 'etiqueta', textContent: cat.n, style: `background:${cat.color}` }));
  t.onclick = () => abrirEditor({ plantilla: p.id });
  t.onkeydown = e => { if (e.key === 'Enter') t.click(); };
  return t;
}

// ---------- Vistas ----------
const ICONO_CAT = { grafico: 'n-plantillas', moda: 'n-firma', ilustracion: 'n-estrella', web: 'n-proyectos', '3d': 'n-elementos' };
const DEGRADADO_CAT = { grafico: ['#ff8a3d', '#c8643b'], moda: ['#ff6fa8', '#d63d86'], ilustracion: ['#a58af0', '#7b5cd6'], web: ['#5aa7ff', '#2f7fe0'], '3d': ['#3ccf9a', '#1f9e74'] };
PINTAR.inicio = async () => {
  await cargarProyectos();
  const recientes = proyectos.filter(p => !p.eliminado).slice(0, 8);
  $('#bloqueRecientes').hidden = !recientes.length;
  $('#recientes').replaceChildren(...recientes.map(tarjetaProyecto));
  $('#recomendadas').replaceChildren(...['ig-coleccion', 'ficha-tecnica', 'moodboard', 'cv', 'web-landing', 'escena-producto', 'historia-frase', 'invitacion'].map(id => tarjetaPlantilla(Plantillas.porId(id))));
};
$('#categorias').append(...Plantillas.CATEGORIAS.map(c => {
  const b = el('button', { className: 'categoria', title: 'Ver plantillas de ' + c.n }, icono(ICONO_CAT[c.id]), el('span', { textContent: c.n }));
  b.style.setProperty('--c1', DEGRADADO_CAT[c.id][0]); b.style.setProperty('--c2', DEGRADADO_CAT[c.id][1]);
  b.onclick = () => { location.hash = 'plantillas/' + c.id; };
  return b;
}));

let filtroProyectos = 'todos';
PINTAR.proyectos = async () => {
  await cargarProyectos();
  const q = $('#buscar').value.trim().toLowerCase();
  const lista = proyectos.filter(p => (filtroProyectos === 'papelera' ? p.eliminado : !p.eliminado) && (filtroProyectos !== 'favoritos' || p.favorito)
    && (!q || (p.nombre || '').toLowerCase().includes(q)));
  $('#listaProyectos').replaceChildren(...lista.map(tarjetaProyecto));
  $('#sinProyectos').hidden = lista.length > 0;
  $('#sinProyectos').textContent = q ? 'Ningún diseño con ese nombre.' : filtroProyectos === 'papelera' ? 'La papelera está vacía.'
    : filtroProyectos === 'favoritos' ? 'Marca un diseño con la estrella para verlo aquí.' : 'Aún no tienes diseños. Pulsa «Crear diseño» para empezar.';
};
$$('#filtrosProyectos [data-filtro]').forEach(b => b.onclick = () => {
  filtroProyectos = b.dataset.filtro;
  $$('#filtrosProyectos [data-filtro]').forEach(x => x.classList.toggle('activo', x === b));
  PINTAR.proyectos();
});
$('#buscar').addEventListener('input', () => PINTAR.proyectos());
$('#bImportar').onclick = () => $('#fProyecto').click();
$('#fProyecto').onchange = async e => {
  const a = e.target.files[0]; e.target.value = '';
  if (!a) return;
  try {
    const datos = JSON.parse(await a.text());
    if (datos.formato !== 'casadrew' || !datos.doc) throw new Error('no es un proyecto de CASADREW');
    const id = nuevoId();
    datos.doc.id = id;
    await Almacen.guardar({ id, nombre: datos.doc.nombre || a.name.replace(/\.[^.]+$/, ''), actualizado: Date.now(), datos, miniatura: '', perfil: Comun.perfilActual().id });
    abrirEditor({ id });
  } catch (err) { alert(`No se pudo abrir «${a.name}»: ${err.message}`); }
};
async function refrescarVista() { ir(); }

let catPlantillas = '';
$('#filtrosPlantillas').append(...[{ id: '', n: 'Todas' }, ...Plantillas.CATEGORIAS].map(c => {
  const b = el('button', { className: 'chip', textContent: c.n }); b.dataset.cat = c.id;
  b.onclick = () => { location.hash = c.id ? 'plantillas/' + c.id : 'plantillas'; };
  return b;
}));
PINTAR.plantillas = cat => {
  catPlantillas = cat || '';
  $$('#filtrosPlantillas .chip').forEach(b => b.classList.toggle('activo', b.dataset.cat === catPlantillas));
  $('#listaPlantillas').replaceChildren(...Plantillas.LISTA.filter(p => !catPlantillas || p.cat === catPlantillas).map(tarjetaPlantilla));
};

// ---------- Generador de QR ----------
qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
const CAMPOS_QR = {
  url: [{ id: 'url', n: 'Dirección web', ph: 'https://thenoorko.com' }],
  texto: [{ id: 'texto', n: 'Texto', tipo: 'area', ph: 'Escribe el texto' }],
  wifi: [{ id: 'red', n: 'Nombre de la red (SSID)' }, { id: 'clave', n: 'Contraseña' }, { id: 'seg', n: 'Seguridad', tipo: 'select', ops: [['WPA', 'WPA/WPA2 (la habitual)'], ['WEP', 'WEP'], ['nopass', 'Sin contraseña']] }],
  email: [{ id: 'para', n: 'Correo', ph: 'hola@correo.com' }, { id: 'asunto', n: 'Asunto' }, { id: 'cuerpo', n: 'Mensaje', tipo: 'area' }],
  tel: [{ id: 'tel', n: 'Teléfono (con prefijo)', ph: '+34 600 000 000' }],
  whatsapp: [{ id: 'num', n: 'Número de WhatsApp (con prefijo)', ph: '+34 600 000 000' }, { id: 'msg', n: 'Mensaje inicial (opcional)', tipo: 'area' }],
};
let tipoQR = 'url';
function pintarCamposQR() {
  $('#qrCampos').replaceChildren(...CAMPOS_QR[tipoQR].map(c => {
    const control = c.tipo === 'area' ? el('textarea', { id: 'q_' + c.id, placeholder: c.ph || '' })
      : c.tipo === 'select' ? el('select', { id: 'q_' + c.id }, ...c.ops.map(([v, t]) => el('option', { value: v, textContent: t })))
      : el('input', { id: 'q_' + c.id, placeholder: c.ph || '' });
    control.addEventListener('input', generarQR);
    return el('label', { className: 'campo' }, c.n, control);
  }));
  generarQR();
}
$$('#qrTipos [data-tipo]').forEach(b => b.onclick = () => { tipoQR = b.dataset.tipo; $$('#qrTipos [data-tipo]').forEach(x => x.classList.toggle('activo', x === b)); pintarCamposQR(); });
const v = id => ($('#q_' + id)?.value || '').trim();
const escWifi = s => s.replace(/([\\;,:"])/g, '\\$1');
function contenidoQR() {
  switch (tipoQR) {
    case 'url': { const u = v('url'); return u && !/^[a-z]+:/i.test(u) ? 'https://' + u : u; }
    case 'texto': return v('texto');
    case 'wifi': return v('red') ? `WIFI:T:${v('seg')};S:${escWifi(v('red'))};${v('seg') === 'nopass' ? '' : `P:${escWifi(v('clave'))};`};` : '';
    case 'email': return v('para') ? `mailto:${v('para')}?` + new URLSearchParams({ subject: v('asunto'), body: v('cuerpo') }).toString().replace(/\+/g, '%20') : '';
    case 'tel': return v('tel') ? 'tel:' + v('tel').replace(/[^\d+]/g, '') : '';
    case 'whatsapp': { const n = v('num').replace(/\D/g, ''); return n ? `https://wa.me/${n}` + (v('msg') ? '?text=' + encodeURIComponent(v('msg')) : '') : ''; }
  }
  return '';
}
let qrActual = null;
function generarQR() {
  const texto = contenidoQR(), c = $('#qrLienzo'), x = c.getContext('2d');
  $('#qrMargenTxt').textContent = $('#qrMargen').value;
  x.clearRect(0, 0, c.width, c.height);
  qrActual = null;
  ['#qrPng', '#qrSvg', '#qrUsar'].forEach(s => $(s).disabled = true);
  if (!texto) { $('#qrEstado').className = 'qr-estado'; $('#qrEstado').textContent = 'Rellena los datos para ver tu código.'; return; }
  let q;
  try { q = qrcode(0, $('#qrNivel').value); q.addData(texto, 'Byte'); q.make(); }
  catch { $('#qrEstado').className = 'qr-estado mal'; $('#qrEstado').textContent = 'Es demasiado texto para un QR. Acórtalo.'; return; }
  const n = q.getModuleCount(), margen = +$('#qrMargen').value, tam = +$('#qrTam').value;
  const celda = Math.max(1, Math.floor(tam / (n + margen * 2))), lado = celda * (n + margen * 2);
  c.width = c.height = lado;
  if (!$('#qrTransp').checked) { x.fillStyle = $('#qrFondo').value; x.fillRect(0, 0, lado, lado); }
  x.fillStyle = $('#qrColor').value;
  for (let f = 0; f < n; f++) for (let k = 0; k < n; k++) if (q.isDark(f, k)) x.fillRect((k + margen) * celda, (f + margen) * celda, celda, celda);
  qrActual = { q, n, margen, celda, lado, texto };
  comprobarQR();
}
// Comprobación real: se vuelve a leer el código dibujado con un lector de QR.
function comprobarQR() {
  const { lado, texto } = qrActual, prueba = el('canvas', { width: lado, height: lado }), x = prueba.getContext('2d');
  x.fillStyle = $('#qrTransp').checked ? '#ffffff' : $('#qrFondo').value; x.fillRect(0, 0, lado, lado);
  x.drawImage($('#qrLienzo'), 0, 0);
  const datos = x.getImageData(0, 0, lado, lado), r = jsQR(datos.data, lado, lado);
  const bien = r && r.data === texto;
  $('#qrEstado').className = 'qr-estado ' + (bien ? 'ok' : 'mal');
  $('#qrEstado').textContent = bien ? `✓ Comprobado: se lee bien (${lado} × ${lado} px)` : '✗ No se lee bien: sube el contraste entre color y fondo o el margen.';
  ['#qrPng', '#qrSvg', '#qrUsar'].forEach(s => $(s).disabled = !bien);
}
function svgQR() {
  const { q, n, margen } = qrActual, t = n + margen * 2;
  let d = '';
  for (let f = 0; f < n; f++) for (let k = 0; k < n; k++) if (q.isDark(f, k)) d += `M${k + margen} ${f + margen}h1v1h-1z`;
  const fondo = $('#qrTransp').checked ? '' : `<rect width="${t}" height="${t}" fill="${$('#qrFondo').value}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${t}" width="${qrActual.lado}" height="${qrActual.lado}" shape-rendering="crispEdges">${fondo}<path d="${d}" fill="${$('#qrColor').value}"/></svg>`;
}
function bajar(nombre, url) { const a = el('a', { href: url, download: nombre }); document.body.append(a); a.click(); a.remove(); }
$('#qrPng').onclick = () => bajar('codigo-qr.png', $('#qrLienzo').toDataURL('image/png'));
$('#qrSvg').onclick = () => { const u = URL.createObjectURL(new Blob([svgQR()], { type: 'image/svg+xml' })); bajar('codigo-qr.svg', u); setTimeout(() => URL.revokeObjectURL(u), 5000); };
$('#qrUsar').onclick = () => {
  try { localStorage.setItem('casadrew_insertar', JSON.stringify({ svg: svgQR(), nombre: 'Código QR' })); } catch { return; }
  abrirEditor({});
};
['#qrColor', '#qrFondo', '#qrTransp', '#qrTam', '#qrMargen', '#qrNivel'].forEach(s => $(s).addEventListener('input', generarQR));
PINTAR.qr = () => { if (!$('#qrCampos').children.length) pintarCamposQR(); };

// ---------- Usuarios ----------
PINTAR.usuarios = async () => {
  const todos = await Almacen.listar();
  const actual = Comun.perfilActual();
  $('#listaPerfiles').replaceChildren(...Comun.perfiles.lista.map((p, i) => {
    const n = todos.filter(x => !x.eliminado && (x.perfil || Comun.perfiles.lista[0].id) === p.id).length;
    const ini = el('i', { textContent: p.nombre[0].toUpperCase() }); ini.style.background = p.color;
    const b = el('button', { className: 'tarjeta-perfil' + (p.id === actual.id ? ' activo' : ''), title: p.id === actual.id ? 'Perfil en uso' : 'Usar este perfil' },
      ini, el('b', { textContent: p.nombre }), el('small', { textContent: `${n} diseño${n === 1 ? '' : 's'}${i === 0 ? ' · principal' : ''}` }));
    b.onclick = () => { Comun.usarPerfil(p.id); pintarPerfil(); PINTAR.usuarios(); };
    return b;
  }));
};
$('#formPerfil').onsubmit = e => {
  e.preventDefault();
  const n = $('#nombrePerfil').value.trim();
  if (!n) return;
  Comun.usarPerfil(Comun.crearPerfil(n).id);
  $('#nombrePerfil').value = '';
  pintarPerfil(); PINTAR.usuarios();
};

// ---------- Ajustes ----------
const VISTA_TEMA = {
  cristal: ['linear-gradient(135deg,#ffd1e8,#c9d8ff,#d6f5e9)', 'rgba(255,255,255,.6)', '#7b5cd6'], vivo: ['linear-gradient(135deg,#fff1f7,#eef5ff)', '#ffffff', 'linear-gradient(135deg,#ff3d7f,#ff8a3d)'],
  minimal: ['#ffffff', '#f3f3f3', '#111111'], oficina: ['#f3f4f6', '#ffffff', '#2b579a'], arena: ['#f6f1ea', '#fffdf9', '#c8643b'], noche: ['#141210', '#1e1b18', '#e07a4f'],
  lavanda: ['#f3f0fa', '#fbfaff', '#7b5cd6'], menta: ['#eef7f3', '#fafffc', '#1f9e74'], coral: ['#fdf1ee', '#fffaf8', '#e0583f'], rosa: ['#fbf0f5', '#fffafc', '#d63d86'],
  oceano: ['#0f1a2a', '#15243a', '#3fa4ff'], grafito: ['#1b1b1d', '#232326', '#f2b33d'],
};
PINTAR.ajustes = async () => {
  $('#temas').replaceChildren(...Comun.TEMAS.map(t => {
    const [fondo, panel, acento] = VISTA_TEMA[t.id];
    const vista = el('span', { className: 'vista' }, el('i'), el('i'));
    vista.style.background = fondo;
    vista.children[0].style.background = panel; vista.children[1].style.background = `linear-gradient(${panel},${panel}) padding-box`;
    vista.children[1].style.border = `10px solid transparent`; vista.children[1].style.borderTopWidth = '28px';
    vista.children[1].style.backgroundImage = acento.includes('gradient') ? acento : `linear-gradient(${acento},${acento})`;
    vista.children[1].style.backgroundSize = '60% 14px'; vista.children[1].style.backgroundRepeat = 'no-repeat'; vista.children[1].style.backgroundColor = panel;
    const b = el('button', { className: 'tema' + (Comun.apariencia.tema === t.id ? ' activo' : ''), title: 'Usar el tema ' + t.n }, vista, el('b', { textContent: t.n }), el('small', { textContent: t.d }));
    b.onclick = () => { Comun.cambiarApariencia({ tema: t.id }); PINTAR.ajustes(); };
    return b;
  }));
  $('#acentos').replaceChildren(...Comun.ACENTOS.map(a => {
    const i = el('i'); i.style.background = a.c || 'conic-gradient(#c8643b,#d63d86,#7b5cd6,#2f7fe0,#1f9e74,#c8643b)';
    const b = el('button', { className: 'acento-b' + (Comun.apariencia.acento === a.c ? ' activo' : '') }, i, a.n);
    b.onclick = () => { Comun.cambiarApariencia({ acento: a.c }); PINTAR.ajustes(); };
    return b;
  }));
  try {
    const e = await navigator.storage.estimate();
    const mb = x => (x / 1048576).toLocaleString('es-ES', { maximumFractionDigits: 1 });
    $('#espacio').textContent = `Tus diseños e imágenes ocupan ${mb(e.usage)} MB en este aparato (hay sitio para unos ${Math.round(e.quota / 1073741824)} GB).`;
  } catch { $('#espacio').textContent = 'No se pudo calcular el espacio usado.'; }
};

pintarPerfil();
// ---------- Elementos ----------
let biblioInicio = null;
PINTAR.elementos = () => {
  if (biblioInicio) return;
  biblioInicio = Biblioteca.montar($('#biblioInicio'), { columnas: 'grande', porFila: 10, alElegir: e => {
    try { localStorage.setItem('casadrew_elemento_pendiente', e.id); } catch {}
    const ultimo = Almacen.ultimo();
    abrirEditor(ultimo ? { id: ultimo } : { nuevo: 1, w: 1080, h: 1080, nombre: 'Diseño con ' + e.n });
  } });
};

ir();
