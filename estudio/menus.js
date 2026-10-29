// CASADREW · Estudio — barra de menús con submenús y temas de color.
// Cada opción: { t: texto, k: atajo, f: acción, si: () => se puede usar, marca: () => está activada, sub: [...] }; '-' es una línea.
'use strict';

const { TEMAS, ACENTOS, apariencia, cambiarApariencia } = Comun;
document.addEventListener('casadrew:tema', () => canvas.requestRenderAll());

const haySel = () => activos().length > 0;
const hayVarios = () => activos().length > 1;
const hayTexto = () => activos().some(esTexto);
const esGrupo = () => { const o = canvas.getActiveObject(); return o instanceof F.Group && !(o instanceof F.ActiveSelection); };
const sobreTextos = f => () => { activos().filter(esTexto).forEach(f); canvas.requestRenderAll(); registrar(); };
const sobreSel = f => () => { activos().forEach(o => { f(o); o.setCoords(); }); canvas.requestRenderAll(); registrar(); };
const textoNuevo = (texto, tam, extra = {}) => () => {
  ponerHerramienta('seleccion');
  const t = CREAR.texto();
  t.set({ text: texto, fontSize: Math.round(Math.min(doc.w, doc.h) * tam), ...extra });
  colocar(t, texto);
};
const forma = clave => () => { ponerHerramienta('seleccion'); colocar(CREAR[clave]()); };
const exportarComo = (formato, escala = 1) => () => Exportar.avanzada({ formato, escala });
const tituloCaso = s => s.toLocaleLowerCase('es').replace(/(^|\s)\p{L}/gu, m => m.toLocaleUpperCase('es'));
const panelVisible = () => !$('#panel').classList.contains('oculto');

