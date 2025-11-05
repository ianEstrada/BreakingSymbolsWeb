# 🤟 Intérprete de Lenguaje de Señas con IA

¡Bienvenido! Este es un proyecto de aplicación web diseñado para actuar como un puente de comunicación, reconociendo las señas del abecedario en tiempo real. Utiliza la visión por computadora y un modelo de IA para interpretar la pose de la mano del usuario y predecir la letra correspondiente.

El objetivo es crear una herramienta educativa, accesible y amigable que facilite el aprendizaje y la práctica del lenguaje de señas.

## ✨ Características Principales

* 📹 **Reconocimiento en Tiempo Real:** Captura video desde la cámara web del usuario.
* 🖐️ **Detección de Manos (Frontend):** Utiliza **MediaPipe.js** en el navegador para extraer 21 puntos clave (landmarks) de la mano de forma eficiente.
* 🧠 **Predicción con IA (Backend):** Un backend robusto de **Django** recibe los landmarks y los procesa con un modelo de Machine Learning (SVM) para predecir la letra.
* 🖥️ **Interfaz Amigable:** Una UI limpia (HTML/CSS) que muestra la cámara, los puntos de referencia y la predicción de forma clara y esperanzadora.

## 🛠️ Tecnologías Utilizadas

* **Backend:** 🐍 Python, 💚 Django, 🤖 scikit-learn
* **Frontend:** 🌐 HTML5, 🎨 CSS3, 💛 JavaScript (ES6+)
* **Procesamiento de Visión:** ✨ MediaPipe.js (¡La detección de manos se ejecuta 100% en el navegador del cliente!)
* **Servidor de Desarrollo:** 📦 Gunicorn

## 📋 Requisitos Previos

Antes de empezar, necesitarás tener lo siguiente:

1.  **Python 3.8+** instalado en tu sistema.
2.  **Git** para clonar el repositorio.
3.  El archivo del modelo de IA: `modelo_ia_senas.pkl`.
    > **IMPORTANTE:** Este archivo no suele (¡y no debe!) ser subido a Git. Asegúrate de tener tu archivo `.pkl` entrenado listo.

## 🚀 Instalación y Ejecución Local

Esta guía te ayudará a ejecutar el proyecto en tu máquina local para desarrollo y pruebas.

### 1. Clonar el Repositorio

Abre tu terminal y clona este proyecto:

```bash
git clone https://github.com/ianEstrada/BreakingSymbolsWeb.git
cd BreakingSymbols

```

### 2. Crear un Entorno Virtual
Es una buena práctica usar un entorno virtual para aislar las dependencias de tu proyecto.

```bash
# Crear el entorno
python -m venv venv

# Activar el entorno
# En Windows:
.\venv\Scripts\activate
# En macOS/Linux:
source venv/bin/activate

```

### 3. Instalar Dependencias
Con tu entorno virtual activado, instala todas las librerías necesarias que se encuentran en requirements.txt.

```bash
pip install -r requirements.txt

```
