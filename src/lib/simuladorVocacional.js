import { Ollama } from '@llamaindex/ollama';
import { saveMessage, getConversation } from './memoriaConversacion.js';

const MODEL_NAME = 'qwen3:1.7b';

const SYSTEM_PROMPT = `
Eres un orientador vocacional IA. Tu objetivo es ayudar al usuario a identificar posibles trayectorias educativas o laborales. Haz preguntas abiertas sobre intereses, gustos y preferencias. Siempre responde de manera empática, clara y accesible. Si tienes historial previo, úsalo como referencia.
`;

const PREGUNTAS = [
  "¿Qué actividades disfrutas hacer en tu tiempo libre?",
  "¿Qué materias o temas te resultan más interesantes o fáciles de aprender?",
  "¿Prefieres trabajar en equipo o de manera independiente?",
];

export async function iniciarSimulador(nombreUsuario) {
  const ollama = new Ollama({ model: MODEL_NAME });

  // Recuperar historial (bonus)
  const historial = getConversation(nombreUsuario) || [];
  let respuestas = [];

  // Hacer preguntas al usuario y guardar respuestas
  for (const pregunta of PREGUNTAS) {
    console.log('\x1b[36mOrientador IA:\x1b[0m', pregunta);
    const respuesta = await promptUsuario('Tú: ');
    respuestas.push(respuesta);
    saveMessage(nombreUsuario, { rol: 'user', texto: respuesta });
  }

  // Armamos los mensajes para el modelo
  let messages = [
    { role: "system", content: SYSTEM_PROMPT }
  ];

  // Solo usamos la última conversación como contexto (opcional)
  if (historial.length > 0) {
    const ultimosMensajes = historial.slice(-6); // solo los últimos 3 pares
    ultimosMensajes.forEach(msg => {
      messages.push({ role: msg.rol === 'user' ? 'user' : 'assistant', content: msg.texto });
    });
  }

  // Insertamos las preguntas y respuestas actuales
  for (let i = 0; i < PREGUNTAS.length; i++) {
    messages.push({ role: "assistant", content: PREGUNTAS[i] });
    messages.push({ role: "user", content: respuestas[i] });
  }

  // Mensaje directo pidiendo sugerencia
  messages.push({
    role: "user",
    content:
      "Con base en mis respuestas anteriores, dime al menos dos carreras o trayectorias laborales que podrían ser adecuadas para mí. Explica brevemente por qué sugieres cada una. Sé concreto, amable y empático."
  });

  // Llama a Ollama pasando el array de mensajes
  const respuestaIA = await ollama.chat({ messages });

  // Debug para ver la estructura real de la respuesta
  // console.log('DEBUG respuestaIA:', respuestaIA);

  // Mostrar la respuesta correcta si existe
  let sugerencia = "";
  if (respuestaIA.message?.content && respuestaIA.message.content.trim() !== "") {
    sugerencia = respuestaIA.message.content;
  } else if (respuestaIA.content && respuestaIA.content.trim() !== "") {
    sugerencia = respuestaIA.content;
  } else if (typeof respuestaIA === "string" && respuestaIA.trim() !== "") {
    sugerencia = respuestaIA;
  }

  if (sugerencia) {
    console.log('\x1b[32mOrientador IA (sugerencias):\x1b[0m', sugerencia);
    saveMessage(nombreUsuario, { rol: 'ia', texto: sugerencia });
  } else {
    console.log('\x1b[31mNo se pudo obtener sugerencias de la IA. Verifica que Ollama esté corriendo, el modelo funcione y prueba hacer la pregunta más directa.\x1b[0m');
  }
}

function promptUsuario(pregunta) {
  return new Promise(resolve => {
    process.stdout.write(pregunta);
    process.stdin.once('data', data => resolve(data.toString().trim()));
  });
}