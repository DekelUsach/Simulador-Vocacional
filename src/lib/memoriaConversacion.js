import fs from 'fs';
const MEMORIA_PATH = './src/lib/memoria.json';

export function saveMessage(usuario, mensaje) {
  let memoria = {};
  if (fs.existsSync(MEMORIA_PATH)) {
    memoria = JSON.parse(fs.readFileSync(MEMORIA_PATH));
  }
  if (!memoria[usuario]) memoria[usuario] = [];
  memoria[usuario].push(mensaje);
  fs.writeFileSync(MEMORIA_PATH, JSON.stringify(memoria, null, 2));
}

export function getConversation(usuario) {
  if (!fs.existsSync(MEMORIA_PATH)) return [];
  const memoria = JSON.parse(fs.readFileSync(MEMORIA_PATH));
  return memoria[usuario] || [];
}