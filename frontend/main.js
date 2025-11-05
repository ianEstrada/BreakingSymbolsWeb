// --- Elementos del DOM ---
const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const prediccionElement = document.getElementById('prediccion');

// --- Función de Extracción de Features (¡OPTIMIZADA!) ---
function extraerFeatures_JS(landmarks) {
    if (!landmarks || landmarks.length === 0) {
        return null;
    }

    const origen = landmarks[0];

    // 1. Calcular 'distPalma' primero, accediendo solo a los puntos necesarios
    const p9_relativo = {
        x: landmarks[9].x - origen.x,
        y: landmarks[9].y - origen.y,
        z: landmarks[9].z - origen.z,
    };
    const distPalma = Math.sqrt(p9_relativo.x**2 + p9_relativo.y**2 + p9_relativo.z**2);

    if (distPalma === 0) {
        return null;
    }

    // 2. Mapear UNA SOLA VEZ:
    //    Calcula la posición relativa Y normaliza Y aplana... todo en un paso.
    const features = landmarks.flatMap(lm => [
        (lm.x - origen.x) / distPalma,
        (lm.y - origen.y) / distPalma,
        (lm.z - origen.z) / distPalma
    ]);
    
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
        
        // Dibujar las LÍNEAS (conexiones)
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { 
            color: '#00FF00', // Verde
            lineWidth: 2      // Grosor de 2 píxeles
        });

        // Dibujar los PUNTOS (landmarks)
        drawLandmarks(canvasCtx, landmarks, {
            color: '#FF0000',     // Rojo (corregido de #F000)
            lineWidth: 1,         // Un borde fino de 1px para el círculo
            circleRadius: 2       // Radio de 2 píxeles
        });
        
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