import React, { useState } from "react";
import { C, FONT_DISPLAY, FONT_BODY, FONT_DATA } from "../tokens";
import { entrarConGoogle, salir } from "../firebase";

export default function Acceso({ motivo, correo }) {
  const [error, setError] = useState(null);
  const [entrando, setEntrando] = useState(false);

  const entrar = async () => {
    setError(null);
    setEntrando(true);
    try {
      await entrarConGoogle();
    } catch (e) {
      if (e?.code === "auth/popup-closed-by-user") setError("Cerraste la ventana antes de terminar. Intenta de nuevo.");
      else if (e?.code === "auth/popup-blocked") setError("El navegador bloqueó la ventana emergente. Permítela y vuelve a intentar.");
      else if (e?.code === "auth/unauthorized-domain") setError("Este dominio no está autorizado en Firebase. Agrégalo en Authentication > Settings > Dominios autorizados.");
      else setError("No se pudo iniciar sesión. Revisa la conexión e intenta de nuevo.");
    } finally {
      setEntrando(false);
    }
  };

  const rechazado = motivo === "no-autorizado";

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
        }}>
          {rechazado ? "Esta cuenta no tiene acceso" : "Historial médico privado"}
        </h1>

        <p style={{
          fontFamily: FONT_BODY, fontSize: 14, color: "#ffffff99",
          lineHeight: 1.55, margin: "0 0 26px",
        }}>
          {rechazado
            ? `La cuenta ${correo} no está en la lista de personas autorizadas. Entra con otra cuenta o pide que agreguen este correo.`
            : "Los registros están protegidos. Entra con la cuenta de Google autorizada para verlos."}
        </p>

        {error && (
          <div style={{
            background: "#ffffff12", border: "1px solid #ffffff22", borderRadius: 2,
            padding: "11px 14px", marginBottom: 16, fontFamily: FONT_BODY,
            fontSize: 13, color: "#fff", lineHeight: 1.5,
          }}>{error}</div>
        )}

        {rechazado ? (
          <button onClick={() => salir()} style={botonEstilo}>Salir y cambiar de cuenta</button>
        ) : (
          <button onClick={entrar} disabled={entrando} style={{
            ...botonEstilo, opacity: entrando ? 0.6 : 1,
            cursor: entrando ? "wait" : "pointer",
          }}>
            {entrando ? "Abriendo…" : "Entrar con Google"}
          </button>
        )}
      </div>
    </div>
  );
}

const botonEstilo = {
  width: "100%", padding: "13px 18px", background: "#fff", color: C.ink,
  border: "none", borderRadius: 2, cursor: "pointer", fontFamily: FONT_DATA,
  fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
};
