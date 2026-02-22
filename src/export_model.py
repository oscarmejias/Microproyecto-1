import os
import shutil
import mlflow
from src.predict import get_best_model
from src.config import MLFLOW_TRACKING_URI

def export_best_model_for_api():
    """
    Extrae el mejor modelo de la carpeta de experimentos usando la API nativa de MLflow
    y lo copia a una carpeta estática 'prod_model' para que el API lo consuma fácilmente.
    """
    print("Buscando el mejor modelo en el historial de MLflow...")
    _, model_version, run_id = get_best_model()
    
    target_dir = "prod_model"

    # Si ya existe un modelo anterior en producción, lo borramos
    if os.path.exists(target_dir):
        shutil.rmtree(target_dir)

    # Configuramos el URI de tracking
    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
    
    # Usamos el URI dinámico del artefacto 
    artifact_uri = f"runs:/{run_id}/modelo_final"
    
    print(f"\nDescargando artefactos desde MLflow ({artifact_uri}) hacia '{target_dir}/'...")
    
    # MLflow se encarga de buscar la ruta real y copiar los archivos
    mlflow.artifacts.download_artifacts(run_id=run_id, dst_path=target_dir)
    
    print(f"Modelo '{model_version}' (Run ID: {run_id}) exportado.")

if __name__ == "__main__":
    export_best_model_for_api()