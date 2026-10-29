// CASADREW · Estudio — piezas comunes a todas las pantallas: tema de color, perfiles y ayudas emergentes.
'use strict';
const Comun = (() => {
  const leer = (clave, def) => { try { return { ...def, ...JSON.parse(localStorage.getItem(clave) || '{}') }; } catch { return { ...def }; } };
  const escribir = (clave, v) => { try { localStorage.setItem(clave, JSON.stringify(v)); } catch {} };

  // ---------- Temas ----------
  const TEMAS = [
    { id: 'cristal', n: 'Cristal', d: 'Paneles translúcidos sobre color' },
    { id: 'vivo', n: 'Vivo', d: 'Colores alegres y degradados' },
    { id: 'minimal', n: 'Minimal', d: 'Blanco, negro y aire' },
    { id: 'oficina', n: 'Oficina', d: 'Sobrio y profesional' },
    { id: 'arena', n: 'Arena', d: 'Cálido y claro' }, { id: 'noche', n: 'Noche', d: 'Oscuro cálido' },
    { id: 'lavanda', n: 'Lavanda', d: 'Lila suave' }, { id: 'menta', n: 'Menta', d: 'Verde fresco' },
    { id: 'coral', n: 'Coral', d: 'Melocotón' }, { id: 'rosa', n: 'Rosa', d: 'Rosa empolvado' },
    { id: 'oceano', n: 'Océano', d: 'Azul noche' }, { id: 'grafito', n: 'Grafito', d: 'Oscuro con dorado' },
  ];
  const ACENTOS = [
    { c: '', n: 'El del tema' }, { c: '#c8643b', n: 'Terracota' }, { c: '#d63d86', n: 'Fucsia' }, { c: '#7b5cd6', n: 'Violeta' },
    { c: '#2f7fe0', n: 'Azul' }, { c: '#1f9e74', n: 'Verde' }, { c: '#c99a2e', n: 'Dorado' }, { c: '#d64545', n: 'Rojo' },
  ];
  const apariencia = leer('casadrew_apariencia', { tema: 'cristal', acento: '' });
  function aplicarApariencia() {
    const html = document.documentElement;
    if (apariencia.tema) html.dataset.tema = apariencia.tema; else delete html.dataset.tema;
    if (apariencia.acento) html.style.setProperty('--acento', apariencia.acento); else html.style.removeProperty('--acento');
    document.dispatchEvent(new CustomEvent('casadrew:tema'));
  }
  function cambiarApariencia(c) { Object.assign(apariencia, c); escribir('casadrew_apariencia', apariencia); aplicarApariencia(); }

  // ---------- Perfiles locales (cada uno ve solo sus diseños) ----------
  const COLORES_PERFIL = ['#c8643b', '#d63d86', '#7b5cd6', '#2f7fe0', '#1f9e74', '#c99a2e'];
  const perfiles = leer('casadrew_perfiles', { lista: [{ id: 'adriana', nombre: 'Adriana', color: '#d63d86' }], actual: 'adriana' });
  const perfilActual = () => perfiles.lista.find(p => p.id === perfiles.actual) || perfiles.lista[0];
  function guardarPerfiles() { escribir('casadrew_perfiles', perfiles); }
  function crearPerfil(nombre) {
    const p = { id: Date.now().toString(36), nombre: nombre.trim().slice(0, 40), color: COLORES_PERFIL[perfiles.lista.length % COLORES_PERFIL.length] };
    perfiles.lista.push(p); guardarPerfiles(); return p;
  }
  function usarPerfil(id) { if (perfiles.lista.some(p => p.id === id)) { perfiles.actual = id; guardarPerfiles(); } }
  // Los diseños de antes de existir perfiles pertenecen al primero.
  const esDelPerfil = proyecto => (proyecto.perfil || perfiles.lista[0].id) === perfilActual().id;

  // ---------- Ayudas emergentes ----------
  // Cualquier elemento con title o data-tip muestra una burbuja al pasar el ratón; en pantallas táctiles
  // el mismo texto queda como etiqueta accesible (aria-label).
  let burbuja = null, temporizador = null, objetivo = null;
  function prepararAyuda(el) {
    if (el.hasAttribute('title')) {
      el.dataset.tip = el.getAttribute('title');
      el.removeAttribute('title');
    }
    if (!el.hasAttribute('aria-label') && !el.textContent.trim()) el.setAttribute('aria-label', el.dataset.tip);
  }
  function mostrarAyuda(el) {
    if (!burbuja) { burbuja = document.createElement('div'); burbuja.className = 'burbuja'; burbuja.setAttribute('role', 'tooltip'); document.body.append(burbuja); }
    burbuja.textContent = el.dataset.tip;
    burbuja.hidden = false;
    const r = el.getBoundingClientRect(), b = burbuja.getBoundingClientRect();
    let x = r.left + r.width / 2 - b.width / 2, y = r.bottom + 8;
    if (y + b.height > innerHeight - 4) y = r.top - b.height - 8;
    if (r.right + b.width + 12 < innerWidth && el.closest('.herramientas, .lateral')) { x = r.right + 10; y = r.top + r.height / 2 - b.height / 2; }
    burbuja.style.left = Math.max(6, Math.min(x, innerWidth - b.width - 6)) + 'px';
    burbuja.style.top = Math.max(6, y) + 'px';
  }
  function ocultarAyuda() { clearTimeout(temporizador); objetivo = null; if (burbuja) burbuja.hidden = true; }
  document.addEventListener('pointerover', e => {
    if (e.pointerType !== 'mouse') return;
    const el = e.target.closest?.('[title], [data-tip]');
    if (el === objetivo) return;
    ocultarAyuda();
    if (!el) return;
    prepararAyuda(el);
    objetivo = el;
    temporizador = setTimeout(() => { if (objetivo === el && el.isConnected) mostrarAyuda(el); }, 380);
  });
  document.addEventListener('pointerdown', ocultarAyuda, true);
  document.addEventListener('scroll', ocultarAyuda, true);
  // Etiquetas accesibles para pantallas táctiles, también en lo que se añada después.
  const etiquetar = raiz => raiz.querySelectorAll?.('[title]').forEach(prepararAyuda);
  document.addEventListener('DOMContentLoaded', () => {
    etiquetar(document);
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => n.nodeType === 1 && (n.hasAttribute('title') ? prepararAyuda(n) : etiquetar(n)))))
      .observe(document.body, { childList: true, subtree: true });
  });

  aplicarApariencia();
  return { TEMAS, ACENTOS, apariencia, cambiarApariencia, aplicarApariencia, perfiles, perfilActual, crearPerfil, usarPerfil, guardarPerfiles, esDelPerfil, leer, escribir };
})();
