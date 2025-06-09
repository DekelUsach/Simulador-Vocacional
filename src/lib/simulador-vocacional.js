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

  // Presentación amable y clara
  console.log("¡Hola! Soy tu orientador vocacional IA. Te haré algunas preguntas sobre tus intereses y preferencias para sugerirte posibles caminos educativos o laborales.");
  guardar("¡Hola! Soy tu orientador vocacional IA. Te haré algunas preguntas sobre tus intereses y preferencias para sugerirte posibles caminos educativos o laborales.", "Bot");

  // Realizar al menos 3 preguntas abiertas (pueden ser más si gustas)
  for (let i = 0; i < preguntas.length; i++) {
    await preguntar(preguntas[i]);
    if (i === 2) { // Luego de 3 preguntas, se puede dar la opción de seguir o no
      await new Promise(resolve => {
        rl.question("¿Querés responder más preguntas para afinar la recomendación? (sí/no)\n", respuesta => {
          guardar("¿Querés responder más preguntas para afinar la recomendación?", "Bot");
          guardar(respuesta, "Usuario");
          if (respuesta.trim().toLowerCase() !== "sí") {
            resolve("break");
          } else {
            resolve();
          }
        });
      }).then(x => { if (x === "break") preguntas.length = i + 1; });
    }
  }

  mostrarMemoria(historial);

  // System prompt claro y empático, con instrucciones explícitas
  const prompt = `
Eres un orientador vocacional empático y profesional. Recibirás una serie de respuestas de un usuario sobre sus intereses, gustos, preferencias y expectativas laborales.

Tu tarea es:
- Analizar toda la información brindada (usa también la memoria de la conversación para personalizar la respuesta).
- Recomendar de forma clara, amable y flexible al menos dos opciones concretas de carreras, oficios o trayectorias educativas/laborales que podrían ser afines para esa persona.
- Explicar brevemente por qué haces esas recomendaciones, vinculándolas con lo que respondió el usuario.
- Si es relevante, sugerir actividades concretas, trayectos alternativos o combinaciones.
- No repitas literalmente las respuestas: sintetiza y personaliza.
- Mantén siempre un tono accesible y alentador.
- Si el usuario vuelve a preguntar, puedes referenciar lo que ya ha contado.

Historial de la conversación:
${historial.map(h => `${h.autor}: ${h.mensaje}`).join('\n')}

Solo responde con la orientación vocacional (no repitas las preguntas).
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

  // Demostrar memoria: referencia explícita a una respuesta anterior
  if (respuestas.length > 0) {
    console.log(`\nPor ejemplo, mencionaste: "${respuestas[0]}". Eso fue tenido en cuenta para las sugerencias.\n`);
  }

  rl.close();
}
let sugerenciaTexto = "\nNo se pudo obtener sugerencias. Intenta de nuevo.\n";
try {
  const respuesta = await ollamaLLM.complete({ prompt });
  // Depuración: muestra toda la respuesta del modelo
  // console.log("DEBUG OLLAMA:", respuesta);

  let result = null;
  if (respuesta?.data?.result) {
    result = respuesta.data.result;
  } else if (respuesta?.result) {
    result = respuesta.result;
  } else if (typeof respuesta === "string") {
    result = respuesta;
  }

  if (result) {
    sugerenciaTexto = "\nSugerencias personalizadas para ti:\n" + result;
    guardar(sugerenciaTexto, "Bot");
    console.log(sugerenciaTexto);
  } else {
    // Muestra la respuesta cruda para depuración
    console.error("Respuesta inesperada del modelo:", respuesta);
    console.log(sugerenciaTexto);
  }
} catch (e) {
  console.error("Error al consultar el modelo:", e);
  console.log(sugerenciaTexto);
}