const MENUS = [
  { t: 'Archivo', sub: [
    { t: 'Nuevo diseño…', k: 'Ctrl+N', f: () => $('#bNuevo').click() },
    { t: 'Mis diseños…', k: 'Ctrl+O', f: () => $('#bMisDisenos').click() },
    { t: 'Abrir archivo .casadrew…', f: () => $('#fProyecto').click() },
    '-',
    { t: 'Importar imagen…', k: 'Ctrl+⇧+I', f: () => $('#fImagen').click() },
    { t: 'Exportación exprés', k: 'Ctrl+E', f: () => Exportar.expres('auto') },
    { t: 'Exprés para…', sub: Object.entries(Exportar.PRESETS).map(([id, p]) => ({ t: p.n, f: () => Exportar.expres(id) })) },
    { t: 'Exportación avanzada…', k: 'Ctrl+⇧+E', f: () => Exportar.avanzada() },
    { t: 'Exportar como', sub: [
      { t: 'PNG', f: exportarComo('png') }, { t: 'PNG al doble de tamaño', f: exportarComo('png', 2) },
      { t: 'JPG', f: exportarComo('jpg') }, { t: 'WebP', f: exportarComo('webp') }, { t: 'PDF para imprimir', f: exportarComo('pdf') },
      { t: 'SVG (vectorial)', f: exportarComo('svg') },
      '-', { t: 'Proyecto editable (.casadrew)', f: exportarComo('casadrew') },
    ] },
    '-',
    { t: 'Guardar ahora', k: 'Ctrl+S', f: guardarYa },
    { t: 'Crear una firma…', f: () => $('#bFirma').click() },
  ] },
  { t: 'Editar', sub: [
    { t: 'Deshacer', k: 'Ctrl+Z', f: deshacer, si: () => historia.pos > 0 },
    { t: 'Rehacer', k: 'Ctrl+Y', f: rehacer, si: () => historia.pos < historia.pila.length - 1 },
    '-',
    { t: 'Cortar', k: 'Ctrl+X', f: () => copiar().then(ACCIONES.borrar), si: haySel },
    { t: 'Copiar', k: 'Ctrl+C', f: copiar, si: haySel },
    { t: 'Pegar', k: 'Ctrl+V', f: pegar, si: () => !!portapapeles },
    { t: 'Duplicar', k: 'Ctrl+D', f: ACCIONES.duplicar, si: haySel },
    { t: 'Eliminar', k: 'Supr', f: ACCIONES.borrar, si: haySel },
    '-',
    { t: 'Seleccionar todo', k: 'Ctrl+A', f: () => reseleccionar(canvas.getObjects().filter(o => o.visible)) },
    { t: 'Quitar la selección', k: 'Esc', f: () => { canvas.discardActiveObject(); canvas.requestRenderAll(); }, si: haySel },
  ] },
  { t: 'Insertar', sub: [
    { t: 'Texto', sub: [
      { t: 'Título', f: textoNuevo('Título', .1, { fontWeight: 'bold' }) },
      { t: 'Subtítulo', f: textoNuevo('Subtítulo', .06) },
      { t: 'Párrafo', f: textoNuevo('Escribe aquí tu texto. Puedes cambiar la letra, el tamaño y el color en el panel de la derecha.', .032, { textAlign: 'left' }) },
    ] },
    { t: 'Forma', sub: [
      { t: 'Rectángulo', k: 'R', f: forma('rect') }, { t: 'Círculo', k: 'E', f: forma('elipse') },
      { t: 'Triángulo', f: forma('triangulo') }, { t: 'Línea', k: 'L', f: forma('linea') },
      { t: 'Estrella', f: forma('estrella') }, { t: 'Hexágono', f: forma('hexagono') },
    ] },
    { t: 'Imagen…', f: () => $('#fImagen').click() },
    { t: 'Firma…', f: () => $('#bFirma').click() },
  ] },
  { t: 'Elemento', sub: [
    { t: 'Organizar', si: haySel, sub: [
      { t: 'Traer al frente', k: 'Ctrl+⇧+]', f: ACCIONES.frente }, { t: 'Traer adelante', k: 'Ctrl+]', f: ACCIONES.adelante },
      { t: 'Enviar atrás', k: 'Ctrl+[', f: ACCIONES.atras }, { t: 'Enviar al fondo', k: 'Ctrl+⇧+[', f: ACCIONES.fondo },
    ] },
    { t: 'Alinear', si: haySel, sub: [
      { t: 'A la izquierda', f: () => alinear('izq') }, { t: 'Al centro (horizontal)', f: () => alinear('ch') },
      { t: 'A la derecha', f: () => alinear('der') }, '-',
      { t: 'Arriba', f: () => alinear('arr') }, { t: 'Al centro (vertical)', f: () => alinear('cv') }, { t: 'Abajo', f: () => alinear('aba') },
    ] },
    { t: 'Repartir', si: () => activos().length > 2, sub: [
      { t: 'En horizontal', f: () => distribuir('h') }, { t: 'En vertical', f: () => distribuir('v') },
    ] },
    { t: 'Girar y voltear', si: haySel, sub: [
      { t: 'Girar 90° a la derecha', f: sobreSel(o => o.rotate(((o.angle || 0) + 90) % 360)) },
      { t: 'Girar 90° a la izquierda', f: sobreSel(o => o.rotate(((o.angle || 0) + 270) % 360)) },
      { t: 'Girar 180°', f: sobreSel(o => o.rotate(((o.angle || 0) + 180) % 360)) },
      { t: 'Quitar el giro', f: sobreSel(o => o.rotate(0)) }, '-',
      { t: 'Voltear en horizontal', f: ACCIONES.voltearH }, { t: 'Voltear en vertical', f: ACCIONES.voltearV },
    ] },
    '-',
    { t: 'Agrupar', k: 'Ctrl+G', f: ACCIONES.agrupar, si: hayVarios },
    { t: 'Desagrupar', k: 'Ctrl+⇧+G', f: ACCIONES.desagrupar, si: esGrupo },
    { t: 'Bloquear / desbloquear', f: ACCIONES.bloquear, si: haySel },
    { t: 'Ocultar', f: () => { const objs = activos(); canvas.discardActiveObject(); objs.forEach(o => o.set('visible', false)); canvas.requestRenderAll(); registrar(); }, si: haySel },
    { t: 'Mostrar todo lo oculto', f: () => { canvas.getObjects().forEach(o => o.set('visible', true)); canvas.requestRenderAll(); registrar(); },
      si: () => canvas.getObjects().some(o => !o.visible) },
  ] },
  { t: 'Texto', sub: [
    { t: 'Negrita', f: sobreTextos(o => o.set('fontWeight', o.fontWeight === 'bold' ? 'normal' : 'bold')), si: hayTexto },
    { t: 'Cursiva', f: sobreTextos(o => o.set('fontStyle', o.fontStyle === 'italic' ? 'normal' : 'italic')), si: hayTexto },
    { t: 'Subrayado', f: sobreTextos(o => o.set('underline', !o.underline)), si: hayTexto },
    { t: 'Tachado', f: sobreTextos(o => o.set('linethrough', !o.linethrough)), si: hayTexto },
    '-',
    { t: 'Alineación', si: hayTexto, sub: [
      { t: 'Izquierda', f: sobreTextos(o => o.set('textAlign', 'left')) }, { t: 'Centro', f: sobreTextos(o => o.set('textAlign', 'center')) },
      { t: 'Derecha', f: sobreTextos(o => o.set('textAlign', 'right')) }, { t: 'Justificado', f: sobreTextos(o => o.set('textAlign', 'justify')) },
    ] },
    { t: 'Tamaño', si: hayTexto, sub: [
      { t: 'Más grande', f: sobreTextos(o => o.set('fontSize', Math.round(o.fontSize * 1.15))) },
      { t: 'Más pequeño', f: sobreTextos(o => o.set('fontSize', Math.max(1, Math.round(o.fontSize / 1.15)))) },
    ] },
    { t: 'Mayúsculas y minúsculas', si: hayTexto, sub: [
      { t: 'TODO EN MAYÚSCULAS', f: sobreTextos(o => o.set('text', o.text.toLocaleUpperCase('es'))) },
      { t: 'todo en minúsculas', f: sobreTextos(o => o.set('text', o.text.toLocaleLowerCase('es'))) },
      { t: 'Tipo Título', f: sobreTextos(o => o.set('text', tituloCaso(o.text))) },
    ] },
  ] },
  { t: 'Ver', sub: [
    { t: 'Acercar', k: 'Ctrl++', f: () => zoomEn(centroMesa(), canvas.getZoom() * 1.25) },
    { t: 'Alejar', k: 'Ctrl+-', f: () => zoomEn(centroMesa(), canvas.getZoom() / 1.25) },
    { t: 'Ajustar a la pantalla', k: 'Ctrl+0', f: ajustarVista },
    { t: 'Tamaño real (100 %)', f: () => zoomEn(centroMesa(), 1) },
    '-',
    { t: 'Cuadrícula', f: () => $('#bRejilla').click(), marca: () => rejilla },
    { t: 'Imán y guías', f: () => $('#bIman').click(), marca: () => iman },
    { t: 'Panel lateral', f: () => { $('#panel').classList.toggle('oculto'); }, marca: panelVisible },
    '-',
    { t: 'Tema de color', sub: [{ t: 'Automático (según el sistema)', f: () => cambiarApariencia({ tema: '' }), marca: () => !apariencia.tema }, '-',
      ...TEMAS.map(x => ({ t: x.n, f: () => cambiarApariencia({ tema: x.id }), marca: () => apariencia.tema === x.id, color: x.id }))] },
    { t: 'Color principal', sub: ACENTOS.map(a => ({ t: a.n, f: () => cambiarApariencia({ acento: a.c }), marca: () => apariencia.acento === a.c, muestra: a.c })) },
  ] },
  { t: 'Herramientas', sub: [
    { t: 'Seleccionar', k: 'V', f: () => ponerHerramienta('seleccion'), marca: () => herramienta === 'seleccion' },
    { t: 'Mover la vista', k: 'H', f: () => ponerHerramienta('mano'), marca: () => herramienta === 'mano' },
    { t: 'Modo dibujo (pincel)', k: 'B', f: () => ponerHerramienta('pincel'), marca: () => herramienta === 'pincel' },
    { t: 'Modo escritura (letra a texto)', k: 'W', f: () => ponerHerramienta('escritura'), marca: () => herramienta === 'escritura' },
    { t: 'Borrador de trazos', k: 'X', f: () => ponerHerramienta('borrador'), marca: () => herramienta === 'borrador' },
    '-',
    { t: 'Tipo de pincel', sub: Object.entries(Trazo.PINCELES).map(([clave, p]) => ({ t: p.n,
      f: () => { ponerHerramienta('pincel'); $(`#pinceles [data-pincel=${clave}]`).click(); }, marca: () => pincelAj.pincel === clave })) },
    { t: 'Motores de IA…', f: () => $('#dIA').showModal() },
    { t: 'Solo el lápiz dibuja', f: () => cambiarPincel({ soloLapiz: !pincelAj.soloLapiz }), marca: () => pincelAj.soloLapiz },
  ] },
  { t: 'Ayuda', sub: [
    { t: 'Atajos de teclado…', f: () => $('#dAtajos').showModal() },
    { t: 'Acerca de CASADREW Estudio…', f: () => $('#dAcerca').showModal() },
  ] },
];

