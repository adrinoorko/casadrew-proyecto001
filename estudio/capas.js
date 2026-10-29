// CASADREW · Estudio — panel de capas visual.
// Arriba está lo que se ve delante; abajo, lo de detrás (el mismo orden en que se dibuja el lienzo).
// Cada capa lleva su miniatura, opacidad, ojo, candado y un asa para arrastrarla a otra altura.
'use strict';

const miniCapas = new WeakMap();
const gruposAbiertos = new WeakSet();
let capaResaltada = null;

function firmaCapa(o) {
  return [o.fill?.toString?.() ?? o.fill, o.stroke, o.strokeWidth, o.opacity, o.angle, o.flipX, o.flipY, o.width, o.height, o.scaleX, o.scaleY,
    o.text, o.fontFamily, o.fontWeight, o.imgRef, o.cropX, o.cropY, o._objects?.length, historia.pos].join('|');
}
function miniaturaCapa(o) {
  const firma = firmaCapa(o), guardada = miniCapas.get(o);
  if (guardada && (guardada.firma === firma || (o.trazo && guardada.url))) return guardada.url;
  let url = '';
  try {
    const visible = o.visible, opac = o.opacity;
    o.visible = true; o.opacity = 1;
    const lado = Math.max(o.getScaledWidth(), o.getScaledHeight(), 1);
    url = o.toCanvasElement({ multiplier: Math.min(4, 64 / lado), withoutShadow: true }).toDataURL();
    o.visible = visible; o.opacity = opac;
  } catch { url = ''; }
  miniCapas.set(o, { firma, url });
  return url;
}

const nombreCapa = o => o.nombre || NOMBRES_TIPO[o.type] || o.type;
const ICONO = (id) => `<svg><use href="#${id}"/></svg>`;

refrescarCapas = function () {
  const lista = $('#capas'), sel = new Set(activos());
  const objs = canvas.getObjects().filter(o => !o.excludeFromExport).reverse();
  $('#sinCapas').hidden = objs.length > 0;
  $('#cuentaCapas').textContent = objs.length ? `· ${objs.length}` : '';
  $('#capasExtremos').hidden = $('#capasDetras').hidden = objs.length < 2;
  const filas = [];
  objs.forEach((o, i) => {
    filas.push(filaCapa(o, { profundidad: i, seleccionada: sel.has(o), unica: sel.size === 1 && sel.has(o) }));
    if (o instanceof F.Group && !(o instanceof F.ActiveSelection) && gruposAbiertos.has(o))
      o.getObjects().slice().reverse().forEach(h => filas.push(filaCapa(h, { hija: true, padre: o })));
  });
  lista.replaceChildren(...filas);
};

function filaCapa(o, { profundidad = 0, seleccionada = false, unica = false, hija = false, padre = null }) {
  const li = document.createElement('li');
  li.className = 'capa' + (seleccionada ? ' sel' : '') + (o.visible ? '' : ' oculta') + (o.bloqueado ? ' bloq' : '') + (hija ? ' hija' : '');
  li.style.setProperty('--prof', profundidad);
  const opac = Math.round((o.opacity ?? 1) * 100);
  const esGrupo = o instanceof F.Group && !(o instanceof F.ActiveSelection);
  li.innerHTML = `
    ${hija ? '<span class="sangria"></span>' : '<span class="asa" title="Arrastra arriba o abajo para cambiar qué queda delante">⋮⋮</span>'}
    ${esGrupo ? `<button class="abrir-grupo" title="${gruposAbiertos.has(o) ? 'Cerrar el grupo' : 'Ver lo que hay dentro del grupo'}">${gruposAbiertos.has(o) ? '▾' : '▸'}</button>` : ''}
    <img class="mini-capa" alt="">
    <span class="nom"></span>
    ${opac < 100 ? `<span class="pct" title="Opacidad: ${opac} %">${opac}%</span>` : ''}
    <button class="ojo ${o.visible ? '' : 'on'}" title="${o.visible ? 'Ocultar' : 'Mostrar'}">${ICONO(o.visible ? 'i-ojo' : 'i-ojo-no')}</button>
    ${hija ? '' : `<button class="candado ${o.bloqueado ? 'on' : ''}" title="${o.bloqueado ? 'Desbloquear' : 'Bloquear (no se podrá mover)'}">${ICONO(o.bloqueado ? 'i-candado' : 'i-candado-no')}</button>`}`;
  li.querySelector('.mini-capa').src = miniaturaCapa(o);
  const nom = li.querySelector('.nom');
  nom.textContent = nombreCapa(o);
  nom.dataset.tip = 'Doble clic para cambiar el nombre';

  li.querySelector('.ojo').onclick = e => {
    e.stopPropagation();
    o.set('visible', !o.visible);
    if (padre) padre.set('dirty', true);
    if (!o.visible && activos().includes(o)) canvas.discardActiveObject();
    canvas.requestRenderAll(); registrar();
  };
  li.querySelector('.candado')?.addEventListener('click', e => { e.stopPropagation(); ponerBloqueo(o, !o.bloqueado); registrar(); });
  li.querySelector('.abrir-grupo')?.addEventListener('click', e => { e.stopPropagation(); gruposAbiertos.has(o) ? gruposAbiertos.delete(o) : gruposAbiertos.add(o); refrescarCapas(); });
  li.onclick = e => {
    if (hija) return reseleccionar([padre]);
    if (!o.visible) return;
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      const actual = activos(), siguiente = actual.includes(o) ? actual.filter(x => x !== o) : [...actual, o];
      reseleccionar(canvas.getObjects().filter(x => siguiente.includes(x)));
    } else reseleccionar([o]);
  };
  nom.ondblclick = e => { e.stopPropagation(); renombrarCapa(o, nom); };
  li.onpointerenter = () => { capaResaltada = o; canvas.requestRenderAll(); };
  li.onpointerleave = () => { if (capaResaltada === o) { capaResaltada = null; canvas.requestRenderAll(); } };
  li.querySelector('.asa')?.addEventListener('pointerdown', e => arrastrarCapa(e, li, o));

  // La capa activa muestra su opacidad y acciones rápidas.
  if (unica) {
    const extra = document.createElement('div');
    extra.className = 'capa-extra';
    extra.innerHTML = `<label title="Opacidad: 0 % es invisible, 100 % es totalmente opaco">Opacidad <input type="range" min="0" max="100" value="${opac}"><output>${opac} %</output></label>
      <button data-a="duplicar" title="Duplicar esta capa">Duplicar</button><button data-a="borrar" class="peligro" title="Eliminar esta capa">Eliminar</button>`;
    const r = extra.querySelector('input'), out = extra.querySelector('output');
    r.oninput = () => { o.set('opacity', r.value / 100); out.textContent = r.value + ' %'; canvas.requestRenderAll(); };
    r.onchange = () => registrar();
    extra.querySelectorAll('[data-a]').forEach(b => b.onclick = ev => { ev.stopPropagation(); ACCIONES[b.dataset.a](); });
    extra.onclick = ev => ev.stopPropagation();
    li.append(extra);
  }
  return li;
}

