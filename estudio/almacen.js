// CASADREW · Estudio — guardado en este aparato (IndexedDB).
// Los diseños guardan solo una referencia a cada imagen; las imágenes van aparte, una sola vez,
// para que guardar y deshacer no copien megas de fotos en cada cambio.
const Almacen = {
  _db: null,
  abrir() {
    if (!this._db) this._db = new Promise((ok, mal) => {
      const r = indexedDB.open('casadrew-estudio', 2);
      r.onupgradeneeded = () => {
        const db = r.result;
        if (!db.objectStoreNames.contains('proyectos')) db.createObjectStore('proyectos', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('imagenes')) db.createObjectStore('imagenes', { keyPath: 'ref' });
      };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => mal(r.error);
    });
    return this._db;
  },
  async _tx(almacen, modo, fn) {
    const db = await this.abrir();
    return new Promise((ok, mal) => {
      const t = db.transaction(almacen, modo);
      const req = fn(t.objectStore(almacen));
      t.oncomplete = () => ok(req && req.result);
      t.onerror = () => mal(t.error);
    });
  },
  guardar(p) { return this._tx('proyectos', 'readwrite', s => s.put(p)); },
  leer(id) { return this._tx('proyectos', 'readonly', s => s.get(id)); },
  listar() { return this._tx('proyectos', 'readonly', s => s.getAll()); },
  borrarDelTodo(id) { return this._tx('proyectos', 'readwrite', s => s.delete(id)); },
  // Cambia solo algunos datos (favorito, nombre, papelera…) sin tocar el diseño.
  async retocar(id, cambios) {
    const p = await this.leer(id);
    if (!p) return null;
    Object.assign(p, cambios);
    if (cambios.nombre && p.datos?.doc) p.datos.doc.nombre = cambios.nombre;
    await this.guardar(p);
    return p;
  },

  guardarImagen(ref, data) { return this._tx('imagenes', 'readwrite', s => s.put({ ref, data })); },
  async leerImagen(ref) { const r = await this._tx('imagenes', 'readonly', s => s.get(ref)); return r ? r.data : ''; },

  ultimo() { try { return localStorage.getItem('casadrew_ultimo') || ''; } catch { return ''; } },
  recordarUltimo(id) { try { localStorage.setItem('casadrew_ultimo', id); } catch {} },
};

// Huella corta de un texto largo (para reconocer la misma imagen sin guardarla dos veces).
function huella(s) {
  let a = 0x811c9dc5, b = 0x01000193 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    a = Math.imul(a ^ c, 16777619);
    b = Math.imul(b ^ c, 2246822507);
  }
  return (a >>> 0).toString(36) + (b >>> 0).toString(36) + s.length.toString(36);
}
