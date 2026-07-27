import React, { useMemo } from "react";
import { C, FONT_DISPLAY, FONT_BODY, FONT_DATA } from "../tokens";
import { CICLO } from "../constantes";
import { hoyISO, fmtFecha, fmtFechaCorta, diasEntre, sumarDias } from "../utils";
import { Tarjeta, Etiqueta, Punto } from "./ui";

function Leyenda({ color, bg, texto, grueso }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{
        width: 12, height: 12, background: bg,
        border: `${grueso ? 2 : 1}px solid ${color}`, borderRadius: 2,
      }} />
      <span style={{
        fontFamily: FONT_DATA, fontSize: 10, letterSpacing: "0.08em",
        textTransform: "uppercase", color: C.ink70,
      }}>{texto}</span>
    </div>
  );
}

export default function RejillaCiclo({ inicioCiclo1, onCambiarInicio, soloLectura }) {
  const hoy = hoyISO();

  const ciclos = useMemo(() => {
    if (!inicioCiclo1) return [];
    return Array.from({ length: CICLO.totalCiclos }, (_, i) => {
      const inicio = sumarDias(inicioCiclo1, i * CICLO.diasTotal);
      return {
        numero: i + 1,
        inicio,
        fin: sumarDias(inicio, CICLO.diasTotal - 1),
        dias: Array.from({ length: CICLO.diasTotal }, (_, d) => ({
          n: d + 1,
          fecha: sumarDias(inicio, d),
          aplicacion: d < CICLO.diasAplicacion,
          pegfilgrastim: d === CICLO.diasAplicacion - 1,
        })),
      };
    });
  }, [inicioCiclo1]);

  const posicion = useMemo(() => {
    if (!inicioCiclo1) return null;
    const delta = diasEntre(inicioCiclo1, hoy);
    if (delta < 0) return { estado: "pendiente", faltan: -delta };
    const total = CICLO.totalCiclos * CICLO.diasTotal;
    if (delta >= total) return { estado: "finalizado" };
    return {
      estado: "activo",
      ciclo: Math.floor(delta / CICLO.diasTotal) + 1,
      dia: (delta % CICLO.diasTotal) + 1,
      aplicacion: (delta % CICLO.diasTotal) + 1 <= CICLO.diasAplicacion,
      pegfilgrastim: (delta % CICLO.diasTotal) + 1 === CICLO.diasAplicacion,
    };
  }, [inicioCiclo1, hoy]);

  const tocaTrimetoprim = [1, 3, 5].includes(new Date(hoy + "T00:00:00").getDay());

  return (
    <Tarjeta style={{ marginBottom: 24 }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        flexWrap: "wrap", gap: 12, marginBottom: 18,
      }}>
        <div>
          <Etiqueta>Protocolo de quimioterapia</Etiqueta>
          <div style={{
            fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 600,
            color: C.ink, letterSpacing: "-0.01em",
          }}>{CICLO.medicamento}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.ink70, marginTop: 3 }}>
            7 días de aplicación · 21 de descanso · {CICLO.totalCiclos} ciclos
          </div>
        </div>
        <label style={{ display: "block" }}>
          <div style={{
            fontFamily: FONT_DATA, fontSize: 10, letterSpacing: "0.1em",
            textTransform: "uppercase", color: C.ink70, marginBottom: 5,
          }}>Inicio ciclo 1</div>
          <input
            type="date" value={inicioCiclo1 || ""} disabled={soloLectura}
            onChange={(e) => onCambiarInicio(e.target.value)}
            style={{
              padding: "8px 10px", border: `1px solid ${C.line}`, borderRadius: 2,
              fontFamily: FONT_DATA, fontSize: 13, color: C.ink,
              background: C.paper, outline: "none",
            }}
          />
        </label>
      </div>

      {posicion?.estado === "activo" && (
        <div style={{
          background: posicion.aplicacion ? C.sageBg : C.paper,
          border: `1px solid ${posicion.aplicacion ? C.sage + "44" : C.line}`,
          borderRadius: 2, padding: "14px 16px", marginBottom: 18,
        }}>
          <Etiqueta style={{ marginBottom: 4 }}>Hoy · {fmtFecha(hoy)}</Etiqueta>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, color: C.ink }}>
            Ciclo {posicion.ciclo} · día {posicion.dia} de {CICLO.diasTotal}
          </div>
          <div style={{ marginTop: 8, display: "grid", gap: 5 }}>
            <Punto activo={posicion.aplicacion}
              texto={posicion.aplicacion ? `Aplicar ${CICLO.medicamento}` : "Día de descanso — sin Azacitidina"} />
            {posicion.pegfilgrastim && <Punto activo texto={CICLO.soporte} color={C.amber} />}
            <Punto activo={tocaTrimetoprim}
              texto={tocaTrimetoprim ? "Tomar Trimetoprim Sulfa 160/800 mg" : "Hoy no toca Trimetoprim Sulfa"} />
          </div>
        </div>
      )}

      {posicion?.estado === "pendiente" && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.ink70, marginBottom: 18 }}>
          El ciclo 1 comienza en {posicion.faltan} {posicion.faltan === 1 ? "día" : "días"}.
        </div>
      )}
      {posicion?.estado === "finalizado" && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.ink70, marginBottom: 18 }}>
          Los 3 ciclos programados terminaron. Reprograma con el hematólogo.
        </div>
      )}
      {!inicioCiclo1 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.ink70, marginBottom: 18 }}>
          Registra la fecha del primer día de Azacitidina para activar el calendario.
        </div>
      )}

      <div style={{ display: "grid", gap: 16 }}>
        {ciclos.map((c) => (
          <div key={c.numero}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontFamily: FONT_DATA, fontSize: 10, letterSpacing: "0.1em",
              textTransform: "uppercase", color: C.ink40, marginBottom: 7,
            }}>
              <span>Ciclo {c.numero}</span>
              <span>{fmtFechaCorta(c.inicio)} — {fmtFechaCorta(c.fin)}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(14, 1fr)", gap: 3 }}>
              {c.dias.map((d) => {
                const esHoy = d.fecha === hoy;
                const pasado = d.fecha < hoy;
                let bg = C.paper, fg = C.ink40, bd = C.line;
                if (d.aplicacion) { bg = pasado ? C.sage + "22" : C.sageBg; fg = C.sage; bd = C.sage + "55"; }
                if (d.pegfilgrastim) { bg = C.amberBg; fg = C.amber; bd = C.amber + "66"; }
                if (esHoy) { bd = C.ink; fg = C.ink; }
                const detalle = d.pegfilgrastim ? "Pegfilgrastim" : d.aplicacion ? "Azacitidina" : "descanso";
                return (
                  <div key={d.n} title={`${fmtFecha(d.fecha)} · ${detalle}`} style={{
                    aspectRatio: "1", background: bg,
                    border: `${esHoy ? 2 : 1}px solid ${bd}`, borderRadius: 2,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: FONT_DATA, fontSize: 10, color: fg,
                    fontWeight: esHoy ? 700 : 400, opacity: pasado && !esHoy ? 0.55 : 1,
                  }}>{d.n}</div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {ciclos.length > 0 && (
        <div style={{ display: "flex", gap: 18, marginTop: 16, flexWrap: "wrap" }}>
          <Leyenda color={C.sage} bg={C.sageBg} texto="Azacitidina" />
          <Leyenda color={C.amber} bg={C.amberBg} texto="Pegfilgrastim" />
          <Leyenda color={C.ink40} bg={C.paper} texto="Descanso" />
          <Leyenda color={C.ink} bg="transparent" texto="Hoy" grueso />
        </div>
      )}
    </Tarjeta>
  );
}
