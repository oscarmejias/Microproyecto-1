"""
Preprocesamiento de datos para predicción.
Replica la lógica de src/data_processor.py para las variables derivadas.
"""

import pandas as pd


def _normalize_column_name(col: str) -> str:
    """Normaliza nombres de columnas como en data_processor.py."""
    return (
        str(col).strip()
        .replace(" ", "_")
        .replace("(", "")
        .replace(")", "")
        .replace("/", "_")
        .replace("'", "")
        .lower()
    )


def _normalize_dataframe_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Normaliza los nombres de las columnas del DataFrame."""
    df = df.copy()
    df.columns = [_normalize_column_name(c) for c in df.columns]
    return df


def normalize_input_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Versión pública de normalización de columnas para validación previa."""
    return _normalize_dataframe_columns(df)


def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Aplica el feature engineering de data_processor.py (líneas 25-28).

    Añade las variables derivadas requeridas por el modelo:
    - total_approved
    - total_enrolled
    - efficiency_ratio
    - grade_trend
    """
    df = df.copy()

    cols_1st_approved = "curricular_units_1st_sem_approved"
    cols_2nd_approved = "curricular_units_2nd_sem_approved"
    cols_1st_enrolled = "curricular_units_1st_sem_enrolled"
    cols_2nd_enrolled = "curricular_units_2nd_sem_enrolled"
    cols_1st_grade = "curricular_units_1st_sem_grade"
    cols_2nd_grade = "curricular_units_2nd_sem_grade"

    required = {
        cols_1st_approved,
        cols_2nd_approved,
        cols_1st_enrolled,
        cols_2nd_enrolled,
        cols_1st_grade,
        cols_2nd_grade,
    }
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Faltan columnas requeridas para el feature engineering: {missing}")

    df["total_approved"] = (
        df[cols_1st_approved].astype(float) + df[cols_2nd_approved].astype(float)
    )
    df["total_enrolled"] = (
        df[cols_1st_enrolled].astype(float) + df[cols_2nd_enrolled].astype(float)
    )
    df["efficiency_ratio"] = df["total_approved"] / (df["total_enrolled"] + 1e-5)
    df["grade_trend"] = (
        df[cols_2nd_grade].astype(float) - df[cols_1st_grade].astype(float)
    )

    return df


def prepare_model_input(df: pd.DataFrame) -> pd.DataFrame:
    """
    Prepara el DataFrame para el modelo: normaliza columnas y añade features derivadas.

    - Normaliza nombres de columnas (spaces, parens, etc.) para coincidir con data_processor
    - Añade total_approved, total_enrolled, efficiency_ratio, grade_trend
    """
    df = _normalize_dataframe_columns(df)
    df = add_engineered_features(df)
    return df
