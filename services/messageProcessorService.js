const { processApiResponse } = require("../utils/messageUtils");
const { extraerTextoFromImg } = require('../utils/ocrService');
const { sendAnalysisResult } = require("./sendAnalysisImgResult");
const axios = require('axios'); // Importa la librería axios
require('dotenv').config(); // Carga las variables de entorno desde el archivo .env


// Función para llamar a la API externa
const callExternalApi = async (apiUrl, phone, msgBody) => {
  try {
    const response = await axios.post(apiUrl, {
      phone: phone,
      msg: msgBody
    });
    return response.data; // Devolvemos los datos de la respuesta
  } catch (error) {
    console.error('Error al llamar a la API externa:', error.message);
    // Propagamos el error para que sea manejado por la función que llama
    throw new Error('Error al comunicarse con el servicio externo.');
  }
};

/*
* Función para controlar los mensajes de TEXTO entrantes.
* Recibe el cliente, el mensaje y la información del remitente ya obtenida.
*/
const handleTextMessage = async (client, msg, senderInfo) => {
  try {

    // El mensaje de texto esta dirigido al bot de natillera?
    const commandPrefix = 'natibot';
    if (!(msg._data.body.toLowerCase().includes(commandPrefix))) {
      console.log("Mensaje de texto no dirigido al bot, no se procesa")
      return
    }

    // 1. Extraer información del remitente o la persona que nos escribió.
    const senderNumber = senderInfo.numero; // Obtenemos el número del objeto senderInfo
    console.log(`Número: ${senderNumber} - Mensaje: ${msg.body}`);


    // 2. Validar URL de la API externa
    const apiUrl = process.env.API_SERVICE_URL;
    if (!apiUrl) {
      console.error('URL de la API externa no configurada.');
      // Puedes usar await msg.reply() aquí si necesitas notificar al usuario, ya que msg está disponible
      // await msg.reply("Lo siento, no puedo procesar tu solicitud en este momento. Estamos trabajando en ello.");
      return; // Detiene la ejecución
    }

    // 3. Llamar a la API externa
    // Usa senderInfo.numero o senderInfo.serializado si tu API externa lo requiere
    // Asegúrate de que callExternalApi esté disponible en este ámbito (impórtala si es necesario)
    const apiResponseData = await callExternalApi(apiUrl, senderInfo.numero, msg.body);

    // 4. Procesar la respuesta de la API
    // Asegúrate de que processApiResponse esté disponible en este ámbito
    const responseMessage = processApiResponse(apiResponseData);

    // 5. Enviar respuesta al cliente
    // Puedes usar await msg.reply() aquí ya que msg está disponible
    await msg.reply(responseMessage);
    console.log(`Respuesta enviada a ${senderNumber}: ${responseMessage}`); // Usamos senderNumber

  } catch (error) {
    console.error('Error en el handler de mensaje de texto:', error.message);
    // Puedes decidir si quieres enviar un mensaje de error al usuario aquí usando msg.reply()
    // try { await msg.reply("Hubo un error interno al procesar tu solicitud."); } catch(e) {} // Manejo de error para el reply
  }
};



const handleImageMessage = async (client, msg, senderInfo) => {
  const senderIdentifier = senderInfo?.nombre || senderInfo?.numero || 'Unknown Sender';
  console.log(`¡Manejando mensaje de imagen! Activando handleImageMessage para ${senderIdentifier}.`);
  let mediaData = null; // Variable para almacenar los datos del medio descargado

  try {
    // 1. Verifica si el mensaje tiene datos de medios
    if (!msg.hasMedia) {
      console.log(`Imagen de ${senderIdentifier} sin datos de medios. Ignorando.`);
      return;
    }

    console.log(`Imagen de ${senderIdentifier} tiene datos de medios. Iniciando descarga a memoria...`);

    // === 2. TRY...CATCH ESPECÍFICO PARA LA DESCARGA ===
    // Intentamos descargar el medio. Si falla (ej: Error: write EOF), este catch lo atrapará.
    try {
      mediaData = await msg.downloadMedia();
      console.log('Datos de la imagen obtenidos en memoria.');
      // Usamos encadenamiento opcional para acceder a mimetype de forma segura
      console.log('Tipo MIME:', mediaData?.mimetype);

    } catch (downloadError) {
      // Este catch debería atrapar errores de descarga como 'Error: write EOF'
      console.error(`Error durante la descarga del medio de ${senderIdentifier}:`, downloadError);
      console.log(`Descarga de medio de ${senderIdentifier} falló. Ignorando este mensaje de imagen.`);
      // Optional: puedes notificar al usuario si la descarga falla
      return; // Salimos de la función si la descarga falla
    }
    // === FIN TRY...CATCH ESPECÍFICO ===

    // Si llegamos aquí, la descarga fue exitosa (mediaData debe contener los datos Base64).
    // 3. Verificamos si mediaData y su propiedad data son válidos
    if (!mediaData || !mediaData.data) {
      console.log(`mediaData o mediaData.data es inválido después de la descarga. Ignorando.`);
      return; // Salir si los datos descargados no son válidos
    }

    // --- === 4. CONVERTIR LA DATA BASE64 A BUFFER === ---
    // mediaData.data es la string Base64 obtenida de la descarga.
    // Convertimos esta string Base64 a un objeto Buffer de Node.js.
    const imageBuffer = Buffer.from(mediaData.data, 'base64');
    console.log('Imagen convertida a Buffer en memoria.');
    // --- === FIN CONVERSIÓN A BUFFER === ---

    // === 5. Llamada a la función de OCR (extraerTextoFromImg) para extraer texto ===
    let extractedText = ''; // Variable para almacenar el texto del OCR

    // Asegúrate de que la función de OCR (extraerTextoFromImg) esté disponible y bien importada
    // y que esté implementada para aceptar un BUFFER.
    if (typeof extraerTextoFromImg === 'function') {
      //console.log('Procediendo con OCR sobre el Buffer en memoria...');
      try {
        // !!! Llama a la función de OCR (extraerTextoFromImg), pasándole el BUFFER (imageBuffer) !!!
        // extraerTextoFromImg (con node-tesseract-ocr en ocrService.js) espera un BUFFER.
        extractedText = await extraerTextoFromImg(imageBuffer, { lang: 'spa' }); // Pasa el Buffer y opciones de idioma (opcional, usando 'spa' now)
        console.log(`PROCESO OCR PARA La imagen de ${senderIdentifier} completado.`);
        //Mandamos a analizar el texto extraido, pasamos el numero de telefono y el texto extraido y si existe el caption
        sendAnalysisResult(extractedText,msg.from,msg._data.caption);
      } catch (ocrError) {
        // Este catch maneja errores DURANTE el OCR (ej: ejecutable tesseract no encontrado, error de procesamiento de la librería)
        console.error(`Error durante el análisis OCR de la imagen de ${senderIdentifier}:`, ocrError);
        // Optional: puedes notificar al usuario sobre el error de OCR...
      }
    } else {
      console.warn('Función extraerTextoFromImg no encontrada o no válida. No se puede realizar OCR.');
    }
    // === Fin llamada a la función de OCR ===

  } catch (error) {
    console.error(`Error general (fuera de descarga/OCR) al procesar el mensaje de imagen de ${senderIdentifier}:`, error);
  }
};


module.exports = { handleTextMessage, handleImageMessage };