import React, { createContext, useContext } from "react";
import { C, FONT_DATA, FONT_BODY, COLOR_ESTADO } from "../tokens";
import { UMBRALES } from "../constantes";
import { evaluar } from "../utils";

/** false para cuentas de solo lectura: oculta formularios y botones de borrar. */
export const PermisoEdicion = createContext(true);

export function Etiqueta({ children, style }) {
  return (
    <div style={{
      fontFamily: FONT_DATA, fontSize: 10, letterSpacing: "0.14em",
      textTransform: "uppercase", color: C.ink40, marginBottom: 6, ...style,
    }}>{children}</div>
  );
}

export function Tarjeta({ children, style, soloEditor }) {
  const puedeEditar = useContext(PermisoEdicion);
  if (soloEditor && !puedeEditar) return null;
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.line}`,
      borderRadius: 2, padding: 20, ...style,
    }}>{children}</div>
  );
}

export function Campo({ label, sufijo, ...props }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{
        fontFamily: FONT_DATA, fontSize: 10, letterSpacing: "0.1em",
        textTransform: "uppercase", color: C.ink70, marginBottom: 5,
      }}>
        {label}{sufijo && <span style={{ color: C.ink40 }}> · {sufijo}</span>}
      </div>
      <input
        {...props}
        style={{
          width: "100%", padding: "9px 10px", border: `1px solid ${C.line}`,
          borderRadius: 2, fontFamily: FONT_DATA, fontSize: 15, color: C.ink,
          background: C.paper, outline: "none", boxSizing: "border-box",
        }}
        onFocus={(e) => (e.target.style.borderColor = C.slate)}
        onBlur={(e) => (e.target.style.borderColor = C.line)}
      />
    </label>
  );
}

export function Boton({ children, variante = "solido", style, ...props }) {
  const estilos = {
    solido: { background: C.ink, color: "#fff", border: `1px solid ${C.ink}` },
    linea:  { background: "transparent", color: C.ink, border: `1px solid ${C.line}` },
  };
  return (
    <button
      {...props}
      style={{
        padding: "10px 18px", borderRadius: 2, cursor: "pointer",
        fontFamily: FONT_DATA, fontSize: 11, letterSpacing: "0.1em",
        textTransform: "uppercase", transition: "opacity .15s",
        ...estilos[variante], ...style,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >{children}</button>
  );
}

export function Valor({ clave, valor, compacto }) {
  const estado = evaluar(clave, valor);
  const u = UMBRALES[clave];
  const col = estado ? COLOR_ESTADO[estado] : { fg: C.ink40, bg: "transparent" };
  const vacio = valor === null || valor === undefined || valor === "";
  return (
    <div style={{
      background: compacto ? "transparent" : col.bg,
      border: compacto ? "none" : `1px solid ${estado ? col.fg + "33" : C.line}`,
      borderRadius: 2, padding: compacto ? 0 : "12px 14px",
    }}>
      {!compacto && <Etiqueta style={{ marginBottom: 4 }}>{u.label}</Etiqueta>}
      <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
        <span style={{
          fontFamily: FONT_DATA, fontSize: compacto ? 14 : 26, fontWeight: 600,
          color: vacio ? C.ink40 : col.fg, letterSpacing: "-0.02em",
        }}>{vacio ? "—" : valor}</span>
        {!compacto && <span style={{ fontFamily: FONT_DATA, fontSize: 11, color: C.ink40 }}>{u.unidad}</span>}
      </div>
    </div>
  );
}

export function Punto({ activo, texto, color = C.sage }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: activo ? color : C.line, flexShrink: 0,
      }} />
      <span style={{
        fontFamily: FONT_BODY, fontSize: 14,
        color: activo ? C.ink : C.ink40, fontWeight: activo ? 500 : 400,
      }}>{texto}</span>
    </div>
  );
}

export const celda = (izq) => ({
  padding: "10px", borderBottom: `1px solid ${C.line}`,
  textAlign: izq ? "left" : "right",
  fontFamily: izq ? FONT_BODY : FONT_DATA,
  fontSize: 13, color: C.ink, verticalAlign: "top",
});

/** Pide confirmación: lo borrado no se puede recuperar desde la app. */
export function BotonBorrar({ onClick, que = "este registro" }) {
  const puedeEditar = useContext(PermisoEdicion);
  if (!puedeEditar) return null;
  const confirmar = () => {
    if (window.confirm(`¿Borrar ${que}? No se puede deshacer.`)) onClick();
  };
  return (
    <button onClick={confirmar} aria-label={`Borrar ${que}`} style={{
      background: "none", border: "none", cursor: "pointer",
      fontFamily: FONT_DATA, fontSize: 10, color: C.ink40,
      letterSpacing: "0.08em", textTransform: "uppercase",
      padding: "8px 10px", minHeight: 36,
    }}>Borrar</button>
  );
}
