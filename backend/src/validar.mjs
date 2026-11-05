/* Forma permitida de cada tipo de registro.
   Lo que no esté aquí se descarta antes de guardar. */

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^\d{2}:\d{2}$/;

const NUMEROS = {
  hemogramas: {
    hb: [0, 30], hto: [0, 100], leucocitos: [0, 500],
    neutrofilos: [0, 500], plaquetas: [0, 2000],
  },
  signos: {
    temp: [30, 45], spo2: [0, 100], peso: [0, 300],
    sis: [0, 300], dia: [0, 200], fc: [0, 300],
  },
  laboratorios: {
    colTotal: [0, 1000], ldl: [0, 1000], hdl: [0, 300], trigliceridos: [0, 5000],
    tsh: [0, 200], t4l: [0, 20], t3: [0, 1000],
  },
};

const TIPOS_EVENTO = ["cita", "azacitidina", "examen", "otro"];

export const PREFIJO = {
  hemogramas: "HEMO",
  signos: "SIGNO",
  laboratorios: "LAB",
  eventos: "EVENTO",
  documentos: "DOC",
};

const texto = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export class ErrorDatos extends Error {}

export function validarRegistro(tipo, d) {
  if (!d || typeof d !== "object") throw new ErrorDatos("Cuerpo inválido");
  if (!FECHA.test(d.fecha ?? "")) throw new ErrorDatos("Fecha inválida (AAAA-MM-DD)");

  const limpio = { fecha: d.fecha, nota: texto(d.nota, 500) };

  if (tipo === "eventos") {
    if (!TIPOS_EVENTO.includes(d.tipo)) throw new ErrorDatos("Tipo de evento inválido");
    if (d.hora && !HORA.test(d.hora)) throw new ErrorDatos("Hora inválida (HH:MM)");
    const titulo = texto(d.titulo, 120);
    if (!titulo) throw new ErrorDatos("Falta el título");
    return {
      ...limpio, tipo: d.tipo, titulo, hora: d.hora || "",
      lugar: texto(d.lugar, 120), dosis: texto(d.dosis, 60),
      hecho: d.hecho === true,
    };
  }

  const campos = NUMEROS[tipo];
  if (!campos) throw new ErrorDatos("Tipo desconocido");
  let alguno = false;
  for (const [k, [min, max]] of Object.entries(campos)) {
    const v = d[k];
    if (v === null || v === undefined || v === "") { limpio[k] = null; continue; }
    if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max) {
      throw new ErrorDatos(`Valor fuera de rango: ${k}`);
    }
    limpio[k] = v;
    alguno = true;
  }
  if (!alguno) throw new ErrorDatos("Registra al menos un valor");
  if (tipo === "laboratorios") limpio.laboratorio = texto(d.laboratorio, 120);
  return limpio;
}

const MIME_DOC = ["application/pdf", "image/jpeg", "image/png", "image/heic", "image/webp"];
export const MAX_BYTES_DOC = 15 * 1024 * 1024;
const CATEGORIAS_DOC = ["hemograma", "colesterol", "tiroides", "orden", "otro"];

export function validarDocumento(d) {
  if (!d || typeof d !== "object") throw new ErrorDatos("Cuerpo inválido");
  if (!FECHA.test(d.fecha ?? "")) throw new ErrorDatos("Fecha inválida");
  if (!MIME_DOC.includes(d.mime)) throw new ErrorDatos("Solo PDF o imagen");
  if (!Number.isInteger(d.tamano) || d.tamano <= 0 || d.tamano > MAX_BYTES_DOC) {
    throw new ErrorDatos("El archivo pasa de 15 MB");
  }
  const nombre = texto(d.nombre, 150).replace(/[^\w.\- áéíóúñÁÉÍÓÚÑ()]/g, "_");
  if (!nombre) throw new ErrorDatos("Falta el nombre");
  return {
    fecha: d.fecha, nombre, mime: d.mime, tamano: d.tamano,
    categoria: CATEGORIAS_DOC.includes(d.categoria) ? d.categoria : "otro",
    nota: texto(d.nota, 300),
  };
}

export function validarPerfil(d) {
  const limpio = {};
  if (d?.inicioCiclo !== undefined) {
    if (d.inicioCiclo !== "" && !FECHA.test(d.inicioCiclo)) throw new ErrorDatos("Fecha inválida");
    limpio.inicioCiclo = d.inicioCiclo;
  }
  if (d?.sembrado === true) limpio.sembrado = true;
  return limpio;
}
