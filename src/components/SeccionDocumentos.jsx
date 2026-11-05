import React, { useRef, useState } from "react";
import { C, FONT_BODY, FONT_DATA } from "../tokens";
import { CATEGORIAS_DOC } from "../constantes";
import { hoyISO, fmtFecha } from "../utils";
import { Tarjeta, Etiqueta, Campo, Boton, celda, BotonBorrar } from "./ui";

const MAX_MB = 15;

export default function SeccionDocumentos({ datos, onSubir, onAbrir, onEliminar }) {
  const [fecha, setFecha] = useState(hoyISO());
  const [categoria, setCategoria] = useState("hemograma");
  const [nota, setNota] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState(null);
  const entrada = useRef(null);

  const elegir = (e) => {
    const f = e.target.files?.[0] ?? null;
    setError(null);
    if (f && f.size > MAX_MB * 1024 * 1024) {
      setError(`El archivo pasa de ${MAX_MB} MB.`);
      setArchivo(null);
      return;
    }
    setArchivo(f);
  };

  const subir = async () => {
    if (!archivo || subiendo) return;
    setSubiendo(true);
    try {
      await onSubir(archivo, { fecha, categoria, nota: nota.trim() });
      setArchivo(null);
      setNota("");
      if (entrada.current) entrada.current.value = "";
    } finally {
      setSubiendo(false);
    }
  };

  // Abre una pestaña antes de pedir la URL para que el navegador no la bloquee
  const abrir = async (id) => {
    const ventana = window.open("", "_blank");
    if (ventana) ventana.opener = null;
    const url = await onAbrir(id);
    if (!url) { ventana?.close(); return; }
    if (ventana) ventana.location.href = url;
    else window.location.assign(url);
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Tarjeta>
        <Etiqueta>Subir examen</Etiqueta>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.ink70, marginBottom: 16 }}>
          PDF o foto, hasta {MAX_MB} MB. Se guarda cifrado y solo tú puedes abrirlo.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          <Campo label="Fecha del examen" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          <label style={{ display: "block" }}>
            <div style={{
              fontFamily: FONT_DATA, fontSize: 10, letterSpacing: "0.1em",
              textTransform: "uppercase", color: C.ink70, marginBottom: 5,
            }}>Tipo</div>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={{
              width: "100%", padding: "9px 10px", border: `1px solid ${C.line}`, borderRadius: 2,
              fontFamily: FONT_DATA, fontSize: 15, color: C.ink, background: C.paper,
            }}>
              {Object.entries(CATEGORIAS_DOC).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        </div>
        <div style={{ marginTop: 12 }}>
          <Campo label="Nota" placeholder="Laboratorio, médico que lo ordenó…" value={nota} onChange={(e) => setNota(e.target.value)} />
        </div>
        <div style={{ marginTop: 12 }}>
          <input ref={entrada} type="file" accept="application/pdf,image/*" onChange={elegir}
            style={{ fontFamily: FONT_BODY, fontSize: 14 }} />
        </div>
        {error && <div style={{ marginTop: 10, fontFamily: FONT_BODY, fontSize: 13, color: C.crimson }}>{error}</div>}
        <div style={{ marginTop: 16 }}>
          <Boton onClick={subir} disabled={!archivo || subiendo}>{subiendo ? "Subiendo…" : "Subir"}</Boton>
        </div>
      </Tarjeta>

      <Tarjeta>
        <Etiqueta>Documentos · {datos.length}</Etiqueta>
        {datos.length === 0 ? (
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.ink40, padding: "16px 0" }}>
            Aún no hay documentos.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {datos.map((d) => (
                <tr key={d.id}>
                  <td style={{ ...celda(true), width: 110, fontFamily: FONT_DATA }}>{fmtFecha(d.fecha)}</td>
                  <td style={celda(true)}>
                    <span style={{
                      fontFamily: FONT_DATA, fontSize: 10, letterSpacing: "0.08em",
                      textTransform: "uppercase", color: C.slate, marginRight: 8,
                    }}>{CATEGORIAS_DOC[d.categoria]}</span>
                    {d.nombre}
                    {d.nota && <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.ink40, marginTop: 2 }}>{d.nota}</div>}
                  </td>
                  <td style={{ ...celda(), width: 140, whiteSpace: "nowrap" }}>
                    <button onClick={() => abrir(d.id)} style={{
                      background: "none", border: "none", cursor: "pointer", fontFamily: FONT_DATA,
                      fontSize: 10, color: C.slate, letterSpacing: "0.08em", textTransform: "uppercase", padding: 4,
                    }}>Abrir</button>
                    <BotonBorrar onClick={() => onEliminar(d.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Tarjeta>
    </div>
  );
}
