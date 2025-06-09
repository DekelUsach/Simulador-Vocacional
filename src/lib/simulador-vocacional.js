import { createInterface } from "readline";
import { Ollama } from "@llamaindex/ollama";

// Instanciar el modelo Ollama (ajusta el nombre/modelo si usas otro)
const ollamaLLM = new Ollama({
  model: "qwen3:1.7b",
  temperature: 0.7,
  timeout: 2 * 60 * 1000,
});

// Preguntas abiertas del simulador vocacional
const preguntas = [
  "¿Qué actividades disfrutas hacer en tu tiempo libre?",
  "¿Qué materias o áreas te atraen más en la escuela o en la vida diaria?",
  "¿Prefieres trabajar en equipo o de forma individual?",
  "¿Qué tipo de ambiente de trabajo te gustaría en el futuro?",
  "¿Hay alguna carrera, oficio o tarea que te llame la atención? ¿Por qué?"
];

function mostrarMemoria(historial) {
  console.log("\n[Memoria de la conversación]:");
  for (const entrada of historial) {
    console.log(`${entrada.autor}: ${entrada.mensaje}`);
  }
}

export async function simuladorVocacional() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const historial = [];
  const respuestas = [];

  function guardar(mensaje, autor) {
    historial.push({ autor, mensaje });
  }

  async function preguntar(pregunta) {
    return new Promise(resolve => {
      rl.question(pregunta + "\n", respuesta => {
        guardar(pregunta, "Bot");
        guardar(respuesta, "Usuario");
        respuestas.push(respuesta);
        resolve(respuesta);
      });
    });
  }

  console.log("¡Hola! Soy tu simulador vocacional. Te haré unas preguntas para ayudarte a descubrir posibles carreras, oficios o tareas que podrían interesarte.");
  guardar("¡Hola! Soy tu simulador vocacional. Te haré unas preguntas para ayudarte a descubrir posibles carreras, oficios o tareas que podrían interesarte.", "Bot");

  for (const pregunta of preguntas) {
    await preguntar(pregunta);
  }

  mostrarMemoria(historial);

  // Construye el prompt para Ollama
  const prompt = `
Eres un orientador vocacional virtual. Recibirás una serie de respuestas de un usuario sobre sus intereses, gustos, preferencias y expectativas laborales.

En base a TODA la información brindada (sin limitarte a una lista predefinida), analiza el perfil y recomienda de forma flexible y concisa al menos dos opciones de carreras, oficios o tareas que podrían ser afines para esa persona. Pueden ser universitarias, tecnicaturas, oficios, arte, deportes, emprendimientos, etc. Explica brevemente por qué haces esas recomendaciones, relacionándolas con las respuestas del usuario. Si lo ves relevante, puedes sugerir actividades concretas, trayectos alternativos, o incluso combinaciones. No repitas literalmente las respuestas, sintetiza y personaliza la orientación.

Respuestas del usuario:
${respuestas.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Recomendaciones:
`;

  // Llama a Ollama para obtener la sugerencia personalizada
  let sugerenciaTexto = "\nNo se pudo obtener sugerencias. Intenta de nuevo.\n";
  try {
    const respuesta = await ollamaLLM.complete({ prompt });
    sugerenciaTexto = "\nSugerencias personalizadas para ti:\n" + respuesta.data.result;
    guardar(sugerenciaTexto, "Bot");
    console.log(sugerenciaTexto);
  } catch (e) {
    console.error("Error al consultar el modelo:", e);
    console.log(sugerenciaTexto);
  }

  // Referenciar una respuesta para demostrar memoria
  console.log(`\nPor ejemplo, mencionaste: "${respuestas[0]}". Eso fue tenido en cuenta para las sugerencias.`);

  rl.close();
}