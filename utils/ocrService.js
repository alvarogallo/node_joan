// Archivo: utils/ocrService.js

// Importa la librería node-tesseract-ocr
const tesseract = require('node-tesseract-ocr');

// Configuración de Tesseract para node-tesseract-ocr
// Asegúrate de que el idioma 'spa' esté instalado en tu sistema para Tesseract.
const config = {
    lang: 'spa', // !!! Idioma: español. Asegúrate de tener spa.traineddata y TESSDATA_PREFIX configurado.
    oem: 1,// OCR Engine mode (1: LSTM - suele ser más preciso)
    psm: 3 // Page segmentation mode (3: Automática, por defecto)
    // Puedes añadir otras opciones de configuración de Tesseract aquí si necesitas
};

/**
 * Extrae texto de un Buffer de imagen utilizando node-tesseract-ocr.
 * REQUIERE:
 * 1. El ejecutable 'tesseract' instalado en el sistema y accesible en la variable de entorno PATH.
 * 2. El archivo '.traineddata' para el idioma especificado (ej: spa.traineddata)
 * en una ubicación a la que Tesseract pueda acceder (usualmente via TESSDATA_PREFIX).
 *
 * @param {Buffer} imageBuffer - Buffer que contiene los datos binarios de la imagen a procesar.
 * @param {object} options - Opciones de configuración adicionales para Tesseract (opcional).
 * @returns {Promise<string>} Una promesa que resuelve con el texto extraído.
 * @throws {Error} Si ocurre un error durante el proceso de OCR
 * (ej: ejecutable tesseract no encontrado, archivo de idioma faltante, error de procesamiento de imagen).
 */
async function extraerTextoFromImg(imageBuffer, options = {}) { // Acepta un BUFFER
    console.log('OCR Service (node-tesseract-ocr): Iniciando OCR desde Buffer...');
    // Loggeamos TESSDATA_PREFIX aquí también, por si hay problemas con el idioma.
    console.log('OCR Service (node-tesseract-ocr): Valor de TESSDATA_PREFIX en el proceso Node:', process.env.TESSDATA_PREFIX);


    try {
        // Fusiona la configuración por defecto con las opciones pasadas
        const finalConfig = { ...config, ...options };

        // Llama a la función recognize de node-tesseract-ocr, pasándole el Buffer.
        // ¡node-tesseract-ocr.recognize acepta un Buffer!
        const text = await tesseract.recognize(imageBuffer, finalConfig);

        console.log('OCR Service (node-tesseract-ocr): Reconocimiento completo.');
        // Puedes loggear el texto completo aquí en el servicio si quieres una confirmación directa.
        console.log('OCR Service (node-tesseract-ocr): Texto extraído:', text);


        return text.trim(); // Devuelve el texto extraído (limpiando espacios/saltos)

    } catch (error) {
        console.error('OCR Service (node-tesseract-ocr): Error durante el procesamiento:', error);
        // Mensajes de ayuda para errores comunes
        if (error.message && (error.message.includes("'tesseract'") || error.message.includes("command not found"))) {
            console.error("\n--- ERROR DE EJECUCIÓN DE TESSERACT ---\nEl comando 'tesseract' no se encontró o no está accesible.\nAsegúrate de que el ejecutable de Tesseract OCR está instalado y en el PATH del sistema (configurado permanentemente).\n---------------------------------------");
        } else if (error.message && error.message.includes("Failed loading language")) {
            const requiredLang = options.lang || config.lang || 'el idioma configurado';
            console.error(`\n--- ARCHIVO DE DATOS DE IDIOMA TESSERACT FALTANTE (${requiredLang}.traineddata) ---\nAsegúrate de que el archivo "${requiredLang}.traineddata" existe en tu carpeta tessdata\ny que la variable de entorno TESSDATA_PREFIX apunta al directorio *padre* de la carpeta tessdata (configurado permanentemente).\n---------------------------------------`);
        } else {
            // Otros posibles errores (ej: imagen no válida, error de memoria, etc.)
            console.error('Posible causa del error de OCR:', error.message);
        }
        throw error; // Relanza el error para que handleImageMessage lo capture
    }
}

// Exporta la función
module.exports = {
    extraerTextoFromImg
};