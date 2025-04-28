const axios = require('axios');

/**
 * @function sendAnalysisResult
 * @description Envía los resultados del análisis de una imagen (texto extraído, número de origen, caption)
 * a un endpoint de API configurado mediante una variable de entorno.
 * Realiza una petición POST con los datos en formato JSON.
 *
 * @author Joan
 *
 * @param {string} extractedText - El texto que fue extraído de la imagen mediante OCR.
 * @param {string} phoneNumber - El número de teléfono de origen del mensaje (ej: "584121234567").
 * @param {string | undefined} caption - El caption original de la imagen. Será `undefined` si la imagen no tenía caption o estaba vacío.
 *
 * @returns {Promise<void>} Una promesa que se resuelve cuando la petición ha terminado
 * (éxito o error), o inmediatamente si la variable de entorno no está configurada.
 *
 * @throws {Error} Puede lanzar errores si hay problemas de conexión o en la petición HTTP,
 * aunque la función ya incluye manejo de errores interno y loguea los detalles.
 *
 * **Nota Importante:**
 * Para que esta función opere correctamente, es indispensable configurar la variable
 * de entorno `API_IMG_ANALIZE` con la URL completa del endpoint de la API que recibirá
 * los datos. Esta variable debe cargarse al inicio de la aplicación, usualmente
 * usando la librería `dotenv` junto con un archivo `.env`.
 *
 * **Dependencias:**
 * Requiere la librería `axios` para realizar las peticiones HTTP.
 * Requiere que la variable de entorno `API_IMG_ANALIZE` esté cargada en `process.env`
 * (comúnmente manejado por `dotenv`).
 */
const sendAnalysisResult = async (extractedText, phoneNumber, caption) => {
    // Obtenemos el endpoint de la variable de entorno
    const apiUrl = process.env.API_IMG_ANALIZE;

    // Verificamos si la variable está definida y no está vacía (ignorando espacios en blanco)
    if (!apiUrl || apiUrl.trim() === '') {
        console.warn('La variable de entorno API_IMG_ANALIZE no está configurada o está vacía. No se enviarán los datos de análisis.');
        return; // Salimos de la función si la URL no es válida
    }

    // Preparamos el JSON a enviar
    // Los nombres de las claves aquí (texto_extraido, telefonoOrigen, caption)
    // deben coincidir con lo que la API espera recibir en el body de la petición POST.
    const postData = {
        extractedText,
        phoneNumber,
        caption
    };

    console.log(`API_IMG_ANALIZE configurada: ${apiUrl}. Intentando enviar datos...`);
    console.log('Datos a enviar:', postData);

    try {
        // Realizamos la petición POST al endpoint configurado.
        // Se incluye la cabecera Content-Type para indicar que el cuerpo es JSON.
        const response = await axios.post(apiUrl, postData, {
            headers: {
                'Content-Type': 'application/json'
                // Puedes añadir otras cabeceras aquí si son necesarias para tu API (ej: API Keys para autenticación)
            }
        });

        console.log(`Datos de análisis enviados exitosamente a ${apiUrl}.`);
        // Logueamos el estado HTTP de la respuesta y los datos que la API devolvió.
        console.log('Respuesta de la API:', response.status, response.data);

    } catch (error) {
        // Se captura cualquier error que ocurra durante la petición HTTP.
        console.error(`Error al enviar datos de análisis a ${apiUrl}:`);
        // Loguear detalles del error para facilitar la depuración.
        // error.response contiene detalles si el servidor respondió con un error HTTP (ej: 404, 500).
        // error.request contiene detalles si la petición se hizo pero no hubo respuesta.
        // error.message es el mensaje de error general.
        if (error.response) {
            console.error('Detalles de Error de Respuesta (API):', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('Detalles de Error de Petición (sin respuesta):', error.request);
        } else {
            console.error('Detalles de Error de Configuración de Petición:', error.message);
        }
        console.error('Configuración de la petición que falló:', error.config);

        // Opcional: Si necesitas que la función que llama a sendAnalysisResult
        // también sepa que hubo un error, puedes relanzar el error capturado.
        // throw error;
    }
};

module.exports = { sendAnalysisResult };