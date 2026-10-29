// CASADREW · Estudio — modo escritura (separado del modo dibujo).
// · «Convertir a texto»: en el iPad, el Apple Pencil escribe dentro de un cuadro de texto y el propio iPadOS
//   (función Garabatear / Scribble, en el aparato y gratis) lo convierte en letras, con tildes y corrector.
// · «Mi letra»: guarda tu escritura tal cual, como trazos vectoriales, sin convertirla.
// El reconocimiento solo existe dentro de esta ventana: el lienzo y el pincel nunca convierten nada.
'use strict';
const Escritura = (() => {
  const FUENTES_ELEGANTES = ['Georgia', 'Palatino Linotype', 'Palatino', 'Garamond', 'Baskerville', 'Didot', 'Optima', 'Avenir Next', 'Segoe UI', 'Brush Script MT', 'Snell Roundhand'];
  const hoja = document.createElement('div');
  hoja.className = 'hoja-escritura';
  hoja.hidden = true;
  hoja.innerHTML = `
    <div class="cab-escritura">
      <div class="tipos-relleno pestanas">
        <button type="button" data-p="texto" class="activo" title="El iPad convierte tu letra en texto digital">Convertir a texto</button>
        <button type="button" data-p="tinta" title="Guarda tu letra tal cual, sin convertirla">Mi letra</button>
      </div>
      <button type="button" class="cerrar" title="Cerrar el modo escritura">✕</button>
    </div>
    <div class="p-texto">
      <textarea class="papel-rayado" lang="es" spellcheck="true" autocapitalize="sentences" autocorrect="on"
        placeholder="Escribe aquí a mano con el Apple Pencil: el iPad lo pasará a texto. En el ordenador, escribe con el teclado."></textarea>
      <div class="fila">
        <label class="ancho">Letra <select class="e-fuente"></select></label>
        <label>Tamaño <input class="e-tam" type="number" min="8" max="2000"></label>
        <label>Color <input class="e-color" type="color" value="#1a1a1a"></label>
      </div>
      <p class="muestra-letra">Así quedará tu texto</p>
      <div class="botones-fila"><button type="button" class="e-limpiar">Borrar</button><button type="button" class="principal e-insertar">Insertar en el diseño</button></div>
    </div>
    <div class="p-tinta" hidden>
      <canvas class="papel-tinta"></canvas>
      <div class="botones-fila"><button type="button" class="t-deshacer">Deshacer</button><button type="button" class="t-limpiar">Borrar</button><button type="button" class="principal t-insertar">Insertar mi letra</button></div>
    </div>`;
  document.body.append(hoja);
  const q = s => hoja.querySelector(s);
  q('.e-fuente').append(...FUENTES_ELEGANTES.map(f => Object.assign(document.createElement('option'), { value: f, textContent: f })));
  const aj = Trazo.ajustes('casadrew_escritura', { fuente: 'Georgia', color: '#1a1a1a' });
  q('.e-fuente').value = aj.fuente; q('.e-color').value = aj.color;
  function refrescarMuestra() {
    const m = q('.muestra-letra');
    m.style.fontFamily = q('.e-fuente').value; m.style.color = q('.e-color').value;
    m.textContent = q('.papel-rayado').value.trim().split('\n')[0].slice(0, 60) || 'Así quedará tu texto';
    q('.papel-rayado').style.fontFamily = q('.e-fuente').value;
    Trazo.guardarAjustes('casadrew_escritura', { fuente: q('.e-fuente').value, color: q('.e-color').value });
  }
  ['.e-fuente', '.e-color', '.papel-rayado'].forEach(s => q(s).addEventListener('input', refrescarMuestra));
  hoja.querySelectorAll('[data-p]').forEach(b => b.onclick = () => {
    hoja.querySelectorAll('[data-p]').forEach(x => x.classList.toggle('activo', x === b));
    q('.p-texto').hidden = b.dataset.p !== 'texto'; q('.p-tinta').hidden = b.dataset.p !== 'tinta';
    if (b.dataset.p === 'tinta') medirTinta();
  });
  q('.cerrar').onclick = () => ponerHerramienta('seleccion');
  q('.e-limpiar').onclick = () => { q('.papel-rayado').value = ''; refrescarMuestra(); };
  q('.e-insertar').onclick = () => {
    const texto = q('.papel-rayado').value.trim();
    if (!texto) return q('.papel-rayado').focus();
    const t = CREAR.texto();
    t.set({ text: texto, fontFamily: q('.e-fuente').value, fill: q('.e-color').value, textAlign: 'left',
      fontSize: +q('.e-tam').value || Math.round(Math.min(doc.w, doc.h) * .05) });
    colocar(t, texto.split('\n')[0].slice(0, 28));
    q('.papel-rayado').value = ''; refrescarMuestra();
  };

  // «Mi letra»: el mismo motor de trazos del pincel, en un papel aparte.
  const papel = q('.papel-tinta'), ctx = papel.getContext('2d');
  let trazos = [], actual = null;
  const PINCEL = { ...Trazo.PINCELES.tinta, thinning: .55 };
  const opc = t => Trazo.opciones(PINCEL, { tam: 5, estabilizar: .55, conPresion: t.pen });
  function medirTinta() {
    const r = papel.getBoundingClientRect(), dpr = devicePixelRatio || 1;
    papel.width = Math.round(r.width * dpr); papel.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); pintarTinta();
  }
  function pintarTinta() {
    ctx.clearRect(0, 0, papel.width, papel.height);
    ctx.fillStyle = q('.e-color').value;
    for (const t of actual ? [...trazos, actual] : trazos) { const d = Trazo.aSVG(t.puntos, opc(t)); if (d) ctx.fill(new Path2D(d)); }
  }
  const punto = e => { const r = papel.getBoundingClientRect(); return Trazo.punto(e, e.clientX - r.left, e.clientY - r.top, PINCEL); };
  papel.addEventListener('pointerdown', e => { e.preventDefault(); try { papel.setPointerCapture(e.pointerId); } catch {} actual = { id: e.pointerId, pen: Trazo.hayPresion(e), puntos: [punto(e)] }; pintarTinta(); });
  papel.addEventListener('pointermove', e => { if (!actual || e.pointerId !== actual.id) return; for (const ev of Trazo.eventos(e)) actual.puntos.push(punto(ev)); requestAnimationFrame(pintarTinta); });
  const fin = e => { if (!actual || e.pointerId !== actual.id) return; if (e.type === 'pointerup') trazos.push(actual); actual = null; pintarTinta(); };
  papel.addEventListener('pointerup', fin); papel.addEventListener('pointercancel', fin);
  q('.t-deshacer').onclick = () => { trazos.pop(); pintarTinta(); };
  q('.t-limpiar').onclick = () => { trazos = []; pintarTinta(); };
  q('.t-insertar').onclick = async () => {
    if (!trazos.length) return;
    const caminos = trazos.map(t => Trazo.aSVG(t.puntos, opc(t))).filter(Boolean);
    const color = q('.e-color').value;
    const g = new F.Group(caminos.map(d => new F.Path(d, { fill: color, strokeWidth: 0 })), { nombre: 'Escritura a mano' });
    g.scale(Math.min(4, doc.w * .6 / g.width));
    colocar(g, 'Escritura a mano');
    trazos = []; pintarTinta();
  };

  document.addEventListener('casadrew:herramienta', e => {
    hoja.hidden = e.detail !== 'escritura';
    if (!hoja.hidden) {
      if (!q('.e-tam').value) q('.e-tam').value = Math.round(Math.min(doc.w, doc.h) * .05);
      refrescarMuestra();
      if (!q('.p-tinta').hidden) medirTinta();
    }
  });
  return {};
})();
