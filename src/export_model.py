import os
import shutil
import mlflow
from src.predict import get_best_model
from src.config import MLFLOW_TRACKING_URI

def export_best_model_for_api():
    print("Buscando el mejor modelo en el historial de MLflow...")
    _, model_version, run_id = get_best_model()
    
    target_dir = "prod_model"

    if os.path.exists(target_dir):
        shutil.rmtree(target_dir)

    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
    
    print(f"\nDescargando artefactos desde MLflow hacia '{target_dir}/'...")
    
    # Descargar SOLO el modelo (no todos los artefactos)
    mlflow.artifacts.download_artifacts(
        run_id=run_id, 
        artifact_path="modelo_final",
        dst_path=target_dir
    )
    
    # Descargar feature_importance.json por separado
    mlflow.artifacts.download_artifacts(
        run_id=run_id,
        artifact_path="feature_importance.json",
        dst_path=target_dir
    )
    
    print(f"Modelo '{model_version}' (Run ID: {run_id}) exportado.")

if __name__ == "__main__":
    export_best_model_for_api()