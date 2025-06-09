import { iniciarSimulador } from './lib/simuladorVocacional.js';

// CLI simple
console.log('Bienvenido al Simulador Vocacional IA\n');
process.stdout.write('Por favor, ingresa tu nombre: ');
process.stdin.once('data', async (data) => {
  const nombre = data.toString().trim();
  await iniciarSimulador(nombre);
  process.exit(0);
});