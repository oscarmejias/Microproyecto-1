import mlflow
import mlflow.xgboost
from xgboost import XGBClassifier
from sklearn.metrics import classification_report, accuracy_score, recall_score, f1_score
from src.config import XGB_BASE_PARAMS, MLFLOW_EXPERIMENT_NAME
from src.data_processor import load_and_prep_data, get_train_test_split

def train_and_evaluate(balance_classes=False):
    """
    Entrena el modelo XGBoost y registra los resultados en MLflow.
    """
    # Configurar MLflow
    mlflow.set_experiment(MLFLOW_EXPERIMENT_NAME)
    
    # Nombre de la ejecución
    run_name = "XGBoost_con_SMOTE" if balance_classes else "XGBoost_Base"
    
    with mlflow.start_run(run_name=run_name):
        print(f"\nIniciando experimento: {run_name}")
        
        # Cargar y preparar datos
        X, y = load_and_prep_data()
        X_train, X_test, y_train, y_test = get_train_test_split(
            X, y, balance_classes=balance_classes
        )
        
        # Entrenar el modelo
        print("Entrenando XGBoost...")
        model = XGBClassifier(**XGB_BASE_PARAMS)
        model.fit(X_train, y_train)
        
        # Predicciones
        y_pred = model.predict(X_test)
        
        # Calcular métricas de Recall y F1-score para cada clase
        acc = accuracy_score(y_test, y_pred)
        recall = recall_score(y_test, y_pred, average='macro')
        f1 = f1_score(y_test, y_pred, average='macro')
        
        print(f"Accuracy: {acc:.4f}")
        print(f"Macro Recall: {recall:.4f}")
        print(f"Macro F1-Score: {f1:.4f}")
        
        # Registrar en MLflow
        # Guardamos los parámetros, las métricas y el modelo empaquetado
        mlflow.log_params(XGB_BASE_PARAMS)
        mlflow.log_param("balanced_classes", balance_classes)
        mlflow.log_metric("accuracy", acc)
        mlflow.log_metric("recall_macro", recall)
        mlflow.log_metric("f1_macro", f1)
        
        # Guardamos el modelo con su firma (input/output) para el API
        mlflow.xgboost.log_model(model, "modelo_xgboost")
        
        print("Experimento registrado exitosamente en MLflow")

if __name__ == "__main__":
    # Al ejecutar este script, correremos ambos experimentos de una vez
    train_and_evaluate(balance_classes=False)
    train_and_evaluate(balance_classes=True)