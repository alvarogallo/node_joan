const { processApiResponse } = require("../utils/messageUtils");
const fs = require('fs');
const path = require('path');
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


// OJO funcion para detectar y procesar las imagenes que me llegan, estas imagenes se van a guardar en el directorio public/pagos
// Luego se va a llamar a otro servicio externo para procesar esta imagen (FUTURO).
// Nota: El nombre de la imagen se guarda con el formato pago_{identificador_serializado_del_remitente}_{nombre_del_remitente}.{extension}
const handleImageMessage = async (client, msg, senderInfo) => { // Aceptar client, msg, Y senderInfo
  console.log('¡Mensaje entrante detectado como IMAGEN! Activando la funcion handeleImageMessage');
  try {
    if (msg.hasMedia) {
      console.log('El mensaje tiene datos de medios adjuntos. Descargando...');

      const mediaData = await msg.downloadMedia();

      if (mediaData) { // Verificar si la descarga fue exitosa
        console.log('Datos de la imagen obtenidos.');
        console.log('Tipo MIME:', mediaData.mimetype);
        console.log('Nombre de archivo original (si disponible):', mediaData.filename || 'N/A');


        // --- Código para GUARDAR la imagen ---

        // Define el directorio donde guardarás los pagos
        // Ajusta la ruta si este archivo está en un subdirectorio diferente a 'services'
        const uploadDir = path.join(__dirname, '..', 'public', 'pagos');
        if (!fs.existsSync(uploadDir)) {
          console.log(`Creando directorio: ${uploadDir}`);
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        // 3. Genera un nombre de archivo USANDO LA INFORMACIÓN DE senderInfo (que ya viene del router)
        const mimeType = mediaData.mimetype;
        // Asegurarse de que mimeType y su split existan, aunque downloadMedia debería proveerlo
        const fileExtension = mimeType && mimeType.split('/')[1] ? mimeType.split('/')[1] : 'bin';


        // Usamos senderInfo.serializado y senderInfo.nombre que YA FUERON OBTENIDOS Y MANEJADOS por getSenderDetails
        // Importante: getSenderDetails devuelve valores por defecto si no pudo obtenerlos.
        // Aseguramos que sean strings antes de limpiarlos.
        const senderSerialized = senderInfo?.serializado || 'UnknownSerialized'; // Usa fallback si serializado es null/undefined
        const senderName = senderInfo?.nombre || 'UnknownUser'; // Usa fallback si nombre es null/undefined

        // Limpiar los identificadores para nombres de archivo seguros
        const cleanSenderSerialized = senderSerialized.replace(/[^a-zA-Z0-9_]/g, ''); // Permite _ después de fallback
        const cleanSenderName = senderName.replace(/[^a-zA-Z0-9_]/g, ''); // Permite _ después de fallback

        // Añadir un timestamp de fallback si el nombre queda vacío después de limpiar
        const fallbackTimestamp = Date.now();
        const finalSenderSerialized = cleanSenderSerialized || `no_serial_${fallbackTimestamp}`;
        const finalSenderName = cleanSenderName || `no_name_${fallbackTimestamp}`;


        // Formato del nombre: pago_{identificador_serializado_limpio}_{nombre_limpio}.{extension}
        const filename = `pago_${finalSenderSerialized}_${finalSenderName}.${fileExtension}`;
        const filePath = path.join(uploadDir, filename);

        // 4. Convierte la string base64 a Buffer.
        const imageBuffer = Buffer.from(mediaData.data, 'base64');

        // 5. Escribe el archivo.
        fs.writeFile(filePath, imageBuffer, async (err) => { // Usa async callback si vas a hacer await dentro
          if (err) {
            console.error('Error al guardar la imagen:', err);
            // Optional: notify user...
            // try { if (msg && typeof msg.reply === 'function') await msg.reply('Lo siento, hubo un error al guardar la imagen del pago.'); } catch(e) {}
          } else {
            console.log(`Imagen de pago guardada correctamente en: ${filePath}`);
            // Optional: notify user...
            // try { if (msg && typeof msg.reply === 'function') await msg.reply('¡Imagen de pago recibida y guardada para revisión!'); } catch(e) {}

            // --- Aquí integrarías el OCR ---
            console.log('\nProcesando imagen con OCR...');
            try {
              // Llama a tu función de OCR (ej: detectText) usando filePath o mediaData.data
              // Asumiendo que tienes una función de OCR que acepta una ruta o base64
              // const textoExtraido = await detectText(filePath); // o detectTextFromBase64(mediaData.data)

              // console.log('Texto extraído por OCR:', textoExtraido);
              // Optional: Reply with extracted text
              // if (textoExtraido && msg && typeof msg.reply === 'function') { await msg.reply(`Texto en la imagen: ${textoExtraido}`); }
            } catch (ocrError) {
              console.error('Error durante el OCR:', ocrError);
              // Optional: Notify user of OCR error
              // try { if (msg && typeof msg.reply === 'function') await msg.reply('No pude leer el texto de la imagen.'); } catch(e) {}
            }
            // --- Fin integración OCR ---
          }
        });

        // --- Fin del código para GUARDAR la imagen ---


      } else {
        console.log('Error: No se pudieron descargar los datos del medio.');
        // Optional: notify user...
        // try { if (msg && typeof msg.reply === 'function') await msg.reply('Lo siento, no pude descargar esta imagen.'); } catch(e) {}
      }


    } else {
      console.log('Mensaje de imagen sin datos de medios inesperadamente.');
    }
  } catch (error) {
    console.error('Error general al procesar el mensaje de imagen:', error);
    // Optional: notify user about internal error...
    // try { if (msg && typeof msg.reply === 'function') await msg.reply('Hubo un error interno al procesar la imagen.'); } catch(e) {}
  }
};




// procesar la imagen con el OCR
const detectText = async (filePath) => {
  try {
    const ocr = await Tesseract.recognize(filePath);
    return ocr.data;
  } catch (error) {
    console.error('Error al procesar la imagen con OCR:', error);
    return null;
  }
};

module.exports = { handleTextMessage, handleImageMessage };