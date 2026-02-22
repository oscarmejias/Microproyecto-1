export type RiskLevel = "alto" | "medio" | "bajo";
export type TargetClass = "Dropout" | "Graduate" | "Enrolled";

export interface Student {
  id: string;
  maritalStatus: number;
  applicationMode: number;
  applicationOrder: number;
  course: number;
  courseName: string;
  attendanceMode: "Diurno" | "Nocturno";
  previousQualification: number;
  previousQualificationGrade: number;
  nationality: number;
  mothersQualification: number;
  fathersQualification: number;
  mothersOccupation: number;
  fathersOccupation: number;
  admissionGrade: number;
  displaced: boolean;
  educationalSpecialNeeds: boolean;
  debtor: boolean;
  tuitionUpToDate: boolean;
  gender: "M" | "F";
  scholarshipHolder: boolean;
  ageAtEnrollment: number;
  international: boolean;
  curricularUnits1stSemEnrolled: number;
  curricularUnits1stSemEvaluations: number;
  curricularUnits1stSemApproved: number;
  curricularUnits1stSemGrade: number;
  curricularUnits1stSemWithoutEvaluations: number;
  curricularUnits2ndSemEnrolled: number;
  curricularUnits2ndSemEvaluations: number;
  curricularUnits2ndSemApproved: number;
  curricularUnits2ndSemGrade: number;
  curricularUnits2ndSemWithoutEvaluations: number;
  unemploymentRate: number;
  inflationRate: number;
  gdp: number;
  // ML prediction output
  prediction: TargetClass;
  dropoutProbability: number;
  graduateProbability: number;
  enrolledProbability: number;
  riskLevel: RiskLevel;
  topRiskFactors: string[];
}

export interface ClusterGroup {
  id: string;
  name: string;
  description: string;
  studentCount: number;
  avgDropoutProbability: number;
  riskLevel: RiskLevel;
  keyCharacteristics: string[];
  recommendedActions: string[];
}

export interface KPIData {
  totalStudents: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  avgDropoutProbability: number;
  retentionRate: number;
}
