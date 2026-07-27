import React, { useState } from "react";
import { C, FONT_BODY, FONT_DATA } from "../tokens";
import { UMBRALES } from "../constantes";
import { hoyISO, fmtFecha, fmtFechaCorta, num } from "../utils";
import { Tarjeta, Etiqueta, Campo, Boton, Valor, celda, BotonBorrar } from "./ui";
import GraficaLinea from "./GraficaLinea";

const VACIO = { fecha: "", hb: "", hto: "", leucocitos: "", neutrofilos: "", plaquetas: "", nota: "" };

export default function SeccionHemogramas({ datos, onAgregar, onEliminar }) {
  const [form, setForm] = useState({ ...VACIO, fecha: hoyISO() });
  const [guardando, setGuardando] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const guardar = async () => {
    if (!form.fecha || guardando) return;
    setGuardando(true);
    try {
      await onAgregar({
        fecha: form.fecha,
        hb: num(form.hb), hto: num(form.hto), leucocitos: num(form.leucocitos),
        neutrofilos: num(form.neutrofilos), plaquetas: num(form.plaquetas),
        nota: form.nota.trim(),
      });
      setForm({ ...VACIO, fecha: hoyISO() });
    } finally {
      setGuardando(false);
    }
  };

  const serie = [...datos].sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((d) => ({ ...d, etiqueta: fmtFechaCorta(d.fecha) }));

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Tarjeta>
        <Etiqueta>Registrar hemograma</Etiqueta>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.ink70, marginBottom: 16 }}>
          Neutrófilos, plaquetas y hemoglobina son los tres que definen si hay que ir a urgencias.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          <Campo label="Fecha" type="date" value={form.fecha} onChange={set("fecha")} />
          <Campo label="Hemoglobina" sufijo="g/dL" type="number" step="0.1" placeholder="7.6" value={form.hb} onChange={set("hb")} />
          <Campo label="Hematocrito" sufijo="%" type="number" step="0.1" placeholder="23.0" value={form.hto} onChange={set("hto")} />
          <Campo label="Leucocitos" sufijo="×10³/µL" type="number" step="0.01" placeholder="1.83" value={form.leucocitos} onChange={set("leucocitos")} />
          <Campo label="Neutrófilos" sufijo="×10³/µL" type="number" step="0.01" placeholder="0.36" value={form.neutrofilos} onChange={set("neutrofilos")} />
          <Campo label="Plaquetas" sufijo="×10³/µL" type="number" step="1" placeholder="51" value={form.plaquetas} onChange={set("plaquetas")} />
        </div>
        <div style={{ marginTop: 12 }}>
          <Campo label="Nota" placeholder="Laboratorio, observaciones del médico…" value={form.nota} onChange={set("nota")} />
        </div>
        <div style={{ marginTop: 16 }}>
          <Boton onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar hemograma"}
          </Boton>
        </div>
      </Tarjeta>

      <GraficaLinea titulo="Hemoglobina" datos={serie} llave="hb"
        umbralAlarma={UMBRALES.hb.alarma} umbralPrecaucion={UMBRALES.hb.precaucion}
        unidad={UMBRALES.hb.unidad} dominio={UMBRALES.hb.dominio} />
      <GraficaLinea titulo="Neutrófilos absolutos" datos={serie} llave="neutrofilos"
        umbralAlarma={UMBRALES.neutrofilos.alarma} umbralPrecaucion={UMBRALES.neutrofilos.precaucion}
        unidad={UMBRALES.neutrofilos.unidad} dominio={UMBRALES.neutrofilos.dominio} />
      <GraficaLinea titulo="Plaquetas" datos={serie} llave="plaquetas"
        umbralAlarma={UMBRALES.plaquetas.alarma} umbralPrecaucion={UMBRALES.plaquetas.precaucion}
        unidad={UMBRALES.plaquetas.unidad} dominio={UMBRALES.plaquetas.dominio} />

      <Tarjeta>
        <Etiqueta>Historial · {datos.length} {datos.length === 1 ? "registro" : "registros"}</Etiqueta>
        {datos.length === 0 ? (
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.ink40, padding: "16px 0" }}>
            Aún no hay hemogramas. Registra el primero arriba.
          </div>
        ) : (
          <div style={{ overflowX: "auto", marginTop: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
              <thead>
                <tr>{["Fecha", "Hb", "Hto", "Leuco", "Neutró", "Plaq", ""].map((h, i) => (
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
                    <td style={celda()}><Valor clave="hb" valor={d.hb} compacto /></td>
                    <td style={celda()}><Valor clave="hto" valor={d.hto} compacto /></td>
                    <td style={celda()}><Valor clave="leucocitos" valor={d.leucocitos} compacto /></td>
                    <td style={celda()}><Valor clave="neutrofilos" valor={d.neutrofilos} compacto /></td>
                    <td style={celda()}><Valor clave="plaquetas" valor={d.plaquetas} compacto /></td>
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
