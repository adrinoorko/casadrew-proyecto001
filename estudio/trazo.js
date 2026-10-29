// CASADREW · Estudio — motor de trazos a mano (Apple Pencil, dedo o ratón).
// Recoge puntos con presión de los eventos de puntero y los convierte en un contorno suave con perfect-freehand.
const Trazo = {
  PINCELES: {
    lapiz:     { n: 'Lápiz',     tam: 4,  thinning: .65, inclinacion: true },
    tinta:     { n: 'Tinta',     tam: 10, thinning: .75, afinar: true },
    rotulador: { n: 'Rotulador', tam: 12, thinning: 0 },
    pincel:    { n: 'Pincel',    tam: 24, thinning: .85, afinar: true },
    marcador:  { n: 'Marcador',  tam: 30, thinning: 0, opacidad: .45, fusion: 'multiply' },
  },

  // Presión de 0 a 1. Con el ratón o el dedo no hay presión real: se simula por la velocidad.
  // Con el lápiz inclinado, el pincel "lápiz" ensancha el trazo, como al sombrear.
  punto(e, x, y, pincel) {
    let p = e.pointerType === 'pen' && e.pressure > 0 ? e.pressure : .5;
    if (pincel.inclinacion && e.pointerType === 'pen') {
      const inc = Math.min(1, Math.hypot(e.tiltX || 0, e.tiltY || 0) / 60);
      p = Math.min(1, p * (1 + inc));
    }
    return [x, y, p];
  },
  hayPresion: e => e.pointerType === 'pen',

  opciones(pincel, { tam, estabilizar = .5, conPresion = true } = {}) {
    return {
      size: tam ?? pincel.tam, thinning: pincel.thinning, smoothing: .55, streamline: Math.min(.95, Math.max(0, estabilizar)),
      simulatePressure: !conPresion && pincel.thinning > 0, last: true,
      start: { taper: pincel.afinar ? (tam ?? pincel.tam) * 2 : 0, cap: true },
      end: { taper: pincel.afinar ? (tam ?? pincel.tam) * 2 : 0, cap: true },
    };
  },

  // Contorno -> trazado SVG ("M … Q … T … Z").
  aSVG(puntos, opc) {
    const c = PerfectFreehand.getStroke(puntos, opc);
    if (c.length < 4) return '';
    const m = (a, b) => ((a + b) / 2).toFixed(2), f = n => n.toFixed(2);
    let [a, b] = c; const d = c[2];
    let s = `M${f(a[0])},${f(a[1])} Q${f(b[0])},${f(b[1])} ${m(b[0], d[0])},${m(b[1], d[1])} T`;
    for (let i = 2; i < c.length - 1; i++) { a = c[i]; b = c[i + 1]; s += `${m(a[0], b[0])},${m(a[1], b[1])} `; }
    return s + 'Z';
  },

  // Puntos de un evento, incluidos los intermedios que el sistema agrupa (más fluidez con el Pencil).
  eventos(e) {
    const lista = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
    return lista.length ? lista : [e];
  },

  ajustes(clave, porDefecto) {
    try { return { ...porDefecto, ...JSON.parse(localStorage.getItem(clave) || '{}') }; } catch { return { ...porDefecto }; }
  },
  guardarAjustes(clave, valor) { try { localStorage.setItem(clave, JSON.stringify(valor)); } catch {} },
};
