import Anthropic from "@anthropic-ai/sdk";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const ssm = new SSMClient({});
let cliente = null;

async function obtenerCliente() {
  if (cliente) return cliente;
  const r = await ssm.send(new GetParameterCommand({
    Name: process.env.PARAM_CLAUDE, WithDecryption: true,
  }));
  const apiKey = r.Parameter?.Value;
  if (!apiKey || apiKey === "CAMBIAR") {
    throw new Error("SIN_LLAVE");
  }
  // API Gateway corta a los 30 s: no reintentar más allá
  cliente = new Anthropic({ apiKey, timeout: 26_000, maxRetries: 0 });
  return cliente;
}

const SISTEMA = `Eres un asistente que ayuda a un familiar a entender el seguimiento médico de su mamá.
Ella tiene síndrome mielodisplásico con exceso de blastos tipo I y recibe azacitidina. También se controla colesterol y tiroides.

Recibes sus registros en JSON: hemogramas, signos vitales, laboratorios (lípidos y tiroides), calendario de citas y aplicaciones, y la lista de documentos subidos (solo nombres, no su contenido).

Reglas:
- Responde en español claro y corto. Cita fechas y valores concretos de los datos.
- Describe tendencias y compara con los umbrales dados. No inventes datos que no estén.
- No diagnostiques ni cambies tratamientos. Para decisiones clínicas, remite al hematólogo tratante.
- Si un valor o síntoma coincide con un signo de urgencia o cruza un umbral de alarma, dilo primero y recomienda llamar a la clínica o ir a urgencias.
- Si los datos no alcanzan para responder, dilo.`;

/** Arma el contexto sin datos que identifiquen a la paciente. */
function contexto(datos, umbrales) {
  const quitar = ({ pk, sk, creado, ...resto }) => resto;
  return JSON.stringify({
    hoy: new Date().toISOString().slice(0, 10),
    umbrales,
    inicioCiclo1: datos.perfil?.inicioCiclo || null,
    hemogramas: datos.hemogramas.map(quitar),
    signos: datos.signos.map(quitar),
    laboratorios: datos.laboratorios.map(quitar),
    eventos: datos.eventos.map(quitar),
    documentos: datos.documentos.map(({ fecha, nombre, categoria }) => ({ fecha, nombre, categoria })),
  });
}

export async function preguntar({ pregunta, historial = [] }, datos, umbrales) {
  const c = await obtenerCliente();

  const previos = historial
    .filter((m) => (m.rol === "usuario" || m.rol === "asistente") && typeof m.texto === "string")
    .slice(-10)
    .map((m) => ({ role: m.rol === "usuario" ? "user" : "assistant", content: m.texto.slice(0, 4000) }));

  const respuesta = await c.beta.messages.create({
    model: process.env.MODELO_CLAUDE,
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low" },
    system: SISTEMA,
    messages: [
      { role: "user", content: `Registros actuales:\n${contexto(datos, umbrales)}` },
      { role: "assistant", content: "Recibí los registros. ¿Qué quieres saber?" },
      ...previos,
      { role: "user", content: pregunta },
    ],
  });

  if (respuesta.stop_reason === "refusal") {
    return "No pude responder esa pregunta. Intenta formularla de otra manera.";
  }
  const texto = respuesta.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  return texto || "No obtuve respuesta. Intenta de nuevo.";
}
