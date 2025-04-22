const { extractSenderInfo, processApiResponse } = require("../utils/messageUtils");
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
 *  Funcion principal controlar los emsanejs entrantes, los mandas a la api externa de Alvaro
 para ser procesados y luego la respuesta de la api externa se envia al cliente.
 */
 const handleIncomingMessage = async (msg) => {
    try {
      // 1. Extraer información del remitente
      const senderNumber = extractSenderInfo(msg);
      console.log(`Número: ${senderNumber} - Mensaje: ${msg.body}`);

      // 2. Validar URL de la API externa
      const apiUrl = process.env.API_SERVICE_URL;
      if (!apiUrl) {
        console.error('URL de la API externa no configurada.');
        //msg.reply("Lo siento, no puedo procesar tu solicitud en este momento. Estamos trabajando en ello.");
        return; // Detiene la ejecución
      }

      // 3. Llamar a la API externa
      const apiResponseData = await callExternalApi(apiUrl, senderNumber, msg.body);

      // 4. Procesar la respuesta de la API
      const responseMessage = processApiResponse(apiResponseData);

      // 5. Enviar respuesta al cliente
      await msg.reply(responseMessage);
      console.log(`Respuesta enviada a ${senderNumber}: ${responseMessage}`);

    } catch (error) {
      console.error('Error en el handler de mensaje:', error.message);
      // Puedes decidir si quieres enviar un mensaje de error al usuario en caso de errores inesperados
      // msg.reply("Hubo un error interno al procesar tu solicitud.");
    }
  };

module.exports = handleIncomingMessage;