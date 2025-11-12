# En (tu_app)/ia_loader.py
import pickle
import os
from fer import FER
from django.conf import settings

def load_model():
    """Carga el modelo y el escalador desde el archivo pkl."""
    ruta_modelo = os.path.join(settings.BASE_DIR, 'modelo_ia_senas.pkl')

    # --- ¡IMPORTANTE PARA GCP! ---
    # En producción (GCP), deberías descargar este archivo
    # desde Google Cloud Storage a una ruta temporal y cargarlo desde allí.

    if not os.path.exists(ruta_modelo):
        print(f"Error: No se encontró {ruta_modelo}")
        return None, None

    try:
        with open(ruta_modelo, 'rb') as f:
            modelo, scaler, tipo = pickle.load(f)
        print(f"✅ Modelo IA ({tipo}) cargado exitosamente.")
        return modelo, scaler
    except Exception as e:
        print(f"Error al cargar modelo: {e}")
        return None, None
    
def load_emotion_model():
    try:
        # ¡IMPORTANTE! mtcnn=True es muy pesado para un servidor.
        # mtcnn=False usa Haar cascades (OpenCV), que es mucho más rápido
        # y ya tienes OpenCV instalado.
        detector = FER(mtcnn=False) 
        print("✅ Modelo de Emociones (FER) cargado exitosamente.")
        return detector
    except Exception as e:
        print(f"Error al cargar modelo de emociones: {e}")
        return None

# Carga el modelo al iniciar Django
MODELO_IA, SCALER_IA = load_model()
EMOTION_DETECTOR = load_emotion_model()