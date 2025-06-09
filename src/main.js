import { tool, agent } from "llamaindex";
import { Ollama } from "@llamaindex/ollama";
import { z } from "zod";
import { empezarChat } from "./lib/cli-chat.js";
import { Estudiantes } from "./lib/estudiantes.js";
import { simuladorVocacional } from "./lib/simulador-vocacional.js";
import { createInterface } from "readline";

// Configuración
const DEBUG = true;

// Instancia de la clase Estudiantes
const estudiantes = new Estudiantes();

// System prompt básico
const systemPrompt = `
Sos un asistente para gestionar estudiantes.
Tu tarea es ayudar a consultar o modificar una base de datos de alumnos.

Usá las herramientas disponibles para:
- Buscar estudiantes por nombre o apellido
- Agregar nuevos estudiantes
- Mostrar la lista completa de estudiantes

Respondé de forma clara y breve.
`.trim();

const ollamaLLM = new Ollama({
    model: "qwen3:1.7b",
    temperature: 0.75,
    timeout: 2 * 60 * 1000, // Timeout de 2 minutos
});

// Tool para buscar por nombre
const buscarPorNombreTool = tool({
    name: "buscarPorNombre",
    description: "Usa esta función para encontrar estudiantes por su nombre",
    parameters: z.object({
        nombre: z.string().describe("El nombre del estudiante a buscar"),
    }),
    execute: ({ nombre }) => {  
        return estudiantes.buscarEstudiantePorNombre(nombre);
    },
});

// Tool para buscar por apellido
const buscarPorApellidoTool = tool({
    name: "buscarPorApellido",
    description: "Usa esta función para encontrar estudiantes por su apellido",
    parameters: z.object({
        apellido: z.string().describe("El apellido del estudiante a buscar"),
    }),
    execute: ({ apellido }) => {
        return estudiantes.buscarEstudiantePorApellido(apellido);
    },
});

// Tool para agregar estudiante
const agregarEstudianteTool = tool({
    name: "agregarEstudiante",
    description: "Usa esta función para agregar un nuevo estudiante",
    parameters: z.object({
        nombre: z.string().describe("El nombre del estudiante"),
        apellido: z.string().describe("El apellido del estudiante"),
        curso: z.string().describe("El curso del estudiante (ej: 4A, 4B, 5A)"),
    }),
    execute: ({ nombre, apellido, curso }) => {
        return estudiantes.agregarEstudiante(nombre, apellido, curso);
    },
});

// Tool para listar estudiantes
const listarEstudiantesTool = tool({
    name: "listarEstudiantes",
    description: "Usa esta función para mostrar todos los estudiantes",
    parameters: z.object({}),
    execute: () => {
        return estudiantes.listarEstudiantes();
    },
});

// Configuración del agente
const elAgente = agent({
    tools: [buscarPorNombreTool, buscarPorApellidoTool, agregarEstudianteTool, listarEstudiantesTool],
    llm: ollamaLLM,
    verbose: false,
    systemPrompt: systemPrompt,
});

const mensajeBienvenida = `
¡Hola! Soy tu asistente. ¿Qué modo deseas usar?
1) Gestor de Estudiantes
2) Simulador Vocacional

Escribe 1 o 2 y presiona ENTER:
`;

// Menú inicial para elegir modo
async function mainMenu() {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question(mensajeBienvenida, async (modo) => {
        if (modo.trim() === "1") {
            console.log("\nEntrando al Gestor de Estudiantes...\n");
            rl.close();
            empezarChat(elAgente, "¡Bienvenido al gestor de estudiantes!");
        } else if (modo.trim() === "2") {
            console.log("\nEntrando al Simulador Vocacional...\n");
            rl.close();
            await simuladorVocacional();
        } else {
            console.log("Por favor, ingresa una opción válida (1 o 2).");
            rl.close();
            mainMenu();
        }
    });
}

// Iniciar el menú principal
mainMenu();