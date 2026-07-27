import { UMBRALES } from "./constantes";

export const hoyISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const fmtFecha = (iso) => {
  if (!iso) return "—";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
};

export const fmtFechaCorta = (iso) => {
  if (!iso) return "—";
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};

export const diasEntre = (isoA, isoB) =>
  Math.round((new Date(isoB + "T00:00:00") - new Date(isoA + "T00:00:00")) / 86400000);

export const sumarDias = (iso, n) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

/** 'alarma' | 'precaucion' | 'ok' | null */
export function evaluar(clave, valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const u = UMBRALES[clave];
  if (!u) return null;
  const v = parseFloat(valor);
  if (Number.isNaN(v)) return null;

  if (u.invertido) {
    if (v >= u.alarma) return "alarma";
    if (v >= u.precaucion) return "precaucion";
    return "ok";
  }
  if (v <= u.alarma) return "alarma";
  if (v <= u.precaucion) return "precaucion";
  return "ok";
}

export const num = (v) =>
  v === "" || v === null || v === undefined ? null : parseFloat(v);

export function armarReporte(paciente, hemogramas, signos, inicioCiclo) {
  const L = [];
  const pad = (v, n) => String(v ?? "—").padEnd(n);
  L.push(`SEGUIMIENTO CLÍNICO — ${paciente.nombre.toUpperCase()}`);
  L.push(`CC ${paciente.cc} · ${paciente.cie}`);
  L.push(`Hematólogo: ${paciente.hematologo} — ${paciente.institucion}`);
  if (inicioCiclo) L.push(`Inicio ciclo 1 de Azacitidina: ${fmtFecha(inicioCiclo)}`);
  L.push(`Generado: ${fmtFecha(hoyISO())}`);
  L.push("");
  L.push("HEMOGRAMAS");
  L.push("Fecha         Hb     Hto    Leuco  Neutró  Plaq");
  [...hemogramas].sort((a, b) => a.fecha.localeCompare(b.fecha)).forEach((d) => {
    L.push(`${pad(fmtFecha(d.fecha), 13)} ${pad(d.hb, 6)} ${pad(d.hto, 6)} ${pad(d.leucocitos, 6)} ${pad(d.neutrofilos, 7)} ${pad(d.plaquetas, 5)}`);
    if (d.nota) L.push(`              ${d.nota}`);
  });
  L.push("");
  L.push("SIGNOS VITALES");
  L.push("Fecha         Temp   SpO2   Peso   PA         FC");
  [...signos].sort((a, b) => a.fecha.localeCompare(b.fecha)).forEach((d) => {
    const pa = d.sis != null ? `${d.sis}/${d.dia ?? "—"}` : "—";
    L.push(`${pad(fmtFecha(d.fecha), 13)} ${pad(d.temp, 6)} ${pad(d.spo2, 6)} ${pad(d.peso, 6)} ${pad(pa, 10)} ${pad(d.fc, 4)}`);
    if (d.nota) L.push(`              ${d.nota}`);
  });
  return L.join("\n");
}
