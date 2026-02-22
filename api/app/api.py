import io
import json
from typing import Any

import numpy as np
import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile
from loguru import logger
from pydantic import ValidationError

from app import __version__, schemas
from app.config import settings
from app.utils.model_loader import make_prediction, model_version
from app.utils.preprocessing import normalize_input_columns, prepare_model_input

api_router = APIRouter()

CSV_STUDENT_INFO_FIELDS = ("student_id", "name")
CSV_ACADEMIC_CONTEXT_FIELDS = ("semester", "batch_id", "course")
CSV_FEATURE_FIELDS = (
    "age_at_enrollment",
    "gender",
    "displaced",
    "debtor",
    "tuition_fees_up_to_date",
    "scholarship_holder",
    "curricular_units_1st_sem_enrolled",
    "curricular_units_1st_sem_approved",
    "curricular_units_1st_sem_grade",
    "curricular_units_2nd_sem_enrolled",
    "curricular_units_2nd_sem_approved",
    "curricular_units_2nd_sem_grade",
)


# Ruta para verificar que la API se esté ejecutando correctamente
@api_router.get("/health", response_model=schemas.Health, status_code=200)
def health() -> dict:
    """
    Root Get
    """
    health = schemas.Health(
        name=settings.PROJECT_NAME, api_version=__version__, model_version=model_version
    )

    return health.dict()

# Ruta para realizar las predicciones
@api_router.post("/predict", response_model=schemas.PredictionResults, status_code=200)
async def predict(input_data: schemas.StudentFeaturesMultiple) -> Any:
    """
    Prediccion usando el modelo de dropout students
    """

    input_df = pd.DataFrame(input_data.to_feature_rows())
    input_df = prepare_model_input(input_df.replace({np.nan: None}))
    student_ids = [item.student_info.student_id.strip() for item in input_data.inputs]

    logger.info(f"Making prediction on inputs: {input_data.inputs}")
    results = make_prediction(input_data=input_df)

    if results["errors"] is not None:
        logger.warning(f"Prediction validation error: {results.get('errors')}")
        raise HTTPException(status_code=400, detail=json.loads(results["errors"]))

    logger.info(f"Prediction results: {results.get('predictions')}")

    return schemas.PredictionResults.from_inference(
        input_df,
        results,
        student_ids=student_ids,
        api_version=__version__,
    )


@api_router.post("/predict/csv", response_model=schemas.PredictionResults, status_code=200)
async def predict_csv(file: UploadFile = File(...)) -> Any:
    """
    Batch prediction from a CSV file upload.
    The CSV should have the same columns as required by the model (excluding Target if present).
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="File must be a CSV file",
        )

    try:
        contents = await file.read()
        input_df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        logger.warning(f"CSV parse error: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid CSV file: {str(e)}") from e

    if input_df.empty:
        raise HTTPException(status_code=400, detail="CSV file is empty")

    # Drop Target column if present (label column, not for prediction)
    if "Target" in input_df.columns:
        input_df = input_df.drop(columns=["Target"])

    # 1) Normalizar columnas CSV
    normalized_df = normalize_input_columns(input_df.replace({np.nan: None}))

    # 2) Mapear explícitamente CSV -> esquema anidado del request
    records = normalized_df.to_dict(orient="records")
    nested_inputs = []
    for row in records:
        nested_inputs.append(
            {
                "student_info": {k: row.get(k) for k in CSV_STUDENT_INFO_FIELDS},
                "academic_context": {k: row.get(k) for k in CSV_ACADEMIC_CONTEXT_FIELDS},
                "features": {k: row.get(k) for k in CSV_FEATURE_FIELDS},
            }
        )

    try:
        validated_payload = schemas.StudentFeaturesMultiple(inputs=nested_inputs)
    except ValidationError as e:
        logger.warning(f"CSV schema validation error: {e}")
        raise HTTPException(status_code=422, detail=json.loads(e.json())) from e

    # 3) Construir input final del modelo usando solo features
    input_df = pd.DataFrame(validated_payload.to_feature_rows())
    input_df = prepare_model_input(input_df)
    student_ids = [item.student_info.student_id.strip() for item in validated_payload.inputs]

    logger.info(f"Making batch prediction on {len(input_df)} rows from CSV")
    results = make_prediction(input_data=input_df)

    if results["errors"] is not None:
        logger.warning(f"Prediction validation error: {results.get('errors')}")
        raise HTTPException(status_code=400, detail=json.loads(results["errors"]))

    logger.info(f"Batch prediction completed: {len(results.get('predictions', []))} predictions")

    return schemas.PredictionResults.from_inference(
        input_df,
        results,
        student_ids=student_ids,
        api_version=__version__,
    )
