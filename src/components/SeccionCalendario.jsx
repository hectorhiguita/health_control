import React, { useMemo, useState } from "react";
import { C, FONT_BODY, FONT_DATA, FONT_DISPLAY } from "../tokens";
import { TIPOS_EVENTO, CICLO } from "../constantes";
import { hoyISO, fmtFecha, sumarDias } from "../utils";
import { Tarjeta, Etiqueta, Campo, Boton, celda, BotonBorrar } from "./ui";

const VACIO = { fecha: "", hora: "", tipo: "cita", titulo: "", lugar: "", dosis: "", nota: "" };
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio",
  "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS = ["L", "M", "M", "J", "V", "S", "D"];

function Selector({ label, value, onChange, opciones }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{
        fontFamily: FONT_DATA, fontSize: 10, letterSpacing: "0.1em",
        textTransform: "uppercase", color: C.ink70, marginBottom: 5,
      }}>{label}</div>
      <select value={value} onChange={onChange} style={{
        width: "100%", padding: "9px 10px", border: `1px solid ${C.line}`,
        borderRadius: 2, fontFamily: FONT_DATA, fontSize: 15, color: C.ink, background: C.paper,
      }}>
        {Object.entries(opciones).map(([k, v]) => <option key={k} value={k}>{v.label ?? v}</option>)}
      </select>
    </label>
  );
}

