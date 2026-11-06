import React, { useCallback, useEffect, useState } from "react";
import { C, FONT_BODY, FONT_DATA } from "../tokens";
import { listarUsuarios, crearUsuario, cambiarRolUsuario, borrarUsuario } from "../datos";
import { Tarjeta, Etiqueta, Campo, Boton, celda, BotonBorrar } from "./ui";

const ROLES = {
  lector: { label: "Solo ver", ayuda: "Ve todo y puede preguntarle al asistente. No cambia nada." },
  editor: { label: "Ver y registrar", ayuda: "Además registra exámenes, citas y documentos." },
};
const ESTADOS = {
  FORCE_CHANGE_PASSWORD: "Invitación enviada",
  CONFIRMED: "Activa",
  RESET_REQUIRED: "Debe cambiar clave",
};

function Selector({ value, onChange, disabled }) {
  return (
    <select value={value} onChange={onChange} disabled={disabled} style={{
      padding: "8px 10px", border: `1px solid ${C.line}`, borderRadius: 2,
      fontFamily: FONT_DATA, fontSize: 13, color: C.ink, background: C.paper,
    }}>
      {Object.entries(ROLES).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
    </select>
  );
}

export default function SeccionUsuarios({ yo }) {
  const [usuarios, setUsuarios] = useState(null);
  const [form, setForm] = useState({ email: "", nombre: "", rol: "lector" });
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const cargar = useCallback(async () => {
    try { setUsuarios(await listarUsuarios()); }
    catch (e) { setMensaje({ error: true, texto: e.message }); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const accion = async (fn, exito) => {
    setOcupado(true);
    setMensaje(null);
    try { await fn(); if (exito) setMensaje({ texto: exito }); await cargar(); return true; }
    catch (e) { setMensaje({ error: true, texto: e.message }); return false; }
    finally { setOcupado(false); }
  };

  const invitar = async () => {
    if (!form.email.trim() || ocupado) return;
    const ok = await accion(() => crearUsuario(form),
      `Invitación enviada a ${form.email.trim()}. Le llega un correo con su clave temporal.`);
    if (ok) setForm({ email: "", nombre: "", rol: "lector" });
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 20 }}>
      <Tarjeta>
        <Etiqueta>Dar acceso a otra persona</Etiqueta>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.ink70, marginBottom: 16, lineHeight: 1.5 }}>
          Le llega un correo con una clave temporal. Al entrar debe crear su clave y
          configurar una app de autenticación en el celular.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <Campo label="Correo" type="email" placeholder="nombre@correo.com" value={form.email} onChange={set("email")} />
          <Campo label="Nombre" placeholder="Dr. Rafael Marín" value={form.nombre} onChange={set("nombre")} />
        </div>
        <fieldset style={{ border: "none", padding: 0, margin: "14px 0 0" }}>
          <legend style={{
            fontFamily: FONT_DATA, fontSize: 10, letterSpacing: "0.1em",
            textTransform: "uppercase", color: C.ink70, marginBottom: 8,
          }}>Qué puede hacer</legend>
          {Object.entries(ROLES).map(([k, r]) => (
            <label key={k} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 0", cursor: "pointer" }}>
              <input type="radio" name="rol" value={k} checked={form.rol === k} onChange={set("rol")} style={{ marginTop: 3 }} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.ink }}>
                <strong>{r.label}</strong>
                <span style={{ display: "block", fontSize: 12, color: C.ink70 }}>{r.ayuda}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <div style={{ marginTop: 14 }}>
          <Boton onClick={invitar} disabled={ocupado || !form.email.trim()}>
            {ocupado ? "Enviando…" : "Enviar invitación"}
          </Boton>
        </div>
        {mensaje && (
          <div role={mensaje.error ? "alert" : "status"} style={{
            marginTop: 14, padding: "10px 14px", borderRadius: 2, fontFamily: FONT_BODY, fontSize: 13,
            background: mensaje.error ? C.amberBg : C.sageBg, color: C.ink,
          }}>{mensaje.texto}</div>
        )}
      </Tarjeta>

      <Tarjeta>
        <Etiqueta>Personas con acceso{usuarios ? ` · ${usuarios.length}` : ""}</Etiqueta>
        {!usuarios ? (
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.ink40 }}>Cargando…</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {usuarios.map((u) => {
                const propio = u.id === yo;
                const fijo = u.rol === "admin" || u.rol === "sin acceso";
                return (
                  <tr key={u.id}>
                    <td style={{ ...celda(true), overflowWrap: "anywhere" }}>
                      {u.nombre || u.email}
                      {propio && <span style={{ fontFamily: FONT_DATA, fontSize: 10, color: C.sage, marginLeft: 8 }}>TÚ</span>}
                      <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.ink40, marginTop: 2 }}>
                        {u.nombre ? `${u.email} · ` : ""}{ESTADOS[u.estado] ?? u.estado}
                      </div>
                    </td>
                    <td style={{ ...celda(), width: 1, whiteSpace: "nowrap" }}>
                      {fijo ? (
                        <span style={{ fontFamily: FONT_DATA, fontSize: 11, color: C.ink70, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          {u.rol === "admin" ? "Administrador" : "Sin acceso"}
                        </span>
                      ) : (
                        <Selector value={u.rol} disabled={ocupado} onChange={(e) =>
                          accion(() => cambiarRolUsuario(u.id, e.target.value), `Rol cambiado. ${u.email} debe volver a entrar.`)} />
                      )}
                    </td>
                    <td style={{ ...celda(), width: 1 }}>
                      {!propio && u.rol !== "admin" && (
                        <BotonBorrar que={`el acceso de ${u.email}`}
                          onClick={() => accion(() => borrarUsuario(u.id), `Se quitó el acceso a ${u.email}.`)} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Tarjeta>
    </div>
  );
}