function renombrarCapa(o, nom) {
  const input = Object.assign(document.createElement('input'), { value: nombreCapa(o), className: 'renombrar', maxLength: 60 });
  nom.replaceWith(input);
  input.focus(); input.select();
  const fin = guardar => {
    if (guardar && input.value.trim()) o.set('nombre', input.value.trim());
    if (guardar) registrar(); else refrescarCapas();

// El panel de capas se puede hacer más alto o más bajo arrastrando su borde superior (se recuerda).
(() => {
  const dock = $('#dockCapas'), panel = $('#panel');
  const guardado = Comun.leer('casadrew_panel', {}).altoCapas;
  if (guardado) dock.style.setProperty('--alto-capas', guardado + 'px');
  $('#asaDock').addEventListener('pointerdown', e => {
    e.preventDefault();
    const y0 = e.clientY, h0 = dock.offsetHeight, max = panel.clientHeight - 100;
    const mover = ev => dock.style.setProperty('--alto-capas', Math.max(120, Math.min(max, h0 + y0 - ev.clientY)) + 'px');
    const fin = () => {
      removeEventListener('pointermove', mover); removeEventListener('pointerup', fin);
      Comun.escribir('casadrew_panel', { ...Comun.leer('casadrew_panel', {}), altoCapas: dock.offsetHeight });
    };
    addEventListener('pointermove', mover); addEventListener('pointerup', fin);
  });
})();
  };
  input.onkeydown = e => { if (e.key === 'Enter') fin(true); if (e.key === 'Escape') fin(false); e.stopPropagation(); };
  input.onblur = () => fin(true);
  input.onclick = e => e.stopPropagation();
}

// Arrastrar una capa (ratón, dedo o lápiz) para cambiar su altura en la pila.
function arrastrarCapa(e, li, o) {
  e.preventDefault(); e.stopPropagation();
  const lista = $('#capas'), filas = [...lista.querySelectorAll(':scope > li.capa:not(.hija)')];
  const inicio = filas.indexOf(li);
  const linea = document.createElement('div'); linea.className = 'linea-soltar';
  lista.append(linea);
  li.classList.add('arrastrando');
  let destino = inicio;
  const mover = ev => {
    const y = ev.clientY;
    destino = filas.length - 1;
    for (let i = 0; i < filas.length; i++) {
      const r = filas[i].getBoundingClientRect();
      if (y < r.top + r.height / 2) { destino = i; break; }
    }
    const ref = filas[destino].getBoundingClientRect(), base = lista.getBoundingClientRect();
    const despues = y > filas[filas.length - 1].getBoundingClientRect().top + filas[filas.length - 1].offsetHeight / 2;
    if (despues) destino = filas.length;
    linea.style.top = ((despues ? filas[filas.length - 1].getBoundingClientRect().bottom : ref.top) - base.top + lista.scrollTop - 1) + 'px';
  };
  const soltar = () => {
    removeEventListener('pointermove', mover); removeEventListener('pointerup', soltar); removeEventListener('pointercancel', soltar);
    linea.remove(); li.classList.remove('arrastrando');
    let fila = destino > inicio ? destino - 1 : destino;
    if (fila === inicio) return;
    // La fila 0 es la de delante: en el lienzo es el índice más alto.
    canvas.moveObjectTo(o, canvas.getObjects().length - 1 - fila);
    canvas.requestRenderAll();
    registrar();
  };
  addEventListener('pointermove', mover); addEventListener('pointerup', soltar); addEventListener('pointercancel', soltar);
}

// Al pasar por una capa, el lienzo marca dónde está ese elemento.
canvas.on('after:render', ({ ctx }) => {
  if (!capaResaltada || exportando || !canvas.getObjects().includes(capaResaltada)) return;
  const v = canvas.viewportTransform, b = capaResaltada.getBoundingRect();
  ctx.save();
  ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--acento').trim() || '#c8643b';
  ctx.lineWidth = 2 / v[0]; ctx.setLineDash([6 / v[0], 4 / v[0]]);
  ctx.strokeRect(b.left, b.top, b.width, b.height);
  ctx.restore();
});
refrescarCapas();