function Mes({ anio, mes, eventosPorDia, hoy, elegido, onElegir }) {
  const primero = new Date(anio, mes, 1);
  const inicio = (primero.getDay() + 6) % 7; // lunes = 0
  const total = new Date(anio, mes + 1, 0).getDate();
  const celdas = [
    ...Array(inicio).fill(null),
    ...Array.from({ length: total }, (_, i) => `${anio}-${String(mes + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`),
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4 }}>
      {DIAS.map((d, i) => (
        <div key={i} style={{ fontFamily: FONT_DATA, fontSize: 10, color: C.ink40, textAlign: "center" }}>{d}</div>
      ))}
      {celdas.map((f, i) => {
        if (!f) return <div key={i} />;
        const ev = eventosPorDia[f] || [];
        const esHoy = f === hoy;
        const esElegido = f === elegido;
        return (
          <button key={f} onClick={() => onElegir(f)} aria-pressed={esElegido}
            aria-label={`${Number(f.slice(8))}${ev.length ? `: ${ev.map((e) => e.titulo).join(", ")}` : ""}`}
            title={ev.map((e) => e.titulo).join(", ")} style={{
            minHeight: 46, minWidth: 0, padding: 4, border: `${esHoy ? 2 : 1}px solid ${esHoy ? C.ink : C.line}`,
            borderRadius: 2, background: esElegido ? C.sageBg : C.surface, cursor: "pointer", textAlign: "left",
            boxShadow: esElegido ? `inset 0 0 0 2px ${C.sage}` : "none",
          }}>
            <div style={{ fontFamily: FONT_DATA, fontSize: 11, color: C.ink }}>{Number(f.slice(8))}</div>
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 3 }}>
              {ev.map((e) => (
                <span key={e.id} style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: TIPOS_EVENTO[e.tipo]?.color ?? C.ink40,
                  opacity: e.hecho ? 0.4 : 1,
                }} />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function SeccionCalendario({ datos, onAgregar, onEliminar }) {
  const hoy = hoyISO();
  const [form, setForm] = useState({ ...VACIO, fecha: hoy });
  const [guardando, setGuardando] = useState(false);
  const [vista, setVista] = useState(() => ({ anio: Number(hoy.slice(0, 4)), mes: Number(hoy.slice(5, 7)) - 1 }));
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const eventosPorDia = useMemo(() => {
    const m = {};
    datos.forEach((e) => { (m[e.fecha] ||= []).push(e); });
    return m;
  }, [datos]);

  const proximos = useMemo(
    () => datos.filter((e) => e.fecha >= hoy).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora)),
    [datos, hoy]
  );
  const pasados = useMemo(() => datos.filter((e) => e.fecha < hoy), [datos, hoy]);

  const guardar = async () => {
    if (!form.fecha || !form.titulo.trim() || guardando) return;
    setGuardando(true);
    try {
      const ok = await onAgregar({ ...form, titulo: form.titulo.trim() });
      if (ok !== false) setForm({ ...VACIO, fecha: form.fecha, tipo: form.tipo });
    } finally {
      setGuardando(false);
    }
  };

  /** Agrega los 7 días de aplicación de un ciclo de una vez */
  const agregarCiclo = async () => {
    if (!form.fecha || guardando) return;
    setGuardando(true);
    try {
      for (let d = 0; d < CICLO.diasAplicacion; d++) {
        const ok = await onAgregar({
          fecha: sumarDias(form.fecha, d), hora: form.hora, tipo: "azacitidina",
          titulo: `${CICLO.medicamento} — día ${d + 1}`, lugar: form.lugar,
          dosis: form.dosis, nota: form.nota,
        });
        if (ok === false) break;
      }
    } finally {
      setGuardando(false);
    }
  };

  const mover = (n) => setVista(({ anio, mes }) => {
    const m = mes + n;
    return { anio: anio + Math.floor(m / 12), mes: ((m % 12) + 12) % 12 };
  });

  const Lista = ({ items }) => (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <tbody>
        {items.map((e) => (
          <tr key={e.id}>
            <td style={{ ...celda(true), width: 110, fontFamily: FONT_DATA }}>
              {fmtFecha(e.fecha)}
              {e.hora && <div style={{ fontSize: 11, color: C.ink40 }}>{e.hora}</div>}
            </td>
            <td style={celda(true)}>
              <span style={{
                fontFamily: FONT_DATA, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
                color: TIPOS_EVENTO[e.tipo]?.color, marginRight: 8,
              }}>{TIPOS_EVENTO[e.tipo]?.label}</span>
              {e.titulo}
              {(e.lugar || e.dosis || e.nota) && (
                <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.ink40, marginTop: 2 }}>
                  {[e.lugar, e.dosis, e.nota].filter(Boolean).join(" · ")}
                </div>
              )}
            </td>
            <td style={{ ...celda(), width: 60 }}><BotonBorrar que={`«${e.titulo}» del ${fmtFecha(e.fecha)}`} onClick={() => onEliminar(e.id)} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 20 }}>
      <Tarjeta>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <Boton variante="linea" onClick={() => mover(-1)}>‹</Boton>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, color: C.ink }}>
            {MESES[vista.mes]} {vista.anio}
          </div>
          <Boton variante="linea" onClick={() => mover(1)}>›</Boton>
        </div>
        <Mes anio={vista.anio} mes={vista.mes} eventosPorDia={eventosPorDia} hoy={hoy}
          elegido={form.fecha} onElegir={(f) => setForm({ ...form, fecha: f })} />
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.ink70, marginTop: 8 }}>
          Toca un día para agendar en esa fecha.
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          {Object.entries(TIPOS_EVENTO).map(([k, t]) => (
            <span key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_DATA, fontSize: 10, color: C.ink70, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color }} />{t.label}
            </span>
          ))}
        </div>
      </Tarjeta>

      <Tarjeta>
        <Etiqueta>Agregar al calendario</Etiqueta>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          <Campo label="Fecha" type="date" value={form.fecha} onChange={set("fecha")} />
          <Campo label="Hora" type="time" value={form.hora} onChange={set("hora")} />
          <Selector label="Tipo" value={form.tipo} onChange={set("tipo")} opciones={TIPOS_EVENTO} />
          <Campo label="Lugar" placeholder="Clínica Astorga" value={form.lugar} onChange={set("lugar")} />
          {form.tipo === "azacitidina" && (
            <Campo label="Dosis" placeholder="100 mg IV" value={form.dosis} onChange={set("dosis")} />
          )}
        </div>
        <div style={{ marginTop: 12 }}>
          <Campo label="Título" placeholder="Control con hematología" value={form.titulo} onChange={set("titulo")} />
        </div>
        <div style={{ marginTop: 12 }}>
          <Campo label="Nota" value={form.nota} onChange={set("nota")} />
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Boton onClick={guardar} disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</Boton>
          <Boton variante="linea" onClick={agregarCiclo} disabled={guardando}>
            Agregar ciclo de {CICLO.diasAplicacion} días desde esta fecha
          </Boton>
        </div>
      </Tarjeta>

      <Tarjeta>
        <Etiqueta>Próximos · {proximos.length}</Etiqueta>
        {proximos.length ? <Lista items={proximos} /> : (
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.ink40 }}>No hay nada agendado.</div>
        )}
      </Tarjeta>

      {pasados.length > 0 && (
        <Tarjeta>
          <Etiqueta>Pasados · {pasados.length}</Etiqueta>
          <Lista items={pasados} />
        </Tarjeta>
      )}
    </div>
  );
}
