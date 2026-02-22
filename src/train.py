import mlflow
import mlflow.xgboost
import mlflow.sklearn # Para Random Forest
import json

from xgboost import XGBClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GridSearchCV
from sklearn.metrics import accuracy_score, recall_score, f1_score, roc_auc_score
from sklearn.utils.class_weight import compute_sample_weight

# Importamos las configuraciones de ambos modelos
from src.config import (
    XGB_BASE_PARAMS, XGB_PARAM_GRID,
    RF_BASE_PARAMS, RF_PARAM_GRID,
    MLFLOW_EXPERIMENT_NAME, MLFLOW_TRACKING_URI
)
from src.data_processor import load_and_prep_data, get_train_test_split
from src.feature_importance import save_feature_importance_artifacts

def train_model(model_name="xgboost"):
    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
    mlflow.set_experiment(MLFLOW_EXPERIMENT_NAME)

    # Datos
    X, y = load_and_prep_data()
    X_train, X_test, y_train, y_test = get_train_test_split(X, y)

    # Selección de Modelo y Configuración
    if model_name == "xgboost":
        estimator = XGBClassifier(**XGB_BASE_PARAMS)
        param_grid = XGB_PARAM_GRID
        run_name = "XGB_Binary_Optimization"
    elif model_name == "random_forest":
        estimator = RandomForestClassifier(**RF_BASE_PARAMS)
        param_grid = RF_PARAM_GRID
        run_name = "RF_Binary_Optimization"
    else:
        raise ValueError("Modelo no soportado. Usa 'xgboost' o 'random_forest'.")

    with mlflow.start_run(run_name=run_name):
        print(f"\nBuscando hiperparámetros óptimos para {model_name}...")

        # Grid Search
        grid = GridSearchCV(estimator, param_grid, cv=3, scoring='f1', n_jobs=-1)

        # Manejo del desbalance de clases según el modelo
        if model_name == "xgboost":
            weights = compute_sample_weight(class_weight='balanced', y=y_train)
            grid.fit(X_train, y_train, sample_weight=weights)
        else:
            grid.fit(X_train, y_train)

        best_model = grid.best_estimator_

        # Evaluación
        y_pred = best_model.predict(X_test)
        f1 = f1_score(y_test, y_pred)
        auc = roc_auc_score(y_test, best_model.predict_proba(X_test)[:, 1])

        print(f"--- RESULTADOS {model_name.upper()} ---")
        print(f"F1-Score: {f1:.4f}")
        print(f"AUC (Riesgo): {auc:.4f}")

        # MLflow Logs
        mlflow.log_params(grid.best_params_)
        mlflow.log_metric("f1_score", f1)
        mlflow.log_metric("auc_score", auc)

        if model_name == "xgboost":
            mlflow.xgboost.log_model(best_model, "modelo_final")
        else:
            mlflow.sklearn.log_model(best_model, "modelo_final")

        # Artefactos para el Frontend
        json_path = save_feature_importance_artifacts(best_model, X.columns)
        mlflow.log_artifact(json_path)

        with open(json_path, 'r') as f:
            top_3 = json.load(f)[:3]

        print("\nTOP 3 PREDICTORES DE DESERCIÓN:")
        for i, item in enumerate(top_3):
            print(f"  {i+1}). {item['feature']} ({item['importance']:.4f})")

if __name__ == "__main__":
    # Al ejecutar el script, entrenaremos y compararemos ambos modelos en MLflow
    train_model("xgboost")
    train_model("random_forest")