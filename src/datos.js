import {
  collection, doc, addDoc, deleteDoc, setDoc, getDoc, getDocs,
  onSnapshot, query, orderBy, serverTimestamp, writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { PACIENTE_ID, SEMILLA_HEMOGRAMAS, SEMILLA_SIGNOS } from "./constantes";

const refPaciente   = () => doc(db, "pacientes", PACIENTE_ID);
const refHemogramas = () => collection(db, "pacientes", PACIENTE_ID, "hemogramas");
const refSignos     = () => collection(db, "pacientes", PACIENTE_ID, "signos");

/** Escucha en vivo. Devuelve la función para cancelar la suscripción. */
export function escucharHemogramas(cb, onError) {
  return onSnapshot(
    query(refHemogramas(), orderBy("fecha", "desc")),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

export function escucharSignos(cb, onError) {
  return onSnapshot(
    query(refSignos(), orderBy("fecha", "desc")),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

export function escucharPaciente(cb, onError) {
  return onSnapshot(refPaciente(), (snap) => cb(snap.exists() ? snap.data() : {}), onError);
}

export const agregarHemograma = (d) =>
  addDoc(refHemogramas(), { ...d, creado: serverTimestamp() });

export const borrarHemograma = (id) =>
  deleteDoc(doc(db, "pacientes", PACIENTE_ID, "hemogramas", id));

export const agregarSigno = (d) =>
  addDoc(refSignos(), { ...d, creado: serverTimestamp() });

export const borrarSigno = (id) =>
  deleteDoc(doc(db, "pacientes", PACIENTE_ID, "signos", id));

export const guardarInicioCiclo = (fecha) =>
  setDoc(refPaciente(), { inicioCiclo: fecha, actualizado: serverTimestamp() }, { merge: true });

/**
 * Siembra los datos clínicos de partida una única vez.
 * Marca el documento del paciente para no repetirlo nunca.
 */
export async function sembrarSiHaceFalta() {
  const snap = await getDoc(refPaciente());
  if (snap.exists() && snap.data().sembrado) return false;

  const hemo = await getDocs(refHemogramas());
  const sig = await getDocs(refSignos());
  if (!hemo.empty || !sig.empty) {
    await setDoc(refPaciente(), { sembrado: true }, { merge: true });
    return false;
  }

  const lote = writeBatch(db);
  SEMILLA_HEMOGRAMAS.forEach((h) => lote.set(doc(refHemogramas()), h));
  SEMILLA_SIGNOS.forEach((s) => lote.set(doc(refSignos()), s));
  lote.set(refPaciente(), { sembrado: true, creado: serverTimestamp() }, { merge: true });
  await lote.commit();
  return true;
}
