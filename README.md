# Seguimiento clínico

Aplicación privada para el seguimiento de **Ludibia Soto Orozco** durante el tratamiento con Azacitidina por Síndrome Mielodisplásico con Exceso de Blastos Tipo I (SMD-EB1).

Registra hemogramas, ciclos de quimioterapia y signos vitales, y avisa cuando algún valor cruza los umbrales que fijó el hematólogo tratante.

---

## Qué hace

**Resumen** — Una banda arriba dice si los últimos valores están en rango, en vigilancia o en alarma. Debajo, el calendario de los 3 ciclos: 28 casillas por ciclo con los 7 días de aplicación marcados, el día del Pegfilgrastim, y hoy resaltado. Indica qué corresponde hacer hoy, incluido si toca Trimetoprim Sulfa.

**Hemogramas** — Hemoglobina, hematocrito, leucocitos, neutrófilos y plaquetas. Cada valor se colorea según su umbral. Las gráficas dibujan la línea de alarma sobre los datos.

**Signos vitales** — Temperatura, saturación, peso, presión arterial y frecuencia cardíaca. La temperatura se evalúa con criterio de neutropenia: 38 °C ya es alarma.

**Alarmas** — Signos que obligan a ir a urgencias, umbrales de transfusión con sus códigos de procedimiento, cuidados en casa y teléfonos.

**Copiar reporte** — Arma un texto ordenado con todo el historial para enviarlo al hematólogo antes de cada control.

---

## Umbrales configurados

Tomados de las órdenes del Dr. Rafael Darío Marín Castellanos, Clínica de Oncología Astorga (04/06/2026).

| Valor | Alarma | Acción ordenada |
|---|---|---|
| Hemoglobina | ≤ 7.0 g/dL | Transfundir 1 U de glóbulos rojos desleucocitados (código 912002) |
| Plaquetas | ≤ 30 ×10³/µL | Transfundir 1 U de plaquetas por aféresis (código 912003) |
| Neutrófilos | ≤ 0.5 ×10³/µL | Neutropenia grave — aislamiento estricto |
| Temperatura | ≥ 38.0 °C | Urgencias inmediato |

Para cambiarlos, edita `src/constantes.js`.

---

## Instalar y correr en local

```bash
npm install
cp .env.example .env    # y pega tus credenciales de Firebase
npm run dev
```

Abre http://localhost:5173

Los pasos para crear el proyecto Firebase están en **[FIREBASE_SETUP.md](FIREBASE_SETUP.md)**.

---

## Publicar

**GitHub Pages** — Cada push a `main` despliega solo, siempre que hayas cargado los secretos del repositorio (ver FIREBASE_SETUP.md, paso 6).

**Firebase Hosting** — Alternativa con dominio propio:

```bash
DEPLOY_TARGET=firebase npm run build
firebase deploy --only hosting
```

---

## Privacidad

Esto guarda el historial médico de una persona identificada.

- El código es público; los **datos no**. Firestore exige sesión iniciada con un correo de la lista blanca.
- La lista está en dos lugares y ambos deben coincidir: `firestore.rules` (la que manda) y la variable `VITE_CORREOS_AUTORIZADOS` (la que evita que se cargue la interfaz).
- **Las reglas son la única protección real.** La configuración de Firebase en el navegador es pública por diseño y no da acceso a nada por sí sola.
- Nunca subas el archivo `.env` — ya está en `.gitignore`.

Para dar acceso a otro familiar: agrega su correo en `firestore.rules`, publica las reglas con `firebase deploy --only firestore:rules`, y agrégalo también al secreto `VITE_CORREOS_AUTORIZADOS`.

---

## Estructura

```
src/
├── App.jsx           Orquesta sesión, datos y pestañas
├── firebase.js       Inicialización, auth, caché offline
├── datos.js          Lecturas en vivo y escrituras a Firestore
├── constantes.js     Paciente, umbrales, protocolo del ciclo
├── utils.js          Fechas, evaluación de umbrales, reporte
├── tokens.js         Paleta y tipografías
└── components/
    ├── BandaEstado.jsx      Semáforo de los últimos valores
    ├── RejillaCiclo.jsx     Calendario de 28 días × 3 ciclos
    ├── SeccionHemogramas.jsx
    ├── SeccionSignos.jsx
    ├── SeccionAlarmas.jsx
    ├── GraficaLinea.jsx     Gráfica con banda de alarma
    ├── Acceso.jsx           Pantalla de login
    ├── FaltaConfig.jsx      Aviso si falta conectar Firebase
    └── ui.jsx               Piezas compartidas
```

---

## Advertencia

Esta herramienta registra y organiza datos. **No reemplaza el hemograma de laboratorio ni el criterio del médico tratante.** Ante cualquier signo de alarma, consultar a urgencias.
