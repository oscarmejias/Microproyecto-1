import { Student, ClusterGroup, KPIData } from "./types";

const courseNames = [
  "Ingeniería Informática", "Enfermería", "Trabajo Social", "Gestión",
  "Periodismo", "Diseño", "Agronomía", "Educación", "Tecnologías",
  "Turismo", "Animación", "Veterinaria", "Biología", "Contabilidad",
  "Marketing", "Ingeniería Mecánica", "Comunicación Social"
];

const riskFactors = [
  "Bajo rendimiento 1er semestre",
  "Deudor de matrícula",
  "Sin beca",
  "Alta tasa de materias sin evaluar",
  "Bajo promedio de admisión",
  "Desplazado geográficamente",
  "Bajo nivel educativo familiar",
  "Caída de rendimiento entre semestres",
  "Estudiante internacional sin apoyo",
  "Edad mayor al promedio",
  "Alto desempleo regional",
  "Pocas materias aprobadas 2do sem",
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateStudent(index: number): Student {
  const dropoutProb = Math.random();
  const graduateProb = (1 - dropoutProb) * (0.5 + Math.random() * 0.5);
  const enrolledProb = 1 - dropoutProb - graduateProb;

  let prediction: Student["prediction"];
  let riskLevel: Student["riskLevel"];

  if (dropoutProb > 0.6) {
    prediction = "Dropout";
    riskLevel = "alto";
  } else if (dropoutProb > 0.35) {
    prediction = Math.random() > 0.5 ? "Dropout" : "Enrolled";
    riskLevel = "medio";
  } else {
    prediction = Math.random() > 0.3 ? "Graduate" : "Enrolled";
    riskLevel = "bajo";
  }

  const numFactors = riskLevel === "alto" ? 4 : riskLevel === "medio" ? 2 : 1;
  const shuffled = [...riskFactors].sort(() => Math.random() - 0.5);
  const topRiskFactors = shuffled.slice(0, numFactors);

  const sem1Enrolled = Math.floor(Math.random() * 5) + 4;
  const sem1Approved = Math.min(sem1Enrolled, Math.floor(Math.random() * (sem1Enrolled + 1)));
  const sem2Enrolled = Math.floor(Math.random() * 5) + 4;
  const sem2Approved = Math.min(sem2Enrolled, Math.floor(Math.random() * (sem2Enrolled + 1)));

  return {
    id: `STU-${String(index + 1).padStart(4, "0")}`,
    maritalStatus: Math.floor(Math.random() * 6) + 1,
    applicationMode: Math.floor(Math.random() * 18) + 1,
    applicationOrder: Math.floor(Math.random() * 9) + 1,
    course: Math.floor(Math.random() * 17),
    courseName: randomFrom(courseNames),
    attendanceMode: Math.random() > 0.3 ? "Diurno" : "Nocturno",
    previousQualification: Math.floor(Math.random() * 17) + 1,
    previousQualificationGrade: Math.round((100 + Math.random() * 100) * 10) / 10,
    nationality: Math.random() > 0.9 ? Math.floor(Math.random() * 20) + 2 : 1,
    mothersQualification: Math.floor(Math.random() * 30) + 1,
    fathersQualification: Math.floor(Math.random() * 30) + 1,
    mothersOccupation: Math.floor(Math.random() * 45) + 1,
    fathersOccupation: Math.floor(Math.random() * 45) + 1,
    admissionGrade: Math.round((95 + Math.random() * 100) * 10) / 10,
    displaced: Math.random() > 0.6,
    educationalSpecialNeeds: Math.random() > 0.95,
    debtor: dropoutProb > 0.5 ? Math.random() > 0.3 : Math.random() > 0.85,
    tuitionUpToDate: dropoutProb > 0.5 ? Math.random() > 0.6 : Math.random() > 0.15,
    gender: Math.random() > 0.45 ? "F" : "M",
    scholarshipHolder: dropoutProb > 0.5 ? Math.random() > 0.8 : Math.random() > 0.4,
    ageAtEnrollment: Math.floor(17 + Math.random() * 20),
    international: Math.random() > 0.9,
    curricularUnits1stSemEnrolled: sem1Enrolled,
    curricularUnits1stSemEvaluations: Math.min(sem1Enrolled + 2, Math.floor(Math.random() * 10) + 3),
    curricularUnits1stSemApproved: sem1Approved,
    curricularUnits1stSemGrade: Math.round((5 + Math.random() * 15) * 100) / 100,
    curricularUnits1stSemWithoutEvaluations: Math.floor(Math.random() * 3),
    curricularUnits2ndSemEnrolled: sem2Enrolled,
    curricularUnits2ndSemEvaluations: Math.min(sem2Enrolled + 2, Math.floor(Math.random() * 10) + 3),
    curricularUnits2ndSemApproved: sem2Approved,
    curricularUnits2ndSemGrade: Math.round((5 + Math.random() * 15) * 100) / 100,
    curricularUnits2ndSemWithoutEvaluations: Math.floor(Math.random() * 3),
    unemploymentRate: Math.round((7 + Math.random() * 10) * 10) / 10,
    inflationRate: Math.round((-1 + Math.random() * 5) * 10) / 10,
    gdp: Math.round((-4 + Math.random() * 8) * 100) / 100,
    prediction,
    dropoutProbability: Math.round(dropoutProb * 1000) / 1000,
    graduateProbability: Math.round(Math.max(0, graduateProb) * 1000) / 1000,
    enrolledProbability: Math.round(Math.max(0, enrolledProb) * 1000) / 1000,
    riskLevel,
    topRiskFactors,
  };
}

export const mockStudents: Student[] = Array.from({ length: 120 }, (_, i) => generateStudent(i));

export const mockKPIs: KPIData = {
  totalStudents: mockStudents.length,
  highRiskCount: mockStudents.filter((s) => s.riskLevel === "alto").length,
  mediumRiskCount: mockStudents.filter((s) => s.riskLevel === "medio").length,
  lowRiskCount: mockStudents.filter((s) => s.riskLevel === "bajo").length,
  avgDropoutProbability:
    Math.round(
      (mockStudents.reduce((sum, s) => sum + s.dropoutProbability, 0) / mockStudents.length) * 1000
    ) / 1000,
  retentionRate:
    Math.round(
      (mockStudents.filter((s) => s.prediction !== "Dropout").length / mockStudents.length) * 1000
    ) / 10,
};

export const mockClusters: ClusterGroup[] = [
  {
    id: "CLU-001",
    name: "Estudiantes con deuda y bajo rendimiento",
    description:
      "Estudiantes que presentan deuda de matrícula y rendimiento académico por debajo del promedio en ambos semestres.",
    studentCount: 28,
    avgDropoutProbability: 0.78,
    riskLevel: "alto",
    keyCharacteristics: [
      "Deudor de matrícula",
      "Promedio < 10 en ambos semestres",
      "Sin beca",
      "Mayoría nocturno",
    ],
    recommendedActions: [
      "Ofrecer plan de financiamiento flexible",
      "Asignar tutor académico semanal",
      "Evaluar elegibilidad para becas de emergencia",
      "Talleres de técnicas de estudio",
    ],
  },
  {
    id: "CLU-002",
    name: "Primer ingreso con baja preparación previa",
    description:
      "Estudiantes de primer año cuya calificación de admisión está significativamente por debajo de la media.",
    studentCount: 22,
    avgDropoutProbability: 0.62,
    riskLevel: "alto",
    keyCharacteristics: [
      "Nota de admisión < 110",
      "Primer año",
      "Alta tasa de materias sin evaluar",
      "Desplazados geográficamente",
    ],
    recommendedActions: [
      "Curso propedéutico obligatorio",
      "Mentoría entre pares",
      "Apoyo en alojamiento y transporte",
      "Seguimiento psicosocial quincenal",
    ],
  },
  {
    id: "CLU-003",
    name: "Estudiantes internacionales aislados",
    description:
      "Estudiantes internacionales con pocas redes de apoyo y rendimiento académico decreciente.",
    studentCount: 12,
    avgDropoutProbability: 0.55,
    riskLevel: "medio",
    keyCharacteristics: [
      "Estudiante internacional",
      "Sin beca",
      "Caída de notas entre semestres",
      "Aislamiento social detectado",
    ],
    recommendedActions: [
      "Programa buddy de integración cultural",
      "Apoyo lingüístico si aplica",
      "Beca de apoyo internacional",
      "Actividades extracurriculares guiadas",
    ],
  },
  {
    id: "CLU-004",
    name: "Estudiantes mayores con carga laboral",
    description:
      "Estudiantes mayores de 25 años que asisten en jornada nocturna, probablemente con responsabilidades laborales.",
    studentCount: 18,
    avgDropoutProbability: 0.48,
    riskLevel: "medio",
    keyCharacteristics: [
      "Edad > 25 años",
      "Jornada nocturna",
      "Pocas materias inscritas",
      "Rendimiento irregular",
    ],
    recommendedActions: [
      "Flexibilizar horarios y evaluaciones",
      "Ofrecer modalidad híbrida",
      "Tutoría personalizada en horarios compatibles",
      "Reconocimiento de experiencia laboral",
    ],
  },
  {
    id: "CLU-005",
    name: "Alto rendimiento estable",
    description:
      "Estudiantes con buen desempeño sostenido, matrícula al día y alto compromiso académico.",
    studentCount: 40,
    avgDropoutProbability: 0.12,
    riskLevel: "bajo",
    keyCharacteristics: [
      "Promedio > 13 ambos semestres",
      "Matrícula al día",
      "Alta tasa de aprobación",
      "Becados frecuentemente",
    ],
    recommendedActions: [
      "Programa de liderazgo estudiantil",
      "Involucrar como mentores pares",
      "Ofrecer oportunidades de investigación",
      "Monitoreo pasivo semestral",
    ],
  },
];

export const courseDistribution = courseNames.map((name) => ({
  course: name.length > 15 ? name.slice(0, 15) + "…" : name,
  fullName: name,
  students: mockStudents.filter((s) => s.courseName === name).length,
  highRisk: mockStudents.filter((s) => s.courseName === name && s.riskLevel === "alto").length,
})).filter(d => d.students > 0).sort((a, b) => b.students - a.students);

export const riskDistribution = [
  { name: "Alto", value: mockKPIs.highRiskCount, fill: "hsl(0, 72%, 51%)" },
  { name: "Medio", value: mockKPIs.mediumRiskCount, fill: "hsl(38, 92%, 50%)" },
  { name: "Bajo", value: mockKPIs.lowRiskCount, fill: "hsl(142, 64%, 40%)" },
];
