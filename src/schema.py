from pydantic import BaseModel, Field
from typing import List, Dict

# ESQUEMAS DE ENTRADA (REQUEST BODY)
# ==========================================

class StudentInfo(BaseModel):
    student_id: str = Field(..., example="ST-2024-001")

class AcademicContext(BaseModel):
    semester: int = Field(..., example=4)
    batch_id: str = Field(..., example="2026-01-MAIA")

class StudentFeatures(BaseModel):
    """
    Variables estrictamente en minúsculas para hacer match 
    con el preprocesamiento de data_processor.py
    """
    age_at_enrollment: int
    gender: int
    displaced: int
    debtor: int
    tuition_fees_up_to_date: int
    scholarship_holder: int
    curricular_units_1st_sem_enrolled: int
    curricular_units_1st_sem_approved: int
    curricular_units_1st_sem_grade: float
    curricular_units_2nd_sem_enrolled: int
    curricular_units_2nd_sem_approved: int
    curricular_units_2nd_sem_grade: float

class PredictionRequest(BaseModel):
    """
    Esquema principal que agrupa toda la información de entrada.
    """
    student_info: StudentInfo
    academic_context: AcademicContext
    features: StudentFeatures


# ESQUEMAS DE SALIDA (RESPONSE)
# ==========================================

class ClassProbabilities(BaseModel):
    Graduate: float
    Dropout: float

class FeatureImpact(BaseModel):
    feature: str
    value: float
    impact: str

class PredictionDetail(BaseModel):
    outcome: str = Field(..., example="Dropout")
    risk_score: float = Field(..., example=0.82)
    risk_level: str = Field(..., example="Alto")
    class_probabilities: ClassProbabilities
    feature_importance: List[FeatureImpact]
    recommendation: str
    intervention_steps: List[str]

class ResponseMetadata(BaseModel):
    model_version: str = Field(..., example="v1.2.0-binary")
    api_version: str = Field(..., example="v1.0.0")
    inference_time_ms: int
    timestamp: str

class PredictionResponse(BaseModel):
    """
    Estructura final de la respuesta enviada al cliente.
    """
    student_id: str
    prediction: PredictionDetail
    metadata: ResponseMetadata