// ---------- Dibujo de los menús ----------
const barra = $('#menubar');
let menuAbierto = null;
function crearLista(items) {
  const ul = document.createElement('ul');
  ul.className = 'submenu';
  ul.setAttribute('role', 'menu');
  for (const it of items) {
    const li = document.createElement('li');
    if (it === '-') { li.className = 'raya'; ul.append(li); continue; }
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'menuitem');
    b.innerHTML = `<span class="chk"></span>${it.muestra !== undefined ? `<i class="muestra" style="background:${it.muestra || 'var(--acento)'}"></i>` : ''}`
      + `${it.color ? `<i class="muestra" data-muestra-tema="${it.color}"></i>` : ''}<span class="txt"></span><kbd>${it.k || ''}</kbd>${it.sub ? '<span class="flecha">›</span>' : ''}`;
    b.querySelector('.txt').textContent = it.t;
    b._it = it;
    li.append(b);
    if (it.sub) { li.classList.add('con-sub'); li.append(crearLista(it.sub)); }
    b.addEventListener('click', e => {
      e.stopPropagation();
      if (b.disabled) return;
      if (it.sub) return abrirSub(li);
      cerrarMenus();
      it.f && it.f();
    });
    b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') abrirSub(it.sub ? li : null, ul); });
    ul.append(li);
  }
  return ul;
}
function abrirSub(li, padre = li?.parentElement) {
  padre.querySelectorAll(':scope > li.abierto').forEach(x => { if (x !== li) x.classList.remove('abierto'); });
  if (!li) return;
  li.classList.add('abierto');
  const sub = li.querySelector(':scope > .submenu');
  sub.classList.remove('izquierda');
  const r = sub.getBoundingClientRect();
  if (r.right > innerWidth - 4) sub.classList.add('izquierda');
}
function refrescarEstados(ul) {
  ul.querySelectorAll('button').forEach(b => {
    const it = b._it;
    b.disabled = it.si ? !it.si() : false;
    b.querySelector('.chk').textContent = it.marca ? (it.marca() ? '✓' : '') : '';
  });
}
MENUS.forEach(m => {
  const cab = Object.assign(document.createElement('button'), { type: 'button', className: 'titulo', textContent: m.t });
  const caja = document.createElement('div');
  caja.className = 'menu-principal';
  const lista = crearLista(m.sub);
  caja.append(cab, lista);
  barra.append(caja);
  const abrir = () => {
    cerrarMenus();
    refrescarEstados(lista);
    caja.classList.add('abierto');
    menuAbierto = caja;
  };
  cab.addEventListener('click', e => { e.stopPropagation(); menuAbierto === caja ? cerrarMenus() : abrir(); });
  cab.addEventListener('pointerenter', () => { if (menuAbierto && menuAbierto !== caja) abrir(); });
});
function cerrarMenus() {
  barra.querySelectorAll('.abierto').forEach(x => x.classList.remove('abierto'));
  menuAbierto = null;
}
document.addEventListener('pointerdown', e => { if (!barra.contains(e.target)) cerrarMenus(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && menuAbierto) { cerrarMenus(); return; }
  if (escribiendo(e) || document.querySelector('dialog[open]') || !(e.ctrlKey || e.metaKey)) return;
  const k = e.key.toLowerCase();
  const atajo = { n: () => $('#bNuevo').click(), o: () => $('#bMisDisenos').click(), s: guardarYa, e: () => e.shiftKey ? Exportar.avanzada() : Exportar.expres('auto') }[k];
  if (atajo && !e.shiftKey) { e.preventDefault(); atajo(); }
  else if (k === 'i' && e.shiftKey) { e.preventDefault(); $('#fImagen').click(); }
});

// Ventana de atajos, hecha a partir de los propios menús.
(function rellenarAtajos() {
  const filas = [];
  const recorrer = (items, ruta) => items.forEach(it => {
    if (it === '-') return;
    if (it.sub) recorrer(it.sub, [...ruta, it.t]);
    else if (it.k) filas.push([[...ruta, it.t].join(' › '), it.k]);
  });
  MENUS.forEach(m => recorrer(m.sub, [m.t]));
  filas.push(['Mover la vista mientras la mantienes pulsada', 'Barra espaciadora'], ['Acercar o alejar', 'Ctrl + rueda del ratón']);
  $('#listaAtajos').append(...filas.map(([a, k]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td></td><td><kbd></kbd></td>';
    tr.firstChild.textContent = a; tr.querySelector('kbd').textContent = k;
    return tr;
  }));
})();
$('#versionPrograma').textContent = ES_PROGRAMA ? 'Programa para Windows' : 'Versión web (ordenador, iPad y móvil)';
