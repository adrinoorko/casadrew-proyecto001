// CASADREW · servidor de datos (Google Sheets + Apps Script).
// Cada pestaña de la hoja es una "tabla"; la fila 1 son los nombres de las columnas.
// Columnas que pone el servidor solo: id, creado, actualizado.
//
// GET  ?accion=listar&hoja=Notas&clave=...
// POST (texto JSON) {"clave","accion":"agregar|actualizar|borrar","hoja","id","datos":{...}}

var FIJAS = ['id', 'creado', 'actualizado'];

function doGet(e) {
  return responder_(function () {
    var p = e.parameter || {};
    comprobarClave_(p.clave);
    var accion = p.accion || 'listar';
    if (accion === 'ping') return { ok: true, hora: new Date().toISOString() };
    if (accion === 'listar') return { ok: true, filas: listar_(p.hoja) };
    throw new Error('Acción desconocida: ' + accion);
  });
}

function doPost(e) {
  return responder_(function () {
    var cuerpo = JSON.parse((e.postData && e.postData.contents) || '{}');
    comprobarClave_(cuerpo.clave);
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      switch (cuerpo.accion) {
        case 'agregar': return { ok: true, fila: agregar_(cuerpo.hoja, cuerpo.datos || {}) };
        case 'actualizar': return { ok: true, fila: actualizar_(cuerpo.hoja, cuerpo.id, cuerpo.datos || {}) };
        case 'borrar': borrar_(cuerpo.hoja, cuerpo.id); return { ok: true };
        default: throw new Error('Acción desconocida: ' + cuerpo.accion);
      }
    } finally {
      lock.releaseLock();
    }
  });
}

function responder_(fn) {
  var salida;
  try { salida = fn(); } catch (err) { salida = { ok: false, error: String(err.message || err) }; }
  return ContentService.createTextOutput(JSON.stringify(salida)).setMimeType(ContentService.MimeType.JSON);
}

function comprobarClave_(clave) {
  if (clave !== CLAVE) throw new Error('Clave incorrecta');
}

function hoja_(nombre) {
  if (!nombre || !/^[\wÁÉÍÓÚÜÑáéíóúüñ ·-]{1,40}$/.test(nombre)) throw new Error('Nombre de hoja no válido');
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var h = libro.getSheetByName(nombre);
  if (!h) {
    h = libro.insertSheet(nombre);
    h.getRange(1, 1, 1, FIJAS.length).setValues([FIJAS]).setFontWeight('bold');
    h.setFrozenRows(1);
  }
  return h;
}

function cabecera_(h) {
  return h.getRange(1, 1, 1, Math.max(h.getLastColumn(), 1)).getValues()[0].map(String);
}

// Añade columnas nuevas si los datos traen campos que la hoja aún no tiene.
function asegurarColumnas_(h, datos) {
  var cab = cabecera_(h);
  Object.keys(datos).forEach(function (k) {
    if (cab.indexOf(k) === -1) {
      cab.push(k);
      h.getRange(1, cab.length).setValue(k).setFontWeight('bold');
    }
  });
  return cab;
}

function aObjeto_(cab, valores) {
  var o = {};
  cab.forEach(function (k, i) {
    var v = valores[i];
    o[k] = v instanceof Date ? v.toISOString() : v;
  });
  return o;
}

function listar_(nombre) {
  var h = hoja_(nombre);
  if (h.getLastRow() < 2) return [];
  var cab = cabecera_(h);
  return h.getRange(2, 1, h.getLastRow() - 1, cab.length).getValues().map(function (v) { return aObjeto_(cab, v); });
}

function filaDe_(h, id) {
  if (!id) throw new Error('Falta el id');
  var n = h.getLastRow() - 1;
  if (n < 1) throw new Error('No existe: ' + id);
  var ids = h.getRange(2, 1, n, 1).getValues();
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 2;
  throw new Error('No existe: ' + id);
}

function limpiar_(datos) {
  var d = {};
  Object.keys(datos).forEach(function (k) { if (FIJAS.indexOf(k) === -1) d[k] = datos[k]; });
  return d;
}

function agregar_(nombre, datos) {
  var h = hoja_(nombre);
  datos = limpiar_(datos);
  var cab = asegurarColumnas_(h, datos);
  var ahora = new Date().toISOString();
  var o = Object.assign({ id: Utilities.getUuid(), creado: ahora, actualizado: ahora }, datos);
  h.appendRow(cab.map(function (k) { return o[k] === undefined ? '' : o[k]; }));
  return o;
}

function actualizar_(nombre, id, datos) {
  var h = hoja_(nombre);
  var fila = filaDe_(h, id);
  datos = limpiar_(datos);
  var cab = asegurarColumnas_(h, datos);
  var actual = aObjeto_(cab, h.getRange(fila, 1, 1, cab.length).getValues()[0]);
  var o = Object.assign(actual, datos, { actualizado: new Date().toISOString() });
  h.getRange(fila, 1, 1, cab.length).setValues([cab.map(function (k) { return o[k] === undefined ? '' : o[k]; })]);
  return o;
}

function borrar_(nombre, id) {
  var h = hoja_(nombre);
  h.deleteRow(filaDe_(h, id));
}

// Para dar permisos la primera vez desde el editor (Ejecutar → autorizar).
function autorizar() {
  Logger.log(SpreadsheetApp.getActiveSpreadsheet().getName());
}
