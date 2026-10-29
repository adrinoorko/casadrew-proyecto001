// CASADREW · Estudio — rellenos: color, degradado lineal o radial (con paradas editables) y sin relleno.
// Sirve para formas, textos y el fondo de la página.
'use strict';
const Degradados = (() => {
  const PRESETS = [
    ['Atardecer', ['#ff9a8b', '#ff6a88', '#ff99ac']], ['Océano', ['#2e3192', '#1bffff']], ['Lavanda', ['#a18cd1', '#fbc2eb']],
    ['Menta', ['#d4fc79', '#96e6a1']], ['Fuego', ['#f83600', '#f9d423']], ['Noche', ['#0f2027', '#203a43', '#2c5364']],
    ['Melocotón', ['#ffecd2', '#fcb69f']], ['Neón', ['#f72585', '#7209b7', '#3a0ca3']], ['Oro', ['#bf953f', '#fcf6ba', '#b38728']],
    ['Cielo', ['#89f7fe', '#66a6ff']], ['Rosa', ['#f093fb', '#f5576c']], ['Bosque', ['#134e5e', '#71b280']],
  ];
  const SOLIDOS = ['#1a1a1a', '#ffffff', '#c8643b', '#e8577a', '#d63d86', '#7b5cd6', '#2f7fe0', '#1f9e74', '#e8b730', '#8c9a7a', '#d9c3a5', '#5d4a3f'];
  const desdePreset = colores => ({ tipo: 'linear', ang: 90, paradas: colores.map((c, i) => ({ pos: i / (colores.length - 1), color: c, opac: 1 })) });
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  const cssDeg = m => `linear-gradient(90deg, ${m.paradas.slice().sort((a, b) => a.pos - b.pos).map(p => `${rgba(p.color, p.opac)} ${Math.round(p.pos * 100)}%`).join(', ')})`;
  const cssMuestra = m => (m.tipo === 'radial' ? 'radial-gradient(circle, ' : `linear-gradient(${m.ang + 90}deg, `)
    + m.paradas.slice().sort((a, b) => a.pos - b.pos).map(p => `${rgba(p.color, p.opac)} ${Math.round(p.pos * 100)}%`).join(', ') + ')';

  function aFabric(m) {
    const stops = m.paradas.slice().sort((a, b) => a.pos - b.pos).map(p => ({ offset: p.pos, color: rgba(p.color, p.opac) }));
    if (m.tipo === 'radial') return new F.Gradient({ type: 'radial', gradientUnits: 'percentage', coords: { x1: .5, y1: .5, r1: 0, x2: .5, y2: .5, r2: .5 }, colorStops: stops });
    const a = m.ang * Math.PI / 180, x = Math.cos(a) / 2, y = Math.sin(a) / 2;
    return new F.Gradient({ type: 'linear', gradientUnits: 'percentage', coords: { x1: .5 - x, y1: .5 - y, x2: .5 + x, y2: .5 + y }, colorStops: stops });
  }
  // Recupera el modelo de un relleno ya hecho (también los de versiones anteriores, que solo guardaban el ángulo).
  function deObjeto(o) {
    if (o.degradado) return JSON.parse(JSON.stringify(o.degradado));
    const g = o.fill;
    return {
      tipo: g.type === 'radial' ? 'radial' : 'linear', ang: o.anguloDegradado ?? 90,
      paradas: g.colorStops.map(s => { const c = new F.Color(s.color); return { pos: s.offset, color: '#' + c.toHex().slice(0, 6), opac: s.opacity ?? c.getAlpha() }; }),
    };
  }
  // Gradiente para pintar el fondo de la página directamente en el lienzo (coordenadas de la página).
  function enContexto(ctx, m, w, h) {
    let g;
    if (m.tipo === 'radial') g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.hypot(w, h) / 2);
    else {
      const a = m.ang * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), L = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
      g = ctx.createLinearGradient(w / 2 - dx * L, h / 2 - dy * L, w / 2 + dx * L, h / 2 + dy * L);
    }
    m.paradas.slice().sort((a, b) => a.pos - b.pos).forEach(p => g.addColorStop(Math.min(1, Math.max(0, p.pos)), rgba(p.color, p.opac)));
    return g;
  }
  function enSVG(m, w, h, id) {
    const stops = m.paradas.slice().sort((a, b) => a.pos - b.pos).map(p => `<stop offset="${p.pos}" stop-color="${p.color}" stop-opacity="${p.opac}"/>`).join('');
    if (m.tipo === 'radial') return `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${w / 2}" cy="${h / 2}" r="${Math.hypot(w, h) / 2}">${stops}</radialGradient>`;
    const a = m.ang * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), L = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
    return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${w / 2 - dx * L}" y1="${h / 2 - dy * L}" x2="${w / 2 + dx * L}" y2="${h / 2 + dy * L}">${stops}</linearGradient>`;
  }

  // ---------- Editor visual (se usa dos veces: elemento y fondo de página) ----------
  function crearEditor(raiz, { leer, aplicar, confirmar, textoNinguno = 'Ninguno' }) {
    raiz.classList.add('ed-relleno');
    raiz.innerHTML = `
      <div class="tipos-relleno">
        <button type="button" data-tipo="solido" title="Un solo color">Color</button>
        <button type="button" data-tipo="linear" title="Degradado en línea recta, de un color a otro">Lineal</button>
        <button type="button" data-tipo="radial" title="Degradado en círculo, desde el centro hacia fuera">Radial</button>
        <button type="button" data-tipo="ninguno" title="${textoNinguno === 'Ninguno' ? 'Sin relleno: solo se verá el borde' : 'Sin fondo: la página será transparente'}">${textoNinguno}</button>
      </div>
      <div class="r-solido"><input type="color" class="r-color" aria-label="Color"><div class="muestras"></div></div>
      <div class="r-deg">
        <div class="barra-deg" title="Toca la barra para añadir un color; arrastra los círculos para moverlos"><div class="pista"></div></div>
        <div class="fila r-parada"><label>Color <input type="color" class="p-color"></label>
          <label class="ancho" title="Transparencia de este color: 0 % invisible, 100 % opaco">Opac. <input type="range" class="p-opac" min="0" max="100"><output class="p-opac-t"></output></label>
          <button type="button" class="p-quitar" title="Quitar este color del degradado">✕</button></div>
        <div class="fila r-ang"><label class="ancho" title="Dirección del degradado. 0° va de izquierda a derecha; 90°, de arriba abajo">Ángulo <input type="range" class="d-ang" min="0" max="360" step="5"><output class="d-ang-t"></output></label></div>
        <div class="presets"></div>
      </div>`;
    const q = s => raiz.querySelector(s);
    let estado = null, parada = 0;
    const solido = () => estado.tipo === 'solido';

    q('.muestras').append(...SOLIDOS.map(c => {
      const b = Object.assign(document.createElement('button'), { type: 'button', className: 'muestra-c', title: c });
      b.style.background = c;
      b.onclick = () => { estado = { tipo: 'solido', color: c }; aplicar(estado); pintar(); confirmar(); };
      return b;
    }));
    q('.presets').append(...PRESETS.map(([n, cs]) => {
      const b = Object.assign(document.createElement('button'), { type: 'button', className: 'preset', title: 'Degradado ' + n });
      b.style.background = `linear-gradient(135deg, ${cs.join(', ')})`;
      b.onclick = () => { const m = desdePreset(cs); if (estado.tipo === 'radial') m.tipo = 'radial'; else m.ang = estado.ang ?? 90; estado = m; parada = 0; aplicar(estado); pintar(); confirmar(); };
      return b;
    }));
    raiz.querySelectorAll('[data-tipo]').forEach(b => b.onclick = () => {
      const t = b.dataset.tipo, actual = estado;
      if (t === 'solido') estado = { tipo: 'solido', color: actual.paradas?.[0]?.color || actual.color || '#c8643b' };
      else if (t === 'ninguno') estado = { tipo: 'ninguno' };
      else if (actual.paradas) estado = { ...actual, tipo: t };
      else { estado = desdePreset([actual.color || '#c8643b', '#ffffff']); estado.tipo = t; }
      parada = 0; aplicar(estado); pintar(); confirmar();
    });
    q('.r-color').oninput = e => { estado = { tipo: 'solido', color: e.target.value }; aplicar(estado); };
    q('.r-color').onchange = confirmar;
    q('.p-color').oninput = e => { estado.paradas[parada].color = e.target.value; aplicar(estado); pintarBarra(); };
    q('.p-opac').oninput = e => { estado.paradas[parada].opac = e.target.value / 100; q('.p-opac-t').textContent = e.target.value + ' %'; aplicar(estado); pintarBarra(); };
    q('.d-ang').oninput = e => { estado.ang = +e.target.value; q('.d-ang-t').textContent = e.target.value + '°'; aplicar(estado); };
    [q('.p-color'), q('.p-opac'), q('.d-ang')].forEach(c => c.onchange = confirmar);
    q('.p-quitar').onclick = () => { if (estado.paradas.length > 2) { estado.paradas.splice(parada, 1); parada = 0; aplicar(estado); pintar(); confirmar(); } };

    // Barra con los colores del degradado: tocar añade un color, arrastrar lo mueve.
    const barra = q('.barra-deg');
    barra.addEventListener('pointerdown', e => {
      const r = barra.getBoundingClientRect(), pos = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const asa = e.target.closest('.asa-deg');
      if (asa) parada = +asa.dataset.i;
      else { estado.paradas.push({ pos, color: estado.paradas[parada].color, opac: 1 }); parada = estado.paradas.length - 1; aplicar(estado); }
      pintar();
      try { barra.setPointerCapture(e.pointerId); } catch {}
      const mover = ev => { estado.paradas[parada].pos = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)); aplicar(estado); pintarBarra(); };
      const fin = () => { barra.removeEventListener('pointermove', mover); barra.removeEventListener('pointerup', fin); barra.removeEventListener('pointercancel', fin); confirmar(); };
      barra.addEventListener('pointermove', mover); barra.addEventListener('pointerup', fin); barra.addEventListener('pointercancel', fin);
    });

    function pintarBarra() {
      q('.pista').style.background = cssDeg(estado) + ', repeating-conic-gradient(#ddd 0 25%, #fff 0 50%) 0 0/10px 10px';
      barra.querySelectorAll('.asa-deg').forEach(a => a.remove());
      estado.paradas.forEach((p, i) => {
        const a = Object.assign(document.createElement('span'), { className: 'asa-deg' + (i === parada ? ' activa' : '') });
        a.dataset.i = i; a.style.left = p.pos * 100 + '%'; a.style.background = p.color;
        barra.append(a);
      });
    }
    function pintar() {
      raiz.querySelectorAll('[data-tipo]').forEach(b => b.classList.toggle('activo', b.dataset.tipo === estado.tipo));
      q('.r-solido').hidden = !solido();
      q('.r-deg').hidden = solido() || estado.tipo === 'ninguno';
      if (solido()) q('.r-color').value = estado.color;
      else if (estado.paradas) {
        const p = estado.paradas[parada] || estado.paradas[0];
        q('.p-color').value = p.color; q('.p-opac').value = Math.round(p.opac * 100); q('.p-opac-t').textContent = Math.round(p.opac * 100) + ' %';
        q('.p-quitar').disabled = estado.paradas.length <= 2;
        q('.r-ang').hidden = estado.tipo === 'radial';
        q('.d-ang').value = estado.ang ?? 90; q('.d-ang-t').textContent = (estado.ang ?? 90) + '°';
        pintarBarra();
      }
    }
    return { mostrar() { estado = leer(); parada = Math.min(parada, (estado.paradas?.length || 1) - 1); pintar(); } };
  }

  // ---------- Conexión con el editor ----------
  const editorObjeto = crearEditor($('#gRelleno'), {
    leer() {
      const o = canvas.getActiveObject(), f = o?.fill;
      if (!f) return { tipo: 'ninguno' };
      if (f instanceof F.Gradient) return deObjeto(o);
      return { tipo: 'solido', color: aHex(f) };
    },
    aplicar(m) {
      activos().forEach(o => {
        if (m.tipo === 'ninguno') o.set({ fill: null, degradado: null });
        else if (m.tipo === 'solido') o.set({ fill: m.color, degradado: null });
        else o.set({ fill: aFabric(m), degradado: JSON.parse(JSON.stringify(m)) });
        o.set('dirty', true);
      });
      canvas.requestRenderAll();
    },
    confirmar: () => registrar(),
  });
  const editorFondo = crearEditor($('#gFondoPagina'), {
    textoNinguno: 'Transparente',
    leer: () => doc.fondoDeg ? JSON.parse(JSON.stringify(doc.fondoDeg)) : doc.fondo ? { tipo: 'solido', color: aHex(doc.fondo) } : { tipo: 'ninguno' },
    aplicar(m) {
      if (m.tipo === 'ninguno') { doc.fondo = null; doc.fondoDeg = null; }
      else if (m.tipo === 'solido') { doc.fondo = m.color; doc.fondoDeg = null; }
      else { doc.fondoDeg = JSON.parse(JSON.stringify(m)); doc.fondo = m.paradas[0].color; }
      canvas.requestRenderAll();
    },
    confirmar: () => registrar(),
  });
  return { aFabric, enContexto, enSVG, cssMuestra, mostrarObjeto: () => editorObjeto.mostrar(), mostrarFondo: () => editorFondo.mostrar() };
})();
