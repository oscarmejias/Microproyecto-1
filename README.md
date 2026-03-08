# RetentIA: Sistema Inteligente de Alerta Temprana y Retención Estudiantil

RetentIA es un sistema analítico desarrollado para abordar el reto global de la deserción en la educación superior. Utilizando técnicas de Machine Learning sobre datos demográficos, socioeconómicos y académicos, el sistema permite identificar estudiantes en riesgo de abandono para priorizar programas de tutoría y consejería estudiantil para maximizar la retención semestral.

## 📋 Descripción del Proyecto
Este proyecto se basa en el conjunto de datos *Predicting Student Dropout and Academic Success* (Realinho et al, 2022). El dataset abarca registros de 4,424 estudiantes de 17 titulaciones distintas matriculados entre 2008 y 2019.

### Preguntas de Negocio
* ¿A qué estudiantes se debe priorizar en los programas de tutoría académica para maximizar su retención semestral?
* ¿Qué ayudas o políticas pueden implementarse para prevenir la deserción de los grupos más vulnerables? 

## 🏗️ Estructura del Repositorio
El proyecto utiliza **DVC (Data Version Control)** para la gestión de datos pesados y **GitHub** para el control de versiones del código.

* `data/`: Contiene los archivos `.dvc` que trackean el dataset original alojado en AWS S3.
* `notebooks/`: Análisis exploratorio de datos (EDA) y experimentos de modelado.
* `.dvc/`: Archivos de configuración de DVC y conexión al almacenamiento remoto.

## ⚙️ Configuración y Uso

### 1. Clonar el repositorio
```bash
git clone https://github.com/oscarmejias/Microproyecto-1.git
cd Microproyecto-1
```

### 2. Inicializar entorno virtual
```bash
python3 -m venv env-dvc
source env-dvc/bin/activate
pip install -r requirements.txt
pip install "dvc[s3]"
```

### 3. Descargar los datos
Dado que los datos están versionados en DVC, debes ejecutar el siguiente comando para traer el dataset desde el bucket `s3://dropout-students-dvcstore`:

```bash
dvc pull
```

## 🚀 Flujo EC2 (wheel + DVC + Docker)

Este flujo asume que ya tienes credenciales AWS válidas en la instancia (por rol de instancia o variables de entorno).

### Prerrequisitos
```bash
python -m pip install -r requirements.txt
python -m pip install "dvc[s3]" build
docker --version
dvc remote list
```

### 1) Entrenar, exportar, construir wheel y subir artefactos a DVC
```bash
bash scripts/train_and_push_model.sh
```

Este script:
- entrena el modelo,
- exporta el mejor modelo a `prod_model/`,
- construye un wheel instalable con `modelo_final` embebido,
- versiona `prod_model` y el wheel con DVC,
- hace `dvc push` al remoto S3.

### 2) Descargar wheel, instalar modelo y desplegar Docker
```bash
bash scripts/pull_model_and_run_docker.sh
```

Variables opcionales para el script 2:
```bash
WHEEL_PATH=artifacts/wheels/dropout_model_artifact.whl
HOST_PORT=8001
CONTAINER_PORT=8080
IMAGE_NAME=dropout-api:latest
CONTAINER_NAME=dropout-api
```

### 3) Verificar servicio
```bash
curl http://localhost:8001/api/v1/health
```

## 🧪 Prototipo del Sistema
El prototipo funcional se divide en dos módulos estratégicos:

- **Panel General:** Visualización macro de la cohorte con indicadores de riesgo agregado y tendencias por semestre.
- **Evaluación Individual:** Análisis detallado por estudiante que incluye probabilidad de deserción, factores de riesgo específicos y recomendaciones de intervención.

Se puede acceder a las imágenes del prototipo así como a un reporte más detallado del proyecto en este enlace: https://docs.google.com/document/d/1FEfJdqrMyvkhoj2cEnjXqCtpBJSAuf2_6T3xhclMGJs/edit?tab=t.0 

## 👥 Integrantes
- Manuel Estévez-Bretón Ruiz
- Jorge Paternina Montiel
- Ling Lung Zúñiga
- Oscar Mejía Segura
