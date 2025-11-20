import json
import numpy as np
import base64
import cv2
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render # Para servir el HTML
from .ia_loader import MODELO_IA, SCALER_IA, EMOTION_DETECTOR # Importa el modelo cargado

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
    
@csrf_exempt # Deshabilita CSRF para esta API
def predict_emotion(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    if EMOTION_DETECTOR is None:
         return JsonResponse({'error': 'Modelo de emoción no cargado'}, status=500)

    try:
        # 1. Recibir la imagen en Base64 desde JavaScript
        data = json.loads(request.body)
        image_data_b64 = data.get('image_b64')
        
        # Quitar el prefijo 'data:image/jpeg;base64,'
        header, image_data_b64 = image_data_b64.split(',', 1) 
        
        # 2. Decodificar Base64 a bytes
        img_data = base64.b64decode(image_data_b64)
        
        # 3. Convertir bytes a un array de OpenCV
        np_arr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        # 4. Usar FER para detectar emociones (en el servidor)
        all_faces = EMOTION_DETECTOR.detect_emotions(frame)

        if not all_faces:
            return JsonResponse({'emocion': '...'})

        # Tomar la primera cara detectada
        face_data = all_faces[0]
        emotions = face_data['emotions']
        top_emotion = max(emotions, key=emotions.get)
            
        # 5. Devolver la predicción
        return JsonResponse({
            'emocion': top_emotion.capitalize()
        })

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)