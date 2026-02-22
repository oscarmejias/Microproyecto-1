import sys
import types
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from pydantic import BaseModel


# Mock del paquete `model` para evitar cargar el wheel real en tests unitarios.
mock_model = types.ModuleType("model")
mock_model.__version__ = "test-model-version"

mock_model_predict = types.ModuleType("model.predict")


def _dummy_make_prediction(*_args, **_kwargs):
    return {"errors": None, "version": "test-version", "predictions": [0.5]}


mock_model_predict.make_prediction = _dummy_make_prediction

mock_model_processing = types.ModuleType("model.processing")
mock_model_processing_validation = types.ModuleType("model.processing.validation")


class DataInputSchema(BaseModel):
    class Config:
        extra = "allow"


mock_model_processing_validation.DataInputSchema = DataInputSchema

sys.modules["model"] = mock_model
sys.modules["model.predict"] = mock_model_predict
sys.modules["model.processing"] = mock_model_processing
sys.modules["model.processing.validation"] = mock_model_processing_validation

# Mock de `app.config` para evitar dependencia de BaseSettings (pydantic v2).
mock_app_config = types.ModuleType("app.config")


class _Settings:
    PROJECT_NAME = "Dropout Students API"
    API_V1_STR = "/api/v1"
    BACKEND_CORS_ORIGINS = []


def _setup_app_logging(*_args, **_kwargs):
    return None


mock_app_config.settings = _Settings()
mock_app_config.setup_app_logging = _setup_app_logging
sys.modules["app.config"] = mock_app_config

from app.main import app

# Cliente de prueba
@pytest.fixture()
def client() -> Generator:
    with TestClient(app) as _client:
        yield _client
        app.dependency_overrides = {}
