import pandas as pd
from sklearn.model_selection import train_test_split
from src.config import DATA_PATH, TARGET_COL, TARGET_MAPPING, COLS_TO_DROP

def load_and_prep_data():
    df = pd.read_csv(DATA_PATH)
    
    # Normalización de nombres de columnas para evitar problemas de acceso
    df.columns = [
        col.replace(' ', '_')
           .replace('(', '')
           .replace(')', '')
           .replace('/', '_')
           .replace("'", "")
           .lower()  
        for col in df.columns
    ]

    target = TARGET_COL.lower()
    cols_to_drop_lower = [col.lower() for col in COLS_TO_DROP]

    # Entrenamos solo con la historia de los que ya terminaron su proceso (Dropout o Graduate)
    df = df[df[target].isin(['Dropout', 'Graduate'])].copy()
    
    # Feature Engineering: Agregamos nuevas variables basadas en la información disponible
    df['total_approved'] = df['curricular_units_1st_sem_approved'] + df['curricular_units_2nd_sem_approved']
    df['total_enrolled'] = df['curricular_units_1st_sem_enrolled'] + df['curricular_units_2nd_sem_enrolled']
    df['efficiency_ratio'] = df['total_approved'] / (df['total_enrolled'] + 1e-5)
    
    # Métrica de Tendencia: ¿mejoró o empeoró sus notas?
    df['grade_trend'] = df['curricular_units_2nd_sem_grade'] - df['curricular_units_1st_sem_grade']

    # Limpieza de Outliers
    df = df.drop(df[(df['total_approved'] == 0) & (df[target] == 'Graduate')].index)

    # Eliminar columnas ruidosas
    df = df.drop(columns=[col for col in cols_to_drop_lower if col in df.columns])
    
    # Mapeo Binario
    df[target] = df[target].map(TARGET_MAPPING)
    
    X = df.drop(columns=[target])
    y = df[target]
    
    return X, y

def get_train_test_split(X, y):
    return train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)