"""
Diccionario de reglas de riesgo para evaluación según predicción y datos del estudiante.

Mapea disparadores de negocio con categorías, niveles de riesgo, recomendaciones
y pasos de intervención para tutores.
"""

from typing import Any, Dict, List

try:
    import pandas as pd
except ImportError:
    pd = None

# Mapeo de nombres de columnas del dataset a nombres usados en las reglas
COLUMN_ALIASES = {
    "Tuition fees up to date": "tuition_fees_up_to_date",
    "Scholarship holder": "scholarship_holder",
}

# Diccionario de reglas de riesgo
# Orden de evaluación: primero reglas de alto riesgo, luego medio, luego bajo
RISK_RULES: List[Dict[str, Any]] = [
    {
        "categoria": "Financiero",
        "nivel_riesgo": "Alto",
        "disparador": "Tuition_fees_up_to_date == 0 OR Debtor == 1",
        "eval_func": lambda row, risk_score: (
            row.get("tuition_fees_up_to_date", 1) == 0
            or row.get("debtor",0) == 1
        ),
        "recommendation": "RIESGO FINANCIERO DETECTADO - El estudiante presenta deudas que bloquean su permanencia.",
        "intervention_steps": "Verificar estado de pagos. Informar fecha límite. Remitir a Oficina de Becas.",
    },
    {
        "categoria": "Académico",
        "nivel_riesgo": "Alto",
        "disparador": "efficiency_ratio < 0.5",
        "eval_func": lambda row, risk_score: row.get("efficiency_ratio", 0) < 0.5
        if _has_enrollment_data(row)
        else False,
        "recommendation": "CRISIS ACADÉMICA - El estudiante aprueba menos de la mitad de su carga académica.",
        "intervention_steps": "Cita para análisis de materias. Taller de hábitos de estudio. Evaluar reducción de carga.",
    },
    {
        "categoria": "Rendimiento",
        "nivel_riesgo": "Medio",
        "disparador": "grade_trend < -2",
        "eval_func": lambda row, risk_score: row.get("grade_trend", 0) < -2
        if _has_grade_data(row)
        else False,
        "recommendation": "ALERTA POR CAÍDA DE RENDIMIENTO - Descenso atípico en el promedio semestral.",
        "intervention_steps": "Evaluación de salud mental. Entrevista de factores personales. Mentoría de refuerzo.",
    },
    {
        "categoria": "Socioeconómico",
        "nivel_riesgo": "Medio",
        "disparador": "Scholarship_holder == 0 AND risk_score > 0.4",
        "eval_func": lambda row, risk_score: (
            row.get("scholarship_holder", row.get("Scholarship holder", 1)) == 0
            and (risk_score is not None and risk_score > 0.4)
        ),
        "recommendation": "RIESGO POR FALTA DE APOYO - Estudiante vulnerable sin subsidio institucional.",
        "intervention_steps": "Validar requisitos para becas. Asignar 'Mentor Par'. Evaluar flexibilidad de horario.",
    },
    {
        "categoria": "Bajo Riesgo",
        "nivel_riesgo": "Bajo",
        "disparador": "risk_score < 0.35",
        "eval_func": lambda row, risk_score: (
            risk_score is not None and risk_score < 0.35
        ),
        "recommendation": "SEGUIMIENTO PREVENTIVO - Estudiante con perfil de graduación exitosa.",
        "intervention_steps": "Mensaje de felicitación. Recordar fechas de inscripción. Monitorear notas finales.",
    },
]


def _get_val(row: Dict, *keys: str, default: Any = None) -> Any:
    """Obtiene valor de row usando múltiples posibles nombres de columna."""
    for key in keys:
        if key in row:
            return row[key]
    return default


