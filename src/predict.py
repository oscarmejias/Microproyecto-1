import pandas as pd
import mlflow.xgboost
import mlflow.sklearn
from src.config import MLFLOW_TRACKING_URI

# Usaremos un modelo por defecto para la carga. Dejamps como default XGBoost
MODEL_PATH = "mlruns/0/.../artifacts/modelo_final" 

def load_model(path=MODEL_PATH, model_type="xgboost"):
    if model_type == "xgboost":
        return mlflow.xgboost.load_model(path)
    return mlflow.sklearn.load_model(path)

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
    if row['Tuition_fees_up_to_date'] == 0 or row['Debtor'] == 1:
        risk_level = "Alto"
        recommendation = "RIESGO FINANCIERO DETECTADO: El estudiante presenta deudas que bloquean su permanencia."
        steps = ["1. Verificar estado de pagos.", "2. Informar fecha límite.", "3. Remitir a Oficina de Becas."]
        features_impact.append({
            "feature": "Tuition_fees_up_to_date / Debtor",
            "value": int(row['Tuition_fees_up_to_date']),
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
    elif row['Scholarship_holder'] == 0 and risk_score > 0.4:
        if risk_level == "Bajo": # Solo sobreescribe si no hay un riesgo mayor previo
            risk_level = "Medio"
            recommendation = "RIESGO POR FALTA DE APOYO: Estudiante vulnerable sin subsidio institucional."
            steps = ["1. Validar requisitos para becas.", "2. Asignar 'Mentor Par'.", "3. Evaluar flexibilidad de horario."]
        features_impact.append({
            "feature": "Scholarship_holder",
            "value": int(row['Scholarship_holder']),
            "impact": "Soporte: Ausencia de beca combinada con probabilidad de riesgo elevada."
        })

    return risk_level, recommendation, steps, features_impact


def predict_student_risk(student_data: dict, model):
    """
    Calcula el riesgo y construye el payload casi final para el API.
    """
    df = pd.DataFrame([student_data])

    # Ingeniería de Variables (Debe ser idéntica al entrenamiento)
    df['total_approved'] = df['curricular_units_1st_sem_approved'] + df['curricular_units_2nd_sem_approved']
    df['total_enrolled'] = df['curricular_units_1st_sem_enrolled'] + df['curricular_units_2nd_sem_enrolled']
    df['efficiency_ratio'] = df['total_approved'] / (df['total_enrolled'] + 1e-5)
    df['grade_trend'] = df['curricular_units_2nd_sem_grade'] - df['curricular_units_1st_sem_grade']

    # Inferencia
    risk_score = float(model.predict_proba(df)[0][1])
    grad_score = 1.0 - risk_score

    # Aplicar Lógica de Negocio
    risk_level, recommendation, steps, features_impact = generate_intervention_logic(df, risk_score)

    # Estructuramos la respuesta principal de la predicción
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