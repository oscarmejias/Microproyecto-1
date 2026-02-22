import mlflow
import mlflow.xgboost
import json
from xgboost import XGBClassifier
from sklearn.model_selection import GridSearchCV
from sklearn.metrics import accuracy_score, recall_score, f1_score, roc_auc_score
from sklearn.utils.class_weight import compute_sample_weight
from src.config import XGB_BASE_PARAMS, XGB_PARAM_GRID, MLFLOW_EXPERIMENT_NAME, MLFLOW_TRACKING_URI
from src.data_processor import load_and_prep_data, get_train_test_split
from src.feature_importance import save_feature_importance_artifacts 

def train_best_binary_model():
    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
    mlflow.set_experiment(MLFLOW_EXPERIMENT_NAME)

    with mlflow.start_run(run_name="XGB_Binary_Optimization"):
        # 1. Datos
        X, y = load_and_prep_data()
        X_train, X_test, y_train, y_test = get_train_test_split(X, y)
        
        # 2. Pesos de clase para manejar el desbalance
        weights = compute_sample_weight(class_weight='balanced', y=y_train)
        
        # 3. Grid Search
        print("Buscando hiperparámetros óptimos en modo BINARIO...")
        xgb = XGBClassifier(**XGB_BASE_PARAMS)
        grid = GridSearchCV(xgb, XGB_PARAM_GRID, cv=3, scoring='f1', n_jobs=-1)
        grid.fit(X_train, y_train, sample_weight=weights)
        
        best_model = grid.best_estimator_
        
        # 4. Evaluación
        y_pred = best_model.predict(X_test)
        f1 = f1_score(y_test, y_pred)
        auc = roc_auc_score(y_test, best_model.predict_proba(X_test)[:, 1])
        
        print(f"--- RESULTADOS ---")
        print(f"F1-Score: {f1:.4f}")
        print(f"AUC (Riesgo): {auc:.4f}")

        # 5. MLflow Logs
        mlflow.log_params(grid.best_params_)
        mlflow.log_metric("f1_score", f1)
        mlflow.log_metric("auc_score", auc)
        mlflow.xgboost.log_model(best_model, "modelo_final_binario")
        
        # 6. Artefactos para el Frontend
        json_path, img_path = save_feature_importance_artifacts(best_model, X.columns)
        mlflow.log_artifact(json_path)
        mlflow.log_artifact(img_path)
        
        with open(json_path, 'r') as f:
            top_3 = json.load(f)[:3]
            print("\nTOP 3 PREDICTORES DE DESERCIÓN:")
            for i, item in enumerate(top_3):
                print(f"{i+1}. {item['feature']} ({item['importance']:.4f})")

if __name__ == "__main__":
    train_best_binary_model()