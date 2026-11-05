import React, { useEffect, useRef, useState } from "react";
import { C, FONT_BODY, FONT_DATA } from "../tokens";
import { Tarjeta, Etiqueta, Boton } from "./ui";

const SUGERENCIAS = [
  "¿Cómo han cambiado los neutrófilos desde el primer ciclo?",
  "¿Algún valor del último hemograma está en alarma?",
  "Resume el colesterol y la tiroides del último año.",
  "¿Qué citas y aplicaciones vienen esta semana?",
];

export default function SeccionAsistente({ onPreguntar }) {
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const fin = useRef(null);

  useEffect(() => { fin.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [mensajes, pensando]);

  const enviar = async (pregunta) => {
    const p = (pregunta ?? texto).trim();
    if (!p || pensando) return;
    const historial = mensajes.filter((m) => !m.error);
    setMensajes([...mensajes, { rol: "usuario", texto: p }]);
    setTexto("");
    setPensando(true);
    try {
      const r = await onPreguntar(p, historial);
      setMensajes((m) => [...m, { rol: "asistente", texto: r }]);
    } catch (e) {
      setMensajes((m) => [...m, { rol: "asistente", texto: e.message || "No se pudo responder.", error: true }]);
    } finally {
      setPensando(false);
    }
  };

  return (
    <Tarjeta>
      <Etiqueta>Pregúntale a Claude sobre el seguimiento</Etiqueta>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.ink70, marginBottom: 16, lineHeight: 1.5 }}>
        Lee los registros guardados (sin nombre ni cédula) y responde. No reemplaza al médico tratante.
      </div>

      <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
        {mensajes.length === 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SUGERENCIAS.map((s) => (
              <Boton key={s} variante="linea" onClick={() => enviar(s)}
                style={{ textTransform: "none", letterSpacing: 0, fontFamily: FONT_BODY, fontSize: 13 }}>{s}</Boton>
            ))}
          </div>
        )}
        {mensajes.map((m, i) => (
          <div key={i} style={{
            justifySelf: m.rol === "usuario" ? "end" : "start", maxWidth: "88%",
            background: m.rol === "usuario" ? C.ink : m.error ? C.amberBg : C.paper,
            color: m.rol === "usuario" ? "#fff" : C.ink,
            border: `1px solid ${m.rol === "usuario" ? C.ink : C.line}`,
            borderRadius: 2, padding: "10px 14px", fontFamily: FONT_BODY, fontSize: 14,
            lineHeight: 1.55, whiteSpace: "pre-wrap",
          }}>{m.texto}</div>
        ))}
        {pensando && (
          <div style={{ fontFamily: FONT_DATA, fontSize: 11, color: C.ink40, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Revisando los registros…
          </div>
        )}
        <div ref={fin} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} maxLength={2000}
          placeholder="Escribe tu pregunta…"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
          style={{
            flex: 1, padding: "9px 10px", border: `1px solid ${C.line}`, borderRadius: 2,
            fontFamily: FONT_BODY, fontSize: 15, color: C.ink, background: C.paper, resize: "vertical",
          }} />
        <Boton onClick={() => enviar()} disabled={pensando || !texto.trim()}>Enviar</Boton>
      </div>
    </Tarjeta>
  );
}
