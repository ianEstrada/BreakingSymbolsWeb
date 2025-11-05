# En (tu_app)/ia_loader.py
import pickle
import os
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

# Carga el modelo al iniciar Django
MODELO_IA, SCALER_IA = load_model()