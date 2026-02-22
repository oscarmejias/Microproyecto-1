import pandas as pd
import json
import mlflow

def format_feature_name(name: str) -> str:
    """
    Formatea 'curricular_units_1st_sem_grade' a 'Curricular Units 1st Sem Grade' 
    para que se vea elegante en el dashboard.
    """
    return name.replace('_', ' ').title()

def get_feature_importance_data(model, feature_names):
    """
    Extrae la importancia de las variables y las devuelve como una lista de diccionarios.
    """
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
    else:
        importances = [0.0] * len(feature_names) 

    df_importance = pd.DataFrame({
        'feature': feature_names,
        'importance': importances
    }).sort_values(by='importance', ascending=False)
    
    df_importance['feature_formatted'] = df_importance['feature'].apply(format_feature_name)
    importance_list = df_importance.to_dict(orient='records')
    
    return importance_list, df_importance

def save_feature_importance_artifacts(model, feature_names):
    """
    Genera y guarda el artefacto JSON para MLflow y el Frontend.
    (Se eliminó la generación de imágenes para optimizar el despliegue).
    """
    importance_list, _ = get_feature_importance_data(model, feature_names)
    
    json_path = "feature_importance.json"
    with open(json_path, "w") as f:
        json.dump(importance_list, f, indent=4)
    
    return json_path