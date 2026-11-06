import { useEffect, useRef } from "react";

/* Cierra la sesión tras un tiempo sin uso. La última actividad se guarda
   en localStorage: así cuenta también con la pestaña cerrada o en otra
   pestaña, y todas las pestañas comparten el mismo reloj. */

export const MINUTOS_INACTIVIDAD = 30;
const LIMITE = MINUTOS_INACTIVIDAD * 60 * 1000;
const LLAVE = "seguimiento.ultimaActividad";
const EVENTOS = ["pointerdown", "keydown", "scroll", "touchstart", "mousemove"];

const ahora = () => Date.now();
const ultima = () => Number(localStorage.getItem(LLAVE)) || 0;
export const marcarActividad = () => localStorage.setItem(LLAVE, String(ahora()));

/* Al salir, Cognito recarga la página: el motivo se guarda para mostrarlo después. */
const LLAVE_MOTIVO = "seguimiento.motivoSalida";
export const anotarSalidaPorInactividad = () => {
  sessionStorage.setItem(LLAVE_MOTIVO, "inactividad");
  localStorage.removeItem(LLAVE);
};
export const leerMotivoSalida = () => sessionStorage.getItem(LLAVE_MOTIVO);
export const borrarMotivoSalida = () => sessionStorage.removeItem(LLAVE_MOTIVO);

/** true si la sesión guardada ya pasó el límite (p. ej. al volver al día siguiente). */
export const sesionVencida = () => {
  const u = ultima();
  return u > 0 && ahora() - u > LIMITE;
};

export function useInactividad(activo, alVencer) {
  const ultimoGuardado = useRef(0);
  const alVencerRef = useRef(alVencer);
  alVencerRef.current = alVencer;

  useEffect(() => {
    if (!activo) return;
    marcarActividad();

    const registrar = () => {
      // mousemove dispara mucho: guardar como máximo cada 15 s
      if (ahora() - ultimoGuardado.current < 15_000) return;
      ultimoGuardado.current = ahora();
      marcarActividad();
    };
    const revisar = () => { if (sesionVencida()) alVencerRef.current(); };

    EVENTOS.forEach((e) => window.addEventListener(e, registrar, { passive: true }));
    document.addEventListener("visibilitychange", revisar);
    const reloj = setInterval(revisar, 30_000);

    return () => {
      EVENTOS.forEach((e) => window.removeEventListener(e, registrar));
      document.removeEventListener("visibilitychange", revisar);
      clearInterval(reloj);
    };
  }, [activo]);
}
