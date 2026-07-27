# Conectar Firebase — paso a paso

Toma unos 15 minutos. Todo lo que se usa aquí está dentro del plan gratuito (Spark).

---

## 1. Crear el proyecto

1. Entra a [console.firebase.google.com](https://console.firebase.google.com) con tu cuenta de Google.
2. **Agregar proyecto** → nómbralo `health-control` → continuar.
3. Desactiva Google Analytics (no hace falta y evita recolectar datos de más).
4. Crear proyecto.

---

## 2. Activar el inicio de sesión con Google

1. Menú izquierdo → **Compilación → Authentication** → *Comenzar*.
2. Pestaña **Sign-in method** → **Google** → activar.
3. Elige un correo de soporte → **Guardar**.

M�s abajo en esa misma sección, en **Settings → Dominios autorizados**, agrega:

```
hectorhiguita.github.io
```

Sin esto el login falla al publicar en GitHub Pages. `localhost` ya viene autorizado.

---

## 3. Crear la base de datos

1. Menú izquierdo → **Compilación → Firestore Database** → *Crear base de datos*.
2. Elige **Iniciar en modo de producción** (bloqueado por defecto — es lo correcto).
3. Ubicación: `nam5 (us-central)` o `southamerica-east1` si prefieres menor latencia.

> **Importante:** no uses el modo de prueba. Deja todo cerrado y luego publica las reglas del paso 5.

---

## 4. Obtener las credenciales

1. Ícono de engranaje → **Configuración del proyecto**.
2. Baja a **Tus apps** → ícono `</>` (Web).
3. Apodo: `health-control` → **Registrar app**.
4. Copia el bloque `firebaseConfig`.

Luego, en tu copia local:

```bash
cp .env.example .env
```

Y pega cada valor:

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=health-control-xxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=health-control-xxxx
VITE_FIREBASE_STORAGE_BUCKET=health-control-xxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_CORREOS_AUTORIZADOS=hahiguit@gmail.com
```

Estos valores identifican el proyecto pero **no dan acceso**. La protección real son las reglas del paso siguiente.

---

## 5. Publicar las reglas de seguridad

Este es el paso que protege los datos de tu mamá. **No lo saltes.**

### Opción A — desde la consola (más rápido)

1. **Firestore Database → Reglas**.
2. Borra lo que haya y pega el contenido completo de `firestore.rules`.
3. **Publicar**.

### Opción B — desde la terminal

```bash
npm install -g firebase-tools
firebase login
firebase use --add          # elige tu proyecto
firebase deploy --only firestore:rules
```

### Verificar que quedó bien

En **Firestore → Reglas → Simulador de Reglas**:

- Lectura de `/pacientes/ludibia-soto-orozco` **sin autenticar** → debe **denegar**.
- Lectura autenticado con `hahiguit@gmail.com` → debe **permitir**.

Si la primera prueba permite el acceso, las reglas no se publicaron.

---

## 6. Secretos para el despliegue automático

En GitHub: **Settings → Secrets and variables → Actions → New repository secret**.

Crea uno por cada línea del `.env`, con el mismo nombre:

| Nombre | Valor |
|---|---|
| `VITE_FIREBASE_API_KEY` | el de tu `.env` |
| `VITE_FIREBASE_AUTH_DOMAIN` | " |
| `VITE_FIREBASE_PROJECT_ID` | " |
| `VITE_FIREBASE_STORAGE_BUCKET` | " |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | " |
| `VITE_FIREBASE_APP_ID` | " |
| `VITE_CORREOS_AUTORIZADOS` | `hahiguit@gmail.com` |

Luego **Settings → Pages → Source: GitHub Actions**.

Con el siguiente push, la app queda en:
`https://hectorhiguita.github.io/health_control/`

---

## 7. Primera entrada

1. Abre la app y entra con tu cuenta de Google.
2. La primera vez siembra sola los datos de partida: el hemograma del 11/05/2026 y el examen físico del 04/06/2026.
3. Ve a **Resumen** y pon la fecha del primer día de Azacitidina en *Inicio ciclo 1*. Eso activa todo el calendario.

---

## Problemas comunes

**«Falta conectar Firebase»**
El `.env` no existe o está vacío. En despliegue, faltan los secretos en GitHub.

**«Firestore rechazó la lectura»**
Las reglas no están publicadas, o tu correo no está en la lista dentro de `firestore.rules`. Revisa que esté escrito igual, en minúsculas.

**«Esta cuenta no tiene acceso»**
Entraste con un correo que no está en `VITE_CORREOS_AUTORIZADOS`. Sal y entra con el correcto.

**El login abre y se cierra sin hacer nada**
Falta agregar `hectorhiguita.github.io` en Authentication → Settings → Dominios autorizados.

**Los datos no aparecen en otro dispositivo**
Confirma que entraste con la misma cuenta. Firestore sincroniza en segundos; si no hay señal, guarda local y sube cuando vuelva la conexión.

---

## Costo

Con un solo usuario registrando unos pocos datos al día, el consumo queda muy por debajo del plan gratuito:

- Firestore Spark: 50.000 lecturas y 20.000 escrituras por día
- Authentication: sin límite práctico para este uso
- GitHub Pages: gratis en repos públicos

No necesitas registrar tarjeta.
