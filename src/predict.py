import pandas as pd
import mlflow
import mlflow.xgboost
import mlflow.sklearn
from src.config import MLFLOW_TRACKING_URI, MLFLOW_EXPERIMENT_NAME

def get_best_model():
    """
    Busca dinámicamente en MLflow el modelo con el mejor AUC,
    identifica su tipo (XGBoost o Random Forest) y lo carga.
    """
    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
    
    # 1. Obtener el ID del experimento
    experiment = mlflow.get_experiment_by_name(MLFLOW_EXPERIMENT_NAME)
    if not experiment:
        raise ValueError(f"No se encontró el experimento: {MLFLOW_EXPERIMENT_NAME}")
        
    # 2. Buscar y ordenar los runs por AUC descendente
    runs = mlflow.search_runs(
        experiment_ids=[experiment.experiment_id],
        order_by=["metrics.auc_score DESC"],
        max_results=1 # Solo nos interesa el #1
    )
    
    if runs.empty:
        raise ValueError("No hay modelos entrenados en este experimento.")
        
    # 3. Extraer metadata del mejor run
    best_run = runs.iloc[0]
    run_id = best_run.run_id
    run_name = best_run["tags.mlflow.runName"] 
    best_auc = best_run["metrics.auc_score"]
    
    model_uri = f"runs:/{run_id}/modelo_final"
    
    # 4. Cargar dinámicamente según el sabor del modelo
    print(f"Cargando el mejor modelo: {run_name} (AUC: {best_auc:.4f})")
    
    if "XGB" in run_name:
        model = mlflow.xgboost.load_model(model_uri)
        model_version = "xgboost"
    else:
        model = mlflow.sklearn.load_model(model_uri)
        model_version = "random_forest"
        
    return model, model_version, run_id


def generate_intervention_logic(student_df, risk_score):
    """
    Evalúa las reglas de negocio del documento de Lógica de Intervención 
    para generar las recomendaciones específicas por estudiante.
    """
    row = student_df.iloc[0]
    features_impact = []
    recommendation = "SEGUIMIENTO PREVENTIVO: Estudiante con perfil de graduación exitosa."
    steps = [
        "1. Mensaje de felicitación",
        "2. Recordar fechas de inscripción.",
        "3. Monitorear notas finales."
    ]
    risk_level = "Bajo"

    # Lógica 1: Riesgo Financiero
    if row['tuition_fees_up_to_date'] == 0 or row['debtor'] == 1:
        risk_level = "Alto"
        recommendation = "RIESGO FINANCIERO DETECTADO: El estudiante presenta deudas que bloquean su permanencia."
        steps = ["1. Verificar estado de pagos.", "2. Informar fecha límite.", "3. Remitir a Oficina de Becas."]
        features_impact.append({
            "feature": "tuition_fees_up_to_date / debtor",
            "value": int(row['tuition_fees_up_to_date']),
            "impact": "Crítico: El estudiante presenta deudas que bloquean su permanencia."
        })

    # Lógica 2: Riesgo Académico (Eficacia)
    elif row['efficiency_ratio'] < 0.5:
        risk_level = "Alto"
        recommendation = "CRISIS ACADÉMICA: El estudiante aprueba menos de la mitad de su carga académica."
        steps = ["1. Cita para análisis de materias.", "2. Taller de hábitos de estudio.", "3. Evaluar reducción de carga."]
        features_impact.append({
            "feature": "efficiency_ratio",
            "value": round(float(row['efficiency_ratio']), 2),
            "impact": "Eficacia: Solo se aprueba un bajo porcentaje de las unidades, aumentando la vulnerabilidad."
        })

    # Lógica 3: Rendimiento (Tendencia)
    elif row.get('grade_trend', 0) < -2:
        risk_level = "Medio"
        recommendation = "ALERTA POR CAÍDA DE RENDIMIENTO: Descenso atípico en el promedio semestral."
        steps = ["1. Evaluación de salud mental.", "2. Entrevista de factores personales.", "3. Mentoría de refuerzo."]
        features_impact.append({
            "feature": "grade_trend",
            "value": round(float(row['grade_trend']), 2),
            "impact": "Tendencia: Caída significativa en las notas respecto al semestre anterior."
        })

    # Lógica 4: Socioeconómico
    elif row['scholarship_holder'] == 0 and risk_score > 0.4:
        if risk_level == "Bajo": 
            risk_level = "Medio"
            recommendation = "RIESGO POR FALTA DE APOYO: Estudiante vulnerable sin subsidio institucional."
            steps = ["1. Validar requisitos para becas.", "2. Asignar 'Mentor Par'.", "3. Evaluar flexibilidad de horario."]
        features_impact.append({
            "feature": "scholarship_holder",
            "value": int(row['scholarship_holder']),
            "impact": "Soporte: Ausencia de beca combinada con probabilidad de riesgo elevada."
        })

    return risk_level, recommendation, steps, features_impact


def predict_student_risk(student_data: dict, model):
    """
    Calcula el riesgo y construye el payload casi final para el API.
    """
    df = pd.DataFrame([student_data])

    # Ingeniería de Variables
    df['total_approved'] = df['curricular_units_1st_sem_approved'] + df['curricular_units_2nd_sem_approved']
    df['total_enrolled'] = df['curricular_units_1st_sem_enrolled'] + df['curricular_units_2nd_sem_enrolled']
    df['efficiency_ratio'] = df['total_approved'] / (df['total_enrolled'] + 1e-5)
    df['grade_trend'] = df['curricular_units_2nd_sem_grade'] - df['curricular_units_1st_sem_grade']

    # Inferencia
    risk_score = float(model.predict_proba(df)[0][1])
    grad_score = 1.0 - risk_score

    # Aplicar Lógica de Negocio
    risk_level, recommendation, steps, features_impact = generate_intervention_logic(df, risk_score)

    # Respuesta estructurada
    prediction_result = {
        "outcome": "Dropout" if risk_score > 0.5 else "Graduate",
        "risk_score": round(risk_score, 2),
        "risk_level": risk_level,
        "class_probabilities": {
            "Graduate": round(grad_score, 2),
            "Dropout": round(risk_score, 2)
        },
        "feature_importance": features_impact,
        "recommendation": recommendation,
        "intervention_steps": steps
    }
    
    return prediction_result


# ==========================================
# BLOQUE DE PRUEBA LOCAL
# ==========================================
if __name__ == "__main__":
    import json

    print("Buscando el mejor modelo en MLflow...")
    modelo_cargado, tipo_modelo, run_id = get_best_model()

    # Data dummy 
    dummy_request = {
        "student_info": {
            "student_id": "ST-2024-001"
        },
        "academic_context": {
            "semester": 4,
            "batch_id": "2026-01-MAIA"
        },
        "features": {
            "age_at_enrollment": 19,
            "gender": 1,
            "displaced": 0,
            "debtor": 0,
            "tuition_fees_up_to_date": 1,
            "scholarship_holder": 1,
            "curricular_units_1st_sem_enrolled": 6,
            "curricular_units_1st_sem_approved": 6,
            "curricular_units_1st_sem_grade": 14.5,
            "curricular_units_2nd_sem_enrolled": 6,
            "curricular_units_2nd_sem_approved": 6,
            "curricular_units_2nd_sem_grade": 15.0
        }
    }

    print("Generando predicción...\n")
    resultado = predict_student_risk(dummy_request["features"], modelo_cargado)
    
    print("--- RESPUESTA DE INFERENCIA GENERADA ---")
    print(json.dumps(resultado, indent=2, ensure_ascii=False))