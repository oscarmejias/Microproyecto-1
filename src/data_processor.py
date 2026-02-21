import pandas as pd
from sklearn.model_selection import train_test_split
from imblearn.over_sampling import SMOTE
from src.config import DATA_PATH, TARGET_COL, TARGET_MAPPING

def load_and_prep_data():
    """
    Carga el dataset y convierte la variable objetivo de texto a números.
    """
    print(f"Cargando datos desde: {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    # Mapeamos 'Dropout' -> 0, 'Enrolled' -> 1, 'Graduate' -> 2
    df[TARGET_COL] = df[TARGET_COL].map(TARGET_MAPPING)

    X = df.drop(columns=[TARGET_COL])
    y = df[TARGET_COL]

    return X, y

def get_train_test_split(X, y, test_size=0.2, random_state=42, balance_classes=False):
    """
    Divide los datos en entrenamiento y test. 
    Aplica balanceo de clases con SMOTE si se requiere.
    """
    # Separación de datos
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )
    
    # Aplicar balanceo de clases solo al set de entrenamiento
    if balance_classes:
        print("Aplicando SMOTE para balancear las clases en el set de entrenamiento...")
        smote = SMOTE(random_state=random_state)
        X_train, y_train = smote.fit_resample(X_train, y_train)
        print("Balanceo completado")
        
    return X_train, X_test, y_train, y_test