import React from "react";
import { C, FONT_DISPLAY, FONT_BODY, FONT_DATA } from "../tokens";

export default function FaltaConfig() {
  return (
    <div style={{
      minHeight: "100vh", background: C.ink, display: "flex",
      alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{ maxWidth: 460 }}>
        <div style={{
          fontFamily: FONT_DATA, fontSize: 10, letterSpacing: "0.16em",
          textTransform: "uppercase", color: "#ffffff66", marginBottom: 10,
        }}>Configuración pendiente</div>
        <h1 style={{
          fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600, color: "#fff",
          margin: "0 0 14px", letterSpacing: "-0.02em",
        }}>Falta conectar Firebase</h1>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: "#ffffff99", lineHeight: 1.6 }}>
          Copia <code style={codigo}>.env.example</code> a <code style={codigo}>.env</code> y pega ahí
          las credenciales de tu proyecto Firebase. Si estás publicando en GitHub Pages,
          agrégalas como secretos del repositorio. Los pasos completos están
          en <code style={codigo}>FIREBASE_SETUP.md</code>.
        </p>
      </div>
    </div>
  );
}

const codigo = {
  fontFamily: FONT_DATA, fontSize: 13, background: "#ffffff18",
  padding: "2px 6px", borderRadius: 2, color: "#fff",
};
