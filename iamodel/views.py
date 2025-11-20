import json
import numpy as np
import base64
import cv2
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render # Para servir el HTML
from .ia_loader import MODELO_IA, SCALER_IA # Importa el modelo cargado

# Umbral de confianza
UMBRAL_CONFIANZA = 0.2

# --- Vista para servir el Frontend ---
def index(request):
    """Sirve la página principal index.html."""
    return render(request, 'index.html')


# --- Vista para la API de predicción ---
@csrf_exempt # Deshabilita CSRF para esta API
def predict_sign(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    if MODELO_IA is None or SCALER_IA is None:
         return JsonResponse({'error': 'Modelo no cargado'}, status=500)

    try:
        # 1. Recibir los datos (landmarks) desde JavaScript
        data = json.loads(request.body)
        features_list = data.get('features') # Espera una lista de 63 números
        
        if not features_list or len(features_list) != 63:
             return JsonResponse({'error': 'Features inválidas'}, status=400)

        # 2. Convertir a NumPy y escalar
        features_np = np.array([features_list]) # [1, 63]
        features_scaled = SCALER_IA.transform(features_np)
        
        # 3. Realizar la predicción
        probabilidades = MODELO_IA.predict_proba(features_scaled)[0]
        max_prob = np.max(probabilidades)
        
        if max_prob < UMBRAL_CONFIANZA:
            return JsonResponse({'letra': 'N/A', 'confianza': float(max_prob)})

        letra_predicha = MODELO_IA.classes_[np.argmax(probabilidades)]
        
        # 4. Devolver la predicción como JSON
        return JsonResponse({
            'letra': letra_predicha,
            'confianza': float(max_prob)
        })

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
