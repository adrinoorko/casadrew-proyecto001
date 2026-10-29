// CASADREW · Estudio — perspectiva y 3D para cualquier elemento (texto, imagen, forma, grupo).
// · Inclinar, girar y rotar en 3D con una cámara de verdad (más o menos perspectiva), volumen (extrusión) con luz.
// · Deformar arrastrando las 4 esquinas (perspectiva libre, por ejemplo para encajar un diseño en un cartel de una foto).
// Se dibuja con la tarjeta gráfica (WebGL). No destruye nada: el elemento original queda guardado dentro
// (fuente3d) y con «Editar el original» vuelve a ser texto o forma editable, con sus ajustes 3D recordados.
'use strict';
const Perspectiva = (() => {
  EXTRA.push('fuente3d', 'p3d', 'centro3d', 'render3d');
  const PRESETS = {
    plano: { n: 'Plano', rx: 0, ry: 0, rz: 0, persp: 40, prof: 0 },
    suelo: { n: 'Tumbado', rx: 55, ry: 0, rz: 0, persp: 55, prof: 0 },
    izquierda: { n: 'Pared izquierda', rx: 0, ry: 45, rz: 0, persp: 50, prof: 0 },
    derecha: { n: 'Pared derecha', rx: 0, ry: -45, rz: 0, persp: 50, prof: 0 },
    epico: { n: 'Título épico', rx: 62, ry: 0, rz: 0, persp: 85, prof: 0 },
    volumen: { n: 'Texto 3D', rx: 18, ry: -24, rz: 0, persp: 35, prof: 22, luz: 60 },
    bloque: { n: 'Bloque', rx: 28, ry: 32, rz: 0, persp: 25, prof: 45, luz: 70 },
    isometrico: { n: 'Isométrico', rx: 35, ry: -45, rz: 0, persp: 0, prof: 18, luz: 55 },
  };
  const BASE = { rx: 0, ry: 0, rz: 0, persp: 40, prof: 0, colorProf: '#3a3a4a', luz: 50, esquinas: null };
  const p3dDe = o => ({ ...BASE, ...(o.p3d || {}) });

  // ---------- WebGL ----------
  let gl = null, glCanvas = null, prog = null, buf = null, tex = null, glVersion = 0;
  function prepararGL() {
    if (gl) return gl;
    glCanvas = document.createElement('canvas');
    const opc = { premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: true, alpha: true };
    gl = glCanvas.getContext('webgl2', opc); glVersion = gl ? 2 : 1;
    if (!gl) gl = glCanvas.getContext('webgl', opc) || glCanvas.getContext('experimental-webgl', opc);
    if (!gl) throw new Error('este aparato no tiene WebGL');
    const vs = `attribute vec3 pos; attribute vec2 uv; uniform vec4 marco; varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4((pos.x - marco.x * pos.z) * marco.z, -(pos.y - marco.y * pos.z) * marco.w, 0.0, pos.z); }`;
    const fs = `precision mediump float; varying vec2 vUv; uniform sampler2D img; uniform vec4 tinte; uniform float luz;
      void main() { vec4 t = texture2D(img, vUv); gl_FragColor = tinte.a > 0.0 ? vec4(tinte.rgb * t.a, t.a) : vec4(t.rgb * luz, t.a); }`;
    const sh = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog);
    gl.useProgram(prog);
    buf = gl.createBuffer(); tex = gl.createTexture();
    return gl;
  }

  // ---------- Geometría ----------
  const rad = g => g * Math.PI / 180;
  function rotacion(rx, ry, rz) {
    const [a, b, c] = [rad(rx), rad(ry), rad(rz)];
    const X = [[1, 0, 0], [0, Math.cos(a), -Math.sin(a)], [0, Math.sin(a), Math.cos(a)]];
    const Y = [[Math.cos(b), 0, Math.sin(b)], [0, 1, 0], [-Math.sin(b), 0, Math.cos(b)]];
    const Z = [[Math.cos(c), -Math.sin(c), 0], [Math.sin(c), Math.cos(c), 0], [0, 0, 1]];
    const mul = (m, n) => m.map((f, i) => [0, 1, 2].map(j => f[0] * n[0][j] + f[1] * n[1][j] + f[2] * n[2][j]));
    return mul(Z, mul(Y, X));
  }
  // Homografía del cuadrado unidad a 4 puntos (para deformar por las esquinas).
  function homografia(q) {
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q; // arriba-izq, arriba-der, abajo-der, abajo-izq
    const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
    const det = dx1 * dy2 - dx2 * dy1 || 1e-9;
    const g = (sx * dy2 - dx2 * sy) / det, h = (dx1 * sy - sx * dy1) / det;
    return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h, 1];
  }
  // Esquinas proyectadas (coordenadas homogéneas [x, y, w]) de una capa a profundidad z. W, H: tamaño del elemento.
  function esquinas3D(p, W, H, z) {
    if (p.esquinas) {
      const m = homografia(p.esquinas);
      return [[0, 0], [1, 0], [1, 1], [0, 1]].map(([u, v]) => [m[0] * u + m[1] * v + m[2], m[3] * u + m[4] * v + m[5], m[6] * u + m[7] * v + m[8]]);
    }
    const R = rotacion(p.rx, p.ry, p.rz), M = Math.max(W, H);
    const f = p.persp <= 0 ? 1e7 : M * .9 / Math.pow(p.persp / 100, 1.2);
    return [[-W / 2, -H / 2], [W / 2, -H / 2], [W / 2, H / 2], [-W / 2, H / 2]].map(([x, y]) => {
      const q = R.map(fila => fila[0] * x + fila[1] * y + fila[2] * z);
      return [q[0], q[1], Math.max(.05, (f + q[2]) / f)];
    });
  }

  // ---------- Dibujar ----------
  // fuente: lienzo con el elemento plano. W, H: su tamaño en la página. res: píxeles de salida por unidad de página.
  function dibujar(fuente, W, H, p, res) {
    prepararGL();
    const M = Math.max(W, H), prof = p.esquinas ? 0 : p.prof / 100 * M * .5;
    const capas = prof > 0 ? Math.min(90, Math.max(2, Math.ceil(prof * res / 1.2))) : 0;
    // Caja que ocupa todo una vez proyectado.
    const todas = [];
    for (const z of capas ? [0, prof] : [0]) for (const [x, y, w] of esquinas3D(p, W, H, z)) todas.push([x / w, y / w]);
    const minX = Math.min(...todas.map(t => t[0])), maxX = Math.max(...todas.map(t => t[0])), minY = Math.min(...todas.map(t => t[1])), maxY = Math.max(...todas.map(t => t[1]));
    let r = res;
    const limite = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), 4096);
    if ((maxX - minX) * r > limite || (maxY - minY) * r > limite) r = limite / Math.max(maxX - minX, maxY - minY);
    const ow = Math.max(1, Math.ceil((maxX - minX) * r)), oh = Math.max(1, Math.ceil((maxY - minY) * r));
    glCanvas.width = ow; glCanvas.height = oh;
    gl.viewport(0, 0, ow, oh);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fuente);
    const pot = n => (n & (n - 1)) === 0;
    const mip = glVersion === 2 || (pot(fuente.width) && pot(fuente.height));
    if (mip) gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    gl.uniform4f(gl.getUniformLocation(prog, 'marco'), cx, cy, 2 / (maxX - minX), 2 / (maxY - minY));
    const uTinte = gl.getUniformLocation(prog, 'tinte'), uLuz = gl.getUniformLocation(prog, 'luz');
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    const aPos = gl.getAttribLocation(prog, 'pos'), aUv = gl.getAttribLocation(prog, 'uv');
    gl.enableVertexAttribArray(aPos); gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 20, 0); gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 20, 12);
    const UV = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const capa = z => {
      const e = esquinas3D(p, W, H, z), v = [];
      for (const i of [0, 1, 2, 0, 2, 3]) v.push(e[i][0], e[i][1], e[i][2], UV[i][0], UV[i][1]);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.DYNAMIC_DRAW);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    // Luz: la cara de delante se oscurece un poco cuanto más de lado mira (luz desde arriba a la izquierda).
    const R = rotacion(p.rx, p.ry, p.rz), normal = [-R[0][2], -R[1][2], -R[2][2]], luzDir = [-.35, -.45, -.82];
    const iluminacion = Math.max(0, normal[0] * luzDir[0] + normal[1] * luzDir[1] + normal[2] * luzDir[2]);
    const fuerza = p.luz / 100;
    if (capas) {
      const c = new F.Color(p.colorProf).getSource();
      for (let i = capas; i >= 1; i--) {
        const t = i / capas, sombra = 1 - fuerza * .55 * t;
        gl.uniform4f(uTinte, c[0] / 255 * sombra, c[1] / 255 * sombra, c[2] / 255 * sombra, 1);
        capa(prof * t);
      }
    }
    gl.uniform4f(uTinte, 0, 0, 0, 0);
    gl.uniform1f(uLuz, p.esquinas ? 1 : 1 - fuerza * .35 * (1 - iluminacion));
    capa(0);
    const salida = Object.assign(document.createElement('canvas'), { width: ow, height: oh });
    salida.getContext('2d').drawImage(glCanvas, 0, 0);
    return { lienzo: salida, minX, minY, r };
  }

  // ---------- Elemento plano de origen ----------
  const cacheFuente = new WeakMap();
  async function fuentePlana(img, maxLado) {
    const guardada = cacheFuente.get(img);
    if (guardada && guardada.maxLado >= maxLado && guardada.datos === img.fuente3d) return guardada;
    const copia = JSON.parse(JSON.stringify(img.fuente3d));
    await prepararImagenes([copia]);
    const [o] = await F.util.enlivenObjects([copia]);
    o.set({ angle: 0, shadow: null, opacity: 1 });
    const W = o.getScaledWidth(), H = o.getScaledHeight(), k = Math.min(4, maxLado / Math.max(W, H, 1));
    const lienzo = o.toCanvasElement({ multiplier: k, withoutShadow: true });
    const r = { lienzo, W, H, k, maxLado, datos: img.fuente3d };
    cacheFuente.set(img, r);
    return r;
  }
  // Aplica los ajustes al elemento 3D. final = guardar en el historial (calidad completa); si no, vista previa rápida.
  async function aplicar(img, final) {
    const p = p3dDe(img), f = await fuentePlana(img, final ? 2048 : 900);
    const centro = img.centro3d || img.getCenterPoint();
    const { lienzo, minX, minY, r } = dibujar(f.lienzo, f.W, f.H, p, final ? f.k : Math.min(f.k, 900 / Math.max(f.W, f.H)));
    if (final) {
      const data = lienzo.toDataURL('image/png');
      img.imgRef = await registrarImagen(data);
      await img.setSrc(data);
    } else img.setElement(lienzo);
    img.set({ cropX: 0, cropY: 0, width: lienzo.width, height: lienzo.height, scaleX: 1 / r, scaleY: 1 / r, angle: 0, flipX: false, flipY: false,
      originX: 'left', originY: 'top', left: centro.x + minX, top: centro.y + minY });
    img.centro3d = { x: centro.x, y: centro.y };
    img.render3d = { r, minX, minY };
    img.setCoords(); img.set('dirty', true);
    canvas.requestRenderAll();
    if (final) registrar();
  }

  // Convierte un elemento normal en 3D (o vuelve a aplicar los ajustes que tenía).
  async function convertir(o, ajustes) {
    if (o.fuente3d) { Object.assign(o.p3d = p3dDe(o), ajustes || {}); return aplicar(o, true); }
    const datos = o.toObject(EXTRA);
    recorrerImagenes([datos], x => { if (x.imgRef && imagenes.has(x.imgRef)) x.src = REF + x.imgRef; });
    delete datos.p3d;
    const centro = o.getCenterPoint(), giro = o.angle || 0;
    const img = new F.FabricImage(document.createElement('canvas'), { nombre: (o.nombre || NOMBRES_TIPO[o.type] || 'Elemento').replace(/ 3D$/, '') + ' 3D', id: o.id,
      opacity: o.opacity, shadow: o.shadow, globalCompositeOperation: o.globalCompositeOperation, visible: o.visible });
    img.fuente3d = datos;
    img.p3d = { ...BASE, ...(o.p3d || {}), ...(ajustes || {}) };
    if (giro && img.p3d.rz === 0 && !o.p3d) img.p3d.rz = giro;
    img.centro3d = centro;
    const pos = canvas.getObjects().indexOf(o);
    historia.pausa = true;
    canvas.remove(o); canvas.insertAt(pos, img);
    historia.pausa = false;
    await aplicar(img, true);
    canvas.setActiveObject(img);
    refrescar();
  }
  // Vuelve al elemento original (editable), recordando los ajustes 3D.
  async function editarOriginal(img, quitar = false) {
    const copia = JSON.parse(JSON.stringify(img.fuente3d));
    await prepararImagenes([copia]);
    const [o] = await F.util.enlivenObjects([copia]);
    if (!quitar) o.p3d = img.p3d;
    o.setPositionByOrigin(img.centro3d || img.getCenterPoint(), 'center', 'center');
    o.set({ opacity: img.opacity, visible: img.visible });
    const pos = canvas.getObjects().indexOf(img);
    historia.pausa = true;
    canvas.remove(img); canvas.insertAt(pos, o);
    historia.pausa = false;
    canvas.setActiveObject(o); canvas.requestRenderAll(); registrar(); refrescar();
  }

  // ---------- Panel ----------
  const sec = document.createElement('section');
  sec.id = 'p3D'; sec.hidden = true;
  sec.innerHTML = `
    <h3>Perspectiva y 3D</h3>
    <div class="presets-3d"></div>
    <div class="ctl-3d">
      <div class="fila"><label class="ancho" title="Inclina hacia atrás o hacia delante, como un cartel tumbado en el suelo">Inclinar <input type="range" data-p="rx" min="-80" max="80"><output></output></label></div>
      <div class="fila"><label class="ancho" title="Gira hacia los lados, como una puerta que se abre">Girar <input type="range" data-p="ry" min="-80" max="80"><output></output></label></div>
      <div class="fila"><label class="ancho" title="Rota en el plano, como las agujas de un reloj">Rotar <input type="range" data-p="rz" min="-180" max="180"><output></output></label></div>
      <div class="fila"><label class="ancho" title="Lo cerca que está la cámara. 0 = sin perspectiva (isométrico); 100 = cámara muy cerca, perspectiva exagerada">Cámara <input type="range" data-p="persp" min="0" max="100"><output></output></label></div>
      <div class="fila"><label class="ancho" title="Grosor del volumen (extrusión), como unas letras de madera">Volumen <input type="range" data-p="prof" min="0" max="100"><output></output></label><input type="color" data-p="colorProf" title="Color del volumen" aria-label="Color del volumen"></div>
      <div class="fila"><label class="ancho" title="Cuánto se notan la luz y la sombra">Luz <input type="range" data-p="luz" min="0" max="100"><output></output></label></div>
    </div>
    <p class="nota modo-esquinas" hidden>Arrastra los 4 círculos de las esquinas en el lienzo. Ideal para encajar un diseño en un cartel, una pared o una pantalla de una foto.</p>
    <div class="botones">
      <button type="button" data-a="convertir" title="Convierte el elemento en 3D (el original queda guardado dentro)">Dar efecto 3D</button>
      <button type="button" data-a="esquinas" title="Perspectiva libre: mueve cada esquina por separado">Deformar esquinas</button>
      <button type="button" data-a="editar" title="Vuelve a ser texto o forma editable. Tus ajustes 3D se recuerdan">Editar el original</button>
      <button type="button" data-a="quitar" class="peligro" title="Quita el efecto y deja el elemento plano">Quitar 3D</button>
    </div>`;
  $('#pObjeto').after(sec);
  const q = s => sec.querySelector(s);
  sec.querySelector('.presets-3d').append(...Object.entries(PRESETS).map(([id, pr]) => {
    const b = Object.assign(document.createElement('button'), { type: 'button', className: 'chip-p', textContent: pr.n, title: 'Aplicar «' + pr.n + '»' });
    b.onclick = () => usarAjustes({ ...pr, n: undefined, esquinas: null });
    return b;
  }));
  const seleccionado = () => { const o = canvas.getActiveObject(); return o && activos().length === 1 && !(o instanceof F.ActiveSelection) ? o : null; };
  const es3D = o => !!o?.fuente3d;
  async function usarAjustes(cambios, final = true, objetivo = seleccionado()) {
    const o = objetivo; if (!o || o !== seleccionado()) return;
    if (!es3D(o)) return convertir(o, cambios);
    Object.assign(o.p3d = p3dDe(o), cambios);
    await aplicar(o, final);
    if (final) refrescar();
  }
  let pendiente = null, ocupado = false;
  sec.querySelectorAll('[data-p]').forEach(inp => {
    inp.addEventListener('input', () => {
      const o = seleccionado(); if (!o) return;
      if (inp.type === 'range') inp.nextElementSibling.textContent = inp.value + (['rx', 'ry', 'rz'].includes(inp.dataset.p) ? '°' : ' %');
      pendiente = { cambios: { [inp.dataset.p]: inp.type === 'range' ? +inp.value : inp.value, esquinas: null }, o };
      if (!es3D(o)) return;
      // Vista previa: como mucho una por fotograma de pantalla, y solo sobre el elemento que se estaba ajustando.
      if (ocupado) return;
      ocupado = true;
      requestAnimationFrame(async () => { try { await usarAjustes(pendiente.cambios, false, pendiente.o); } finally { ocupado = false; } });
    });
    inp.addEventListener('change', () => usarAjustes({ [inp.dataset.p]: inp.type === 'range' ? +inp.value : inp.value, esquinas: null }, true));
  });
  sec.querySelector('[data-a=convertir]').onclick = () => { const o = seleccionado(); if (o && !es3D(o)) convertir(o, o.p3d ? null : PRESETS.volumen); };
  sec.querySelector('[data-a=editar]').onclick = () => { const o = seleccionado(); if (es3D(o)) editarOriginal(o); };
  sec.querySelector('[data-a=quitar]').onclick = () => { const o = seleccionado(); if (es3D(o)) editarOriginal(o, true); };
  sec.querySelector('[data-a=esquinas]').onclick = async () => {
    const o = seleccionado(); if (!o) return;
    if (!es3D(o)) await convertir(o, { prof: 0 });
    const img = seleccionado();
    esquinasDe = esquinasDe === img ? null : img;
    if (esquinasDe && !img.p3d.esquinas) {
      // Empieza desde la forma que tiene ahora (sin saltos).
      const f = await fuentePlana(img, 900);
      img.p3d.esquinas = esquinas3D(p3dDe(img), f.W, f.H, 0).map(([x, y, w]) => [x / w, y / w]);
      img.p3d.prof = 0;
    }
    refrescar(); canvas.requestRenderAll();
  };

  function refrescar() {
    const o = seleccionado();
    sec.hidden = !o || (typeof Imagen !== 'undefined' && $('#pImagen') && (!$('#modoRecorte').hidden || !$('#modoVarita').hidden));
    if (!o) { esquinasDe = null; return; }
    if (esquinasDe && esquinasDe !== o) esquinasDe = null;
    const tiene = es3D(o), p = p3dDe(o);
    sec.classList.toggle('activo3d', tiene);
    q('[data-a=convertir]').hidden = tiene;
    q('[data-a=convertir]').textContent = o.p3d ? 'Volver a aplicar el 3D' : 'Dar efecto 3D';
    q('[data-a=editar]').hidden = q('[data-a=quitar]').hidden = !tiene;
    q('[data-a=esquinas]').classList.toggle('activo', !!esquinasDe);
    q('.modo-esquinas').hidden = !esquinasDe;
    q('.ctl-3d').classList.toggle('apagado', !!p.esquinas);
    sec.querySelectorAll('[data-p]').forEach(inp => {
      inp.value = p[inp.dataset.p];
      if (inp.type === 'range') inp.nextElementSibling.textContent = p[inp.dataset.p] + (['rx', 'ry', 'rz'].includes(inp.dataset.p) ? '°' : ' %');
    });
  }
  ['selection:created', 'selection:updated', 'selection:cleared'].forEach(ev => canvas.on(ev, () => setTimeout(refrescar)));
  // Si el elemento 3D se mueve, se escala o se gira a mano, se pasa al original y se vuelve a dibujar nítido.
  canvas.on('object:modified', async ({ target: o }) => {
    if (!es3D(o) || !o.render3d || arrastrando >= 0) return;
    const { r, minX, minY } = o.render3d;
    const local = new F.Point(-minX * r - o.width / 2, -minY * r - o.height / 2);
    o.centro3d = F.util.transformPoint(local, o.calcTransformMatrix());
    const sx = o.scaleX * r, sy = o.scaleY * r, giro = o.angle || 0;
    if (Math.abs(sx - 1) < .002 && Math.abs(sy - 1) < .002 && !giro) return;
    o.fuente3d.scaleX = (o.fuente3d.scaleX || 1) * sx; o.fuente3d.scaleY = (o.fuente3d.scaleY || 1) * sy;
    if (o.p3d.esquinas) o.p3d.esquinas = o.p3d.esquinas.map(([x, y]) => [x * sx, y * sy]);
    if (giro) o.p3d = { ...p3dDe(o), rz: ((p3dDe(o).rz + giro + 540) % 360) - 180 };
    cacheFuente.delete(o);
    historia.pausa = true; await aplicar(o, true); historia.pausa = false;
    registrar(); refrescar();
  });

  // ---------- Deformar por las esquinas (asas en el lienzo) ----------
  let esquinasDe = null, arrastrando = -1;
  const puntoAsa = (img, i) => { const c = img.centro3d, [x, y] = img.p3d.esquinas[i]; return new F.Point(c.x + x, c.y + y); };
  canvas.on('after:render', ({ ctx }) => {
    if (!esquinasDe || exportando || !canvas.getObjects().includes(esquinasDe)) return;
    const v = canvas.viewportTransform, img = esquinasDe;
    ctx.save();
    const pts = [0, 1, 2, 3].map(i => F.util.transformPoint(puntoAsa(img, i), v));
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--acento').trim() || '#7b5cd6';
    ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.stroke();
    ctx.setLineDash([]);
    for (const p of pts) { ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke(); }
    ctx.restore();
  });
  mesa.addEventListener('pointerdown', e => {
    if (!esquinasDe || e.button > 0) return;
    const r = canvas.upperCanvasEl.getBoundingClientRect(), v = canvas.viewportTransform;
    const i = [0, 1, 2, 3].findIndex(k => { const p = F.util.transformPoint(puntoAsa(esquinasDe, k), v); return Math.hypot(p.x - (e.clientX - r.left), p.y - (e.clientY - r.top)) < (e.pointerType === 'mouse' ? 14 : 24); });
    if (i < 0) return;
    e.stopPropagation(); e.preventDefault();
    arrastrando = i;
    try { mesa.setPointerCapture(e.pointerId); } catch {}
  }, true);
  mesa.addEventListener('pointermove', e => {
    if (arrastrando < 0) return;
    e.stopPropagation();
    const img = esquinasDe, p = canvas.getScenePoint(e);
    img.p3d.esquinas[arrastrando] = [p.x - img.centro3d.x, p.y - img.centro3d.y];
    if (ocupado) return;
    ocupado = true;
    requestAnimationFrame(async () => { try { await aplicar(img, false); } finally { ocupado = false; } });
  }, true);
  const soltar = async e => {
    if (arrastrando < 0) return;
    e.stopPropagation(); arrastrando = -1;
    await aplicar(esquinasDe, true); refrescar();
  };
  mesa.addEventListener('pointerup', soltar, true);
  mesa.addEventListener('pointercancel', soltar, true);

  return { convertir, editarOriginal, aplicar, PRESETS, dibujar, refrescar };
})();
