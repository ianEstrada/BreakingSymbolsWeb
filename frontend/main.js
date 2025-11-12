document.addEventListener("DOMContentLoaded", () => {
    // --- Elementos del DOM ---
    const videoElement = document.getElementById('input_video');
    const canvasElement = document.getElementById('output_canvas');
    if (!canvasElement) { console.error("No se encontró #output_canvas"); return; }
    const canvasCtx = canvasElement.getContext('2d');
    const prediccionElement = document.getElementById('prediccion');
    const textoFormado = document.getElementById('textoFormado');
    const emocionElement = document.getElementById('emocion');

    if (!videoElement) { console.error("No se encontró #input_video"); return; }
    if (!prediccionElement) console.warn("Advertencia: no se encontró #prediccion.");
    if (!textoFormado) console.warn("Advertencia: no se encontró #textoFormado.");
    if (!emocionElement) console.warn("Advertencia: no se encontró #emocion.");

    // --- Variables de Estado ---
    let palabraFormada = "";
    let ultimoChequeoEmocion = 0;
    const FRECUENCIA_EMOCION_MS = 500; // Chequear emoción cada 500ms
    const mapaNombres = { "happy": "Feliz", "sad": "Triste", "angry": "Enojado", "surprised": "Sorpresa", "neutral": "Neutral", "fearful": "Miedo", "disgusted": "Disgusto"};

    // --- Función de Extracción de Features (Señas) ---
    function extraerFeatures_JS(landmarks) {
        if (!landmarks || landmarks.length === 0) return null;
        const origen = landmarks[0];
        const p9_relativo = {
            x: landmarks[9].x - origen.x,
            y: landmarks[9].y - origen.y,
            z: landmarks[9].z - origen.z,
        };
        const distPalma = Math.sqrt(p9_relativo.x**2 + p9_relativo.y**2 + p9_relativo.z**2);
        if (distPalma === 0) return null;
        return landmarks.flatMap(lm => [
            (lm.x - origen.x) / distPalma,
            (lm.y - origen.y) / distPalma,
            (lm.z - origen.z) / distPalma
        ]);
    }

    // --- Función API Señas ---
    async function llamarAPISeñas(features) {
        try {
            const response = await fetch('/api/predict/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ features: features })
            });
            if (!response.ok) { console.error("Error en la API de señas:", response.statusText); return; }
            const data = await response.json();
            if (prediccionElement) prediccionElement.textContent = data.letra || '...';
            return data;
        } catch (error) {
            console.error("Error al llamar a la API de señas:", error);
        }
    }

    // --- Función de Carga Modelos Face-API ---
    async function cargarModelosFaceAPI() {
        const MODEL_URL = '/static/models'; 
        console.log("Cargando modelos de face-api...");
        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
            ]);
            console.log("¡Modelos de face-api cargados!");
        } catch (error) {
            console.error("Error cargando modelos de face-api:", error);
        }
    }

    // --- Función onResults (MediaPipe) ---
    function onResults(results) {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#39ff14', lineWidth: 1 });
            
            const features = extraerFeatures_JS(landmarks);
            if (features) {
                llamarAPISeñas(features);
            } else {
                if (prediccionElement) prediccionElement.textContent = '...';
            }
        } else {
            if (prediccionElement) prediccionElement.textContent = '...';
        }

        canvasCtx.restore();
    }

    // --- Configurar MediaPipe Hands ---
    const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    hands.onResults(onResults); 
    
    // --- El Bucle de Control Principal ---
    async function bucleDeteccion(timestamp) {
        // 1. Enviar el video a MediaPipe Hands (rápido)
        await hands.send({ image: videoElement });

        // 2. Controlar la detección de emociones (lento)
        if (timestamp - ultimoChequeoEmocion > FRECUENCIA_EMOCION_MS) {
            ultimoChequeoEmocion = timestamp; 
            
            const detections = await faceapi.detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceExpressions();

            if (detections && detections.length > 0) {
                const expressions = detections[0].expressions;
                let emocionDominante = "Neutral";
                let maxValor = 0;
                
                for (const [emocion, valor] of Object.entries(expressions)) {
                    if (valor > maxValor) {
                        maxValor = valor;
                        emocionDominante = emocion;
                    }
                }
                if (emocionElement) emocionElement.textContent = mapaNombres[emocionDominante] || "Neutral";
            } else {
                if (emocionElement) emocionElement.textContent = "...";
            }
        }
        
        // 3. Llamarse a sí mismo para el siguiente frame
        window.requestAnimationFrame(bucleDeteccion);
    }
    
    // --- ¡LA NUEVA FUNCIÓN DE INICIO! ---
    async function main() {
        console.log("DOM listo — inicializando.");
        
        // 1. Cargar los modelos de Face-API
        await cargarModelosFaceAPI();

        // 2. Iniciar la cámara MANUALMENTE (la forma robusta)
        try {
            console.log("Solicitando permiso de cámara...");
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
                audio: false
            });
            console.log("Permiso de cámara obtenido.");
            videoElement.srcObject = stream;
            
            // --- CAMBIO CLAVE ---
            // No usamos 'onloadedmetadata'. Le decimos 'play()' y esperamos a que termine.
            // Esto es más directo y robusto.
            await videoElement.play(); 
            console.log("Cámara iniciada y video reproduciéndose. Empezando bucle de detección.");

            // 3. ¡Empezar el bucle principal!
            window.requestAnimationFrame(bucleDeteccion);
            // --- FIN CAMBIO CLAVE ---

        } catch (err) {
            console.error("Error fatal al iniciar la cámara:", err);
            // Hacer el error visible al usuario
            alert("ERROR: No se pudo acceder a la cámara. Revisa los permisos en el candado 🔒 de la URL y recarga la página. Error: " + err.message);
        }
    }

    // --- Lógica de Teclado (sin cambios) ---
    document.addEventListener("keydown", (event) => {
        const activeTag = document.activeElement ? document.activeElement.tagName : null;
        if (activeTag && (activeTag === "INPUT" || activeTag === "TEXTAREA")) return;
        if (event.key.toLowerCase() === "w") {
            const letra = prediccionElement ? prediccionElement.textContent.trim() : null;
            if (letra && letra !== "..." && letra !== "N/A") {
                palabraFormada += letra;
                if (textoFormado) textoFormado.textContent = palabraFormada;
            }
        } else if (event.key === "Backspace") {
            event.preventDefault();
            palabraFormada = palabraFormada.slice(0, -1);
            if (textoFormado) textoFormado.textContent = palabraFormada || "...";
        } else if (event.key === "Enter") {
            palabraFormada = "";
            if (textoFormado) textoFormado.textContent = "...";
        }
    });

    // --- ¡Punto de entrada! ---
    main();
});