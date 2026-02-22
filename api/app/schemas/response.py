"""
Modelos de salida usados por la API actual.

La respuesta canónica vive en `predict.py` para evitar duplicidad de contratos.
"""

from .predict import PredictionDetail, PredictionMetadata, PredictionResults

__all__ = ["PredictionResults", "PredictionDetail", "PredictionMetadata"]
