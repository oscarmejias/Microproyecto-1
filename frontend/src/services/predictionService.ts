import { COURSE } from "@/data/variableDictionary";
import { supabase } from "@/integrations/supabase/client";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface PredictionInput {
  maritalStatus: number;
  applicationMode: number;
  applicationOrder: number;
  course: number;
  daytimeEveningAttendance: number;
  previousQualification: number;
  previousQualificationGrade: number;
  nationality: number;
  mothersQualification: number;
  fathersQualification: number;
  mothersOccupation: number;
  fathersOccupation: number;
  admissionGrade: number;
  displaced: number;
  educationalSpecialNeeds: number;
  debtor: number;
  tuitionFeesUpToDate: number;
  gender: number;
  scholarshipHolder: number;
  ageAtEnrollment: number;
  international: number;
  curricularUnits1stSemCredited: number;
  curricularUnits1stSemEnrolled: number;
  curricularUnits1stSemEvaluations: number;
  curricularUnits1stSemApproved: number;
  curricularUnits1stSemGrade: number;
  curricularUnits1stSemWithoutEvaluations: number;
  curricularUnits2ndSemCredited: number;
  curricularUnits2ndSemEnrolled: number;
  curricularUnits2ndSemEvaluations: number;
  curricularUnits2ndSemApproved: number;
  curricularUnits2ndSemGrade: number;
  curricularUnits2ndSemWithoutEvaluations: number;
  unemploymentRate: number;
  inflationRate: number;
  gdp: number;
}

export interface PredictionResponse {
  prediction: "Dropout" | "Graduate" | "Enrolled";
  dropoutProbability: number;
  graduateProbability: number;
  enrolledProbability: number;
  riskLevel: "alto" | "medio" | "bajo";
  topRiskFactors: string[];
}

export interface SimplePredictionInput {
  student_id: string;
  name: string;
  semester: number;
  batch_id: string;
  course: string;
  age_at_enrollment: number;
  gender: number;
  displaced: number;
  debtor: number;
  tuition_fees_up_to_date: number;
  scholarship_holder: number;
  curricular_units_1st_sem_enrolled: number;
  curricular_units_1st_sem_approved: number;
  curricular_units_1st_sem_grade: number;
  curricular_units_2nd_sem_enrolled: number;
  curricular_units_2nd_sem_approved: number;
  curricular_units_2nd_sem_grade: number;
}

export interface BatchPredictionResult {
  student_id: string;
  outcome: string;
  risk_level: string;
  risk_score: number;
  recommendation: string;
  intervention_steps: string;
  class_probabilities: { Graduate?: number; Dropout?: number };
}

export interface PredictionRecord {
  id: string;
  created_at: string;
  batch_id: string | null;
  student_id: string | null;
  student_name: string | null;
  course: string | null;
  semester: number | null;
  age_at_enrollment: number | null;
  gender: number | null;
  displaced: number | null;
  debtor: number | null;
  tuition_fees_up_to_date: number | null;
  scholarship_holder: number | null;
  cu_1st_sem_enrolled: number | null;
  cu_1st_sem_approved: number | null;
  cu_1st_sem_grade: number | null;
  cu_2nd_sem_enrolled: number | null;
  cu_2nd_sem_approved: number | null;
  cu_2nd_sem_grade: number | null;
  outcome: string | null;
  risk_score: number | null;
  risk_level: string | null;
  dropout_prob: number | null;
  graduate_prob: number | null;
  recommendation: string | null;
  intervention: string | null;
}

// ──────────────────────────────────────────────
// Defaults
// ──────────────────────────────────────────────

