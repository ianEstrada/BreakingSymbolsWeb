// --- Elementos del DOM ---
const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const prediccionElement = document.getElementById('prediccion');

// --- Función de Extracción de Features (¡La clave!) ---
// Esta es la versión JS de tu función 'extraer_features' de Python.
function extraerFeatures_JS(landmarks) {
    if (!landmarks || landmarks.length === 0) {
        return null;
    }

    // 1. Convertir a un array simple y tomar la muñeca (landmark 0) como origen
    const origen = landmarks[0];
    const landmarksRelativos = landmarks.map(lm => ({
        x: lm.x - origen.x,
        y: lm.y - origen.y,
        z: lm.z - origen.z,
    }));

    // 2. Calcular la distancia de la palma (norma de landmark 9 relativo)
    const p9 = landmarksRelativos[9]; // Base del dedo medio
    const distPalma = Math.sqrt(p9.x**2 + p9.y**2 + p9.z**2);

    if (distPalma === 0) {
        return null;
    }

    // 3. Normalizar por la distancia de la palma
    const landmarksNormalizados = landmarksRelativos.map(lm => ({
        x: lm.x / distPalma,
        y: lm.y / distPalma,
        z: lm.z / distPalma,
    }));

    // 4. Aplanar (Flatten) el array de 21x3 a 1x63
    const features = landmarksNormalizados.flatMap(lm => [lm.x, lm.y, lm.z]);
    
    return features; // Devuelve el vector de 63 características
}


// --- Función para llamar a la API de Django ---
async function llamarAPI(features) {
    try {
        const response = await fetch('/api/predict/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'X-CSRFToken' no es necesario si se usa @csrf_exempt
            },
            body: JSON.stringify({ features: features })
        });

        if (!response.ok) {
            console.error("Error en la API:", response.statusText);
            return;
        }

        const data = await response.json();
        
        // Actualizar la UI
        prediccionElement.textContent = data.letra || '...';

    } catch (error) {
        console.error("Error al llamar a la API:", error);
    }
}


// --- Configuración de MediaPipe Hands ---
function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        // Asumimos solo una mano
        const landmarks = results.multiHandLandmarks[0];
        
        // -----------------------------------------------------------------
        // --- INICIO DE LA CORRECCIÓN ---
        // -----------------------------------------------------------------

        // Dibujar las LÍNEAS (conexiones)
        // 'lineWidth' aquí controla el grosor de las líneas verdes.
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { 
            color: '#00FF00', // Verde
            lineWidth: 2      // Grosor de 2 píxeles
        });

        // Dibujar los PUNTOS (landmarks)
        // 'circleRadius' controla el tamaño de los puntos rojos.
        // 'lineWidth' controla el borde de esos puntos (opcional).
        drawLandmarks(canvasCtx, landmarks, {
            color: '#F000',      // Rojo
            lineWidth: 1,           // Un borde fino de 1px para el círculo
            circleRadius: 2        // <-- ¡ESTA ES LA CORRECCIÓN! Radio de 3 píxeles
        });
        
        // -----------------------------------------------------------------
        // --- FIN DE LA CORRECCIÓN ---
        // -----------------------------------------------------------------


        // 1. Extraer features
        const features = extraerFeatures_JS(landmarks);
        
        // 2. Enviar features a la API
        if (features) {
            llamarAPI(features);
        } else {
            prediccionElement.textContent = '...';
        }
    } else {
        prediccionElement.textContent = '...';
    }
    canvasCtx.restore();
}

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
hands.onResults(onResults);


// --- Iniciar la Cámara ---
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
});
camera.start();