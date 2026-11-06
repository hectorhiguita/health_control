import React, { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea,
} from "recharts";
import { C, FONT_BODY, FONT_DATA } from "../tokens";
import { UMBRALES, GRUPOS_LAB } from "../constantes";
import { hoyISO, fmtFecha, fmtFechaCorta, num } from "../utils";
import { Tarjeta, Etiqueta, Campo, Boton, Valor, celda, BotonBorrar } from "./ui";

const CLAVES = GRUPOS_LAB.flatMap((g) => g.claves);
const VACIO = { fecha: "", laboratorio: "", nota: "", ...Object.fromEntries(CLAVES.map((k) => [k, ""])) };

/** Franja "en rango" según el tipo de umbral */
function franjaNormal(u) {
  if (u.rango) return u.rango;
  if (u.invertido) return [u.dominio[0], u.precaucion];
  return [u.precaucion, u.dominio[1]];
}

function Grafica({ clave, serie }) {
  const u = UMBRALES[clave];
  const conDato = serie.filter((d) => d[clave] !== null && d[clave] !== undefined);
  if (conDato.length < 2) return null;
  const [y1, y2] = franjaNormal(u);

  return (
    <Tarjeta>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div>
          <Etiqueta style={{ marginBottom: 2 }}>{u.label}</Etiqueta>
          <span style={{ fontFamily: FONT_DATA, fontSize: 11, color: C.ink40 }}>{u.unidad}</span>
        </div>
        <span style={{ fontFamily: FONT_DATA, fontSize: 10, color: C.sage, letterSpacing: "0.08em" }}>
          EN RANGO {y1}–{y2}
        </span>
      </div>
      <div style={{ height: 170 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={conDato} margin={{ top: 5, right: 24, left: -18, bottom: 0 }}>
            <ReferenceArea y1={y1} y2={y2} fill={C.sage} fillOpacity={0.08} />
            <CartesianGrid stroke={C.line} strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="etiqueta" tick={{ fontSize: 10, fill: C.ink40, fontFamily: FONT_DATA }}
              axisLine={{ stroke: C.line }} tickLine={false} />
            <YAxis domain={u.dominio} tick={{ fontSize: 10, fill: C.ink40, fontFamily: FONT_DATA }}
              axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: C.surface, border: `1px solid ${C.line}`,
                borderRadius: 2, fontFamily: FONT_DATA, fontSize: 12,
              }}
              formatter={(v) => [`${v} ${u.unidad}`, u.label]}
            />
            <Line type="monotone" dataKey={clave} stroke={C.slate} strokeWidth={2}
              dot={{ r: 3.5, fill: C.slate, strokeWidth: 0 }} activeDot={{ r: 5, fill: C.ink }}
              isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Tarjeta>
  );
}

export default function SeccionLaboratorios({ datos, onAgregar, onEliminar }) {
  const [form, setForm] = useState({ ...VACIO, fecha: hoyISO() });
  const [guardando, setGuardando] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const guardar = async () => {
    if (!form.fecha || guardando) return;
    setGuardando(true);
    try {
      const ok = await onAgregar({
        fecha: form.fecha,
        laboratorio: form.laboratorio.trim(),
        nota: form.nota.trim(),
        ...Object.fromEntries(CLAVES.map((k) => [k, num(form[k])])),
      });
      // Si falló, se conserva lo escrito
      if (ok !== false) setForm({ ...VACIO, fecha: hoyISO() });
    } finally {
      setGuardando(false);
    }
  };

  const serie = [...datos].sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((d) => ({ ...d, etiqueta: fmtFechaCorta(d.fecha) }));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 20 }}>
      <Tarjeta soloEditor>
        <Etiqueta>Registrar colesterol o tiroides</Etiqueta>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.ink70, marginBottom: 16 }}>
          Llena solo los valores que trae el examen. Los rangos son generales: compáralos con los del laboratorio.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          <Campo label="Fecha" type="date" value={form.fecha} onChange={set("fecha")} />
          <Campo label="Laboratorio" placeholder="Nombre del laboratorio" value={form.laboratorio} onChange={set("laboratorio")} />
        </div>
        {GRUPOS_LAB.map((g) => (
          <div key={g.id} style={{ marginTop: 16 }}>
            <Etiqueta>{g.titulo}</Etiqueta>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
              {g.claves.map((k) => (
                <Campo key={k} label={UMBRALES[k].label} sufijo={UMBRALES[k].unidad}
                  type="number" step="0.01" value={form[k]} onChange={set(k)} />
              ))}
            </div>
          </div>
        ))}
        <div style={{ marginTop: 12 }}>
          <Campo label="Nota" placeholder="Ayuno, cambios de medicina…" value={form.nota} onChange={set("nota")} />
        </div>
        <div style={{ marginTop: 16 }}>
          <Boton onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar resultados"}
          </Boton>
        </div>
      </Tarjeta>

      {/* Gráficas en dos columnas cuando hay espacio: menos scroll */}
      {GRUPOS_LAB.map((g) => (
        <div key={g.id} style={{
          display: "grid", gap: 20,
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
        }}>
          {g.claves.map((k) => <Grafica key={k} clave={k} serie={serie} />)}
        </div>
      ))}

      <Tarjeta>
        <Etiqueta>Historial · {datos.length} {datos.length === 1 ? "registro" : "registros"}</Etiqueta>
        {datos.length === 0 ? (
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.ink40, padding: "16px 0" }}>
            Aún no hay resultados. Registra el primero arriba.
          </div>
        ) : (
          <div style={{ overflowX: "auto", marginTop: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
              <thead>
                <tr>{["Fecha", "ColT", "LDL", "HDL", "TG", "TSH", "T4L", "T3", ""].map((h, i) => (
                  <th key={i} style={{
                    textAlign: i === 0 ? "left" : "right", padding: "8px 10px",
                    borderBottom: `1px solid ${C.line}`, fontFamily: FONT_DATA,
                    fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
                    color: C.ink40, fontWeight: 400,
                  }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {datos.map((d) => (
                  <tr key={d.id}>
                    <td style={celda(true)}>
                      {fmtFecha(d.fecha)}
                      {(d.laboratorio || d.nota) && (
                        <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.ink40, marginTop: 2 }}>
                          {[d.laboratorio, d.nota].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </td>
                    {CLAVES.map((k) => (
                      <td key={k} style={celda()}><Valor clave={k} valor={d[k]} compacto /></td>
                    ))}
                    <td style={{ ...celda(), textAlign: "right" }}>
                      <BotonBorrar que={`los resultados del ${fmtFecha(d.fecha)}`} onClick={() => onEliminar(d.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>
    </div>
  );
}