export const DEFAULT_SIMPLE_INPUT: SimplePredictionInput = {
  student_id: "",
  name: "",
  semester: 2,
  batch_id: "2026-01-EVAL",
  course: "Computer Science",
  age_at_enrollment: 20,
  gender: 1,
  displaced: 0,
  debtor: 0,
  tuition_fees_up_to_date: 1,
  scholarship_holder: 0,
  curricular_units_1st_sem_enrolled: 6,
  curricular_units_1st_sem_approved: 5,
  curricular_units_1st_sem_grade: 12,
  curricular_units_2nd_sem_enrolled: 6,
  curricular_units_2nd_sem_approved: 5,
  curricular_units_2nd_sem_grade: 11,
};

export const DEFAULT_INPUT: PredictionInput = {
  maritalStatus: 1,
  applicationMode: 1,
  applicationOrder: 1,
  course: 7,
  daytimeEveningAttendance: 1,
  previousQualification: 1,
  previousQualificationGrade: 130,
  nationality: 1,
  mothersQualification: 1,
  fathersQualification: 1,
  mothersOccupation: 5,
  fathersOccupation: 5,
  admissionGrade: 130,
  displaced: 0,
  educationalSpecialNeeds: 0,
  debtor: 0,
  tuitionFeesUpToDate: 1,
  gender: 1,
  scholarshipHolder: 0,
  ageAtEnrollment: 20,
  international: 0,
  curricularUnits1stSemCredited: 0,
  curricularUnits1stSemEnrolled: 6,
  curricularUnits1stSemEvaluations: 6,
  curricularUnits1stSemApproved: 5,
  curricularUnits1stSemGrade: 12,
  curricularUnits1stSemWithoutEvaluations: 0,
  curricularUnits2ndSemCredited: 0,
  curricularUnits2ndSemEnrolled: 6,
  curricularUnits2ndSemEvaluations: 6,
  curricularUnits2ndSemApproved: 5,
  curricularUnits2ndSemGrade: 11,
  curricularUnits2ndSemWithoutEvaluations: 0,
  unemploymentRate: 10.8,
  inflationRate: 1.4,
  gdp: 1.74,
};

// ──────────────────────────────────────────────
// API payload builders
// ──────────────────────────────────────────────

function buildAPIPayload(input: PredictionInput) {
  const courseName = COURSE.find((c) => c.value === input.course)?.label ?? "Informatics Engineering";
  return {
    inputs: [{
      academic_context: { batch_id: "2026-01-EVAL", course: courseName, semester: 2 },
      features: {
        age_at_enrollment: input.ageAtEnrollment,
        curricular_units_1st_sem_approved: input.curricularUnits1stSemApproved,
        curricular_units_1st_sem_enrolled: input.curricularUnits1stSemEnrolled,
        curricular_units_1st_sem_grade: input.curricularUnits1stSemGrade,
        curricular_units_2nd_sem_approved: input.curricularUnits2ndSemApproved,
        curricular_units_2nd_sem_enrolled: input.curricularUnits2ndSemEnrolled,
        curricular_units_2nd_sem_grade: input.curricularUnits2ndSemGrade,
        debtor: input.debtor,
        displaced: input.displaced,
        gender: input.gender,
        scholarship_holder: input.scholarshipHolder,
        tuition_fees_up_to_date: input.tuitionFeesUpToDate,
      },
      student_info: { name: "Evaluacion Individual", student_id: `EVAL-${Date.now()}` },
    }],
  };
}

function buildSimpleAPIPayload(input: SimplePredictionInput) {
  return {
    inputs: [{
      academic_context: {
        batch_id: input.batch_id || "2026-01-EVAL",
        course: input.course,
        semester: input.semester,
      },
      features: {
        age_at_enrollment: input.age_at_enrollment,
        curricular_units_1st_sem_approved: input.curricular_units_1st_sem_approved,
        curricular_units_1st_sem_enrolled: input.curricular_units_1st_sem_enrolled,
        curricular_units_1st_sem_grade: input.curricular_units_1st_sem_grade,
        curricular_units_2nd_sem_approved: input.curricular_units_2nd_sem_approved,
        curricular_units_2nd_sem_enrolled: input.curricular_units_2nd_sem_enrolled,
        curricular_units_2nd_sem_grade: input.curricular_units_2nd_sem_grade,
        debtor: input.debtor,
        displaced: input.displaced,
        gender: input.gender,
        scholarship_holder: input.scholarship_holder,
        tuition_fees_up_to_date: input.tuition_fees_up_to_date,
      },
      student_info: {
        name: input.name || "Evaluacion Individual",
        student_id: input.student_id || `EVAL-${Date.now()}`,
      },
    }],
  };
}

