"""
Esquemas de entrada (Request) para la API.
Basados en src/schema.py
"""

from pydantic import BaseModel, Field


class StudentInfo(BaseModel):
    """Identificación del estudiante."""

    student_id: str = Field(..., example="ST-2024-001")
    name: str = Field(..., example="John Doe")


class AcademicContext(BaseModel):
    """Contexto académico del estudiante."""

    semester: int = Field(..., example=4)
    batch_id: str = Field(..., example="2026-01-MAIA")
    course: str = Field(..., example="Computer Science")

class StudentFeatures(BaseModel):
    """
    Variables estrictamente en minúsculas para hacer match
    con el preprocesamiento de data_processor.py.
    """

    age_at_enrollment: int = Field(..., example=19)
    gender: int = Field(..., example=1)
    displaced: int = Field(..., example=0)
    debtor: int = Field(..., example=0)
    tuition_fees_up_to_date: int = Field(..., example=1)
    scholarship_holder: int = Field(..., example=1)
    curricular_units_1st_sem_enrolled: int = Field(..., example=6)
    curricular_units_1st_sem_approved: int = Field(..., example=6)
    curricular_units_1st_sem_grade: float = Field(..., example=14.5)
    curricular_units_2nd_sem_enrolled: int = Field(..., example=6)
    curricular_units_2nd_sem_approved: int = Field(..., example=6)
    curricular_units_2nd_sem_grade: float = Field(..., example=15.0)


class PredictionRequest(BaseModel):
    """
    Esquema principal que agrupa toda la información de entrada para una predicción.
    """

    student_info: StudentInfo
    academic_context: AcademicContext
    features: StudentFeatures

    class Config:
        json_schema_extra = {
            "example": {
                "student_info": {"student_id": "ST-2024-001", "name": "John Doe"},
                "academic_context": {"semester": 4, "batch_id": "2026-01-MAIA", "course": "Computer Science"},
                "features": {
                    "age_at_enrollment": 19,
                    "gender": 1,
                    "displaced": 0,
                    "debtor": 0,
                    "tuition_fees_up_to_date": 1,
                    "scholarship_holder": 1,
                    "curricular_units_1st_sem_enrolled": 6,
                    "curricular_units_1st_sem_approved": 6,
                    "curricular_units_1st_sem_grade": 14.5,
                    "curricular_units_2nd_sem_enrolled": 6,
                    "curricular_units_2nd_sem_approved": 6,
                    "curricular_units_2nd_sem_grade": 15.0,
                },
            }
        }
