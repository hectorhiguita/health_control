import { Amplify } from "aws-amplify";
import {
  signInWithRedirect, signOut, fetchAuthSession, getCurrentUser,
} from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";

const env = import.meta.env;

export const configurado = Boolean(
  env.VITE_USER_POOL_ID && env.VITE_USER_POOL_CLIENT_ID && env.VITE_DOMINIO_LOGIN && env.VITE_API_URL
);

if (configurado) {
  const origen = `${window.location.origin}/`;
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: env.VITE_USER_POOL_ID,
        userPoolClientId: env.VITE_USER_POOL_CLIENT_ID,
        loginWith: {
          oauth: {
            domain: env.VITE_DOMINIO_LOGIN,
            scopes: ["openid", "email", "profile"],
            redirectSignIn: [origen],
            redirectSignOut: [origen],
            responseType: "code",
          },
        },
      },
    },
  });
}

/** Lleva a la página de Cognito (clave + doble factor). */
export const entrar = () => signInWithRedirect();
export const salir = () => signOut();

export async function usuarioActual() {
  try {
    const u = await getCurrentUser();
    const s = await fetchAuthSession();
    return { id: u.userId, email: s.tokens?.idToken?.payload?.email ?? u.username };
  } catch {
    return null;
  }
}

/** Token de acceso vigente; Amplify lo renueva solo. */
export async function token() {
  const s = await fetchAuthSession();
  const t = s.tokens?.accessToken?.toString();
  if (!t) throw new Error("Sesión vencida");
  return t;
}

export const observarSesion = (cb) =>
  Hub.listen("auth", ({ payload }) => {
    if (["signInWithRedirect", "signedOut", "tokenRefresh_failure"].includes(payload.event)) cb(payload.event);
  });
