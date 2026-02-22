from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pydantic import BaseModel
from .request import PredictionRequest


class PredictionDetail(BaseModel):
    """Detalle de riesgo aplicado según reglas de negocio."""

    student_id: Optional[str] = None
    categoria: str
    risk_level: str
    outcome: Optional[str] = None
    risk_score: Optional[float] = None
    class_probabilities: Optional[Dict[str, float]] = None
    recommendation: str
    intervention_steps: str


class PredictionMetadata(BaseModel):
    model_version: str
    api_version: str
    timestamp: str


# Esquema de los resultados de predicción (respuesta batch/legacy)
class PredictionResults(BaseModel):
    errors: Optional[Any] = None
    version: str
    predictions: Optional[List[Any]] = None
    prediction: Optional[List[PredictionDetail]] = None
    metadata: Optional[PredictionMetadata] = None

    @classmethod
    def from_inference(
        cls,
        input_df: Any,
        raw_results: Dict[str, Any],
        student_ids: Optional[List[Optional[str]]] = None,
        api_version: str = "",
    ) -> "PredictionResults":
        """
        Construye PredictionResults a partir del resultado crudo del modelo,
        añadiendo los campos calculados (risk_details) según las reglas de negocio.
        """
        from app.utils.risk_rules import build_risk_details_dicts

        predictions = raw_results.get("predictions") or []
        risk_dicts = build_risk_details_dicts(input_df, predictions)
        if student_ids:
            for i, detail in enumerate(risk_dicts):
                detail["student_id"] = student_ids[i] if i < len(student_ids) else None
        risk_details = [PredictionDetail(**d) for d in risk_dicts]
        model_version = raw_results.get("version", "")
        timestamp = datetime.now(timezone.utc).isoformat(timespec="seconds").replace(
            "+00:00",
            "Z",
        )

        return cls(
            errors=raw_results.get("errors"),
            version=model_version,
            predictions=predictions,
            prediction=risk_details,
            metadata=PredictionMetadata(
                model_version=model_version,
                api_version=api_version,
                timestamp=timestamp,
            ),
        )


class StudentFeaturesMultiple(BaseModel):
    """Payload batch basado en StudentFeatures."""

    inputs: List[PredictionRequest]

    class Config:
        json_schema_extra = {
            "example": {
                "inputs": [
                    {
                        "student_info": {
                            "student_id": "ST-2024-001",
                            "name": "John Doe"
                        },
                        "academic_context": {
                            "semester": 4,
                            "batch_id": "2026-01-MAIA",
                            "course": "Computer Science"
                        },
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
                        }
                    }
                ]
            }
        }

    def to_feature_rows(self) -> List[Dict[str, Any]]:
        """Aplana el payload y retorna solo el bloque `features` por input."""
        rows: List[Dict[str, Any]] = []
        for item in self.inputs:
            if hasattr(item.features, "model_dump"):  # pydantic v2
                rows.append(item.features.model_dump())
            else:  # pydantic v1
                rows.append(item.features.dict())
        return rows


# Compatibilidad con contrato anterior (si otros módulos lo importan)
class MultipleDataInputs(BaseModel):
    inputs: List[Dict[str, Any]]