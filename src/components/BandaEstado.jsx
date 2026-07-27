import React from "react";
import { C, FONT_DISPLAY, FONT_BODY, FONT_DATA, COLOR_ESTADO } from "../tokens";
import { UMBRALES } from "../constantes";
import { evaluar } from "../utils";
import { Etiqueta } from "./ui";

export default function BandaEstado({ ultimoHemograma, ultimoSigno }) {
  const alertas = [];

  if (ultimoHemograma) {
    ["hb", "plaquetas", "neutrofilos"].forEach((k) => {
      const e = evaluar(k, ultimoHemograma[k]);
      if (e === "alarma" || e === "precaucion") {
        alertas.push({
          nivel: e,
          texto: `${UMBRALES[k].label} en ${ultimoHemograma[k]} ${UMBRALES[k].unidad}`,
          accion: e === "alarma" ? UMBRALES[k].accion : null,
        });
      }
    });
  }

  if (ultimoSigno) {
    const et = evaluar("temp", ultimoSigno.temp);
    if (et === "alarma")
      alertas.push({ nivel: "alarma", texto: `Fiebre de ${ultimoSigno.temp} °C`, accion: UMBRALES.temp.accion });
    else if (et === "precaucion")
      alertas.push({ nivel: "precaucion", texto: `Temperatura en ${ultimoSigno.temp} °C`, accion: "Repetir en una hora" });

    const es = evaluar("spo2", ultimoSigno.spo2);
    if (es === "alarma")
      alertas.push({ nivel: "alarma", texto: `Saturación en ${ultimoSigno.spo2} %`, accion: "Consultar a urgencias" });
    else if (es === "precaucion")
      alertas.push({ nivel: "precaucion", texto: `Saturación en ${ultimoSigno.spo2} %`, accion: null });
  }

  const hayAlarma = alertas.some((a) => a.nivel === "alarma");
  const hayPrecaucion = alertas.some((a) => a.nivel === "precaucion");
  const nivel = hayAlarma ? "alarma" : hayPrecaucion ? "precaucion" : "ok";
  const col = COLOR_ESTADO[nivel];

  const titulo = hayAlarma
    ? "Hay valores en umbral de alarma"
    : hayPrecaucion
    ? "Hay valores que requieren vigilancia"
    : "Últimos registros dentro de rango";

  return (
    <div style={{
      background: col.bg, border: `1px solid ${col.fg}22`,
      borderLeft: `4px solid ${col.fg}`, borderRadius: 2,
      padding: "18px 22px", marginBottom: 24,
    }}>
      <Etiqueta style={{ color: col.fg }}>Estado actual</Etiqueta>
      <div style={{
        fontFamily: FONT_DISPLAY, fontSize: 21, fontWeight: 600,
        color: C.ink, letterSpacing: "-0.02em", lineHeight: 1.25,
      }}>{titulo}</div>

      {alertas.length > 0 ? (
        <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
          {alertas.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{
                fontFamily: FONT_DATA, fontSize: 9, letterSpacing: "0.1em",
                background: COLOR_ESTADO[a.nivel].fg, color: "#fff",
                padding: "3px 7px", borderRadius: 2, marginTop: 1, whiteSpace: "nowrap",
              }}>{COLOR_ESTADO[a.nivel].txt.toUpperCase()}</span>
              <div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.ink, fontWeight: 500 }}>{a.texto}</div>
                {a.accion && (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.ink70, marginTop: 2 }}>{a.accion}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.ink70, marginTop: 6 }}>
          Sigue vigilando fiebre, sangrados y palidez aunque los números estén bien.
        </div>
      )}
    </div>
  );
}
