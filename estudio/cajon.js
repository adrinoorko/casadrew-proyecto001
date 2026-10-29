// CASADREW · Estudio — cajón lateral del editor con Elementos y Plantillas.
// Tocar un elemento lo añade al centro de la página; arrastrarlo lo suelta justo donde lo dejas.
// También: cambiar los colores de un grupo o dibujo vectorial y editar el texto de un grupo con doble clic.
'use strict';
const Cajon = (() => {
  const cajon = document.createElement('aside');
  cajon.className = 'cajon'; cajon.id = 'cajon'; cajon.hidden = true;
  cajon.innerHTML = `
    <div class="cajon-cab">
      <div class="tipos-relleno pestanas"><button type="button" data-t="elementos" class="activo">Elementos</button><button type="button" data-t="plantillas">Plantillas</button></div>
      <button type="button" class="cerrar" title="Cerrar el cajón">✕</button>
    </div>
    <div class="cajon-el"></div>
    <div class="cajon-pl" hidden><p class="nota">Abre la plantilla como un diseño nuevo; el actual queda guardado.</p><div class="lista-pl"></div></div>`;
  $('.cuerpo').insertBefore(cajon, $('#mesa'));
  const q = s => cajon.querySelector(s);

  const biblio = Biblioteca.montar(q('.cajon-el'), { alElegir: e => insertar(e), alArrastrar: soltarEn, porFila: 6 });

  function abrir(pestana = 'elementos') {
    cajon.hidden = false;
    $$('#bElementos, #bPlantillas').forEach(b => b.classList.toggle('activo', b.id === (pestana === 'elementos' ? 'bElementos' : 'bPlantillas')));
    cajon.querySelectorAll('[data-t]').forEach(b => b.classList.toggle('activo', b.dataset.t === pestana));
    q('.cajon-el').hidden = pestana !== 'elementos'; q('.cajon-pl').hidden = pestana !== 'plantillas';
    if (pestana === 'plantillas') pintarPlantillas();
    medirMesa();
  }
  function cerrar() { cajon.hidden = true; $$('#bElementos, #bPlantillas').forEach(b => b.classList.remove('activo')); medirMesa(); }
  q('.cerrar').onclick = cerrar;
  cajon.querySelectorAll('[data-t]').forEach(b => b.onclick = () => abrir(b.dataset.t));
  $('#bElementos').onclick = () => cajon.hidden || q('.cajon-el').hidden ? abrir('elementos') : cerrar();
  $('#bPlantillas').onclick = () => cajon.hidden || q('.cajon-pl').hidden ? abrir('plantillas') : cerrar();

  let plantillasPintadas = false;
  function pintarPlantillas() {
    if (plantillasPintadas) return;
    plantillasPintadas = true;
    q('.lista-pl').append(...Plantillas.LISTA.map(p => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'ficha-pl'; b.title = `Abrir «${p.n}» (${p.w} × ${p.h} px)`;
      b.innerHTML = `<img alt=""><span></span>`;
      b.querySelector('span').textContent = p.n;
      requestAnimationFrame(() => { b.querySelector('img').src = Plantillas.miniatura(p.id, 240); });
      b.onclick = async () => { await guardarYa(); location.href = 'editor.html?plantilla=' + p.id; };
      return b;
    }));
  }

  // ---------- Añadir al diseño ----------
  async function insertar(e, punto) {
    ponerHerramienta('seleccion');
    ponerEstado('Añadiendo «' + e.n + '»…');
    try {
      const { obj, cubrir, encima } = await Elementos.crear(e, { w: doc.w, h: doc.h });
      if (obj.dataPendiente) { obj.imgRef = await registrarImagen(obj.dataPendiente); delete obj.dataPendiente; }
      if (obj instanceof F.Group) obj.set('subTargetCheck', true);
      if (cubrir) {
        obj.set({ originX: 'left', originY: 'top', left: 0, top: 0, scaleX: doc.w / obj.width, scaleY: doc.h / obj.height });
        historia.pausa = true; canvas.add(obj); if (!encima) canvas.sendObjectToBack(obj); historia.pausa = false;
        canvas.setActiveObject(obj); canvas.requestRenderAll(); registrar();
      } else {
        const w = obj.width, h = obj.height;
        const k = e.cat === 'web' ? Math.min(doc.w * .8 / w, doc.h * .6 / h, Math.max(doc.w, doc.h) / 1200)
          : Math.min(doc.w, doc.h) * .35 / Math.max(w, h);
        obj.scale(k);
        if (punto) {
          obj.setPositionByOrigin(punto, 'center', 'center');
          canvas.add(obj); canvas.setActiveObject(obj); canvas.requestRenderAll();
        } else colocar(obj);
      }
      const oscuro = e.fondoOscuro && !doc.fondoDeg && (!doc.fondo || new F.Color(doc.fondo).getSource().slice(0, 3).reduce((s, v) => s + v, 0) > 384);
      ponerEstado(oscuro ? `«${e.n}» añadido. Brilla más sobre un fondo oscuro (Documento › Fondo de la página).`
        : e.fusion ? `«${e.n}» añadido como capa de efecto (modo de fusión: ${e.fusion}). Baja su opacidad si quieres un efecto más suave.`
        : `«${e.n}» añadido.` + (obj instanceof F.Group && obj.getObjects().some(esTexto) ? ' Doble clic sobre el texto para cambiarlo.' : ''));
    } catch (err) {
      ponerEstado(`No se pudo añadir «${e.n}»: ${err.message || err}`);
    }
  }
  function soltarEn(e, x, y) {
    const r = $('#mesa').getBoundingClientRect();
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return;
    insertar(e, canvas.getScenePoint({ clientX: x, clientY: y }));
  }

  // Desde la pantalla de inicio: «Añadir a mi diseño».
  async function traerPendiente() {
    let id = '';
    try { id = localStorage.getItem('casadrew_elemento_pendiente') || ''; localStorage.removeItem('casadrew_elemento_pendiente'); } catch {}
    if (!id) return;
    if (id.startsWith('ico-')) await Elementos.cargarIconos();
    const e = Elementos.porId(id);
    if (e) { if ($('#dNuevo').open) $('#dNuevo').close(); await insertar(e); }
  }

  // ---------- Doble clic sobre un texto dentro de un grupo: se separa el grupo y se edita el texto ----------
  canvas.on('mouse:dblclick', opt => {
    const g = opt.target;
    if (!(g instanceof F.Group) || g instanceof F.ActiveSelection || g.bloqueado) return;
    const texto = (opt.subTargets || []).find(esTexto);
    if (!texto) return;
    canvas.setActiveObject(g);
    ACCIONES.desagrupar();
    canvas.setActiveObject(texto);
    texto.enterEditing(); texto.selectAll();
    canvas.requestRenderAll();
  });
  F.Group.ownDefaults.subTargetCheck = true;

  // ---------- Colores de un grupo (iconos, ilustraciones, prendas, SVG importados…) ----------
  const seccion = document.createElement('div');
  seccion.id = 'gColoresGrupo'; seccion.hidden = true;
  seccion.innerHTML = `<div class="fila"><span class="etq">Colores</span><span class="ayuda-i" title="Cada muestra es un color que usa este elemento. Cámbialo y se cambia en todas sus partes a la vez.">?</span></div><div class="colores-grupo"></div>`;
  $('#gRelleno').after(seccion);
  const hex = c => { try { return '#' + new F.Color(c).toHex().slice(0, 6).toLowerCase(); } catch { return null; } };
  function partes(o, lista = []) {
    for (const h of o.getObjects ? o.getObjects() : []) { if (h.getObjects) partes(h, lista); else lista.push(h); }
    return lista;
  }
  function coloresDe(g) {
    const vistos = new Map();
    for (const p of partes(g)) for (const prop of ['fill', 'stroke']) {
      if (typeof p[prop] !== 'string' || !p[prop] || p[prop] === 'none' || (prop === 'stroke' && !p.strokeWidth)) continue;
      const h = hex(p[prop]); if (h && !vistos.has(h)) vistos.set(h, true);
    }
    return [...vistos.keys()].slice(0, 12);
  }
  function mostrarColores() {
    const o = canvas.getActiveObject();
    const g = activos().length === 1 && o instanceof F.Group && !(o instanceof F.ActiveSelection) ? o : null;
    const cs = g ? coloresDe(g) : [];
    seccion.hidden = !cs.length;
    if (!cs.length) return;
    seccion.querySelector('.colores-grupo').replaceChildren(...cs.map(c => {
      const i = Object.assign(document.createElement('input'), { type: 'color', value: c, title: 'Cambiar este color' });
      let actual = c;
      i.oninput = () => {
        for (const p of partes(g)) for (const prop of ['fill', 'stroke']) if (typeof p[prop] === 'string' && hex(p[prop]) === actual) p.set(prop, i.value);
        actual = i.value; g.set('dirty', true); canvas.requestRenderAll();
      };
      i.onchange = () => registrar();
      return i;
    }));
  }
  ['selection:created', 'selection:updated', 'selection:cleared'].forEach(ev => canvas.on(ev, () => setTimeout(mostrarColores)));

  return { abrir, cerrar, insertar, traerPendiente, biblio };
})();
