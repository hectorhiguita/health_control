import React, { useState, useEffect, useMemo, useCallback } from "react";
import { C, FONT_DISPLAY, FONT_BODY, FONT_DATA } from "./tokens";
import { PACIENTE } from "./constantes";
import { fmtFecha, armarReporte } from "./utils";
import {
  configurado, observarSesion, estaAutorizado, salir,
} from "./firebase";
import {
  escucharHemogramas, escucharSignos, escucharPaciente,
  agregarHemograma, borrarHemograma, agregarSigno, borrarSigno,
  guardarInicioCiclo, sembrarSiHaceFalta,
} from "./datos";

import Acceso from "./components/Acceso";
import FaltaConfig from "./components/FaltaConfig";
import BandaEstado from "./components/BandaEstado";
import RejillaCiclo from "./components/RejillaCiclo";
import SeccionHemogramas from "./components/SeccionHemogramas";
import SeccionSignos from "./components/SeccionSignos";
import SeccionAlarmas from "./components/SeccionAlarmas";
import { Tarjeta, Etiqueta, Boton, Valor } from "./components/ui";

const PESTANAS = [
  ["resumen", "Resumen"],
  ["hemogramas", "Hemogramas"],
  ["signos", "Signos vitales"],
  ["alarmas", "Alarmas"],
];

export default function App() {
  const [sesion, setSesion] = useState({ estado: "cargando", usuario: null });
  const [hemogramas, setHemogramas] = useState([]);
  const [signos, setSignos] = useState([]);
  const [inicioCiclo, setInicioCiclo] = useState("");
  const [pestana, setPestana] = useState("resumen");
  const [aviso, setAviso] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [listo, setListo] = useState(false);

  /* Sesión */
  useEffect(() => {
    if (!configurado) return;
    return observarSesion((u) => {
      if (!u) setSesion({ estado: "fuera", usuario: null });
      else if (!estaAutorizado(u)) setSesion({ estado: "rechazado", usuario: u });
      else setSesion({ estado: "dentro", usuario: u });
    });
  }, []);

  /* Suscripciones a Firestore */
  useEffect(() => {
    if (sesion.estado !== "dentro") return;
    let cancelado = false;

    const alFallar = (e) => {
      if (cancelado) return;
      setAviso(e?.code === "permission-denied"
        ? "Firestore rechazó la lectura. Revisa que tu correo esté en firestore.rules y que las reglas estén publicadas."
        : "Se perdió la conexión con la base. Los cambios se guardarán cuando vuelva.");
    };

    sembrarSiHaceFalta().catch(() => {});

    const u1 = escucharHemogramas((d) => { if (!cancelado) { setHemogramas(d); setListo(true); } }, alFallar);
    const u2 = escucharSignos((d) => { if (!cancelado) setSignos(d); }, alFallar);
    const u3 = escucharPaciente((d) => { if (!cancelado) setInicioCiclo(d.inicioCiclo || ""); }, alFallar);

    return () => { cancelado = true; u1(); u2(); u3(); };
  }, [sesion.estado]);

  const conError = useCallback(async (fn, msg) => {
    try { setAviso(null); await fn(); }
    catch { setAviso(msg); }
  }, []);

  const ultimoHemograma = useMemo(() => hemogramas[0] || null, [hemogramas]);
  const ultimoSigno = useMemo(() => signos[0] || null, [signos]);

  const copiarReporte = async () => {
    try {
      await navigator.clipboard.writeText(
        armarReporte(PACIENTE, hemogramas, signos, inicioCiclo)
      );
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {
      setAviso("No se pudo copiar al portapapeles.");
    }
  };

  if (!configurado) return <FaltaConfig />;
  if (sesion.estado === "cargando") return <Pantalla texto="Verificando acceso…" />;
  if (sesion.estado === "fuera") return <Acceso />;
  if (sesion.estado === "rechazado") return <Acceso motivo="no-autorizado" correo={sesion.usuario.email} />;
  if (!listo) return <Pantalla texto="Cargando registros…" />;

  return (
    <div style={{ minHeight: "100vh", background: C.paper, paddingBottom: 60 }}>
      <header style={{ background: C.ink, color: "#fff", padding: "26px 0 0" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 20px" }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "flex-start", gap: 16, flexWrap: "wrap",
          }}>
            <div>
              <div style={{
                fontFamily: FONT_DATA, fontSize: 10, letterSpacing: "0.16em",
                textTransform: "uppercase", color: "#ffffff66", marginBottom: 8,
              }}>Seguimiento clínico</div>
              <h1 style={{
                fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 600, margin: 0,
                letterSpacing: "-0.025em", lineHeight: 1.1,
              }}>{PACIENTE.nombre}</h1>
              <div style={{ fontFamily: FONT_DATA, fontSize: 12, color: "#ffffff88", marginTop: 7 }}>
                CC {PACIENTE.cc} · {PACIENTE.cie}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <Boton variante="linea" onClick={copiarReporte} style={{ color: "#fff", borderColor: "#ffffff44" }}>
                {copiado ? "Copiado ✓" : "Copiar reporte"}
              </Boton>
              <button onClick={() => salir()} title={sesion.usuario.email} style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: FONT_DATA, fontSize: 10, color: "#ffffff77",
                letterSpacing: "0.1em", textTransform: "uppercase", padding: "10px 6px",
              }}>Salir</button>
            </div>
          </div>

          <nav style={{ display: "flex", gap: 2, marginTop: 24, overflowX: "auto" }}>
            {PESTANAS.map(([id, label]) => (
              <button key={id} onClick={() => setPestana(id)} style={{
                padding: "11px 16px", border: "none", cursor: "pointer",
                background: pestana === id ? C.paper : "transparent",
                color: pestana === id ? C.ink : "#ffffff99",
                fontFamily: FONT_DATA, fontSize: 11, letterSpacing: "0.1em",
                textTransform: "uppercase", borderRadius: "2px 2px 0 0", whiteSpace: "nowrap",
              }}>{label}</button>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 20px 0" }}>
        {aviso && (
          <div style={{
            background: C.amberBg, border: `1px solid ${C.amber}44`, borderRadius: 2,
            padding: "12px 16px", marginBottom: 20, fontFamily: FONT_BODY,
            fontSize: 13, color: C.ink, lineHeight: 1.5,
          }}>{aviso}</div>
        )}

        {pestana === "resumen" && (
          <>
            <BandaEstado ultimoHemograma={ultimoHemograma} ultimoSigno={ultimoSigno} />
            <RejillaCiclo
              inicioCiclo1={inicioCiclo}
              onCambiarInicio={(v) => conError(() => guardarInicioCiclo(v), "No se pudo guardar la fecha del ciclo.")}
            />

            <Tarjeta style={{ marginBottom: 24 }}>
              <Cabecera titulo="Último hemograma" fecha={ultimoHemograma?.fecha} />
              {ultimoHemograma ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
                  <Valor clave="hb" valor={ultimoHemograma.hb} />
                  <Valor clave="neutrofilos" valor={ultimoHemograma.neutrofilos} />
                  <Valor clave="plaquetas" valor={ultimoHemograma.plaquetas} />
                  <Valor clave="hto" valor={ultimoHemograma.hto} />
                  <Valor clave="leucocitos" valor={ultimoHemograma.leucocitos} />
                </div>
              ) : <Vacio texto="Registra el primer hemograma en su pestaña." />}
            </Tarjeta>

            <Tarjeta>
              <Cabecera titulo="Últimos signos vitales" fecha={ultimoSigno?.fecha} />
              {ultimoSigno ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
                  <Valor clave="temp" valor={ultimoSigno.temp} />
                  <Valor clave="spo2" valor={ultimoSigno.spo2} />
                  <Simple label="Peso" valor={ultimoSigno.peso} unidad="kg" />
                  <Simple label="Presión arterial"
                    valor={ultimoSigno.sis != null ? `${ultimoSigno.sis}/${ultimoSigno.dia ?? "—"}` : null} />
                </div>
              ) : <Vacio texto="Registra los primeros signos vitales en su pestaña." />}
            </Tarjeta>
          </>
        )}

        {pestana === "hemogramas" && (
          <SeccionHemogramas
            datos={hemogramas}
            onAgregar={(d) => conError(() => agregarHemograma(d), "No se pudo guardar el hemograma.")}
            onEliminar={(id) => conError(() => borrarHemograma(id), "No se pudo borrar el registro.")}
          />
        )}

        {pestana === "signos" && (
          <SeccionSignos
            datos={signos}
            onAgregar={(d) => conError(() => agregarSigno(d), "No se pudieron guardar los signos.")}
            onEliminar={(id) => conError(() => borrarSigno(id), "No se pudo borrar el registro.")}
          />
        )}

        {pestana === "alarmas" && <SeccionAlarmas />}

        <footer style={{
          marginTop: 40, paddingTop: 20, borderTop: `1px solid ${C.line}`,
          fontFamily: FONT_DATA, fontSize: 10, color: C.ink40,
          letterSpacing: "0.06em", lineHeight: 1.8,
        }}>
          <div>TUTELA {PACIENTE.radicado} · {PACIENTE.eps}</div>
          <div>Umbrales tomados de las órdenes del {PACIENTE.hematologo}, {PACIENTE.institucion}.</div>
          <div>Esta herramienta registra y organiza datos. No reemplaza el hemograma de laboratorio ni el criterio del médico tratante.</div>
        </footer>
      </main>
    </div>
  );
}

