import { initializeApp } from "firebase/app";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut,
  onAuthStateChanged, setPersistence, browserLocalPersistence,
} from "firebase/auth";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
} from "firebase/firestore";

const config = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

export const configurado = Boolean(config.apiKey && config.projectId);

const app = configurado ? initializeApp(config) : null;

// Caché local persistente: la app funciona sin internet y
// sincroniza sola cuando vuelve la conexión.
export const db = app
  ? initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    })
  : null;

export const auth = app ? getAuth(app) : null;
if (auth) setPersistence(auth, browserLocalPersistence).catch(() => {});

const proveedorGoogle = new GoogleAuthProvider();
proveedorGoogle.setCustomParameters({ prompt: "select_account" });

export const entrarConGoogle = () => signInWithPopup(auth, proveedorGoogle);
export const salir = () => signOut(auth);
export const observarSesion = (cb) => onAuthStateChanged(auth, cb);

export const CORREOS_AUTORIZADOS = (import.meta.env.VITE_CORREOS_AUTORIZADOS || "")
  .split(",").map((c) => c.trim().toLowerCase()).filter(Boolean);

export const estaAutorizado = (usuario) =>
  Boolean(usuario?.email) &&
  (CORREOS_AUTORIZADOS.length === 0 ||
   CORREOS_AUTORIZADOS.includes(usuario.email.toLowerCase()));
