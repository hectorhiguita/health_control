# Seguimiento clínico

Aplicación privada para el seguimiento de **Ludibia Soto Orozco**: tratamiento con Azacitidina por Síndrome Mielodisplásico con Exceso de Blastos Tipo I (SMD-EB1), control de colesterol y de tiroides.

Todo corre en AWS y se despliega con Terraform. Con una sola persona usándola, el costo es casi cero.

---

## Qué hace

**Resumen** — Banda de estado de los últimos valores, rejilla de los 3 ciclos de 28 días y lo próximo en el calendario.

**Hemogramas** — Hemoglobina, hematocrito, leucocitos, neutrófilos y plaquetas, con umbrales del hematólogo.

**Signos vitales** — Temperatura (38 °C ya es alarma en neutropenia), saturación, peso, presión y pulso.

**Colesterol y tiroides** — Colesterol total, LDL, HDL, triglicéridos, TSH, T4 libre y T3, con gráfica y franja "en rango".

**Calendario** — Citas, exámenes y aplicaciones de azacitidina. Un botón agenda los 7 días de un ciclo de una vez.

**Documentos** — Sube el PDF o la foto de cada examen. Queda en S3 cifrado; se abre con un enlace que dura 5 minutos.

**Asistente** — Preguntas en lenguaje natural sobre el seguimiento, respondidas por Claude con los registros guardados.

**Alarmas** — Signos de urgencia, umbrales de transfusión, cuidados en casa y teléfonos.

**Copiar reporte** — Texto ordenado con todo el historial para el médico.

---

## Arquitectura

```
Navegador ──► CloudFront ──► S3 (sitio, privado, OAC)
   │
   ├─► Cognito (login + MFA obligatorio, sin registro público)
   │
   └─► API Gateway HTTP (JWT de Cognito) ──► Lambda (Node 22, arm64)
                                               ├─► DynamoDB (tabla única, PITR)
                                               ├─► S3 documentos (cifrado, versionado)
                                               ├─► SSM Parameter Store (llave de Claude)
                                               └─► API de Anthropic (asistente)
```

| Pieza | Archivo | Costo aprox. |
|---|---|---|
| Sitio | `infra/sitio.tf` | $0 (capa gratis CloudFront) |
| Login | `infra/auth.tf` | $0 (< 10 000 usuarios) |
| API + Lambda | `infra/api.tf` | $0 (capa gratis) |
| Datos | `infra/datos.tf` | centavos |
| Alerta de gasto | `infra/presupuesto.tf` | $0 |
| Asistente (Claude) | `backend/src/asistente.mjs` | según uso de la API de Anthropic |

---

## Seguridad

- Nadie se registra solo. Terraform crea la única cuenta y Cognito envía una clave temporal al correo.
- Doble factor obligatorio (app de autenticación).
- La API exige token válido **y** pertenecer al grupo `familia`.
- Buckets privados, solo HTTPS, cifrados. Los PDF se suben y abren con URL firmadas de 5 minutos.
- La llave de Claude vive en SSM como `SecureString` y nunca pasa por Terraform ni por el estado.
- Al asistente se le envían los valores clínicos, **sin nombre, cédula ni radicado**.
- Cabeceras de seguridad (CSP, HSTS, `noindex`) en CloudFront.
- Presupuesto mensual con aviso por correo.

---

## Desplegar por primera vez

Necesitas `terraform` ≥ 1.10, `node` ≥ 20 y `aws` configurado con una cuenta **IAM** (no root).

**1. Configuración** (una sola vez). El estado va al bucket `itm-lab-hahiguit-tfstates`, con bloqueo por archivo (`use_lockfile`); está fijo en `infra/versions.tf`.

```bash
cp infra/terraform.tfvars.example infra/terraform.tfvars  # revisa los correos
```

**2. Desplegar todo:**

```bash
./scripts/desplegar.sh
```

Al final imprime la URL del sitio.

**3. Llave de Claude** (crea una en [console.anthropic.com](https://console.anthropic.com)):

```bash
aws ssm put-parameter --overwrite --type SecureString \
  --name /health-control/anthropic-api-key --value 'sk-ant-...'
```

**4. Primer ingreso:** abre la URL, entra con el correo y la clave temporal, cambia la clave y registra la app de autenticación.

---

## Trabajar en local

```bash
./scripts/env-local.sh   # crea .env.local con las salidas de Terraform
npm install
npm run dev
```

Abre http://localhost:5173 — ya está permitido en Cognito y en CORS.

---

## Cambios frecuentes

| Quiero… | Dónde |
|---|---|
| Cambiar umbrales | `src/constantes.js` (y la copia para el asistente en `backend/src/index.mjs`) |
| Dar acceso a otro familiar | Crear el usuario en Cognito y agregarlo al grupo `familia` |
| Cambiar el modelo de Claude | `modelo_claude` en `infra/terraform.tfvars` |
| Cambiar el tope de gasto | `presupuesto_mensual_usd` en `infra/terraform.tfvars` |

---

## Estructura

```
infra/                 Terraform (sitio, login, API, datos, presupuesto)
backend/src/
  index.mjs            Rutas de la API
  validar.mjs          Forma permitida de cada registro
  asistente.mjs        Preguntas a Claude
scripts/
  desplegar.sh         terraform apply + build + subida a S3
  env-local.sh         Genera .env para Vite
src/
  App.jsx              Sesión, datos y pestañas
  auth.js              Cognito con Amplify
  datos.js             Llamadas a la API
  constantes.js        Paciente, umbrales, protocolo del ciclo
  utils.js             Fechas, evaluación de umbrales, reporte
  components/          Pantallas y piezas de la interfaz
```

---

## Advertencia

Esta herramienta registra y organiza datos. **No reemplaza el examen de laboratorio ni el criterio del médico tratante.** Ante cualquier signo de alarma, consultar a urgencias.
