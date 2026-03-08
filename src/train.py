import mlflow
import mlflow.xgboost
import mlflow.sklearn
import json
import pandas as pd

from xgboost import XGBClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GridSearchCV
from sklearn.metrics import f1_score, roc_auc_score
from sklearn.utils.class_weight import compute_sample_weight
from mlflow.tracking import MlflowClient

from src.config import (
    XGB_BASE_PARAMS, XGB_PARAM_GRID,
    RF_BASE_PARAMS, RF_PARAM_GRID,
    MLFLOW_EXPERIMENT_NAME, MLFLOW_TRACKING_URI
)
from src.data_processor import load_and_prep_data, get_train_test_split
from src.feature_importance import save_feature_importance_artifacts


def train_and_log_top_experiments(model_name="xgboost", top_n=6):
    """
    Ejecuta GridSearchCV, selecciona los top_n mejores resultados por CV,
    los reentrena, evalúa en test set, y loggea cada uno como un run 
    independiente en MLflow. Al final marca al campeón (mejor AUC en test).
    
    COMPATIBILIDAD: predict.py busca por metrics.auc_score DESC,
    así que seguirá encontrando al campeón automáticamente.
    """
    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
    mlflow.set_experiment(MLFLOW_EXPERIMENT_NAME)
    client = MlflowClient()

    # Datos
    X, y = load_and_prep_data()
    X_train, X_test, y_train, y_test = get_train_test_split(X, y)

    # Configuración según modelo
    if model_name == "xgboost":
        estimator = XGBClassifier(**XGB_BASE_PARAMS)
        param_grid = XGB_PARAM_GRID
        weights = compute_sample_weight(class_weight='balanced', y=y_train)
        fit_params = {'sample_weight': weights}
    elif model_name == "random_forest":
        estimator = RandomForestClassifier(**RF_BASE_PARAMS)
        param_grid = RF_PARAM_GRID
        fit_params = {}
    else:
        raise ValueError("Modelo no soportado. Usa 'xgboost' o 'random_forest'.")

    print(f"\n🔍 Ejecutando GridSearchCV exhaustivo para {model_name}...")

    grid = GridSearchCV(estimator, param_grid, cv=3, scoring='f1', n_jobs=-1)
    grid.fit(X_train, y_train, **fit_params)

    # Extraer los Top N resultados del GridSearch
    results_df = pd.DataFrame(grid.cv_results_)
    top_results = results_df.sort_values(by='rank_test_score').head(top_n)

    print(f"✅ Búsqueda finalizada. Evaluando el Top {top_n} en el Set de Prueba...")

    best_test_auc = 0
    best_run_id = None

    for i, (_, row) in enumerate(top_results.iterrows()):
        params = row['params']
        run_name = f"{model_name}_CV_Rank_{i+1}"

        with mlflow.start_run(run_name=run_name) as run:
            # Reentrenar con los hiperparámetros específicos de este candidato
            if model_name == "xgboost":
                model = XGBClassifier(**XGB_BASE_PARAMS, **params)
                model.fit(X_train, y_train, sample_weight=weights)
            else:
                model = RandomForestClassifier(**RF_BASE_PARAMS, **params)
                model.fit(X_train, y_train)

            # Evaluar en el conjunto de test
            y_pred = model.predict(X_test)
            f1 = f1_score(y_test, y_pred)
            auc = roc_auc_score(y_test, model.predict_proba(X_test)[:, 1])

            print(f"  [{run_name}] F1_Test: {f1:.4f} | AUC: {auc:.4f} | Params: {params}")

            # Loggear parámetros y métricas
            mlflow.log_params(params)
            mlflow.log_metric("f1_score", f1)
            mlflow.log_metric("auc_score", auc)
            mlflow.log_metric("cv_mean_f1", row['mean_test_score'])

            # Loggear modelo (mismo nombre de artefacto que el original)
            if model_name == "xgboost":
                mlflow.xgboost.log_model(model, "modelo_final")
            else:
                mlflow.sklearn.log_model(model, "modelo_final")

            # Loggear feature importance
            json_path = save_feature_importance_artifacts(model, X.columns)
            mlflow.log_artifact(json_path)

            # Rastrear cuál tiene el mejor AUC en test
            if auc > best_test_auc:
                best_test_auc = auc
                best_run_id = run.info.run_id

    # Marcar al campeón
    if best_run_id:
        print(f"\n🏆 Campeón para {model_name} (AUC Test: {best_test_auc:.4f})")
        client.set_tag(best_run_id, "Campeon", "True")


# ==========================================
# Función original preservada (opcional)
# ==========================================
def train_model(model_name="xgboost"):
    """
    Función original que solo loggea el mejor modelo del GridSearch.
    Se preserva por retrocompatibilidad pero ya no se usa en __main__.
    """
    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
    mlflow.set_experiment(MLFLOW_EXPERIMENT_NAME)

    X, y = load_and_prep_data()
    X_train, X_test, y_train, y_test = get_train_test_split(X, y)

    if model_name == "xgboost":
        estimator = XGBClassifier(**XGB_BASE_PARAMS)
        param_grid = XGB_PARAM_GRID
        run_name = "XGB_Binary_Optimization"
    elif model_name == "random_forest":
        estimator = RandomForestClassifier(**RF_BASE_PARAMS)
        param_grid = RF_PARAM_GRID
        run_name = "RF_Binary_Optimization"
    else:
        raise ValueError("Modelo no soportado.")

    with mlflow.start_run(run_name=run_name):
        grid = GridSearchCV(estimator, param_grid, cv=3, scoring='f1', n_jobs=-1)

        if model_name == "xgboost":
            weights = compute_sample_weight(class_weight='balanced', y=y_train)
            grid.fit(X_train, y_train, sample_weight=weights)
        else:
            grid.fit(X_train, y_train)

        best_model = grid.best_estimator_
        y_pred = best_model.predict(X_test)
        f1 = f1_score(y_test, y_pred)
        auc = roc_auc_score(y_test, best_model.predict_proba(X_test)[:, 1])

        mlflow.log_params(grid.best_params_)
        mlflow.log_metric("f1_score", f1)
        mlflow.log_metric("auc_score", auc)

        if model_name == "xgboost":
            mlflow.xgboost.log_model(best_model, "modelo_final")
        else:
            mlflow.sklearn.log_model(best_model, "modelo_final")

        json_path = save_feature_importance_artifacts(best_model, X.columns)
        mlflow.log_artifact(json_path)

        print(f"[{run_name}] F1: {f1:.4f} | AUC: {auc:.4f}")


if __name__ == "__main__":
    # Nueva lógica: loggea los Top 6 de cada modelo
    train_and_log_top_experiments("xgboost", top_n=6)
    train_and_log_top_experiments("random_forest", top_n=6)