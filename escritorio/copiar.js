// Copia el estudio web dentro del programa de escritorio (app/estudio), para que el .exe use el mismo código.
const fs = require('fs');
const path = require('path');
const origen = path.join(__dirname, '..', 'estudio');
const destino = path.join(__dirname, 'app', 'estudio');
fs.rmSync(path.join(__dirname, 'app'), { recursive: true, force: true });
fs.cpSync(origen, destino, { recursive: true });
console.log('Estudio copiado en', destino);