function Cabecera({ titulo, fecha }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
      <Etiqueta style={{ marginBottom: 0 }}>{titulo}</Etiqueta>
      <span style={{ fontFamily: FONT_DATA, fontSize: 11, color: C.ink40 }}>
        {fecha ? fmtFecha(fecha) : "sin registros"}
      </span>
    </div>
  );
}

function Simple({ label, valor, unidad }) {
  return (
    <div style={{ border: `1px solid ${C.line}`, borderRadius: 2, padding: "12px 14px" }}>
      <Etiqueta style={{ marginBottom: 4 }}>{label}</Etiqueta>
      <div style={{ fontFamily: FONT_DATA, fontSize: 26, fontWeight: 600, color: C.ink }}>
        {valor ?? "—"}
        {unidad && valor != null && <span style={{ fontSize: 11, color: C.ink40, marginLeft: 4 }}>{unidad}</span>}
      </div>
    </div>
  );
}

function Vacio({ texto }) {
  return <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.ink40 }}>{texto}</div>;
}

function Pantalla({ texto }) {
  return (
    <div style={{
      minHeight: "100vh", background: C.paper, display: "flex",
      alignItems: "center", justifyContent: "center",
    }}>
      <span style={{
        fontFamily: FONT_DATA, fontSize: 11, letterSpacing: "0.14em",
        textTransform: "uppercase", color: C.ink40,
      }}>{texto}</span>
    </div>
  );
}
