// CASADREW · Estudio — biblioteca de elementos (la usan la pantalla de inicio y el editor).
// Todo lo de este archivo es diseño original de CASADREW (formas, moda, marcos, neón, 3D, texturas…), libre de derechos de terceros.
// Los iconos vienen aparte, de Tabler Icons (licencia MIT), en recursos/iconos-tabler.js: ver recursos/PROCEDENCIA.md.
// Cada elemento es de uno de estos tipos:
//   svg: dibujo vectorial (se puede cambiar de color)      crear: elementos del editor (textos editables, formas…)
//   textura: imagen generada en el aparato (tejidos, papel, mármol…)      icono: icono de Tabler
'use strict';
const Elementos = (() => {
  const F = fabric;
  const CATS = [
    { id: 'formas', n: 'Formas' }, { id: 'iconos', n: 'Iconos' }, { id: 'moda', n: 'Moda' }, { id: 'marcos', n: 'Marcos' },
    { id: 'stickers', n: 'Stickers' }, { id: 'ilustraciones', n: 'Ilustraciones' }, { id: 'neon', n: 'Brillo y neón' }, { id: '3d', n: '3D' },
    { id: 'degradados', n: 'Degradados' }, { id: 'texturas', n: 'Texturas y tejidos' }, { id: 'fondos', n: 'Fondos' },
    { id: 'efectos', n: 'Efectos' }, { id: 'lineas', n: 'Líneas' }, { id: 'web', n: 'Diseño web' },
  ];
  const LISTA = [];
  const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const add = (cat, n, def, tags = '') => LISTA.push({ id: cat + '-' + slug(n), n, cat, tags, ...def });

  // ---------- Ayudas para dibujar ----------
  const svg = (cuerpo, vb = '0 0 200 200') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${cuerpo}</svg>`;
  const f1 = n => +n.toFixed(1);
  const circ = (cx, cy, r) => `M${f1(cx - r)} ${f1(cy)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  const pts = (lista) => 'M' + lista.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L') + 'Z';
  const poli = (n, r, cx = 100, cy = 100, giro = -90) => pts(Array.from({ length: n }, (_, i) => { const a = (giro + 360 * i / n) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }));
  const estrella = (n, r1, r2, cx = 100, cy = 100) => pts(Array.from({ length: 2 * n }, (_, i) => { const r = i % 2 ? r2 : r1, a = (-90 + 180 * i / n) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }));
  const relleno = (d, c, extra = '') => `<path d="${d}" fill="${c}" ${extra}/>`;
  const linea = (d, c = '#1a1a1a', g = 3, extra = '') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${g}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  const prenda = (d, extra = '') => `<path d="${d}" fill="#ffffff" stroke="#1a1a1a" stroke-width="2.5" stroke-linejoin="round" ${extra}/>`;
  const costura = d => `<path d="${d}" fill="none" stroke="#1a1a1a" stroke-width="1.3" stroke-dasharray="4 3"/>`;
  const detalle = d => `<path d="${d}" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  const azar = semilla => () => { semilla |= 0; semilla = semilla + 0x6D2B79F5 | 0; let t = Math.imul(semilla ^ semilla >>> 15, 1 | semilla); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const degL = (stops, ang = 90) => {
    const a = ang * Math.PI / 180, x = Math.cos(a) / 2, y = Math.sin(a) / 2;
    return new F.Gradient({ type: 'linear', gradientUnits: 'percentage', coords: { x1: .5 - x, y1: .5 - y, x2: .5 + x, y2: .5 + y }, colorStops: stops.map((c, i) => ({ offset: i / (stops.length - 1), color: c })) });
  };
  const degR = (stops, cx = .5, cy = .5, r = .5) => new F.Gradient({ type: 'radial', gradientUnits: 'percentage', coords: { x1: cx, y1: cy, r1: 0, x2: cx, y2: cy, r2: r }, colorStops: stops.map((c, i) => ({ offset: i / (stops.length - 1), color: c })) });
  const T = (texto, o) => new F.Textbox(texto, { fontFamily: 'Segoe UI', fill: '#1a1a1a', fontSize: 28, textAlign: 'center', ...o, nombre: o.nombre || texto.split('\n')[0].slice(0, 28) });
  const R = o => new F.Rect({ strokeWidth: 0, ...o });
  const C = o => new F.Circle({ strokeWidth: 0, ...o });
  const brillo = (c, blur = 28) => new F.Shadow({ color: c, blur, offsetX: 0, offsetY: 0 });
  const sombra = (blur = 24, y = 10, c = 'rgba(0,0,0,.18)') => new F.Shadow({ color: c, blur, offsetX: 0, offsetY: y });

  // ---------- Formas ----------
  const CORAZON = 'M100 178C40 130 8 98 8 62 8 34 30 14 56 14c20 0 36 12 44 28 8-16 24-28 44-28 26 0 48 20 48 48 0 36-32 68-92 116Z';
  const NUBE = circ(62, 112, 42) + circ(104, 86, 52) + circ(146, 114, 40) + 'M62 154H146V120H62Z';
  [
    ['Corazón', CORAZON, '#e8577a', 'amor love san valentín'], ['Estrella', estrella(5, 92, 38), '#e8b730'], ['Estrella de 4 puntas', estrella(4, 92, 26), '#7b5cd6', 'brillo destello'],
    ['Estrella de 6 puntas', estrella(6, 90, 52), '#2f7fe0'], ['Estrella de 8 puntas', estrella(8, 90, 58), '#1f9e74'], ['Sello dentado', estrella(24, 92, 80), '#c8643b', 'insignia oferta'],
    ['Explosión', estrella(14, 94, 62), '#ff3d7f', 'cómic boom'], ['Pentágono', poli(5, 90), '#8a5cc8'], ['Octógono', poli(8, 90, 100, 100, -67.5), '#d64545'],
    ['Rombo', pts([[100, 8], [184, 100], [100, 192], [16, 100]]), '#2e9e6b', 'diamante'], ['Paralelogramo', pts([[50, 40], [190, 40], [150, 160], [10, 160]]), '#3b7dc8'],
    ['Trapecio', pts([[55, 40], [145, 40], [190, 160], [10, 160]]), '#c99a2e'], ['Cruz', 'M75 10H125V75H190V125H125V190H75V125H10V75H75Z', '#d64545', 'más plus'],
    ['Flecha', 'M10 75H130V35L190 100 130 165V125H10Z', '#1a1a1a', 'derecha'], ['Flecha doble', 'M10 100 60 45V78H140V45L190 100 140 155V122H60V155Z', '#1a1a1a'],
    ['Flecha curva', 'M30 170C30 90 70 50 130 50V18L188 70 130 122V90C88 90 64 116 64 170Z', '#c8643b', 'girar'],
    ['Chevron', 'M20 30H110L180 100 110 170H20L90 100Z', '#7b5cd6', 'flecha'], ['Bocadillo', 'M30 20H170Q190 20 190 40V120Q190 140 170 140H92L50 182 58 140H30Q10 140 10 120V40Q10 20 30 20Z', '#ffffff', 'diálogo chat mensaje'],
    ['Bocadillo redondo', 'M100 20C150 20 190 50 190 88S150 156 100 156C88 156 77 154 67 151L24 178 38 136C20 123 10 106 10 88 10 50 50 20 100 20Z', '#ffffff', 'diálogo chat'],
    ['Nube', NUBE, '#9fc6ef', 'cielo'], ['Gota', 'M100 10C130 60 165 95 165 130A65 65 0 0 1 35 130C35 95 70 60 100 10Z', '#3fa4ff', 'agua lágrima'],
    ['Rayo', 'M118 8 38 112H96L78 192 162 82H104Z', '#e8b730', 'electricidad energía'], ['Luna', 'M130 16A86 86 0 1 0 186 132 70 70 0 1 1 130 16Z', '#f2d16b', 'noche'],
    ['Escudo', 'M100 10 180 40V100C180 145 145 175 100 192 55 175 20 145 20 100V40Z', '#2b579a'], ['Etiqueta', 'M20 50 70 10H180V190H70L20 150ZM60 100m-14 0a14 14 0 1 0 28 0a14 14 0 1 0-28 0', '#c8643b', 'precio tag', 'fill-rule="evenodd"'],
    ['Anillo', circ(100, 100, 90) + circ(100, 100, 52), '#1f9e74', 'aro donut', 'fill-rule="evenodd"'], ['Medio círculo', 'M10 140A90 90 0 0 1 190 140Z', '#ff8a3d', 'arco'],
    ['Cinta', 'M0 60H40V40H160V60H200L180 100 200 140H160V160H40V140H0L20 100Z', '#d63d86', 'banner lazo'], ['Píldora', 'M60 60H140A40 40 0 0 1 140 140H60A40 40 0 0 1 60 60Z', '#7b5cd6', 'cápsula'],
    ['Forma orgánica 1', 'M152 48C182 76 186 128 158 160S78 196 46 166 8 82 40 48 122 20 152 48Z', '#f5b8c4', 'blob mancha'],
    ['Forma orgánica 2', 'M44 40C80 8 150 14 176 58S180 160 138 180 40 186 22 140 8 72 44 40Z', '#b8e0d2', 'blob mancha'],
    ['Forma orgánica 3', 'M100 14C140 10 190 44 186 96S148 190 98 186 10 150 16 96 60 18 100 14Z', '#ffd9a8', 'blob mancha'],
    ['Engranaje', estrella(12, 92, 74) + circ(100, 100, 30), '#5f6672', 'rueda ajustes', 'fill-rule="evenodd"'],
    ['Flor geométrica', [0, 60, 120, 180, 240, 300].map(a => circ(100 + 45 * Math.cos(a * Math.PI / 180), 100 + 45 * Math.sin(a * Math.PI / 180), 45)).join(''), '#e86fa3'],
  ].forEach(([n, d, c, tags = '', extra = '']) => add('formas', n, { svg: svg(relleno(d, c, extra + (c === '#ffffff' ? ' stroke="#1a1a1a" stroke-width="3"' : ''))) }, tags));

  // ---------- Líneas y divisores ----------
  [
    ['Línea ondulada', linea('M10 100Q32 70 55 100T100 100 145 100 190 100', '#1a1a1a', 4), 'onda'],
    ['Zigzag', linea('M10 110L28 90 46 110 64 90 82 110 100 90 118 110 136 90 154 110 172 90 190 110', '#1a1a1a', 4)],
    ['Línea discontinua', linea('M10 100H190', '#1a1a1a', 4, 'stroke-dasharray="12 8"'), 'puntos'],
    ['Línea de puntos', linea('M10 100H190', '#1a1a1a', 7, 'stroke-dasharray="0.1 16"'), 'punteada'],
    ['Divisor con rombo', linea('M10 100H80M120 100H190', '#1a1a1a', 3) + relleno(pts([[100, 86], [114, 100], [100, 114], [86, 100]]), '#1a1a1a'), 'separador'],
    ['Divisor floral', linea('M10 100H70M130 100H190', '#8c6a4f', 2.5) + linea('M100 100C90 80 72 84 78 96S100 108 100 100C100 108 116 110 122 96S110 80 100 100Z', '#8c6a4f', 2.5) + relleno(circ(100, 100, 5), '#8c6a4f'), 'adorno separador'],
    ['Subrayado de pincel', relleno('M8 112C50 96 120 92 192 98L190 112C130 106 70 110 12 126Z', '#e8577a'), 'brocha trazo'],
    ['Círculo a mano', linea('M150 52C126 26 60 30 34 72S40 168 104 170 182 128 168 82C160 58 128 40 92 44', '#d63d86', 5), 'rodear marcar'],
    ['Flecha dibujada', linea('M20 150C50 80 110 60 170 60M140 34 172 60 142 90', '#1a1a1a', 5), 'garabato'],
    ['Espiral', linea('M100 100C100 92 112 92 112 100S100 118 88 108 84 80 104 76 134 92 128 116 96 146 70 126 56 82 86 60 150 62 160 110', '#7b5cd6', 4)],
    ['Garabato', linea('M14 120C30 70 46 140 64 96S94 70 104 118 136 150 146 96 176 78 188 112', '#1f9e74', 5), 'squiggle'],
  ].forEach(([n, cuerpo, tags = '']) => add('lineas', n, { svg: svg(cuerpo) }, tags));

  // ---------- Marcos ----------
  const marcoSVG = (cuerpo, vb) => svg(cuerpo, vb);
  [
    ['Marco simple', relleno('M0 0H200V200H0ZM14 14V186H186V14Z', '#1a1a1a', 'fill-rule="evenodd"')],
    ['Marco redondeado', relleno('M30 0H170A30 30 0 0 1 200 30V170A30 30 0 0 1 170 200H30A30 30 0 0 1 0 170V30A30 30 0 0 1 30 0ZM34 14A20 20 0 0 0 14 34V166A20 20 0 0 0 34 186H166A20 20 0 0 0 186 166V34A20 20 0 0 0 166 14Z', '#c8643b', 'fill-rule="evenodd"')],
    ['Marco doble', `<rect x="4" y="4" width="192" height="192" fill="none" stroke="#1a1a1a" stroke-width="4"/><rect x="16" y="16" width="168" height="168" fill="none" stroke="#1a1a1a" stroke-width="1.5"/>`],
    ['Marco circular', relleno(circ(100, 100, 96) + circ(100, 100, 82), '#c99a2e', 'fill-rule="evenodd"'), 'redondo'],
    ['Marco de arco', relleno('M0 200V90A100 90 0 0 1 200 90V200ZM14 186H186V92A86 78 0 0 0 14 92Z', '#8c9a7a', 'fill-rule="evenodd"'), 'ventana'],
    ['Esquinas decorativas', ['M8 50V8H50', 'M150 8H192V50', 'M192 150V192H150', 'M50 192H8V150'].map(d => linea(d, '#1a1a1a', 4)).join('') + [[22, 22], [178, 22], [178, 178], [22, 178]].map(([x, y]) => relleno(circ(x, y, 5), '#1a1a1a')).join(''), 'ornamento'],
    ['Polaroid', `<rect x="10" y="4" width="180" height="210" rx="4" fill="#ffffff" stroke="#e2e2e2" stroke-width="1"/><rect x="22" y="16" width="156" height="150" fill="#d9e4f2"/>`, 'foto instantánea', '0 0 200 220'],
    ['Tira de película', `<rect x="0" y="0" width="200" height="200" fill="#1a1a1a"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="${8 + i * 24}" y="8" width="12" height="14" rx="2" fill="#ffffff"/><rect x="${8 + i * 24}" y="178" width="12" height="14" rx="2" fill="#ffffff"/>`).join('')}<rect x="10" y="32" width="180" height="136" fill="#ececec"/>`, 'cine foto'],
    ['Sello de correos', `<path d="${'M0 0H200V200H0Z' + Array.from({ length: 10 }, (_, i) => circ(10 + i * 20, 0, 6) + circ(10 + i * 20, 200, 6) + circ(0, 10 + i * 20, 6) + circ(200, 10 + i * 20, 6)).join('')}" fill="#ffffff" fill-rule="evenodd" stroke="#d9cfc2" stroke-width="1"/><rect x="18" y="18" width="164" height="164" fill="#f3d6c4"/>`, 'postal estampilla'],
    ['Entrada de evento', `<path d="M0 0H200V70A14 14 0 0 0 200 98V200H0V98A14 14 0 0 0 0 70Z" fill="#7b5cd6"/>${linea('M14 84H186', '#ffffff', 2, 'stroke-dasharray="6 6"')}`, 'ticket billete'],
    ['Marco festoneado', relleno(Array.from({ length: 16 }, (_, i) => { const a = i * Math.PI / 8; return circ(100 + 82 * Math.cos(a), 100 + 82 * Math.sin(a), 18); }).join('') + circ(100, 100, 84), '#f5b8c4'), 'ondas'],
  ].forEach(([n, cuerpo, tags = '', vb]) => add('marcos', n, { svg: marcoSVG(cuerpo, vb) }, tags));

  // ---------- Moda: prendas planas (flats), detalles y accesorios ----------
  const MODA = [
    ['Camiseta', prenda('M72 22Q100 40 128 22L168 38 192 80 162 94 152 76V184H48V76L38 94 8 80 32 38Z') + detalle('M72 22Q100 54 128 22') + costura('M50 174H150') + costura('M14 74 36 86M186 74 164 86'), 'prenda flat camiseta tshirt'],
    ['Camiseta de tirantes', prenda('M76 14H90Q100 48 110 14H124L130 60Q148 70 150 92V186H50V92Q52 70 70 60Z') + costura('M52 176H148'), 'top tank'],
    ['Camisa', prenda('M76 18 100 30 124 18 168 36 194 120 172 128 152 84V188H48V84L28 128 6 120 32 36Z') + prenda('M76 18 100 30 92 48 70 28Z') + prenda('M124 18 100 30 108 48 130 28Z') + detalle('M100 30V188') + [60, 90, 120, 150, 176].map(y => `<circle cx="104" cy="${y}" r="3" fill="#1a1a1a"/>`).join('') + costura('M174 118 192 124M8 124 26 118'), 'prenda flat blusa'],
    ['Sudadera con capucha', prenda('M66 30Q100 -6 134 30L170 46 196 150 172 158 154 96V178H46V96L28 158 4 150 30 46Z') + prenda('M72 34Q100 70 128 34Q120 10 100 8 80 10 72 34Z') + detalle('M92 52 88 92M108 52 112 92') + prenda('M62 130H138L150 168H50Z') + costura('M48 170H152'), 'hoodie prenda'],
    ['Chaqueta', prenda('M70 18 100 30 130 18 170 40 192 170 168 176 152 96V188H48V96L32 176 8 170 30 40Z') + prenda('M70 18 100 30 100 110 76 70Z') + prenda('M130 18 100 30 100 110 124 70Z') + detalle('M100 110V188') + [124, 152].map(y => `<circle cx="94" cy="${y}" r="3.5" fill="#1a1a1a"/>`).join('') + detalle('M58 140H82M118 140H142'), 'americana blazer abrigo'],
    ['Vestido', prenda('M78 14H86L90 48Q100 56 110 48L114 14H122L128 60Q120 78 124 94L178 186H22L76 94Q80 78 72 60Z') + detalle('M76 94Q100 102 124 94') + costura('M28 178Q100 188 172 178'), 'prenda flat'],
    ['Falda', prenda('M60 26H140V44H60Z') + prenda('M60 44H140L172 182H28Z') + detalle('M84 44 74 182M116 44 126 182M100 44V182') + costura('M32 172H168'), 'prenda flat'],
    ['Pantalón', prenda('M56 16H144L152 188H108L100 78 92 188H48Z') + detalle('M56 32H144M100 32V64Q100 74 92 78') + detalle('M58 34Q72 52 86 34M142 34Q128 52 114 34') + costura('M52 178H90M110 178H148'), 'vaqueros jeans prenda'],
    ['Pantalón corto', prenda('M54 30H146L160 130H110L100 74 90 130H40Z') + detalle('M54 46H146M100 46V72') + costura('M44 120H88M112 120H156'), 'shorts bermuda'],
    ['Bolso de mano', prenda('M30 80H170L182 180H18Z') + detalle('M66 80C66 36 134 36 134 80') + detalle('M30 104H170') + `<rect x="92" y="98" width="16" height="14" rx="2" fill="#1a1a1a"/>`, 'accesorio cartera'],
    ['Bolso tote', prenda('M40 70H160L170 186H30Z') + detalle('M70 70V42Q70 22 86 22H114Q130 22 130 42V70'), 'accesorio bolsa compra'],
    ['Gorra', prenda('M30 120C30 60 70 36 110 36S186 62 186 120Z') + prenda('M30 120H186L198 136Q150 146 104 140L8 132Z') + detalle('M108 36V120M70 46Q86 80 84 120') + `<circle cx="108" cy="36" r="4" fill="#1a1a1a"/>`, 'accesorio sombrero'],
    ['Sombrero', prenda('M10 140Q100 112 190 140Q100 168 10 140Z') + prenda('M58 132Q56 70 74 52Q100 40 126 52Q144 70 142 132Q100 120 58 132Z') + detalle('M60 112Q100 100 140 112'), 'accesorio fedora'],
    ['Gafas de sol', `<path d="M14 80H86Q90 120 66 132H38Q14 124 14 80ZM114 80H186Q186 124 162 132H134Q110 120 114 80Z" fill="#1a1a1a"/>` + detalle('M86 86Q100 76 114 86M14 80 4 70M186 80 196 70'), 'accesorio lentes'],
    ['Zapato de tacón', prenda('M14 150Q14 132 40 128L104 112Q130 104 150 70L170 64Q178 74 172 104L166 150Z') + prenda('M150 150H166L160 190H152Z') + detalle('M14 150H150'), 'accesorio calzado stiletto'],
    ['Zapatilla', prenda('M10 150V110Q40 108 66 86L90 80Q120 104 160 108Q190 112 192 140V150Z') + prenda('M10 150H192V164Q100 170 10 164Z') + detalle('M80 90 96 104M90 84 106 98M100 80 116 94'), 'deportiva sneaker calzado'],
    ['Collar', linea('M30 30Q100 150 170 30', '#c99a2e', 3) + relleno(pts([[100, 112], [116, 132], [100 , 158], [84, 132]]), '#7b5cd6') + relleno(circ(100, 112, 5), '#c99a2e'), 'joya colgante'],
    ['Cinturón', `<rect x="4" y="84" width="192" height="32" rx="4" fill="#5d4a3f"/><rect x="40" y="76" width="44" height="48" rx="6" fill="none" stroke="#c99a2e" stroke-width="7"/>` + detalle('M62 84V116') + [120, 140, 160].map(x => `<circle cx="${x}" cy="100" r="3.5" fill="#2a1d16"/>`).join(''), 'accesorio cuero hebilla'],
    ['Botón de 4 agujeros', relleno(circ(100, 100, 80) + circ(78, 78, 10) + circ(122, 78, 10) + circ(78, 122, 10) + circ(122, 122, 10), '#c8643b', 'fill-rule="evenodd"') + linea(circ(100, 100, 64), '#00000033', 3), 'detalle mercería'],
    ['Botón de 2 agujeros', relleno(circ(100, 100, 80) + circ(80, 100, 11) + circ(120, 100, 11), '#2b579a', 'fill-rule="evenodd"') + linea(circ(100, 100, 66), '#ffffff55', 3), 'detalle mercería'],
    ['Cremallera', `<rect x="88" y="0" width="24" height="200" fill="#5f6672"/>${Array.from({ length: 16 }, (_, i) => `<rect x="${i % 2 ? 100 : 84}" y="${6 + i * 11}" width="16" height="7" rx="2" fill="#c0c4cc"/>`).join('')}<path d="M86 120H114V150Q100 164 86 150Z" fill="#c0c4cc" stroke="#5f6672" stroke-width="2"/><rect x="94" y="150" width="12" height="36" rx="5" fill="#c0c4cc" stroke="#5f6672" stroke-width="2"/>`, 'detalle cierre zip', '0 0 200 200'],
    ['Bolsillo', prenda('M40 40H160V150L100 176 40 150Z') + costura('M50 50H150V144L100 166 50 144Z') + detalle('M40 70H160'), 'detalle parche'],
    ['Cuello de camisa', prenda('M40 60 100 90 160 60 170 110 122 120 100 90 78 120 30 110Z') + costura('M44 70 98 96M156 70 102 96'), 'detalle'],
    ['Volante', relleno('M0 60H200V90' + Array.from({ length: 8 }, (_, i) => `Q${187.5 - i * 25} 150 ${175 - i * 25} 90`).join('') + 'Z', '#f5b8c4', 'stroke="#1a1a1a" stroke-width="2"'), 'detalle frunce ruffle'],
    ['Etiqueta de prenda', `<rect x="20" y="50" width="160" height="100" rx="8" fill="#ffffff" stroke="#1a1a1a" stroke-width="2.5"/>` + costura('M30 60H170M30 140H170') + `<text x="100" y="96" text-anchor="middle" font-family="Georgia" font-size="26" fill="#1a1a1a">THE NOORKO</text><text x="100" y="124" text-anchor="middle" font-family="Segoe UI" font-size="16" fill="#555">TALLA M · 100 % ALGODÓN</text>`, 'detalle marca label'],
    ['Pespunte', linea('M10 100H190', '#1a1a1a', 2.5, 'stroke-dasharray="8 6"'), 'costura detalle'],
    ['Lazo', relleno('M100 100C70 60 20 50 18 80S60 130 100 100ZM100 100C130 60 180 50 182 80S140 130 100 100ZM100 100 74 170H96L100 120 104 170H126Z', '#d63d86') + relleno(circ(100, 100, 14), '#b02a6c'), 'moño bow cinta'],
    ['Diamante', relleno('M50 40H150L190 80 100 180 10 80Z', '#7fd0f5') + linea('M10 80H190M50 40 76 80 100 180 124 80 150 40M76 80 100 40 124 80', '#2f7fe0', 2), 'joya gema brillante'],
  ];
  MODA.forEach(([n, cuerpo, tags = '', vb]) => add('moda', n, { svg: svg(cuerpo, vb) }, tags));

  // ---------- Ilustraciones y decorativos ----------
  const petalos = (n, rx, ry, dist, color, centro) => Array.from({ length: n }, (_, i) => `<ellipse cx="100" cy="${100 - dist}" rx="${rx}" ry="${ry}" fill="${color}" transform="rotate(${360 * i / n} 100 100)"/>`).join('') + relleno(circ(100, 100, centro[0]), centro[1]);
  [
    ['Hoja', relleno('M30 170C30 90 90 30 176 24 170 110 110 170 30 170Z', '#5aa469') + linea('M30 170Q100 100 160 40', '#2e6b3a', 3), 'planta naturaleza'],
    ['Rama con hojas', linea('M20 180Q100 110 180 20', '#5d4a3f', 4) + [[60, 140, -30], [90, 112, 40], [116, 86, -40], [140, 60, 35], [160, 40, -45]].map(([x, y, a]) => `<ellipse cx="${x}" cy="${y - 18}" rx="11" ry="24" fill="#6fb07a" transform="rotate(${a} ${x} ${y})"/>`).join(''), 'planta botánica'],
    ['Flor', petalos(5, 30, 44, 42, '#f28fb1', [24, '#f2c14e']), 'naturaleza'],
    ['Margarita', petalos(12, 12, 40, 46, '#ffffff', [26, '#f2c14e']).replace(/fill="#ffffff"/g, 'fill="#ffffff" stroke="#e2d6c8" stroke-width="1.5"'), 'flor'],
    ['Tulipán', linea('M100 190V100', '#4f8a5b', 5) + relleno('M100 160C80 150 60 130 64 116 84 124 96 140 100 160Z', '#5aa469') + relleno('M64 40 82 64 100 34 118 64 136 40C142 86 126 110 100 110S58 86 64 40Z', '#e8577a'), 'flor'],
    ['Sol', relleno(circ(100, 100, 46), '#f2b33d') + Array.from({ length: 12 }, (_, i) => `<rect x="96" y="12" width="8" height="30" rx="4" fill="#f2b33d" transform="rotate(${i * 30} 100 100)"/>`).join(''), 'verano tiempo'],
    ['Luna y estrellas', relleno('M120 26A76 76 0 1 0 176 136 62 62 0 1 1 120 26Z', '#f2d16b') + relleno(estrella(4, 14, 4, 160, 50), '#f2d16b') + relleno(estrella(4, 9, 3, 40, 40), '#f2d16b'), 'noche'],
    ['Montañas', relleno('M0 180 70 60 110 120 140 80 200 180Z', '#6c7a91') + relleno('M70 60 88 92 76 86 62 96 56 84Z', '#ffffff'), 'paisaje naturaleza'],
    ['Olas', relleno('M0 120Q25 96 50 120T100 120 150 120 200 120V200H0Z', '#3fa4ff') + relleno('M0 150Q25 126 50 150T100 150 150 150 200 150V200H0Z', '#2b6fc2'), 'mar agua'],
    ['Arcoíris', ['#e8577a', '#f2b33d', '#5aa469', '#3fa4ff', '#7b5cd6'].map((c, i) => linea(`M${20 + i * 12} 160A${80 - i * 12} ${80 - i * 12} 0 0 1 ${180 - i * 12} 160`, c, 12)).join(''), 'colores'],
    ['Corona', relleno('M20 160 30 60 70 110 100 40 130 110 170 60 180 160Z', '#f2b33d') + [[30, 60], [100, 40], [170, 60]].map(([x, y]) => relleno(circ(x, y, 9), '#f2b33d')).join('') + `<rect x="20" y="150" width="160" height="20" rx="4" fill="#d99a1e"/>`, 'reina rey'],
    ['Chispas', relleno(estrella(4, 60, 14, 80, 110), '#f2b33d') + relleno(estrella(4, 30, 7, 150, 50), '#f2b33d') + relleno(estrella(4, 18, 5, 160, 150), '#f2b33d'), 'brillo destello'],
    ['Corazones', relleno(CORAZON, '#e8577a', 'transform="translate(20 50) scale(.5)"') + relleno(CORAZON, '#f28fb1', 'transform="translate(100 20) scale(.4)"') + relleno(CORAZON, '#d63d86', 'transform="translate(110 110) scale(.35)"'), 'amor'],
    ['Planta en maceta', relleno('M60 130H140L128 192H72Z', '#c8643b') + `<rect x="54" y="120" width="92" height="16" rx="4" fill="#b0532e"/>` + [[100, 60, 0], [72, 80, -40], [128, 80, 40]].map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="16" ry="38" fill="#5aa469" transform="rotate(${a} ${x} ${y + 30})"/>`).join(''), 'naturaleza hogar'],
    ['Cactus', relleno('M86 190V40A14 14 0 0 1 114 40V190Z', '#5aa469') + relleno('M86 120H62A12 12 0 0 1 50 108V80A10 10 0 0 1 70 80V100H86Z', '#5aa469') + relleno('M114 100H136V66A10 10 0 0 1 156 66V100A12 12 0 0 1 144 112H114Z', '#5aa469') + `<rect x="64" y="166" width="72" height="30" rx="4" fill="#c8643b"/>`, 'planta desierto'],
    ['Mariposa', relleno('M100 100C80 40 20 30 24 80S80 110 100 100ZM100 100C120 40 180 30 176 80S120 110 100 100ZM100 104C80 120 40 150 60 170S96 130 100 104ZM100 104C120 120 160 150 140 170S104 130 100 104Z', '#7b5cd6') + `<rect x="96" y="70" width="8" height="80" rx="4" fill="#1a1a1a"/>`, 'insecto naturaleza'],
    ['Pluma', relleno('M40 180C40 110 90 40 170 20 150 100 110 150 40 180Z', '#e2c9a4') + linea('M30 190Q100 110 166 26', '#8c6a4f', 3), 'escribir ligera'],
    ['Taza de café', relleno('M40 70H150V140A40 40 0 0 1 110 180H80A40 40 0 0 1 40 140Z', '#ffffff', 'stroke="#1a1a1a" stroke-width="4"') + linea('M150 90H162A18 18 0 0 1 162 126H150', '#1a1a1a', 6) + linea('M70 50Q62 36 72 24M96 50Q88 36 98 24M122 50Q114 36 124 24', '#9a9aa3', 4), 'bebida desayuno'],
    ['Sobre', relleno('M10 40H190V160H10Z', '#ffffff', 'stroke="#1a1a1a" stroke-width="4"') + linea('M10 40 100 110 190 40', '#1a1a1a', 4), 'carta correo mensaje'],
    ['Estrella fugaz', linea('M20 170 110 80', '#f2b33d', 6, 'stroke-opacity=".5"') + linea('M40 180 120 100', '#f2b33d', 3, 'stroke-opacity=".35"') + relleno(estrella(5, 42, 18, 136, 64), '#f2b33d'), 'deseo noche'],
    ['Huella de gato', relleno(circ(100, 130, 34) + circ(56, 82, 16) + circ(84, 56, 16) + circ(116, 56, 16) + circ(144, 82, 16), '#5d4a3f'), 'animal mascota'],
  ].forEach(([n, cuerpo, tags = '']) => add('ilustraciones', n, { svg: svg(cuerpo) }, tags));

  // ---------- Stickers (con texto editable: desagrupa para cambiar el texto) ----------
  const sticker = (fondo, textos) => () => {
    const objs = [...fondo(), ...textos.map(([t, o]) => T(t, { originX: 'center', originY: 'center', fontWeight: 'bold', ...o }))];
    return objs;
  };
  const estrellaObj = (n, r1, r2, o) => new F.Polygon(Array.from({ length: 2 * n }, (_, i) => { const r = i % 2 ? r2 : r1, a = (-90 + 180 * i / n) * Math.PI / 180; return { x: r * Math.cos(a), y: r * Math.sin(a) }; }), { originX: 'center', originY: 'center', left: 0, top: 0, strokeWidth: 0, ...o });
  [
    ['Nuevo', sticker(() => [estrellaObj(18, 110, 92, { fill: '#ff3d7f', stroke: '#ffffff', strokeWidth: 8 })], [['¡NUEVO!', { fontSize: 46, fill: '#ffffff', width: 200, angle: -12 }]]), 'oferta novedad'],
    ['Rebajas', sticker(() => [C({ radius: 100, originX: 'center', originY: 'center', fill: '#e8b730', stroke: '#1a1a1a', strokeWidth: 6 })], [['REBAJAS', { fontSize: 34, fill: '#1a1a1a', width: 190, top: -26 }], ['-50%', { fontSize: 62, fill: '#d64545', width: 190, top: 26 }]]), 'oferta descuento sale'],
    ['Wow', sticker(() => [estrellaObj(12, 112, 70, { fill: '#2f7fe0', stroke: '#1a1a1a', strokeWidth: 6 })], [['WOW!', { fontSize: 60, fill: '#f2d16b', width: 220, fontFamily: 'Impact', stroke: '#1a1a1a', strokeWidth: 2 }]]), 'cómic'],
    ['Precio', sticker(() => [R({ width: 260, height: 110, rx: 55, ry: 55, originX: 'center', originY: 'center', fill: '#1a1a1a' })], [['19,99 €', { fontSize: 54, fill: '#ffffff', width: 250 }]]), 'etiqueta oferta'],
    ['Gracias', sticker(() => [R({ width: 300, height: 100, rx: 50, ry: 50, originX: 'center', originY: 'center', fill: '#f5b8c4', stroke: '#ffffff', strokeWidth: 8, shadow: sombra(14, 6) })], [['Gracias ♥', { fontSize: 48, fill: '#8a1f4d', width: 280, fontFamily: 'Georgia', fontStyle: 'italic', fontWeight: 'normal' }]]), 'agradecimiento'],
    ['Hecho a mano', sticker(() => [C({ radius: 100, originX: 'center', originY: 'center', fill: '#f4ece4', stroke: '#5d4a3f', strokeWidth: 4 }), C({ radius: 86, originX: 'center', originY: 'center', fill: null, stroke: '#5d4a3f', strokeWidth: 1.5, strokeDashArray: [6, 5] })], [['HECHO\nA MANO', { fontSize: 34, fill: '#5d4a3f', width: 170, fontFamily: 'Georgia', lineHeight: 1 }]]), 'sello artesanal'],
    ['Edición limitada', sticker(() => [new F.Path('M-150 -40H150L130 0 150 40H-150L-130 0Z', { originX: 'center', originY: 'center', left: 0, top: 0, fill: '#7b5cd6', strokeWidth: 0 })], [['EDICIÓN LIMITADA', { fontSize: 26, fill: '#ffffff', width: 280, charSpacing: 80 }]]), 'cinta exclusivo'],
    ['Me gusta', sticker(() => [C({ radius: 70, originX: 'center', originY: 'center', fill: '#ffffff', shadow: sombra(16, 6) })], [['♥', { fontSize: 80, fill: '#e8577a', width: 120, top: -4 }]]), 'corazón like'],
    ['Abierto', sticker(() => [R({ width: 280, height: 120, rx: 18, ry: 18, originX: 'center', originY: 'center', fill: '#1f9e74', stroke: '#ffffff', strokeWidth: 8, shadow: sombra(14, 6) })], [['ABIERTO', { fontSize: 56, fill: '#ffffff', width: 260 }]]), 'tienda cartel'],
  ].forEach(([n, crear, tags]) => add('stickers', n, { crear }, tags));

  // ---------- Brillo y neón ----------
  const neon = (d, color, grosor = 7) => () => [
    new F.Path(d, { fill: null, stroke: color, strokeWidth: grosor * 1.8, strokeLineCap: 'round', strokeLineJoin: 'round', shadow: brillo(color, 36), opacity: .85 }),
    new F.Path(d, { fill: null, stroke: '#ffffff', strokeWidth: grosor * .55, strokeLineCap: 'round', strokeLineJoin: 'round', opacity: .9, shadow: brillo(color, 10) }),
  ];
  [
    ['Corazón neón', neon(CORAZON, '#ff3df0')], ['Estrella neón', neon(estrella(5, 92, 38), '#f2d16b')], ['Círculo neón', neon(circ(100, 100, 86), '#3fe0ff')],
    ['Rayo neón', neon('M118 8 38 112H96L78 192 162 82H104Z', '#ffe14d')], ['Flecha neón', neon('M20 100H170M120 50 170 100 120 150', '#7bff6b')],
    ['Ola neón', neon('M10 100Q32 60 55 100T100 100 145 100 190 100', '#ff8a3d')], ['Triángulo neón', neon(poli(3, 90, 100, 112), '#a66bff')],
  ].forEach(([n, crear]) => add('neon', n, { crear, fondoOscuro: true }, 'brillo luz glow'));
  add('neon', 'Cartel neón', { fondoOscuro: true, crear: () => [
    T('Abierto', { fontSize: 120, fontFamily: 'Brush Script MT', fill: '#ffffff', width: 520, stroke: '#ff3df0', strokeWidth: 2, shadow: brillo('#ff3df0', 40) }),
  ] }, 'texto luz letrero');
  add('neon', 'Destello', { svg: svg(`<defs><radialGradient id="h"><stop offset="0" stop-color="#ffffff"/><stop offset=".25" stop-color="#fff3c4" stop-opacity=".9"/><stop offset="1" stop-color="#ffcf4d" stop-opacity="0"/></radialGradient></defs><circle cx="100" cy="100" r="96" fill="url(#h)"/>${relleno(estrella(4, 96, 6), '#ffffff')}`), fondoOscuro: true, fusion: 'screen' }, 'brillo luz estrella');
  add('neon', 'Halo de luz', { svg: svg(`<defs><radialGradient id="h"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".4" stop-color="#9fd8ff" stop-opacity=".5"/><stop offset="1" stop-color="#3f7fff" stop-opacity="0"/></radialGradient></defs><circle cx="100" cy="100" r="98" fill="url(#h)"/>`), fondoOscuro: true, fusion: 'screen' }, 'brillo resplandor');

  // ---------- 3D (volumen con luces y sombras) ----------
  const D3 = [
    ['Esfera', `<defs><radialGradient id="g" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#ffffff"/><stop offset=".2" stop-color="#ff9ec0"/><stop offset=".7" stop-color="#d63d86"/><stop offset="1" stop-color="#6e1442"/></radialGradient><radialGradient id="s"><stop offset="0" stop-color="#000" stop-opacity=".3"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs><ellipse cx="100" cy="186" rx="70" ry="10" fill="url(#s)"/><circle cx="100" cy="94" r="82" fill="url(#g)"/>`, 'bola'],
    ['Cubo', `<path d="M100 20 176 60 100 100 24 60Z" fill="#9fd0ff"/><path d="M24 60 100 100V188L24 148Z" fill="#3f8fe0"/><path d="M176 60 100 100V188L176 148Z" fill="#1d5fae"/>`, 'caja dado'],
    ['Cilindro', `<defs><linearGradient id="g"><stop offset="0" stop-color="#3a8a6a"/><stop offset=".35" stop-color="#8fe0bd"/><stop offset="1" stop-color="#1f5e46"/></linearGradient></defs><path d="M30 40V160A70 22 0 0 0 170 160V40Z" fill="url(#g)"/><ellipse cx="100" cy="40" rx="70" ry="22" fill="#b6f0d6"/>`, 'tubo lata'],
    ['Cono', `<defs><linearGradient id="g"><stop offset="0" stop-color="#b0532e"/><stop offset=".4" stop-color="#ffb08a"/><stop offset="1" stop-color="#7a3214"/></linearGradient></defs><path d="M100 14 172 164A72 20 0 0 1 28 164Z" fill="url(#g)"/>`],
    ['Pirámide', `<path d="M100 16 20 170 100 190Z" fill="#f2c14e"/><path d="M100 16 180 170 100 190Z" fill="#c9921d"/>`, 'egipto triángulo'],
    ['Donut 3D', `<defs><radialGradient id="g" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#fff1c4"/><stop offset=".45" stop-color="#ffb84d"/><stop offset="1" stop-color="#b86a00"/></radialGradient></defs><path d="${circ(100, 100, 88) + circ(100, 100, 34)}" fill="url(#g)" fill-rule="evenodd"/>`, 'toro anillo rosquilla'],
    ['Cápsula 3D', `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2d6ff"/><stop offset=".45" stop-color="#9b7be8"/><stop offset="1" stop-color="#4b2c9e"/></linearGradient></defs><rect x="10" y="60" width="180" height="80" rx="40" fill="url(#g)"/><rect x="34" y="70" width="110" height="16" rx="8" fill="#ffffff" opacity=".55"/>`, 'píldora botón'],
    ['Botón 3D', `<rect x="14" y="70" width="172" height="84" rx="26" fill="#a31f52"/><rect x="14" y="52" width="172" height="84" rx="26" fill="#ff3d7f"/><rect x="34" y="62" width="120" height="14" rx="7" fill="#ffffff" opacity=".35"/>`, 'pulsar'],
    ['Caja isométrica', `<path d="M100 30 180 70 100 110 20 70Z" fill="#e6c9a3"/><path d="M20 70 100 110V190L20 150Z" fill="#c9a074"/><path d="M180 70 100 110V190L180 150Z" fill="#a87f53"/><path d="M60 50 140 90V110L60 70Z" fill="#d9b78c"/>`, 'paquete envío'],
    ['Moneda', `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2b0"/><stop offset=".5" stop-color="#f2b33d"/><stop offset="1" stop-color="#a86f00"/></linearGradient></defs><ellipse cx="108" cy="104" rx="80" ry="80" fill="#a86f00"/><circle cx="100" cy="96" r="80" fill="url(#g)"/><circle cx="100" cy="96" r="60" fill="none" stroke="#a86f00" stroke-width="4" opacity=".6"/>`, 'dinero oro'],
    ['Gema', `<path d="M60 30H140L184 80 100 184 16 80Z" fill="#3fa4ff"/><path d="M60 30 80 80H16Z" fill="#9fd8ff"/><path d="M140 30 120 80H184Z" fill="#1d6fc2"/><path d="M80 80H120L100 184Z" fill="#62b8ff"/><path d="M60 30H140L120 80H80Z" fill="#c4e8ff"/>`, 'diamante joya'],
  ];
  D3.forEach(([n, cuerpo, tags = '']) => add('3d', n, { svg: svg(cuerpo) }, 'volumen ' + tags));

  // ---------- Degradados ----------
  const PALETAS = [['Atardecer', ['#ff9a8b', '#ff6a88', '#ff99ac']], ['Océano', ['#2e3192', '#1bffff']], ['Lavanda', ['#a18cd1', '#fbc2eb']],
    ['Menta', ['#d4fc79', '#96e6a1']], ['Fuego', ['#f83600', '#f9d423']], ['Noche', ['#0f2027', '#203a43', '#2c5364']], ['Melocotón', ['#ffecd2', '#fcb69f']],
    ['Neón', ['#f72585', '#7209b7', '#3a0ca3']], ['Oro', ['#bf953f', '#fcf6ba', '#b38728']], ['Cielo', ['#89f7fe', '#66a6ff']], ['Rosa', ['#f093fb', '#f5576c']], ['Bosque', ['#134e5e', '#71b280']]];
  PALETAS.forEach(([n, cs]) => {
    add('degradados', 'Círculo ' + n, { crear: () => [C({ radius: 100, fill: degL(cs, 135) })] }, 'gradiente color');
    add('degradados', 'Mancha ' + n, { crear: () => [new F.Path('M152 48C182 76 186 128 158 160S78 196 46 166 8 82 40 48 122 20 152 48Z', { fill: degL(cs, 45), strokeWidth: 0 })] }, 'gradiente blob');
  });
  add('degradados', 'Orbe brillante', { crear: () => [C({ radius: 100, fill: degR(['#ffffff', '#b8a4ff', '#5b3fd6', 'rgba(91,63,214,0)'], .4, .35, .6) })] }, 'esfera gradiente');

  // ---------- Texturas, tejidos y fondos generados en el aparato ----------
  // Ruido de valor suavizado (para mármol, madera, seda).
  function ruido(r) {
    const N = 256, p = Float32Array.from({ length: N * N }, r);
    const s = t => t * t * (3 - 2 * t);
    const v = (x, y) => p[((y & 255) * N) + (x & 255)];
    const n = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = s(x - xi), yf = s(y - yi);
      const a = v(xi, yi) + (v(xi + 1, yi) - v(xi, yi)) * xf, b = v(xi, yi + 1) + (v(xi + 1, yi + 1) - v(xi, yi + 1)) * xf; return a + (b - a) * yf; };
    return (x, y, oct = 4) => { let t = 0, amp = .5, f = 1; for (let i = 0; i < oct; i++) { t += amp * n(x * f, y * f); amp /= 2; f *= 2; } return t; };
  }
  const porPixel = (x, w, h, fn) => { const img = x.createImageData(w, h); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const [r, g, b, a = 255] = fn(i, j); const k = (j * w + i) * 4; img.data[k] = r; img.data[k + 1] = g; img.data[k + 2] = b; img.data[k + 3] = a; } x.putImageData(img, 0, 0); };
  const motas = (x, w, h, r, n, color, tam = 1.5) => { x.fillStyle = color; for (let i = 0; i < n; i++) { const s = tam * (.5 + r()); x.globalAlpha = .2 + r() * .5; x.fillRect(r() * w, r() * h, s, s); } x.globalAlpha = 1; };
  const TEXTURAS = {
    vaquero(x, w, h, r) {
      x.fillStyle = '#34507e'; x.fillRect(0, 0, w, h);
      x.lineWidth = 1.4;
      for (let i = -h; i < w; i += 3) { x.strokeStyle = r() > .5 ? 'rgba(255,255,255,.10)' : 'rgba(0,0,30,.18)'; x.beginPath(); x.moveTo(i, 0); x.lineTo(i + h, h); x.stroke(); }
      for (let i = 0; i < w; i += 2) if (r() > .9) { x.fillStyle = `rgba(200,215,240,${.05 + r() * .12})`; x.fillRect(i, 0, 1 + r() * 2, h); }
      motas(x, w, h, r, w * h / 40, '#dfe8f7', 1.3);
    },
    punto(x, w, h, r) {
      x.fillStyle = '#b9876a'; x.fillRect(0, 0, w, h);
      const pw = 14, ph = 16;
      for (let y = 0; y < h + ph; y += ph) for (let i = 0; i < w + pw; i += pw) {
        for (const lado of [-1, 1]) {
          const g = x.createLinearGradient(i, y, i + lado * pw / 2, y + ph);
          g.addColorStop(0, 'rgba(255,240,225,.55)'); g.addColorStop(1, 'rgba(90,50,30,.45)');
          x.fillStyle = g; x.beginPath(); x.ellipse(i + lado * pw / 4, y + ph / 2, pw / 4.2, ph / 1.6, -lado * .5, 0, 7); x.fill();
        }
      }
      motas(x, w, h, r, w * h / 60, '#fff2e6', 1);
    },
    lino(x, w, h, r) {
      x.fillStyle = '#e6dac6'; x.fillRect(0, 0, w, h);
      for (let j = 0; j < h; j += 2) { x.fillStyle = `rgba(120,95,60,${r() * .12})`; x.fillRect(0, j, w, 1); }
      for (let i = 0; i < w; i += 2) { x.fillStyle = `rgba(255,255,255,${r() * .16})`; x.fillRect(i, 0, 1, h); }
      motas(x, w, h, r, w * h / 50, '#8c7558', 2);
    },
    papel(x, w, h, r) {
      x.fillStyle = '#f6f1e6'; x.fillRect(0, 0, w, h);
      motas(x, w, h, r, w * h / 18, '#b9ab93', 1.2); motas(x, w, h, r, w * h / 40, '#ffffff', 1.6);
      for (let i = 0; i < w * h / 4000; i++) { x.strokeStyle = 'rgba(150,130,100,.15)'; x.lineWidth = .6; x.beginPath(); const a = r() * w, b = r() * h; x.moveTo(a, b); x.quadraticCurveTo(a + r() * 20, b + r() * 20, a + r() * 30 - 15, b + r() * 30 - 15); x.stroke(); }
    },
    kraft(x, w, h, r) {
      x.fillStyle = '#b88a5c'; x.fillRect(0, 0, w, h);
      motas(x, w, h, r, w * h / 10, '#6e4a26', 1.3); motas(x, w, h, r, w * h / 25, '#e6c79e', 1.5);
    },
    marmol(x, w, h, r) {
      const n = ruido(r), k = 5 / Math.max(w, h);
      porPixel(x, w, h, (i, j) => { const t = Math.abs(Math.sin((i * k * 6 + j * k * 3 + n(i * k, j * k, 5) * 7) * 1.4)); const vena = Math.pow(t, .18);
        const c = 160 + vena * 92 + (n(i * k * 4, j * k * 4, 2) - .5) * 14; return [c, c, c + 4]; });
    },
    terrazo(x, w, h, r) {
      x.fillStyle = '#efe8df'; x.fillRect(0, 0, w, h);
      const cs = ['#e08a6b', '#5f8a7a', '#f2c14e', '#2b3a55', '#d9b3a3', '#9aa5a0'];
      for (let i = 0; i < w * h / 900; i++) { const cx = r() * w, cy = r() * h, rad = 3 + r() * 14, lados = 4 + Math.floor(r() * 4);
        x.fillStyle = cs[Math.floor(r() * cs.length)]; x.beginPath();
        for (let k = 0; k < lados; k++) { const a = k / lados * 7 + r() * .6, rr = rad * (.6 + r() * .5); x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
        x.fill(); }
    },
    madera(x, w, h, r) {
      const n = ruido(r), k = 3 / Math.max(w, h);
      porPixel(x, w, h, (i, j) => { const anillo = Math.sin((j * k * 22 + n(i * k * .6, j * k * 3, 4) * 9)) * .5 + .5;
        const v = .55 + anillo * .35 + (n(i * k * 30, j * k * 2, 2) - .5) * .2; return [Math.min(255, 196 * v + 30), Math.min(255, 132 * v + 18), Math.min(255, 78 * v + 8)]; });
    },
    purpurina(x, w, h, r) {
      const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#2b1f0e'); g.addColorStop(1, '#4a3510'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      const cs = ['#fff3c4', '#f2c14e', '#ffffff', '#d4a537', '#ffe7a0'];
      for (let i = 0; i < w * h / 6; i++) { x.globalAlpha = r(); x.fillStyle = cs[Math.floor(r() * cs.length)]; const s = 1 + r() * 2.5; x.fillRect(r() * w, r() * h, s, s); }
      x.globalAlpha = 1;
    },
    seda(x, w, h, r) {
      const n = ruido(r), k = 2 / Math.max(w, h);
      porPixel(x, w, h, (i, j) => { const t = Math.sin((i * k * 4 + n(i * k, j * k, 3) * 6)) * .5 + .5, v = .55 + .45 * Math.pow(t, 2.2); return [222 * v + 20, 160 * v + 20, 184 * v + 24]; });
    },
    cuero(x, w, h, r) {
      const n = ruido(r), k = 40 / Math.max(w, h);
      porPixel(x, w, h, (i, j) => { const t = n(i * k, j * k, 3), v = .7 + Math.abs(t - .5) * .7; return [120 * v, 74 * v, 44 * v]; });
      motas(x, w, h, r, w * h / 30, '#2a170b', 1.2);
    },
    vichy(x, w, h, r, c = '#d64545') {
      x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); const p = Math.max(18, Math.round(Math.max(w, h) / 22));
      x.globalAlpha = .45; x.fillStyle = c;
      for (let i = 0; i < w; i += p * 2) x.fillRect(i, 0, p, h);
      for (let j = 0; j < h; j += p * 2) x.fillRect(0, j, w, p);
      x.globalAlpha = 1;
    },
    tartan(x, w, h) {
      x.fillStyle = '#1f3d2e'; x.fillRect(0, 0, w, h); const p = Math.max(80, Math.round(Math.max(w, h) / 6));
      const bandas = [[0, .28, '#7a1f1f', .65], [.38, .06, '#e8b730', .7], [.55, .2, '#0f2440', .55], [.84, .03, '#ffffff', .6]];
      for (const [pos, an, c, a] of bandas) { x.globalAlpha = a; x.fillStyle = c;
        for (let i = 0; i < w; i += p) x.fillRect(i + pos * p, 0, an * p, h);
        for (let j = 0; j < h; j += p) x.fillRect(0, j + pos * p, w, an * p); }
      x.globalAlpha = 1;
    },
    pataDeGallo(x, w, h) {
      x.fillStyle = '#f4efe6'; x.fillRect(0, 0, w, h); const p = Math.max(24, Math.round(Math.max(w, h) / 20)), u = p / 4;
      x.fillStyle = '#1a1a1a';
      for (let j = -p; j < h + p; j += p) for (let i = -p; i < w + p; i += p) {
        x.beginPath(); x.moveTo(i, j); x.lineTo(i + 2 * u, j); x.lineTo(i + 4 * u, j + 2 * u); x.lineTo(i + 4 * u, j + 4 * u); x.lineTo(i + 2 * u, j + 2 * u); x.lineTo(i + 2 * u, j + 4 * u); x.lineTo(i, j + 2 * u); x.closePath(); x.fill();
        x.beginPath(); x.moveTo(i + 2 * u, j + 4 * u); x.lineTo(i + 4 * u, j + 4 * u); x.lineTo(i + 3 * u, j + 5 * u); x.closePath(); x.fill();
      }
    },
    rayas(x, w, h) { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); const p = Math.max(16, Math.round(Math.max(w, h) / 24)); x.fillStyle = '#1d2f5a'; for (let j = 0; j < h; j += p * 2) x.fillRect(0, j, w, p); },
    lunares(x, w, h) { x.fillStyle = '#d63d86'; x.fillRect(0, 0, w, h); const p = Math.max(28, Math.round(Math.max(w, h) / 16)); x.fillStyle = '#ffffff';
      for (let j = 0, f = 0; j < h + p; j += p / 2, f++) for (let i = (f % 2) * p / 2; i < w + p; i += p) { x.beginPath(); x.arc(i, j, p / 7, 0, 7); x.fill(); } },
    cuadricula(x, w, h) { x.fillStyle = '#fbfaf6'; x.fillRect(0, 0, w, h); const p = Math.max(20, Math.round(Math.max(w, h) / 30)); x.strokeStyle = 'rgba(80,130,200,.35)'; x.lineWidth = 1;
      x.beginPath(); for (let i = 0; i < w; i += p) { x.moveTo(i + .5, 0); x.lineTo(i + .5, h); } for (let j = 0; j < h; j += p) { x.moveTo(0, j + .5); x.lineTo(w, j + .5); } x.stroke(); },
    puntos(x, w, h) { x.fillStyle = '#fbfaf6'; x.fillRect(0, 0, w, h); const p = Math.max(20, Math.round(Math.max(w, h) / 30)); x.fillStyle = 'rgba(60,60,80,.35)';
      for (let j = p; j < h; j += p) for (let i = p; i < w; i += p) { x.beginPath(); x.arc(i, j, 1.6, 0, 7); x.fill(); } },
    // Fondos
    malla(x, w, h, r, cs = ['#ffd1e8', '#c9d8ff', '#d6f5e9', '#ffe6c7']) { x.fillStyle = '#f2ecfa'; x.fillRect(0, 0, w, h);
      cs.forEach((c, i) => { const cx = [.15, .85, .75, .2][i] * w, cy = [.2, .15, .85, .9][i] * h, rad = Math.max(w, h) * .7; const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad); g.addColorStop(0, c); g.addColorStop(1, c + '00'); x.fillStyle = g; x.fillRect(0, 0, w, h); }); },
    aurora(x, w, h) { x.fillStyle = '#0b1026'; x.fillRect(0, 0, w, h);
      [['#2de0a7', .3, .35], ['#7b5cff', .7, .3], ['#ff4fd8', .55, .7]].forEach(([c, a, b]) => { x.save(); x.translate(a * w, b * h); x.scale(1.8, .55); const rad = Math.max(w, h) * .4, g = x.createRadialGradient(0, 0, 0, 0, 0, rad); g.addColorStop(0, c + 'cc'); g.addColorStop(1, c + '00'); x.fillStyle = g; x.fillRect(-rad, -rad, rad * 2, rad * 2); x.restore(); }); },
    bokeh(x, w, h, r) { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1a0f2e'); g.addColorStop(1, '#3d1a3a'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      const cs = ['#ffcf6b', '#ff7aa8', '#9fd8ff', '#ffffff'];
      for (let i = 0; i < 46; i++) { const cx = r() * w, cy = r() * h, rad = Math.max(w, h) * (.02 + r() * .07), c = cs[Math.floor(r() * cs.length)], gg = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
        gg.addColorStop(0, c + '99'); gg.addColorStop(.75, c + '55'); gg.addColorStop(1, c + '00'); x.fillStyle = gg; x.beginPath(); x.arc(cx, cy, rad, 0, 7); x.fill(); } },
    atardecer(x, w, h) { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2b1a4a'); g.addColorStop(.45, '#c94b7c'); g.addColorStop(.75, '#ff9a5a'); g.addColorStop(1, '#ffd48a'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h * .72, rad = Math.min(w, h) * .2, s = x.createRadialGradient(cx, cy, rad * .6, cx, cy, rad * 2.4); s.addColorStop(0, '#fff2c4'); s.addColorStop(.3, '#ffd27a88'); s.addColorStop(1, '#ffd27a00'); x.fillStyle = s; x.fillRect(0, 0, w, h); },
    // Efectos (capas encima, con modo de fusión)
    vineta(x, w, h) { const g = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .3, w / 2, h / 2, Math.hypot(w, h) * .6); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.75)'); x.fillStyle = g; x.fillRect(0, 0, w, h); },
    grano(x, w, h, r) { porPixel(x, w, h, () => { const v = r() * 255; return [v, v, v, 70]; }); },
    fugaDeLuz(x, w, h) { [['#ff6a3d', .05, .1, .6], ['#ffcf4d', .2, 0, .4], ['#ff3d7f', 0, .5, .45]].forEach(([c, a, b, s]) => { const rad = Math.max(w, h) * s, g = x.createRadialGradient(a * w, b * h, 0, a * w, b * h, rad); g.addColorStop(0, c + 'dd'); g.addColorStop(1, c + '00'); x.fillStyle = g; x.fillRect(0, 0, w, h); }); },
    semitono(x, w, h) { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); const p = Math.max(10, Math.round(Math.max(w, h) / 60)); x.fillStyle = '#1a1a1a';
      for (let j = 0; j < h + p; j += p) for (let i = 0; i < w + p; i += p) { const t = (i / w + j / h) / 2; x.beginPath(); x.arc(i, j, p * .55 * t, 0, 7); x.fill(); } },
    rayosDeLuz(x, w, h) { x.save(); for (let i = 0; i < 9; i++) { const a = .25 + i * .09, l = Math.hypot(w, h) * 1.2, g = x.createLinearGradient(0, 0, Math.cos(a) * l, Math.sin(a) * l);
      g.addColorStop(0, 'rgba(255,248,220,.55)'); g.addColorStop(1, 'rgba(255,248,220,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(-w * .05, -h * .05);
      x.lineTo(Math.cos(a - .025) * l, Math.sin(a - .025) * l); x.lineTo(Math.cos(a + .025) * l, Math.sin(a + .025) * l); x.fill(); } x.restore(); },
    destelloLente(x, w, h) { const cx = w * .72, cy = h * .28, k = Math.max(w, h);
      [[0, .22, '#fff7e0', .9], [0, .5, '#ffb84d', .35]].forEach(([d, s, c, a]) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, k * s); g.addColorStop(0, c); g.addColorStop(1, c + '00'); x.globalAlpha = a; x.fillStyle = g; x.fillRect(0, 0, w, h); });
      [[.35, .04, '#7fd0ff'], [.55, .07, '#ff9ec0'], [.8, .03, '#b8ffb0'], [1.05, .1, '#ffd27a']].forEach(([t, s, c]) => { const px = cx + (w / 2 - cx) * t * 2, py = cy + (h / 2 - cy) * t * 2; x.globalAlpha = .35; x.fillStyle = c; x.beginPath(); x.arc(px, py, k * s, 0, 7); x.fill(); });
      x.globalAlpha = 1; },
  };
  const TEX = (cat, n, clave, tags, opc = {}) => add(cat, n, { textura: clave, ...opc }, tags);
  [['Tela vaquera', 'vaquero', 'denim jeans tejido vaquero tela'], ['Punto de lana', 'punto', 'tejido jersey knit'], ['Lino', 'lino', 'tejido natural'], ['Seda', 'seda', 'tejido satén brillo'],
    ['Cuero', 'cuero', 'piel material'], ['Cuadros vichy', 'vichy', 'tejido gingham picnic'], ['Tartán', 'tartan', 'tejido escocés cuadros'], ['Pata de gallo', 'pataDeGallo', 'tejido houndstooth'],
    ['Rayas marineras', 'rayas', 'tejido navy'], ['Lunares', 'lunares', 'tejido topos polka'],
  ].forEach(([n, c, t]) => { TEX('texturas', n, c, t); });
  [['Papel', 'papel'], ['Papel kraft', 'kraft', 'cartón'], ['Mármol', 'marmol', 'piedra lujo'], ['Terrazo', 'terrazo'], ['Madera', 'madera'], ['Purpurina dorada', 'purpurina', 'glitter brillo oro']]
    .forEach(([n, c, t = '']) => TEX('texturas', n, c, 'textura ' + t));
  [['Degradado malla', 'malla', 'pastel suave'], ['Aurora', 'aurora', 'noche colores'], ['Bokeh', 'bokeh', 'luces desenfoque'], ['Atardecer', 'atardecer', 'sol cielo'],
    ['Papel cuadriculado', 'cuadricula', 'cuaderno'], ['Papel punteado', 'puntos', 'cuaderno bullet'], ['Mármol de fondo', 'marmol', 'piedra']]
    .forEach(([n, c, t]) => TEX('fondos', n, c, 'fondo ' + t, { fondo: true }));
  [['Viñeta', 'vineta', 'oscurecer bordes', 'multiply'], ['Grano de película', 'grano', 'ruido vintage analógico', 'overlay'], ['Fuga de luz', 'fugaDeLuz', 'luz cálida vintage', 'screen'],
    ['Semitono', 'semitono', 'puntos cómic halftone', 'multiply'], ['Luz volumétrica', 'rayosDeLuz', 'rayos sol volumen', 'screen'], ['Destello de lente', 'destelloLente', 'flare luz', 'screen']]
    .forEach(([n, c, t, fusion]) => TEX('efectos', n, c, 'efecto ' + t, { fondo: true, encima: true, fusion, fondoOscuro: fusion === 'screen' }));
  // Las telas también aparecen en Moda.
  LISTA.filter(e => e.cat === 'texturas' && /tejido/.test(e.tags)).forEach(e => { e.cats = ['texturas', 'moda']; });

  // Fondos vectoriales (se adaptan al tamaño de la página y siguen siendo editables).
  const fondoVector = (n, gen, tags) => add('fondos', n, { svgDoc: gen, fondo: true }, 'fondo ' + tags);
  fondoVector('Ondas', (w, h) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#e9f4ff"/>`
    + [['#9fd0ff', .62], ['#5aa8f0', .72], ['#2b6fc2', .84]].map(([c, y]) => { const a = h * y, amp = h * .05; return `<path d="M0 ${a}Q${w * .25} ${a - amp} ${w * .5} ${a}T${w} ${a}V${h}H0Z" fill="${c}"/>`; }).join('') + '</svg>', 'mar agua');
  fondoVector('Confeti', (w, h) => { const r = azar(7), cs = ['#ff3d7f', '#f2b33d', '#3fa4ff', '#1f9e74', '#7b5cd6']; let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#fffaf2"/>`;
    const k = Math.min(w, h) / 60; for (let i = 0; i < 70; i++) { const x = r() * w, y = r() * h, c = cs[i % cs.length], a = r() * 180;
      s += i % 3 ? `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(k * 1.4)}" height="${f1(k * .6)}" fill="${c}" transform="rotate(${f1(a)} ${f1(x)} ${f1(y)})"/>` : `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(k * .5)}" fill="${c}"/>`; }
    return s + '</svg>'; }, 'fiesta celebración');
  fondoVector('Rayos de sol', (w, h) => { const cx = w / 2, cy = h / 2, L = Math.hypot(w, h); let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#ffcf4d"/>`;
    for (let i = 0; i < 24; i += 2) { const a1 = i * Math.PI / 12, a2 = (i + 1) * Math.PI / 12; s += `<path d="M${cx} ${cy}L${f1(cx + L * Math.cos(a1))} ${f1(cy + L * Math.sin(a1))}L${f1(cx + L * Math.cos(a2))} ${f1(cy + L * Math.sin(a2))}Z" fill="#ffb627"/>`; }
    return s + '</svg>'; }, 'retro cómic sunburst');
  fondoVector('Geométrico', (w, h) => { const r = azar(3), cs = ['#2b3a55', '#3d5280', '#4e6aa3', '#6f8fc9', '#33446b']; const p = Math.max(w, h) / 8; let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">`;
    for (let y = 0; y < h; y += p) for (let x = 0; x < w; x += p) { s += `<path d="M${f1(x)} ${f1(y)}H${f1(x + p)}V${f1(y + p)}Z" fill="${cs[Math.floor(r() * 5)]}"/><path d="M${f1(x)} ${f1(y)}V${f1(y + p)}H${f1(x + p)}Z" fill="${cs[Math.floor(r() * 5)]}"/>`; }
    return s + '</svg>'; }, 'triángulos low poly');
  fondoVector('Formas orgánicas', (w, h) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#f7efe6"/>`
    + `<ellipse cx="${w * .05}" cy="${h * .08}" rx="${w * .38}" ry="${h * .3}" fill="#f5c6b8"/><ellipse cx="${w * .98}" cy="${h * .92}" rx="${w * .42}" ry="${h * .32}" fill="#c9dfd0"/><ellipse cx="${w * .9}" cy="${h * .12}" rx="${w * .12}" ry="${w * .12}" fill="#f2d16b"/></svg>`, 'suave blob');

  // ---------- Diseño web (componentes editables) ----------
  const W = (n, crear, tags) => add('web', n, { crear }, 'web interfaz ui ' + tags);
  W('Botón principal', () => [R({ width: 260, height: 72, rx: 14, ry: 14, fill: '#7b5cd6', shadow: sombra(18, 8, 'rgba(123,92,214,.35)') }), T('Empezar ahora', { width: 260, top: 21, fontSize: 26, fontWeight: 'bold', fill: '#ffffff' })], 'button');
  W('Botón secundario', () => [R({ width: 260, height: 72, rx: 14, ry: 14, fill: '#ffffff', stroke: '#7b5cd6', strokeWidth: 3 }), T('Saber más', { width: 260, top: 21, fontSize: 26, fontWeight: 'bold', fill: '#7b5cd6' })], 'button contorno');
  W('Botón píldora', () => [R({ width: 220, height: 64, rx: 32, ry: 32, fill: degL(['#ff3d7f', '#ff8a3d'], 0) }), T('Comprar', { width: 220, top: 17, fontSize: 26, fontWeight: 'bold', fill: '#ffffff' })], 'button degradado');
  W('Campo de texto', () => [T('Correo electrónico', { width: 420, fontSize: 20, fill: '#5f6672', textAlign: 'left' }), R({ top: 34, width: 420, height: 60, rx: 10, ry: 10, fill: '#ffffff', stroke: '#c9ced6', strokeWidth: 2 }), T('tu@correo.com', { left: 18, top: 51, width: 380, fontSize: 22, fill: '#9aa1ab', textAlign: 'left' })], 'input formulario');
  W('Buscador', () => [R({ width: 480, height: 64, rx: 32, ry: 32, fill: '#f1f2f6' }), C({ left: 24, top: 18, radius: 11, fill: null, stroke: '#5f6672', strokeWidth: 3 }), new F.Line([44, 40, 52, 48], { stroke: '#5f6672', strokeWidth: 3, strokeLineCap: 'round' }), T('Buscar…', { left: 70, top: 18, width: 360, fontSize: 24, fill: '#8a909a', textAlign: 'left' })], 'search');
  W('Barra de navegación', () => [R({ width: 1200, height: 84, fill: '#ffffff', shadow: sombra(20, 4, 'rgba(0,0,0,.08)') }), T('MARCA', { left: 40, top: 26, width: 200, fontSize: 30, fontWeight: 'bold', textAlign: 'left' }),
    ...['Inicio', 'Tienda', 'Colección', 'Contacto'].map((t, i) => T(t, { left: 520 + i * 130, top: 30, width: 120, fontSize: 22, fill: '#3a3f47' })), R({ left: 1060, top: 20, width: 110, height: 44, rx: 22, ry: 22, fill: '#1a1a1a' }), T('Entrar', { left: 1060, top: 30, width: 110, fontSize: 20, fill: '#ffffff', fontWeight: 'bold' })], 'menú navbar cabecera');
  W('Tarjeta', () => [R({ width: 360, height: 440, rx: 22, ry: 22, fill: '#ffffff', shadow: sombra(30, 12) }), R({ left: 0, top: 0, width: 360, height: 220, rx: 22, ry: 22, fill: degL(['#a18cd1', '#fbc2eb'], 135) }), R({ left: 0, top: 190, width: 360, height: 30, fill: '#ffffff' }),
    T('Título de la tarjeta', { left: 28, top: 240, width: 300, fontSize: 28, fontWeight: 'bold', textAlign: 'left' }), T('Una descripción corta que explica el contenido.', { left: 28, top: 286, width: 300, fontSize: 19, fill: '#6b7280', textAlign: 'left' }),
    R({ left: 28, top: 364, width: 140, height: 48, rx: 12, ry: 12, fill: '#1a1a1a' }), T('Ver', { left: 28, top: 375, width: 140, fontSize: 20, fill: '#ffffff', fontWeight: 'bold' })], 'card producto');
  W('Tarjeta de precio', () => [R({ width: 340, height: 460, rx: 24, ry: 24, fill: '#1d1b2b' }), T('PRO', { top: 40, width: 340, fontSize: 22, fill: '#b8a4ff', charSpacing: 300 }), T('19 €', { top: 84, width: 340, fontSize: 72, fill: '#ffffff', fontWeight: 'bold' }), T('al mes', { top: 172, width: 340, fontSize: 20, fill: '#9a96b0' }),
    T('✓ Proyectos ilimitados\n✓ Exportar en alta calidad\n✓ Soporte prioritario', { left: 40, top: 230, width: 270, fontSize: 19, fill: '#e3e0f0', textAlign: 'left', lineHeight: 1.7 }), R({ left: 40, top: 370, width: 260, height: 56, rx: 14, ry: 14, fill: '#7b5cd6' }), T('Elegir', { left: 40, top: 385, width: 260, fontSize: 22, fill: '#ffffff', fontWeight: 'bold' })], 'pricing plan');
  W('Cabecera principal', () => [R({ width: 1200, height: 520, fill: degL(['#1d1b2b', '#3a1f5d'], 135) }), T('Diseña algo increíble', { left: 80, top: 150, width: 640, fontSize: 64, fill: '#ffffff', fontWeight: 'bold', textAlign: 'left' }),
    T('Una frase corta que explica lo que ofreces y por qué importa.', { left: 80, top: 320, width: 560, fontSize: 24, fill: '#c9c4e0', textAlign: 'left' }), R({ left: 80, top: 400, width: 220, height: 60, rx: 30, ry: 30, fill: '#ff3d7f' }), T('Empezar', { left: 80, top: 416, width: 220, fontSize: 22, fill: '#ffffff', fontWeight: 'bold' }),
    C({ left: 820, top: 110, radius: 150, fill: degR(['#ff8fc7', '#7b5cd6', 'rgba(123,92,214,0)'], .4, .4, .6) })], 'hero portada landing');
  W('Insignia', () => [R({ width: 150, height: 44, rx: 22, ry: 22, fill: '#e3f7ee' }), T('● Disponible', { width: 150, top: 11, fontSize: 18, fill: '#1f9e74', fontWeight: 'bold' })], 'badge etiqueta estado');
  W('Interruptor', () => [R({ width: 96, height: 52, rx: 26, ry: 26, fill: '#1f9e74' }), C({ left: 48, top: 4, radius: 22, fill: '#ffffff', shadow: sombra(6, 2) })], 'toggle switch');
  W('Casilla marcada', () => [R({ width: 40, height: 40, rx: 8, ry: 8, fill: '#7b5cd6' }), new F.Polyline([{ x: 10, y: 21 }, { x: 17, y: 28 }, { x: 31, y: 13 }], { fill: null, stroke: '#ffffff', strokeWidth: 4, strokeLineCap: 'round', strokeLineJoin: 'round' }), T('Acepto las condiciones', { left: 56, top: 7, width: 280, fontSize: 22, textAlign: 'left' })], 'checkbox formulario');
  W('Avatar', () => [C({ radius: 48, fill: degL(['#f093fb', '#f5576c'], 135) }), T('AN', { top: 30, width: 96, fontSize: 32, fill: '#ffffff', fontWeight: 'bold' })], 'perfil usuario');
  W('Valoración', () => [...Array.from({ length: 5 }, (_, i) => new F.Polygon(Array.from({ length: 10 }, (_, k) => { const r = k % 2 ? 9 : 22, a = (-90 + 36 * k) * Math.PI / 180; return { x: r * Math.cos(a), y: r * Math.sin(a) }; }), { left: i * 50, top: 0, fill: i < 4 ? '#f2b33d' : '#e3e3e3', strokeWidth: 0 }))], 'estrellas reseña rating');
  W('Ventana de navegador', () => [R({ width: 900, height: 600, rx: 14, ry: 14, fill: '#ffffff', stroke: '#d9dce1', strokeWidth: 2, shadow: sombra(40, 16) }), R({ width: 900, height: 52, rx: 14, ry: 14, fill: '#eef0f3' }), R({ top: 30, width: 900, height: 22, fill: '#eef0f3' }),
    ...['#ff5f57', '#febc2e', '#28c840'].map((c, i) => C({ left: 22 + i * 26, top: 18, radius: 8, fill: c })), R({ left: 120, top: 12, width: 640, height: 28, rx: 14, ry: 14, fill: '#ffffff' }), T('www.tuweb.com', { left: 120, top: 16, width: 640, fontSize: 16, fill: '#8a909a' })], 'mockup maqueta browser');
  W('Marco de móvil', () => [R({ width: 400, height: 820, rx: 60, ry: 60, fill: '#1a1a1a' }), R({ left: 16, top: 16, width: 368, height: 788, rx: 46, ry: 46, fill: '#f7f5f2' }), R({ left: 140, top: 30, width: 120, height: 32, rx: 16, ry: 16, fill: '#1a1a1a' })], 'mockup maqueta iphone teléfono');
  W('Pestañas', () => [R({ width: 540, height: 60, rx: 14, ry: 14, fill: '#f1f2f6' }), R({ left: 6, top: 6, width: 172, height: 48, rx: 10, ry: 10, fill: '#ffffff', shadow: sombra(8, 2) }),
    ...['Todo', 'Mujer', 'Hombre'].map((t, i) => T(t, { left: 6 + i * 178, top: 18, width: 172, fontSize: 20, fill: i ? '#6b7280' : '#1a1a1a', fontWeight: i ? 'normal' : 'bold' }))], 'tabs menú');
  W('Barra de progreso', () => [R({ width: 500, height: 18, rx: 9, ry: 9, fill: '#e8e8ee' }), R({ width: 330, height: 18, rx: 9, ry: 9, fill: degL(['#7b5cd6', '#ff3d7f'], 0) }), T('66 %', { left: 510, top: -6, width: 80, fontSize: 22, textAlign: 'left', fontWeight: 'bold' })], 'carga progress');
  W('Aviso', () => [R({ width: 560, height: 84, rx: 14, ry: 14, fill: '#fff4e5', stroke: '#f2b33d', strokeWidth: 2 }), C({ left: 22, top: 24, radius: 18, fill: '#f2b33d' }), T('!', { left: 22, top: 26, width: 36, fontSize: 26, fill: '#ffffff', fontWeight: 'bold' }), T('Revisa los datos antes de enviar.', { left: 76, top: 28, width: 460, fontSize: 21, fill: '#7a4b00', textAlign: 'left' })], 'alerta mensaje');
  W('Pie de página', () => [R({ width: 1200, height: 220, fill: '#1d1b2b' }), T('MARCA', { left: 60, top: 50, width: 200, fontSize: 30, fill: '#ffffff', fontWeight: 'bold', textAlign: 'left' }),
    ...[['Tienda', 'Novedades\nColecciones\nRebajas'], ['Ayuda', 'Envíos\nDevoluciones\nContacto'], ['Síguenos', 'Instagram\nTikTok\nPinterest']].map(([t, l], i) => T(t + '\n' + l, { left: 520 + i * 220, top: 46, width: 200, fontSize: 18, fill: '#c9c4e0', textAlign: 'left', lineHeight: 1.6 })),
    T('© 2026 · Todos los derechos reservados', { left: 60, top: 170, width: 500, fontSize: 15, fill: '#7d7896', textAlign: 'left' })], 'footer');

  // ---------- Iconos (Tabler, se cargan cuando hacen falta) ----------
  let iconosCargados = null;
  function cargarIconos(base = '') {
    if (!iconosCargados) iconosCargados = new Promise((ok, mal) => {
      if (window.ICONOS_TABLER) return ok();
      const s = Object.assign(document.createElement('script'), { src: base + 'recursos/iconos-tabler.js', onload: ok, onerror: () => mal(new Error('no se encontraron los iconos')) });
      document.head.append(s);
    }).then(() => {
      const { categorias, lista } = window.ICONOS_TABLER;
      for (const [nombre, c, tags, cuerpo] of lista) LISTA.push({ id: 'ico-' + nombre, n: nombre.replace(/-/g, ' '), cat: 'iconos', sub: categorias[c], tags: tags + ' ' + categorias[c], icono: cuerpo });
    });
    return iconosCargados;
  }
  const svgIcono = (cuerpo, color = '#1a1a1a', grosor = 1.75) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${grosor}" stroke-linecap="round" stroke-linejoin="round">${cuerpo}</svg>`;

  // Búsqueda en español: se traducen las palabras más comunes para encontrar también los iconos (con etiquetas en inglés).
  const DICC = { corazon: 'heart', estrella: 'star', flecha: 'arrow', casa: 'home', hogar: 'home', sol: 'sun', luna: 'moon', nube: 'cloud', lluvia: 'rain', nieve: 'snow',
    flor: 'flower', hoja: 'leaf', arbol: 'tree', planta: 'plant', gato: 'cat', perro: 'dog', pez: 'fish', pajaro: 'bird', cafe: 'coffee', comida: 'food', fruta: 'fruit',
    manzana: 'apple', pizza: 'pizza', tarta: 'cake', pastel: 'cake', regalo: 'gift', compra: 'shopping', carrito: 'cart', bolsa: 'bag', tienda: 'shop', dinero: 'cash coin',
    tarjeta: 'credit card', camiseta: 'shirt', ropa: 'shirt clothes', percha: 'hanger', zapato: 'shoe', gafas: 'eyeglass', sombrero: 'hat', diamante: 'diamond', anillo: 'ring',
    telefono: 'phone', movil: 'phone', correo: 'mail', mensaje: 'message', chat: 'message', camara: 'camera', foto: 'photo', video: 'video', musica: 'music', play: 'play',
    reloj: 'clock', calendario: 'calendar', mapa: 'map', ubicacion: 'map pin', avion: 'plane', coche: 'car', bici: 'bike', barco: 'ship', usuario: 'user', persona: 'user',
    cara: 'mood', feliz: 'happy smile', triste: 'sad', risa: 'smile', mano: 'hand', ok: 'thumb up', like: 'thumb heart', candado: 'lock', llave: 'key', buscar: 'search',
    ajustes: 'settings', libro: 'book', lapiz: 'pencil', pincel: 'brush', paleta: 'palette', tijeras: 'scissors', regla: 'ruler', color: 'color palette', luz: 'bulb', idea: 'bulb',
    fuego: 'flame', agua: 'droplet', rayo: 'bolt', copa: 'glass', vino: 'wine', bebida: 'drink', deporte: 'ball', pelota: 'ball', trofeo: 'trophy', premio: 'award medal',
    lavado: 'wash', planchar: 'iron', secar: 'dry', etiqueta: 'tag label', mundo: 'world globe', web: 'world', wifi: 'wifi', descargar: 'download', subir: 'upload', compartir: 'share',
    check: 'check', cruz: 'x', mas: 'plus', menos: 'minus', info: 'info', alerta: 'alert', campana: 'bell', fiesta: 'confetti party', globo: 'balloon', corona: 'crown', mariposa: 'butterfly',
    bebe: 'baby', salud: 'heartbeat', medicina: 'pill', edificio: 'building', escuela: 'school', avion2: 'plane', tren: 'train', estrellas: 'stars', brillo: 'sparkles', chispas: 'sparkles' };
  const normal = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  function buscar(texto = '', cat = '') {
    const palabras = normal(texto).split(/\s+/).filter(Boolean);
    return LISTA.filter(e => {
      if (cat && e.cat !== cat && !(e.cats || []).includes(cat)) return false;
      if (!palabras.length) return true;
      const heno = normal(`${e.n} ${e.tags} ${e.sub || ''} ${CATS.find(c => c.id === e.cat)?.n || ''}`);
      return palabras.every(p => heno.includes(p) || (DICC[p] || '').split(' ').some(t => t && heno.includes(t)));
    });
  }
  const porId = id => LISTA.find(e => e.id === id);

  // ---------- Crear el objeto para el editor ----------
  const LADO_MAX_TEXTURA = 1600;
  function lienzoTextura(e, w, h) {
    const k = Math.min(1, LADO_MAX_TEXTURA / Math.max(w, h)), c = Object.assign(document.createElement('canvas'), { width: Math.max(8, Math.round(w * k)), height: Math.max(8, Math.round(h * k)) });
    TEXTURAS[e.textura](c.getContext('2d', { willReadFrequently: true }), c.width, c.height, azar(e.id.length * 7919 + 13));
    return c;
  }
  async function deSVG(cadena) {
    const { objects, options } = await F.loadSVGFromString(cadena);
    return F.util.groupSVGElements(objects.filter(Boolean), options);
  }
  // Devuelve { obj, cubrir } listo para colocar. «cubrir» = ocupa toda la página (fondos, texturas, efectos).
  async function crear(e, { w = 1080, h = 1080 } = {}) {
    let obj;
    if (e.icono) obj = await deSVG(svgIcono(e.icono));
    else if (e.svg) obj = await deSVG(e.svg);
    else if (e.svgDoc) obj = await deSVG(e.svgDoc(Math.round(w), Math.round(h)));
    else if (e.textura) {
      const c = lienzoTextura(e, e.fondo ? w : Math.min(w, h) * .6, e.fondo ? h : Math.min(w, h) * .6);
      // Las texturas opacas van en JPG (pesan mucho menos); los efectos con transparencia, en PNG.
      const data = e.encima ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', .9);
      obj = await F.FabricImage.fromURL(data); obj.dataPendiente = data;
    } else {
      const objs = e.crear();
      obj = objs.length === 1 ? objs[0] : new F.Group(objs);
    }
    if (e.fusion) obj.set('globalCompositeOperation', e.fusion);
    obj.set('nombre', e.n);
    return { obj, cubrir: !!e.fondo, encima: !!e.encima };
  }

  // ---------- Miniaturas ----------
  const cacheMini = new Map();
  const urlSVG = s => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  async function miniatura(e, lado = 120) {
    if (cacheMini.has(e.id)) return cacheMini.get(e.id);
    let url = '';
    try {
      if (e.icono) url = urlSVG(svgIcono(e.icono));
      else if (e.svg) url = urlSVG(e.svg);
      else if (e.svgDoc) url = urlSVG(e.svgDoc(400, 300));
      else if (e.textura) url = lienzoTextura(e, e.fondo ? lado * 2 : lado * 1.6, e.fondo ? lado * 1.5 : lado * 1.6).toDataURL('image/jpeg', .8);
      else {
        const objs = e.crear(), g = objs.length === 1 ? objs[0] : new F.Group(objs);
        const m = Math.min(2, (lado * 2) / Math.max(g.width * (g.scaleX || 1), g.height * (g.scaleY || 1), 1));
        url = g.toCanvasElement({ multiplier: m }).toDataURL('image/png');
      }
    } catch (err) { console.warn('miniatura', e.id, err); }
    cacheMini.set(e.id, url);
    return url;
  }

  return { CATS, LISTA, buscar, porId, crear, miniatura, cargarIconos, svgIcono };
})();
