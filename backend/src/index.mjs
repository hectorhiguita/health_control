import { randomUUID } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient, QueryCommand, PutCommand, DeleteCommand,
  GetCommand, UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import {
  PREFIJO, ErrorDatos, validarRegistro, validarDocumento, validarPerfil, MAX_BYTES_DOC,
} from "./validar.mjs";
import { preguntar } from "./asistente.mjs";
import * as usuarios from "./usuarios.mjs";

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});
const s3 = new S3Client({});

const { TABLA, BUCKET, PACIENTE_ID, GRUPO_ADMIN, GRUPO_EDITOR, GRUPO_LECTOR } = process.env;
const PK = `PAC#${PACIENTE_ID}`;

/* Umbrales que se le pasan al asistente (copia de src/constantes.js) */
const UMBRALES = {
  hb: { unidad: "g/dL", alarmaMenorIgual: 7.0, vigilarMenorIgual: 8.5 },
  plaquetas: { unidad: "×10³/µL", alarmaMenorIgual: 30, vigilarMenorIgual: 50 },
  neutrofilos: { unidad: "×10³/µL", alarmaMenorIgual: 0.5, vigilarMenorIgual: 1.0 },
  leucocitos: { unidad: "×10³/µL", alarmaMenorIgual: 1.0, vigilarMenorIgual: 3.0 },
  hto: { unidad: "%", alarmaMenorIgual: 21, vigilarMenorIgual: 27 },
  temp: { unidad: "°C", alarmaMayorIgual: 38.0, vigilarMayorIgual: 37.5, nota: "urgencias inmediato en neutropenia" },
  spo2: { unidad: "%", alarmaMenorIgual: 90, vigilarMenorIgual: 93 },
  colTotal: { unidad: "mg/dL", deseable: "< 200", alto: ">= 240" },
  ldl: { unidad: "mg/dL", deseable: "< 130", alto: ">= 160" },
  hdl: { unidad: "mg/dL", deseable: ">= 50", bajo: "< 40" },
  trigliceridos: { unidad: "mg/dL", deseable: "< 150", alto: ">= 200" },
  tsh: { unidad: "mUI/L", rango: "0.4 - 4.0" },
  t4l: { unidad: "ng/dL", rango: "0.8 - 1.8" },
  t3: { unidad: "ng/dL", rango: "80 - 200" },
};

const responder = (status, cuerpo) => ({
  statusCode: status,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
  body: JSON.stringify(cuerpo),
});

const leerCuerpo = (evento) => {
  if (!evento.body) return {};
  const crudo = evento.isBase64Encoded ? Buffer.from(evento.body, "base64").toString() : evento.body;
  if (crudo.length > 100_000) throw new ErrorDatos("Cuerpo demasiado grande");
  try { return JSON.parse(crudo); } catch { throw new ErrorDatos("JSON inválido"); }
};

/** Además del token válido, la persona debe estar en un grupo con acceso. */
function permisos(evento) {
  const claims = evento.requestContext?.authorizer?.jwt?.claims ?? {};
  // Llega como "[familia otro]" o "familia"
  const grupos = String(claims["cognito:groups"] ?? "").replace(/[[\]]/g, "").split(/[\s,]+/);
  const admin = grupos.includes(GRUPO_ADMIN);
  const editor = admin || grupos.includes(GRUPO_EDITOR);
  return {
    quien: claims.username,
    admin,
    editor,
    lector: editor || grupos.includes(GRUPO_LECTOR),
  };
}

async function todo() {
  const items = [];
  let ExclusiveStartKey;
  do {
    const r = await db.send(new QueryCommand({
      TableName: TABLA,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: { ":pk": PK },
      ExclusiveStartKey,
    }));
    items.push(...r.Items);
    ExclusiveStartKey = r.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  const datos = { perfil: {}, hemogramas: [], signos: [], laboratorios: [], eventos: [], documentos: [] };
  const porPrefijo = Object.fromEntries(Object.entries(PREFIJO).map(([k, v]) => [v, k]));
  for (const it of items) {
    const [pref, id] = it.sk.split("#");
    if (pref === "PERFIL") { datos.perfil = it; continue; }
    const lista = porPrefijo[pref];
    if (lista) datos[lista].push({ ...it, id });
  }
  for (const k of Object.keys(PREFIJO)) {
    datos[k].sort((a, b) => (b.fecha + (b.hora || "")).localeCompare(a.fecha + (a.hora || "")));
  }
  const { pk, sk, ...perfil } = datos.perfil;
  datos.perfil = perfil;
  return datos;
}

const limpiar = ({ pk, sk, ...resto }) => resto;

async function crear(tipo, cuerpo) {
  const id = randomUUID();
  const item = { pk: PK, sk: `${PREFIJO[tipo]}#${id}`, ...validarRegistro(tipo, cuerpo), creado: new Date().toISOString() };
  await db.send(new PutCommand({ TableName: TABLA, Item: item }));
  return { ...limpiar(item), id };
}

async function borrar(tipo, id) {
  await db.send(new DeleteCommand({ TableName: TABLA, Key: { pk: PK, sk: `${PREFIJO[tipo]}#${id}` } }));
}

async function guardarPerfil(cuerpo) {
  const cambios = validarPerfil(cuerpo);
  const claves = Object.keys(cambios);
  if (!claves.length) throw new ErrorDatos("Nada que guardar");
  await db.send(new UpdateCommand({
    TableName: TABLA,
    Key: { pk: PK, sk: "PERFIL#" },
    UpdateExpression: "SET " + claves.map((k) => `#${k} = :${k}`).join(", ") + ", actualizado = :t",
    ExpressionAttributeNames: Object.fromEntries(claves.map((k) => [`#${k}`, k])),
    ExpressionAttributeValues: {
      ...Object.fromEntries(claves.map((k) => [`:${k}`, cambios[k]])),
      ":t": new Date().toISOString(),
    },
  }));
}

async function iniciarSubida(cuerpo) {
  const d = validarDocumento(cuerpo);
  const id = randomUUID();
  const llave = `docs/${id}`;
  const subida = await createPresignedPost(s3, {
    Bucket: BUCKET,
    Key: llave,
    Expires: 300,
    Fields: { "Content-Type": d.mime },
    Conditions: [
      ["content-length-range", 1, MAX_BYTES_DOC],
      ["eq", "$Content-Type", d.mime],
    ],
  });
  const item = { pk: PK, sk: `DOC#${id}`, ...d, llave, creado: new Date().toISOString() };
  await db.send(new PutCommand({ TableName: TABLA, Item: item }));
  return { documento: { ...limpiar(item), id }, subida };
}

async function obtenerDocumento(id) {
  const r = await db.send(new GetCommand({ TableName: TABLA, Key: { pk: PK, sk: `DOC#${id}` } }));
  if (!r.Item) throw new ErrorDatos("Documento no encontrado");
  return r.Item;
}

async function urlDocumento(id) {
  const doc = await obtenerDocumento(id);
  const url = await getSignedUrl(s3, new GetObjectCommand({
    Bucket: BUCKET, Key: doc.llave,
    ResponseContentType: doc.mime,
    ResponseContentDisposition: `inline; filename="${encodeURIComponent(doc.nombre)}"`,
  }), { expiresIn: 300 });
  return { url };
}

async function borrarDocumento(id) {
  const doc = await obtenerDocumento(id);
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: doc.llave }));
  await borrar("documentos", id);
}

