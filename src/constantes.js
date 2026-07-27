/* Datos y protocolo tomados de los documentos clínicos reales.
   Orden Recetario 41827 — Clínica de Oncología Astorga — 04/06/2026 */

export const PACIENTE_ID = "ludibia-soto-orozco";

export const PACIENTE = {
  nombre: "Ludibia Soto Orozco",
  cc: "21.894.008",
  nacimiento: "1961-03-10",
  dx: "Síndrome Mielodisplásico con Exceso de Blastos Tipo I",
  cie: "D467 · SMD-EB1 · Riesgo intermedio",
  hematologo: "Dr. Rafael Darío Marín Castellanos",
  institucion: "Clínica de Oncología Astorga",
  eps: "Nueva EPS",
  radicado: "05001310900320260011900",
};

export const UMBRALES = {
  hb: {
    label: "Hemoglobina", unidad: "g/dL", alarma: 7.0, precaucion: 8.5,
    accion: "Transfundir 1 U de glóbulos rojos desleucocitados (código 912002)",
    dominio: [4, 14],
  },
  plaquetas: {
    label: "Plaquetas", unidad: "×10³/µL", alarma: 30, precaucion: 50,
    accion: "Transfundir 1 U de plaquetas por aféresis (código 912003)",
    dominio: [0, 250],
  },
  neutrofilos: {
    label: "Neutrófilos", unidad: "×10³/µL", alarma: 0.5, precaucion: 1.0,
    accion: "Neutropenia grave — aislamiento estricto, tapabocas, sin alimentos crudos",
    dominio: [0, 5],
  },
  leucocitos: { label: "Leucocitos", unidad: "×10³/µL", alarma: 1.0, precaucion: 3.0, dominio: [0, 12] },
  hto:        { label: "Hematocrito", unidad: "%", alarma: 21, precaucion: 27, dominio: [10, 50] },
  temp: {
    label: "Temperatura", unidad: "°C", alarma: 38.0, precaucion: 37.5, invertido: true,
    accion: "URGENCIAS INMEDIATO — un solo registro de 38 °C o más en neutropenia",
  },
  spo2: { label: "Saturación O₂", unidad: "%", alarma: 90, precaucion: 93 },
};

export const CICLO = {
  diasAplicacion: 7,
  diasTotal: 28,
  totalCiclos: 3,
  medicamento: "Azacitidina 100 mg IV",
  soporte: "Pegfilgrastim 6 mg SC (día 7)",
  profilaxis: "Trimetoprim Sulfa 160/800 mg — lunes, miércoles y viernes",
};

export const CONTACTOS = [
  ["Clínica de Oncología Astorga", "604 520 0140"],
  ["Nueva EPS — atención al usuario", "018000 910 901"],
  ["Supersalud", "018000 513 700"],
  ["Emergencias", "123"],
];

export const SIGNOS_URGENCIA = [
  "Temperatura de 38 °C o más — una sola vez basta",
  "Escalofríos intensos",
  "Sangrado que no para tras 10 minutos de presión",
  "Sangre en orina o deposiciones negras",
  "Tos persistente o dolor al tragar",
  "Debilidad extrema o dificultad para respirar",
  "Enrojecimiento o lesiones nuevas en la piel",
];

export const CUIDADOS_CASA = [
  "Lavado de manos estricto de la paciente y de quienes la cuidan",
  "Tapabocas de alta eficiencia dentro y fuera de casa",
  "Sin contacto con personas enfermas ni aglomeraciones",
  "Alimentos bien cocidos — nada de frutas o verduras crudas",
  "Cepillo de dientes de cerdas suaves",
  "Nada de aspirina ni ibuprofeno — solo acetaminofén",
];

/* Semilla: laboratorio 11/05/2026 y examen físico 04/06/2026.
   Se escribe una sola vez, cuando la base está vacía. */
export const SEMILLA_HEMOGRAMAS = [
  { fecha: "2026-05-11", hb: 7.6, hto: 23.0, leucocitos: 1.83, neutrofilos: 0.36,
    plaquetas: 51, nota: "Línea base previa a quimioterapia — Clínica Astorga" },
];

export const SEMILLA_SIGNOS = [
  { fecha: "2026-06-04", peso: 50.0, sis: 130, dia: 80, fc: null, spo2: null,
    temp: null, nota: "Examen físico consulta hematología" },
];
