// CASADREW Estudio · programa de escritorio para Windows.
// Abre el mismo estudio que la versión web, servido desde casadrew://estudio/ para que los diseños
// guardados tengan siempre el mismo sitio (no se pierden al actualizar el programa).
const { app, BrowserWindow, Menu, protocol, net, shell } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

const RAIZ = path.join(__dirname, 'app');

protocol.registerSchemesAsPrivileged([
  { scheme: 'casadrew', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
]);

function crearVentana() {
  const ventana = new BrowserWindow({
    width: 1440, height: 900, minWidth: 900, minHeight: 600,
    title: 'CASADREW Estudio', backgroundColor: '#f6f1ea', show: false,
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  ventana.once('ready-to-show', () => { ventana.maximize(); ventana.show(); });
  // Los enlaces externos se abren en el navegador, no dentro del programa.
  ventana.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  ventana.loadURL('casadrew://estudio/index.html');
}

// Solo una copia del programa abierta a la vez.
if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', () => {
  const v = BrowserWindow.getAllWindows()[0];
  if (v) { if (v.isMinimized()) v.restore(); v.focus(); }
});

app.whenReady().then(() => {
  protocol.handle('casadrew', req => {
    const { host, pathname } = new URL(req.url);
    const ruta = path.normalize(path.join(RAIZ, host, decodeURIComponent(pathname)));
    if (!ruta.startsWith(RAIZ)) return new Response('No permitido', { status: 403 });
    return net.fetch(pathToFileURL(ruta).toString());
  });
  // Los menús los dibuja el propio estudio (iguales en el PC y en el iPad).
  Menu.setApplicationMenu(null);
  crearVentana();
});
app.on('window-all-closed', () => app.quit());
