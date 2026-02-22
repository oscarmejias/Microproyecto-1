import { PredictionInput, DEFAULT_INPUT, SimplePredictionInput, DEFAULT_SIMPLE_INPUT } from "@/services/predictionService";

/** Map of CSV column headers → PredictionInput keys */
const COLUMN_MAP: Record<string, keyof PredictionInput> = {
  "Marital status": "maritalStatus",
  "Marital_status": "maritalStatus",
  "Application mode": "applicationMode",
  "Application_mode": "applicationMode",
  "Application order": "applicationOrder",
  "Application_order": "applicationOrder",
  "Course": "course",
  "Daytime/evening attendance": "daytimeEveningAttendance",
  "Daytime_evening_attendance": "daytimeEveningAttendance",
  "Previous qualification": "previousQualification",
  "Previous_qualification": "previousQualification",
  "Previous qualification (grade)": "previousQualificationGrade",
  "Previous_qualification_(grade)": "previousQualificationGrade",
  "Nacionality": "nationality",
  "Nationality": "nationality",
  "Mother's qualification": "mothersQualification",
  "Mothers_qualification": "mothersQualification",
  "Mother_qualification": "mothersQualification",
  "Father's qualification": "fathersQualification",
  "Fathers_qualification": "fathersQualification",
  "Father_qualification": "fathersQualification",
  "Mother's occupation": "mothersOccupation",
  "Mothers_occupation": "mothersOccupation",
  "Mother_occupation": "mothersOccupation",
  "Father's occupation": "fathersOccupation",
  "Fathers_occupation": "fathersOccupation",
  "Father_occupation": "fathersOccupation",
  "Admission grade": "admissionGrade",
  "Admission_grade": "admissionGrade",
  "Displaced": "displaced",
  "Educational special needs": "educationalSpecialNeeds",
  "Educational_special_needs": "educationalSpecialNeeds",
  "Debtor": "debtor",
  "Tuition fees up to date": "tuitionFeesUpToDate",
  "Tuition_fees_up_to_date": "tuitionFeesUpToDate",
  "Gender": "gender",
  "Scholarship holder": "scholarshipHolder",
  "Scholarship_holder": "scholarshipHolder",
  "Age at enrollment": "ageAtEnrollment",
  "Age_at_enrollment": "ageAtEnrollment",
  "International": "international",
  "Curricular units 1st sem (credited)": "curricularUnits1stSemCredited",
  "Curricular_units_1st_sem_(credited)": "curricularUnits1stSemCredited",
  "Curricular units 1st sem (enrolled)": "curricularUnits1stSemEnrolled",
  "Curricular_units_1st_sem_(enrolled)": "curricularUnits1stSemEnrolled",
  "Curricular units 1st sem (evaluations)": "curricularUnits1stSemEvaluations",
  "Curricular_units_1st_sem_(evaluations)": "curricularUnits1stSemEvaluations",
  "Curricular units 1st sem (approved)": "curricularUnits1stSemApproved",
  "Curricular_units_1st_sem_(approved)": "curricularUnits1stSemApproved",
  "Curricular units 1st sem (grade)": "curricularUnits1stSemGrade",
  "Curricular_units_1st_sem_(grade)": "curricularUnits1stSemGrade",
  "Curricular units 1st sem (without evaluations)": "curricularUnits1stSemWithoutEvaluations",
  "Curricular_units_1st_sem_(without_evaluations)": "curricularUnits1stSemWithoutEvaluations",
  "Curricular units 2nd sem (credited)": "curricularUnits2ndSemCredited",
  "Curricular_units_2nd_sem_(credited)": "curricularUnits2ndSemCredited",
  "Curricular units 2nd sem (enrolled)": "curricularUnits2ndSemEnrolled",
  "Curricular_units_2nd_sem_(enrolled)": "curricularUnits2ndSemEnrolled",
  "Curricular units 2nd sem (evaluations)": "curricularUnits2ndSemEvaluations",
  "Curricular_units_2nd_sem_(evaluations)": "curricularUnits2ndSemEvaluations",
  "Curricular units 2nd sem (approved)": "curricularUnits2ndSemApproved",
  "Curricular_units_2nd_sem_(approved)": "curricularUnits2ndSemApproved",
  "Curricular units 2nd sem (grade)": "curricularUnits2ndSemGrade",
  "Curricular_units_2nd_sem_(grade)": "curricularUnits2ndSemGrade",
  "Curricular units 2nd sem (without evaluations)": "curricularUnits2ndSemWithoutEvaluations",
  "Curricular_units_2nd_sem_(without_evaluations)": "curricularUnits2ndSemWithoutEvaluations",
  "Unemployment rate": "unemploymentRate",
  "Unemployment_rate": "unemploymentRate",
  "Inflation rate": "inflationRate",
  "Inflation_rate": "inflationRate",
  "GDP": "gdp",
};

