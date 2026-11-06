import React, { useEffect, useState } from "react";
import { C, FONT_DISPLAY, FONT_BODY, FONT_DATA } from "../tokens";
import { entrar } from "../auth";
import { leerMotivoSalida, borrarMotivoSalida, MINUTOS_INACTIVIDAD } from "../inactividad";

export default function Acceso() {
  const [error, setError] = useState(() => leerMotivoSalida() === "inactividad"
    ? `Se cerró la sesión tras ${MINUTOS_INACTIVIDAD} minutos sin uso. Vuelve a entrar.` : null);
  // Se borra después de mostrarlo una vez
  useEffect(() => { borrarMotivoSalida(); }, []);
  const [entrando, setEntrando] = useState(false);

  const iniciar = async () => {
    setError(null);
    setEntrando(true);
    try {
      await entrar();
    } catch {
      setError("No se pudo abrir el inicio de sesión. Revisa la conexión e intenta de nuevo.");
      setEntrando(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.ink, display: "flex",
      alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{ maxWidth: 380, width: "100%" }}>
        <div style={{
          fontFamily: FONT_DATA, fontSize: 10, letterSpacing: "0.16em",
          textTransform: "uppercase", color: "#ffffff66", marginBottom: 10,
        }}>Seguimiento clínico</div>

        <h1 style={{
          fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 600, color: "#fff",
          margin: "0 0 14px", letterSpacing: "-0.025em", lineHeight: 1.15,
        }}>Historial médico privado</h1>

        <p style={{
          fontFamily: FONT_BODY, fontSize: 14, color: "#ffffff99",
          lineHeight: 1.55, margin: "0 0 26px",
        }}>
          Los registros están protegidos. Entra con tu correo, tu clave y el código de tu app de autenticación.
        </p>

        {error && (
          <div style={{
            background: "#ffffff12", border: "1px solid #ffffff22", borderRadius: 2,
            padding: "11px 14px", marginBottom: 16, fontFamily: FONT_BODY,
            fontSize: 13, color: "#fff", lineHeight: 1.5,
          }}>{error}</div>
        )}

        <button onClick={iniciar} disabled={entrando} style={{
          width: "100%", padding: "13px 18px", background: "#fff", color: C.ink,
          border: "none", borderRadius: 2, fontFamily: FONT_DATA,
          fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
          opacity: entrando ? 0.6 : 1, cursor: entrando ? "wait" : "pointer",
        }}>
          {entrando ? "Abriendo…" : "Entrar"}
        </button>
      </div>
    </div>
  );
}
