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

## 🧪 Prototipo del Sistema
El prototipo funcional se divide en dos módulos estratégicos:

- **Panel General:** Visualización macro de la cohorte con indicadores de riesgo agregado y tendencias por semestre.
- **Evaluación Individual:** Análisis detallado por estudiante que incluye probabilidad de deserción, factores de riesgo específicos y recomendaciones de intervención.

## 👥 Integrantes
- Manuel Estévez-Bretón Ruiz
- Jorge Paternina Montiel
- Ling Lung Zúñiga
- Oscar Mejía Segura