// CASADREW · Estudio — guardado en este aparato (IndexedDB).
// Más adelante el PC será el almacén principal; esto es la copia local que permite trabajar sin conexión.
const Almacen = {
  _db: null,
  abrir() {
    if (!this._db) this._db = new Promise((ok, mal) => {
      const r = indexedDB.open('casadrew-estudio', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('proyectos', { keyPath: 'id' });
      r.onsuccess = () => ok(r.result);
      r.onerror = () => mal(r.error);
    });
    return this._db;
  },
  async _tx(modo, fn) {
    const db = await this.abrir();
    return new Promise((ok, mal) => {
      const t = db.transaction('proyectos', modo);
      const req = fn(t.objectStore('proyectos'));
      t.oncomplete = () => ok(req && req.result);
      t.onerror = () => mal(t.error);
    });
  },
  guardar(p) { return this._tx('readwrite', s => s.put(p)); },
  leer(id) { return this._tx('readonly', s => s.get(id)); },
  listar() { return this._tx('readonly', s => s.getAll()); },

  ultimo() { try { return localStorage.getItem('casadrew_ultimo') || ''; } catch { return ''; } },
  recordarUltimo(id) { try { localStorage.setItem('casadrew_ultimo', id); } catch {} },
};
