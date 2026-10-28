// CASADREW · conexión con el servidor (Google Sheets + Apps Script).
// La clave NO está en el código: se escribe una vez en cada aparato y se guarda en ese aparato.
const SERVIDOR = 'https://script.google.com/macros/s/AKfycbxv5VCKaqzoQNwlR_O3I93FUahefdlW8NFfeMB2uEUB3gXoRtuwMG9F1zYkRxbFo5zu/exec';
const LLAVE_LOCAL = 'casadrew_clave';

const Datos = {
  clave() { try { return localStorage.getItem(LLAVE_LOCAL) || ''; } catch { return ''; } },
  guardarClave(c) { try { localStorage.setItem(LLAVE_LOCAL, c.trim()); } catch {} },
  olvidarClave() { try { localStorage.removeItem(LLAVE_LOCAL); } catch {} },

  async _respuesta(r) {
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'Error del servidor');
    return j;
  },
  async ping() {
    const u = `${SERVIDOR}?accion=ping&clave=${encodeURIComponent(this.clave())}`;
    return this._respuesta(await fetch(u));
  },
  async listar(hoja) {
    const u = `${SERVIDOR}?accion=listar&hoja=${encodeURIComponent(hoja)}&clave=${encodeURIComponent(this.clave())}`;
    return (await this._respuesta(await fetch(u))).filas;
  },
  // text/plain para que el navegador no haga la consulta previa (Apps Script no la admite).
  async _enviar(cuerpo) {
    const r = await fetch(SERVIDOR, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                                      body: JSON.stringify({ ...cuerpo, clave: this.clave() }) });
    return this._respuesta(r);
  },
  async agregar(hoja, datos) { return (await this._enviar({ accion: 'agregar', hoja, datos })).fila; },
  async actualizar(hoja, id, datos) { return (await this._enviar({ accion: 'actualizar', hoja, id, datos })).fila; },
  async borrar(hoja, id) { await this._enviar({ accion: 'borrar', hoja, id }); },
};
