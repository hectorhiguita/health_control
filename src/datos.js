import { token } from "./auth";
import { SEMILLA_HEMOGRAMAS, SEMILLA_SIGNOS } from "./constantes";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export class ErrorApi extends Error {
  constructor(mensaje, estado) { super(mensaje); this.estado = estado; }
}

async function pedir(ruta, { metodo = "GET", cuerpo } = {}) {
  const r = await fetch(`${API}${ruta}`, {
    method: metodo,
    headers: {
      authorization: `Bearer ${await token()}`,
      ...(cuerpo ? { "content-type": "application/json" } : {}),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new ErrorApi(json.error || `Error ${r.status}`, r.status);
  return json;
}

/** Todo el historial en una sola llamada. */
export const cargarTodo = () => pedir("/datos");

export const agregar = (tipo, d) => pedir(`/registros/${tipo}`, { metodo: "POST", cuerpo: d });
export const borrar = (tipo, id) => pedir(`/registros/${tipo}/${id}`, { metodo: "DELETE" });

export const guardarInicioCiclo = (fecha) =>
  pedir("/perfil", { metodo: "PUT", cuerpo: { inicioCiclo: fecha } });

export async function subirDocumento(archivo, meta) {
  const { documento, subida } = await pedir("/documentos", {
    metodo: "POST",
    cuerpo: { ...meta, nombre: archivo.name, mime: archivo.type, tamano: archivo.size },
  });
  const form = new FormData();
  Object.entries(subida.fields).forEach(([k, v]) => form.append(k, v));
  form.append("file", archivo);
  const r = await fetch(subida.url, { method: "POST", body: form });
  if (!r.ok) {
    await borrarDocumento(documento.id).catch(() => {});
    throw new ErrorApi("No se pudo subir el archivo", r.status);
  }
  return documento;
}

export const urlDocumento = (id) => pedir(`/documentos/${id}/url`).then((r) => r.url);
export const borrarDocumento = (id) => pedir(`/documentos/${id}`, { metodo: "DELETE" });

export const preguntarAsistente = (pregunta, historial) =>
  pedir("/asistente", { metodo: "POST", cuerpo: { pregunta, historial } }).then((r) => r.respuesta);

/**
 * Siembra los datos clínicos de partida una única vez.
 * Marca el perfil para no repetirlo nunca.
 */
export async function sembrarSiHaceFalta(datos) {
  if (datos.perfil?.sembrado) return false;
  if (!datos.hemogramas.length && !datos.signos.length) {
    await Promise.all([
      ...SEMILLA_HEMOGRAMAS.map((h) => agregar("hemogramas", h)),
      ...SEMILLA_SIGNOS.map((s) => agregar("signos", s)),
    ]);
  }
  await pedir("/perfil", { metodo: "PUT", cuerpo: { sembrado: true } });
  return true;
}