// ──────────────────────────────────────────────
// API response parser
// ──────────────────────────────────────────────

function parseAPIResponse(apiData: any): PredictionResponse {
  const root = Array.isArray(apiData) ? apiData[0] : apiData;
  const pred = root?.prediction?.[0];
  if (!pred) throw new Error("La API no devolvió predicciones");

  const riskMap: Record<string, "alto" | "medio" | "bajo"> = {
    High: "alto", Alto: "alto",
    Medium: "medio", Medio: "medio",
    Low: "bajo", Bajo: "bajo",
  };

  const probs = pred.class_probabilities ?? {};
  const dropoutProb = pred.risk_score ?? probs["Dropout"] ?? 0;
  const graduateProb = probs["Graduate"] ?? Math.max(0.01, 1 - dropoutProb);
  const enrolledProb = Math.max(0.01, 1 - dropoutProb - graduateProb);

  const factors: string[] = [];
  if (pred.recommendation) factors.push(pred.recommendation);
  if (pred.intervention_steps) factors.push(pred.intervention_steps);
  if (factors.length === 0) factors.push("Sin factores de riesgo significativos");

  return {
    prediction: (pred.outcome as PredictionResponse["prediction"]) ?? "Enrolled",
    dropoutProbability: Math.round(dropoutProb * 1000) / 1000,
    graduateProbability: Math.round(graduateProb * 1000) / 1000,
    enrolledProbability: Math.round(enrolledProb * 1000) / 1000,
    riskLevel: riskMap[pred.risk_level] ?? "medio",
    topRiskFactors: factors,
  };
}

// ──────────────────────────────────────────────
// Individual prediction
// ──────────────────────────────────────────────

export async function predictStudent(input: PredictionInput): Promise<PredictionResponse> {
  const payload = buildAPIPayload(input);
  const { data, error } = await supabase.functions.invoke("predict-proxy", { body: payload });
  if (error) throw new Error(`Error del proxy: ${error.message}`);
  return parseAPIResponse(data);
}

export async function predictStudentSimple(input: SimplePredictionInput): Promise<PredictionResponse> {
  const payload = buildSimpleAPIPayload(input);
  const { data, error } = await supabase.functions.invoke("predict-proxy", { body: payload });
  if (error) throw new Error(`Error del proxy: ${error.message}`);
  return parseAPIResponse(data);
}

// ──────────────────────────────────────────────
// Batch CSV prediction
// ──────────────────────────────────────────────

export async function predictBatchCSV(file: File, batchId: string): Promise<BatchPredictionResult[]> {
  const csvContent = await file.text();
  const { data, error } = await supabase.functions.invoke("predict-csv-proxy", {
    body: { csv_content: csvContent, batch_id: batchId },
  });
  if (error) throw new Error(`Error del proxy CSV: ${error.message}`);
  return data?.predictions ?? [];
}

// ──────────────────────────────────────────────
// Fetch predictions from DB
// ──────────────────────────────────────────────

export async function fetchPredictions(batchId?: string): Promise<PredictionRecord[]> {
  let query = supabase.from("predictions").select("*").order("created_at", { ascending: false });
  if (batchId) {
    query = query.eq("batch_id", batchId);
  }
  const { data, error } = await query;
  if (error) throw new Error(`Error al cargar predicciones: ${error.message}`);
  return (data ?? []) as unknown as PredictionRecord[];
}
