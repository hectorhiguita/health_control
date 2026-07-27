import React from "react";
import { C, FONT_BODY, FONT_DATA } from "../tokens";
import { UMBRALES, CONTACTOS, SIGNOS_URGENCIA, CUIDADOS_CASA } from "../constantes";
import { Tarjeta, Etiqueta } from "./ui";

function Lista({ items, color }) {
  return (
    <div style={{ display: "grid", gap: 7, marginTop: 10 }}>
      {items.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, marginTop: 7, flexShrink: 0 }} />
          <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.ink, lineHeight: 1.45 }}>{s}</span>
        </div>
      ))}
    </div>
  );
}

export default function SeccionAlarmas() {
  const transfusiones = [
    { k: "hb", txt: "Transfundir 1 unidad de glóbulos rojos desleucocitados", cod: "912002" },
    { k: "plaquetas", txt: "Transfundir 1 unidad de plaquetas por aféresis", cod: "912003" },
    { k: "neutrofilos", txt: "Neutropenia grave — extremar aislamiento preventivo", cod: null },
  ];

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{
        background: C.crimsonBg, border: `1px solid ${C.crimson}33`,
        borderLeft: `4px solid ${C.crimson}`, borderRadius: 2, padding: "20px 22px",
      }}>
        <Etiqueta style={{ color: C.crimson }}>Ir a urgencias de inmediato si aparece</Etiqueta>
        <Lista items={SIGNOS_URGENCIA} color={C.crimson} />
        <div style={{
          marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.crimson}22`,
          fontFamily: FONT_BODY, fontSize: 13, color: C.ink70,
        }}>
          Al llegar, avisar que la paciente cursa un Síndrome Mielodisplásico y está en protocolo de quimioterapia.
        </div>
      </div>

      <Tarjeta>
        <Etiqueta>Umbrales de transfusión ordenados por el hematólogo</Etiqueta>
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          {transfusiones.map(({ k, txt, cod }) => (
            <div key={k} style={{
              display: "flex", gap: 14, alignItems: "center", padding: "12px 14px",
              background: C.paper, borderRadius: 2, border: `1px solid ${C.line}`,
            }}>
              <div style={{ minWidth: 96 }}>
                <div style={{ fontFamily: FONT_DATA, fontSize: 18, fontWeight: 600, color: C.crimson }}>
                  ≤ {UMBRALES[k].alarma}
                </div>
                <div style={{ fontFamily: FONT_DATA, fontSize: 10, color: C.ink40 }}>{UMBRALES[k].unidad}</div>
              </div>
              <div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.ink, fontWeight: 500 }}>{UMBRALES[k].label}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.ink70, marginTop: 1 }}>
                  {txt}{cod && <span style={{ fontFamily: FONT_DATA, fontSize: 11, color: C.ink40 }}> · código {cod}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Tarjeta>

      <Tarjeta>
        <Etiqueta>Cuidados en casa durante la neutropenia</Etiqueta>
        <Lista items={CUIDADOS_CASA} color={C.sage} />
      </Tarjeta>

      <Tarjeta>
        <Etiqueta>Contactos</Etiqueta>
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          {CONTACTOS.map(([n, t]) => (
            <div key={n} style={{
              display: "flex", justifyContent: "space-between", gap: 12,
              paddingBottom: 8, borderBottom: `1px solid ${C.line}`,
            }}>
              <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.ink }}>{n}</span>
              <a href={`tel:${t.replace(/\s/g, "")}`} style={{
                fontFamily: FONT_DATA, fontSize: 14, color: C.slate,
                whiteSpace: "nowrap", textDecoration: "none",
              }}>{t}</a>
            </div>
          ))}
        </div>
      </Tarjeta>
    </div>
  );
}