export async function handler(evento) {
  const p = permisos(evento);
  if (!p.lector) return responder(403, { error: "Sin acceso" });

  const metodo = evento.requestContext.http.method;
  const partes = (evento.rawPath || "/").split("/").filter(Boolean);
  const [recurso, a, b] = partes;

  // Quien solo lee puede consultar y preguntar, nada más
  const soloLectura = (metodo === "GET" && ["datos", "documentos", "yo"].includes(recurso))
    || (metodo === "POST" && recurso === "asistente");
  if (!p.editor && !soloLectura) return responder(403, { error: "Tu cuenta solo puede ver el seguimiento" });

  try {
    if (metodo === "GET" && recurso === "yo") {
      return responder(200, { rol: p.admin ? "admin" : p.editor ? "editor" : "lector" });
    }

    if (metodo === "GET" && recurso === "datos") return responder(200, await todo());

    if (recurso === "usuarios") {
      if (!p.admin) return responder(403, { error: "Solo el administrador maneja las cuentas" });
      if (metodo === "GET" && !a) return responder(200, await usuarios.listar());
      if (metodo === "POST" && !a) return responder(201, await usuarios.crear(leerCuerpo(evento)));
      if (metodo === "PUT" && a) { await usuarios.cambiarRol(a, leerCuerpo(evento).rol, p.quien); return responder(200, { ok: true }); }
      if (metodo === "DELETE" && a) { await usuarios.borrar(a, p.quien); return responder(200, { ok: true }); }
    }

    if (recurso === "perfil" && metodo === "PUT") {
      await guardarPerfil(leerCuerpo(evento));
      return responder(200, { ok: true });
    }

    if (recurso === "registros" && ["hemogramas", "signos", "laboratorios", "eventos"].includes(a)) {
      if (metodo === "POST" && !b) return responder(201, await crear(a, leerCuerpo(evento)));
      if (metodo === "DELETE" && b) { await borrar(a, b); return responder(200, { ok: true }); }
    }

    if (recurso === "documentos") {
      if (metodo === "POST" && !a) return responder(201, await iniciarSubida(leerCuerpo(evento)));
      if (metodo === "GET" && a && b === "url") return responder(200, await urlDocumento(a));
      if (metodo === "DELETE" && a) { await borrarDocumento(a); return responder(200, { ok: true }); }
    }

    if (recurso === "asistente" && metodo === "POST") {
      const cuerpo = leerCuerpo(evento);
      const pregunta = typeof cuerpo.pregunta === "string" ? cuerpo.pregunta.trim().slice(0, 2000) : "";
      if (!pregunta) throw new ErrorDatos("Escribe una pregunta");
      const respuesta = await preguntar({ pregunta, historial: cuerpo.historial }, await todo(), UMBRALES);
      return responder(200, { respuesta });
    }

    return responder(404, { error: "Ruta no encontrada" });
  } catch (e) {
    if (e instanceof ErrorDatos) return responder(400, { error: e.message });
    if (e.message === "SIN_LLAVE") return responder(503, { error: "Falta configurar la llave de Claude (ver README)." });
    if (e?.name === "APIConnectionTimeoutError") return responder(504, { error: "Claude tardó demasiado. Intenta una pregunta más corta." });
    if (/credit balance/i.test(e?.message ?? "")) return responder(503, { error: "La cuenta de Anthropic no tiene saldo. Recárgala en console.anthropic.com → Plans & Billing." });
    if (e?.status === 401) return responder(503, { error: "La llave de Anthropic no es válida. Revisa el parámetro en SSM." });
    console.error(JSON.stringify({ ruta: evento.rawPath, error: e?.name, mensaje: e?.message }));
    return responder(500, { error: "Error interno" });
  }
}
