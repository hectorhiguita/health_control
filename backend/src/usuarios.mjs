/* Gestión de personas con acceso. Solo la usa quien está en el grupo admin. */
import {
  CognitoIdentityProviderClient, ListUsersCommand, AdminListGroupsForUserCommand,
  AdminCreateUserCommand, AdminAddUserToGroupCommand, AdminRemoveUserFromGroupCommand,
  AdminDeleteUserCommand, AdminUserGlobalSignOutCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { ErrorDatos } from "./validar.mjs";

const cognito = new CognitoIdentityProviderClient({});
const { USER_POOL_ID, GRUPO_ADMIN, GRUPO_EDITOR, GRUPO_LECTOR } = process.env;

/** Roles que se pueden dar desde la app. Admin solo se da por Terraform. */
export const ROLES = { lector: GRUPO_LECTOR, editor: GRUPO_EDITOR };

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const atributo = (u, nombre) => u.Attributes?.find((a) => a.Name === nombre)?.Value ?? "";

function rolDe(grupos) {
  if (grupos.includes(GRUPO_ADMIN)) return "admin";
  if (grupos.includes(GRUPO_EDITOR)) return "editor";
  if (grupos.includes(GRUPO_LECTOR)) return "lector";
  return "sin acceso";
}

export async function listar() {
  const usuarios = [];
  let PaginationToken;
  do {
    const r = await cognito.send(new ListUsersCommand({ UserPoolId: USER_POOL_ID, PaginationToken }));
    usuarios.push(...r.Users);
    PaginationToken = r.PaginationToken;
  } while (PaginationToken);

  return Promise.all(usuarios.map(async (u) => {
    const g = await cognito.send(new AdminListGroupsForUserCommand({ UserPoolId: USER_POOL_ID, Username: u.Username }));
    return {
      id: u.Username,
      email: atributo(u, "email"),
      nombre: atributo(u, "name"),
      rol: rolDe(g.Groups.map((x) => x.GroupName)),
      estado: u.UserStatus,          // FORCE_CHANGE_PASSWORD = aún no entra
      activo: u.Enabled,
      creado: u.UserCreateDate,
    };
  }));
}

/** Crea la cuenta; Cognito envía la clave temporal al correo. */
export async function crear({ email, nombre, rol }) {
  const correo = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!CORREO.test(correo)) throw new ErrorDatos("Correo inválido");
  if (!ROLES[rol]) throw new ErrorDatos("Rol inválido");
  const nom = typeof nombre === "string" ? nombre.trim().slice(0, 80) : "";

  let r;
  try {
    r = await cognito.send(new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: correo,
      DesiredDeliveryMediums: ["EMAIL"],
      UserAttributes: [
        { Name: "email", Value: correo },
        { Name: "email_verified", Value: "true" },
        ...(nom ? [{ Name: "name", Value: nom }] : []),
      ],
    }));
  } catch (e) {
    if (e.name === "UsernameExistsException") throw new ErrorDatos("Ese correo ya tiene cuenta");
    throw e;
  }
  await cognito.send(new AdminAddUserToGroupCommand({
    UserPoolId: USER_POOL_ID, Username: r.User.Username, GroupName: ROLES[rol],
  }));
  return { id: r.User.Username, email: correo, nombre: nom, rol, estado: r.User.UserStatus, activo: true };
}

export async function cambiarRol(id, rol, quien) {
  if (!ROLES[rol]) throw new ErrorDatos("Rol inválido");
  if (id === quien) throw new ErrorDatos("No puedes cambiar tu propio rol");
  const g = await cognito.send(new AdminListGroupsForUserCommand({ UserPoolId: USER_POOL_ID, Username: id }));
  const actuales = g.Groups.map((x) => x.GroupName);
  if (actuales.includes(GRUPO_ADMIN)) throw new ErrorDatos("Los administradores se cambian en Terraform");
  for (const grupo of Object.values(ROLES).filter((x) => x !== ROLES[rol] && actuales.includes(x))) {
    await cognito.send(new AdminRemoveUserFromGroupCommand({ UserPoolId: USER_POOL_ID, Username: id, GroupName: grupo }));
  }
  await cognito.send(new AdminAddUserToGroupCommand({ UserPoolId: USER_POOL_ID, Username: id, GroupName: ROLES[rol] }));
  // Los tokens viejos traen los grupos anteriores: forzar nuevo ingreso
  await cognito.send(new AdminUserGlobalSignOutCommand({ UserPoolId: USER_POOL_ID, Username: id }));
}

export async function borrar(id, quien) {
  if (id === quien) throw new ErrorDatos("No puedes borrar tu propia cuenta");
  const g = await cognito.send(new AdminListGroupsForUserCommand({ UserPoolId: USER_POOL_ID, Username: id }));
  if (g.Groups.some((x) => x.GroupName === GRUPO_ADMIN)) throw new ErrorDatos("Los administradores se quitan en Terraform");
  await cognito.send(new AdminUserGlobalSignOutCommand({ UserPoolId: USER_POOL_ID, Username: id }));
  await cognito.send(new AdminDeleteUserCommand({ UserPoolId: USER_POOL_ID, Username: id }));
}
