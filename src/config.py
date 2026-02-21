import os
from pathlib import Path

# Rutas del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "dropout_students.csv" 

# Configuración de MLflow
MLFLOW_EXPERIMENT_NAME = "retencion_estudiantil_xgb"

# Mapeo de la variable objetivo (Target)
TARGET_COL = "Target"
TARGET_MAPPING = {
    "Dropout": 0,
    "Enrolled": 1,
    "Graduate": 2
}

# Parámetros base para XGBoost
XGB_BASE_PARAMS = {
    "objective": "multi:softprob", # Indica que queremos predecir probabilidades para múltiples clases
    "num_class": 3,                # Clases: Dropout, Enrolled, Graduate
    "max_depth": 5,                # Profundidad máxima de los árboles
    "learning_rate": 0.1,          
    "n_estimators": 100,           
    "eval_metric": "mlogloss",     # Métrica para evaluar el error en problemas multiclase
    "random_state": 42             # Reproducibilidad de resultados 
}