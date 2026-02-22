import os
from pathlib import Path

# Rutas
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "dropout_students.csv"

# MLflow
MLFLOW_TRACKING_URI = str(BASE_DIR / "mlruns")
MLFLOW_EXPERIMENT_NAME = "retencion_estudiantil_binary"

# Target (0: Éxito, 1: Riesgo)
TARGET_COL = "Target"
TARGET_MAPPING = {
    "Dropout": 1,
    "Graduate": 0
}

# Columnas a eliminar (Ruido detectado en el EDA)
COLS_TO_DROP = [
    'Nacionality', 'International', 'Educational_special_needs',
    'Unemployment_rate', 'Inflation_rate', 'GDP'
]

API_FEATURES = [
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
    "curricular_units_2nd_sem_grade"
]

# Configuraciones de Modelos

# XGBoost
XGB_BASE_PARAMS = {
    "objective": "binary:logistic",
    "random_state": 42,
    "eval_metric": "auc"
}

XGB_PARAM_GRID = {
    'max_depth': [4, 6, 8],
    'learning_rate': [0.01, 0.05, 0.1],
    'n_estimators': [200, 400],
    'gamma': [0, 0.1],
    'subsample': [0.8],
    'colsample_bytree': [0.8]
}

# Random Forest
RF_BASE_PARAMS = {
    "random_state": 42,
    "class_weight": "balanced"
}

RF_PARAM_GRID = {
    'n_estimators': [100, 200, 300],
    'max_depth': [None, 10, 20],
    'min_samples_split': [2, 5, 10],
    'min_samples_leaf': [1, 2, 4]
}