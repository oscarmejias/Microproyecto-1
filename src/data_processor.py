import pandas as pd
from sklearn.model_selection import train_test_split
from src.config import DATA_PATH, TARGET_COL, TARGET_MAPPING, COLS_TO_DROP, API_FEATURES

def load_and_prep_data():
    df = pd.read_csv(DATA_PATH)
    
    # Normalización de nombres
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

    df = df[df[target].isin(['Dropout', 'Graduate'])].copy()
    
    # Feature Engineering: Creamos nuevas variables basadas en las existentes 
    df['total_approved'] = df['curricular_units_1st_sem_approved'] + df['curricular_units_2nd_sem_approved']
    df['total_enrolled'] = df['curricular_units_1st_sem_enrolled'] + df['curricular_units_2nd_sem_enrolled']
    df['efficiency_ratio'] = df['total_approved'] / (df['total_enrolled'] + 1e-5)
    df['grade_trend'] = df['curricular_units_2nd_sem_grade'] - df['curricular_units_1st_sem_grade']

    # Limpieza de Outliers
    df = df.drop(df[(df['total_approved'] == 0) & (df[target] == 'Graduate')].index)

    # Mapeo Binario 
    df[target] = df[target].map(TARGET_MAPPING)

    # Filtrar para que X tenga solo las variables del contrato del API + las calculadas
    engineered_features = ['total_approved', 'total_enrolled', 'efficiency_ratio', 'grade_trend']
    final_features = API_FEATURES + engineered_features
    
    final_features = [f for f in final_features if f in df.columns]
    
    X = df[final_features]
    y = df[target]
    
    return X, y

def get_train_test_split(X, y):
    return train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)