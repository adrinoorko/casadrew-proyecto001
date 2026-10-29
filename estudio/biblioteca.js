// CASADREW · Estudio — buscador visual de elementos (el mismo en la pantalla de inicio y en el editor).
// Sin búsqueda muestra una fila de cada categoría; con búsqueda o categoría, la rejilla completa.
// Las miniaturas se dibujan solo cuando se ven (para no gastar tiempo en lo que no está en pantalla).
'use strict';
const Biblioteca = (() => {
  function montar(raiz, { alElegir, alArrastrar, columnas = 'normal', porFila = 6, base = '' }) {
    raiz.classList.add('biblio', 'biblio-' + columnas);
    raiz.innerHTML = `
      <label class="buscador biblio-buscar" title="Busca en español: corazón, vaquero, neón, flecha, botón…">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
        <input type="search" placeholder="Buscar elementos" aria-label="Buscar elementos">
      </label>
      <div class="biblio-cats"></div>
      <div class="biblio-rejilla" tabindex="-1"></div>`;
    const q = s => raiz.querySelector(s);
    const entrada = q('input'), cats = q('.biblio-cats'), rejilla = q('.biblio-rejilla');
    let cat = '', limite = 120;

    const visible = new IntersectionObserver(entradas => entradas.forEach(en => {
      if (!en.isIntersecting) return;
      visible.unobserve(en.target);
      const e = Elementos.porId(en.target.dataset.id);
      Elementos.miniatura(e).then(url => { const img = en.target.querySelector('img'); if (url) img.src = url; else img.classList.add('sin'); });
    }), { rootMargin: '200px' });

    function ficha(e) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'ficha-el' + (e.fondoOscuro ? ' oscura' : '') + (e.fondo ? ' ancha' : '');
      b.dataset.id = e.id; b.title = e.n + (e.sub ? ` · ${e.sub}` : '');
      b.innerHTML = '<img alt="" draggable="false">';
      b.setAttribute('aria-label', 'Añadir ' + e.n);
      prepararArrastre(b, e);
      visible.observe(b);
      return b;
    }
    // Tocar = añadir al centro. Arrastrar (ratón al momento; dedo o lápiz tras mantener pulsado) = soltar donde quieras.
    function prepararArrastre(b, e) {
      b.addEventListener('pointerdown', ev => {
        if (ev.button > 0) return;
        const x0 = ev.clientX, y0 = ev.clientY, tactil = ev.pointerType !== 'mouse';
        let fantasma = null, listo = !tactil, temporizador = tactil ? setTimeout(() => { listo = true; b.classList.add('listo'); }, 280) : 0;
        const mover = m => {
          if (!fantasma && !listo && Math.hypot(m.clientX - x0, m.clientY - y0) > 8) return limpiar();
          if (!alArrastrar || !listo || (!fantasma && Math.hypot(m.clientX - x0, m.clientY - y0) < 6)) return;
          m.preventDefault();
          if (!fantasma) {
            fantasma = b.cloneNode(true); fantasma.className = 'fantasma-el';
            document.body.append(fantasma);
            try { b.setPointerCapture(ev.pointerId); } catch {}
          }
          fantasma.style.left = m.clientX + 'px'; fantasma.style.top = m.clientY + 'px';
        };
        const soltar = s => {
          const arrastrado = !!fantasma;
          limpiar();
          if (arrastrado) alArrastrar(e, s.clientX, s.clientY);
          else if (s.type === 'pointerup' && Math.hypot(s.clientX - x0, s.clientY - y0) < 8) alElegir(e);
        };
        function limpiar() {
          clearTimeout(temporizador); b.classList.remove('listo');
          fantasma?.remove(); fantasma = null;
          removeEventListener('pointermove', mover); removeEventListener('pointerup', soltar); removeEventListener('pointercancel', soltar);
        }
        addEventListener('pointermove', mover, { passive: false }); addEventListener('pointerup', soltar); addEventListener('pointercancel', soltar);
      });
      b.addEventListener('keydown', k => { if (k.key === 'Enter' || k.key === ' ') { k.preventDefault(); alElegir(e); } });
      b.addEventListener('click', k => k.preventDefault());
    }

    function pintar() {
      const texto = entrada.value.trim();
      cats.querySelectorAll('button').forEach(b => b.classList.toggle('activo', b.dataset.cat === cat));
      rejilla.replaceChildren();
      if (!texto && !cat) {
        // Portada: una fila por categoría.
        for (const c of Elementos.CATS) {
          const lista = Elementos.buscar('', c.id);
          if (!lista.length) continue;
          const cab = document.createElement('div'); cab.className = 'biblio-cab';
          cab.innerHTML = `<b>${c.n}</b><button type="button" class="enlace">Ver todo (${c.id === 'iconos' && !window.ICONOS_TABLER ? '2.500+' : lista.length})</button>`;
          cab.querySelector('button').onclick = () => elegirCat(c.id);
          const fila = document.createElement('div'); fila.className = 'biblio-fila';
          fila.append(...lista.slice(0, porFila).map(ficha));
          rejilla.append(cab, fila);
        }
        return;
      }
      const lista = Elementos.buscar(texto, cat);
      if (!lista.length) { rejilla.innerHTML = `<p class="nota">No hay elementos con «${texto.replace(/</g, '')}». Prueba con otra palabra (por ejemplo: flor, flecha, botón, tela).</p>`; return; }
      const grid = document.createElement('div'); grid.className = 'biblio-todo';
      grid.append(...lista.slice(0, limite).map(ficha));
      rejilla.append(grid);
      if (lista.length > limite) {
        const mas = Object.assign(document.createElement('button'), { type: 'button', className: 'biblio-mas', textContent: `Mostrar más (${lista.length - limite})` });
        mas.onclick = () => { limite += 240; pintar(); };
        rejilla.append(mas);
      }
    }
    function elegirCat(id) {
      cat = cat === id ? '' : id; limite = 120; rejilla.scrollTop = 0;
      if (cat === 'iconos') Elementos.cargarIconos(base).then(pintar);
      pintar();
    }
    cats.append(...[{ id: '', n: 'Todo' }, ...Elementos.CATS].map(c => {
      const b = Object.assign(document.createElement('button'), { type: 'button', className: 'chip-p', textContent: c.n });
      b.dataset.cat = c.id;
      b.onclick = () => elegirCat(c.id);
      return b;
    }));
    let espera = null;
    entrada.addEventListener('input', () => {
      clearTimeout(espera);
      espera = setTimeout(async () => { limite = 120; if (entrada.value.trim()) await Elementos.cargarIconos(base).catch(() => {}); pintar(); }, 180);
    });
    pintar();
    return { pintar, enfocar: () => entrada.focus() };
  }
  return { montar };
})();
