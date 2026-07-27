import React, { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { C, FONT_BODY, FONT_DATA } from "../tokens";
import { hoyISO, fmtFecha, fmtFechaCorta, num } from "../utils";
import { Tarjeta, Etiqueta, Campo, Boton, Valor, celda, BotonBorrar } from "./ui";

const VACIO = { fecha: "", peso: "", sis: "", dia: "", fc: "", spo2: "", temp: "", nota: "" };

export default function SeccionSignos({ datos, onAgregar, onEliminar }) {
  const [form, setForm] = useState({ ...VACIO, fecha: hoyISO() });
  const [guardando, setGuardando] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const guardar = async () => {
    if (!form.fecha || guardando) return;
    setGuardando(true);
    try {
      await onAgregar({
        fecha: form.fecha, peso: num(form.peso), sis: num(form.sis),
        dia: num(form.dia), fc: num(form.fc), spo2: num(form.spo2),
        temp: num(form.temp), nota: form.nota.trim(),
      });
      setForm({ ...VACIO, fecha: hoyISO() });
    } finally {
      setGuardando(false);
    }
  };

  const serie = [...datos].sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((d) => ({ ...d, etiqueta: fmtFechaCorta(d.fecha) }));

  const conPeso = serie.filter((d) => d.peso != null);
  const conPA = serie.filter((d) => d.sis != null);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Tarjeta>
        <Etiqueta>Registrar signos vitales</Etiqueta>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.ink70, marginBottom: 16 }}>
          Con neutropenia, una sola temperatura de 38 °C o más obliga a ir a urgencias.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
          <Campo label="Fecha" type="date" value={form.fecha} onChange={set("fecha")} />
          <Campo label="Temperatura" sufijo="°C" type="number" step="0.1" placeholder="36.5" value={form.temp} onChange={set("temp")} />
          <Campo label="Saturación" sufijo="%" type="number" step="1" placeholder="97" value={form.spo2} onChange={set("spo2")} />
          <Campo label="Peso" sufijo="kg" type="number" step="0.1" placeholder="50.0" value={form.peso} onChange={set("peso")} />
          <Campo label="Sistólica" sufijo="mmHg" type="number" placeholder="130" value={form.sis} onChange={set("sis")} />
          <Campo label="Diastólica" sufijo="mmHg" type="number" placeholder="80" value={form.dia} onChange={set("dia")} />
          <Campo label="Frec. cardíaca" sufijo="lpm" type="number" placeholder="78" value={form.fc} onChange={set("fc")} />
        </div>
        <div style={{ marginTop: 12 }}>
          <Campo label="Nota" placeholder="Cómo se sintió, síntomas, sangrados…" value={form.nota} onChange={set("nota")} />
        </div>
        <div style={{ marginTop: 16 }}>
          <Boton onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar signos"}
          </Boton>
        </div>
      </Tarjeta>

      {conPeso.length > 1 && (
        <Tarjeta>
          <Etiqueta>Peso · kg</Etiqueta>
          <div style={{ height: 170, marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={conPeso} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke={C.line} strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="etiqueta" tick={{ fontSize: 10, fill: C.ink40, fontFamily: FONT_DATA }} axisLine={{ stroke: C.line }} tickLine={false} />
                <YAxis domain={["dataMin - 3", "dataMax + 3"]} tick={{ fontSize: 10, fill: C.ink40, fontFamily: FONT_DATA }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 2, fontFamily: FONT_DATA, fontSize: 12 }} formatter={(v) => [`${v} kg`, "Peso"]} />
                <Line type="monotone" dataKey="peso" stroke={C.sage} strokeWidth={2} dot={{ r: 3.5, fill: C.sage, strokeWidth: 0 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Tarjeta>
      )}

      {conPA.length > 1 && (
        <Tarjeta>
          <Etiqueta>Presión arterial · mmHg</Etiqueta>
          <div style={{ height: 180, marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={conPA} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke={C.line} strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="etiqueta" tick={{ fontSize: 10, fill: C.ink40, fontFamily: FONT_DATA }} axisLine={{ stroke: C.line }} tickLine={false} />
                <YAxis domain={[40, 180]} tick={{ fontSize: 10, fill: C.ink40, fontFamily: FONT_DATA }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 2, fontFamily: FONT_DATA, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontFamily: FONT_DATA, fontSize: 11 }} />
                <Line type="monotone" dataKey="sis" name="Sistólica" stroke={C.slate} strokeWidth={2} dot={{ r: 3, fill: C.slate, strokeWidth: 0 }} isAnimationActive={false} />
                <Line type="monotone" dataKey="dia" name="Diastólica" stroke={C.ink40} strokeWidth={2} dot={{ r: 3, fill: C.ink40, strokeWidth: 0 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Tarjeta>
      )}

      <Tarjeta>
        <Etiqueta>Historial · {datos.length} {datos.length === 1 ? "registro" : "registros"}</Etiqueta>
        {datos.length === 0 ? (
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.ink40, padding: "16px 0" }}>
            Aún no hay signos vitales registrados.
          </div>
        ) : (
          <div style={{ overflowX: "auto", marginTop: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
              <thead>
                <tr>{["Fecha", "Temp", "SpO₂", "Peso", "PA", "FC", ""].map((h, i) => (
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
                      {d.nota && <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.ink40, marginTop: 2 }}>{d.nota}</div>}
                    </td>
                    <td style={celda()}><Valor clave="temp" valor={d.temp} compacto /></td>
                    <td style={celda()}><Valor clave="spo2" valor={d.spo2} compacto /></td>
                    <td style={celda()}>{d.peso ?? "—"}</td>
                    <td style={celda()}>{d.sis != null ? `${d.sis}/${d.dia ?? "—"}` : "—"}</td>
                    <td style={celda()}>{d.fc ?? "—"}</td>
                    <td style={{ ...celda(), textAlign: "right" }}>
                      <BotonBorrar onClick={() => onEliminar(d.id)} />
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