def _has_enrollment_data(row: Dict) -> bool:
    enrolled_1 = _get_val(row, "curricular_units_1st_sem_enrolled", "Curricular units 1st sem (enrolled)", default=0) or 0
    enrolled_2 = _get_val(row, "curricular_units_2nd_sem_enrolled", "Curricular units 2nd sem (enrolled)", default=0) or 0
    return (enrolled_1 + enrolled_2) > 0


def _has_grade_data(row: Dict) -> bool:
    grade_1 = _get_val(row, "curricular_units_1st_sem_grade", "Curricular units 1st sem (grade)")
    grade_2 = _get_val(row, "curricular_units_2nd_sem_grade", "Curricular units 2nd sem (grade)")
    return grade_1 is not None and grade_2 is not None




def evaluate_risk_rules(
    row: Dict[str, Any],
    risk_score: float,
    *,
    stop_on_first: bool = False,
) -> List[Dict[str, Any]]:
    """
    Evalúa las reglas de riesgo para un estudiante dado sus datos y score de predicción.

    Args:
        row: Diccionario con datos del estudiante (de la fila del CSV/input).
        risk_score: Probabilidad de abandono devuelta por el modelo (0-1).
        stop_on_first: Si True, retorna solo la primera regla que se cumple.

    Returns:
        Lista de reglas que aplican, con categoria, nivel_riesgo, recommendation, intervention_steps.
    """
    # Normalizar row: aceptar tanto dict como objeto con atributos
    if hasattr(row, "to_dict"):
        row = row.to_dict()
    row = dict(row)

    matched: List[Dict[str, Any]] = []
    for rule in RISK_RULES:
        try:
            if rule["eval_func"](row, risk_score):
                matched.append({
                    "categoria": rule["categoria"],
                    "nivel_riesgo": rule["nivel_riesgo"],
                    "recommendation": rule["recommendation"],
                    "intervention_steps": rule["intervention_steps"],
                })
                if stop_on_first:
                    break
        except (KeyError, TypeError, ZeroDivisionError):
            continue

    if not matched and stop_on_first:
        matched = [{
            "categoria": "Sin clasificación específica",
            "nivel_riesgo": "Medio",
            "recommendation": "SEGUIMIENTO RUTINARIO - Evaluar caso según contexto.",
            "intervention_steps": "Revisar historial académico. Monitorear próximas calificaciones. Mantener contacto con el estudiante."
        }]

    return matched


def get_risk_score(pred: Any) -> Any:
    """Extrae la probabilidad de abandono (risk_score) de la predicción."""
    if pred is None:
        return None
    if isinstance(pred, (list, tuple)):
        return float(pred[1]) if len(pred) > 1 else float(pred[0])
    return float(pred)


def build_risk_details_dicts(input_df, predictions: list) -> List[Dict[str, Any]]:
    """
    Evalúa reglas de riesgo por cada fila y su predicción.
    Retorna lista de dicts con detalles de reglas y datos de predicción:
    outcome, risk_score, risk_level y class_probabilities.
    """
    if pd is None or not hasattr(input_df, "iterrows"):
        return []
    risk_details = []
    pred_list = predictions or []
    for i, row in input_df.iterrows():
        pred = pred_list[i] if i < len(pred_list) else None
        risk_score = get_risk_score(pred)
        matched = evaluate_risk_rules(row.to_dict(), risk_score, stop_on_first=True)
        detail = matched[0] if matched else {}
        rounded_risk_score = round(risk_score, 2) if risk_score is not None else None
        rounded_grad_score = round(1.0 - risk_score, 2) if risk_score is not None else None
        detail["risk_level"] = detail.get("nivel_riesgo", "Medio")
        detail["risk_score"] = rounded_risk_score
        detail["outcome"] = (
            "Dropout" if risk_score is not None and risk_score > 0.5 else "Graduate"
        )
        detail["class_probabilities"] = (
            {
                "Graduate": rounded_grad_score,
                "Dropout": rounded_risk_score,
            }
            if risk_score is not None
            else None
        )
        risk_details.append(detail)
    return risk_details