export async function parseStudentCSV(file: File): Promise<PredictionInput> {
  const text = await file.text();
  const lines = text.trim().split(/\r?\n/);

  if (lines.length < 2) {
    throw new Error("El CSV debe tener al menos una fila de encabezados y una fila de datos.");
  }

  const delimiter = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ""));
  const values = lines[1].split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ""));

  const result: PredictionInput = { ...DEFAULT_INPUT };
  let matchedCount = 0;

  headers.forEach((header, idx) => {
    const key = COLUMN_MAP[header];
    if (key && idx < values.length) {
      const num = parseFloat(values[idx]);
      if (!isNaN(num)) {
        (result as unknown as Record<string, number>)[key] = num;
        matchedCount++;
      }
    }
  });

  if (matchedCount === 0) {
    throw new Error(
      "No se encontraron columnas reconocidas en el CSV. Verifica que los encabezados coincidan con el diccionario de variables."
    );
  }

  return result;
}

// ──────────────────────────────────────────────
// Simple CSV parser for the simplified form
// ──────────────────────────────────────────────

const SIMPLE_COLUMN_MAP: Record<string, keyof SimplePredictionInput> = {
  student_id: "student_id",
  name: "name",
  semester: "semester",
  batch_id: "batch_id",
  course: "course",
  age_at_enrollment: "age_at_enrollment",
  gender: "gender",
  displaced: "displaced",
  debtor: "debtor",
  tuition_fees_up_to_date: "tuition_fees_up_to_date",
  scholarship_holder: "scholarship_holder",
  curricular_units_1st_sem_enrolled: "curricular_units_1st_sem_enrolled",
  curricular_units_1st_sem_approved: "curricular_units_1st_sem_approved",
  curricular_units_1st_sem_grade: "curricular_units_1st_sem_grade",
  curricular_units_2nd_sem_enrolled: "curricular_units_2nd_sem_enrolled",
  curricular_units_2nd_sem_approved: "curricular_units_2nd_sem_approved",
  curricular_units_2nd_sem_grade: "curricular_units_2nd_sem_grade",
};

const STRING_FIELDS = new Set<string>(["student_id", "name", "batch_id", "course"]);

export async function parseSimpleStudentCSV(file: File): Promise<SimplePredictionInput[]> {
  const text = await file.text();
  const lines = text.trim().split(/\r?\n/);

  if (lines.length < 2) {
    throw new Error("El CSV debe tener al menos una fila de encabezados y una fila de datos.");
  }

  const delimiter = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ""));

  const results: SimplePredictionInput[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = lines[i].split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: SimplePredictionInput = { ...DEFAULT_SIMPLE_INPUT };
    let matchedCount = 0;

    headers.forEach((header, idx) => {
      const key = SIMPLE_COLUMN_MAP[header];
      if (key && idx < values.length) {
        if (STRING_FIELDS.has(key)) {
          (row as any)[key] = values[idx];
          matchedCount++;
        } else {
          const num = parseFloat(values[idx]);
          if (!isNaN(num)) {
            (row as any)[key] = num;
            matchedCount++;
          }
        }
      }
    });

    if (matchedCount > 0) {
      results.push(row);
    }
  }

  if (results.length === 0) {
    throw new Error(
      "No se encontraron columnas reconocidas en el CSV. Verifica que los encabezados coincidan con el formato esperado."
    );
  }

  return results;
}
