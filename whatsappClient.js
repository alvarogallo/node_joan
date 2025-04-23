const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { handleTextMessage, handleImageMessage } = require("./services/messageProcessorService");
const { getSenderDetails } = require("./utils/senderUtils");
let sessionIniciada = false; // Estado de la sesión
let qrCode = null; // Guardar el código QR generado
let client; // Variable para almacenar la instancia del cliente
const setQrCode = (qr) => {
  qrCode = qr;
};
const axios = require('axios'); // Importa la librería axios
require('dotenv').config(); // Carga las variables de entorno desde el archivo .env

const initializeWhatsAppClient = () => {
  client = new Client({
    webVersionCache: {
      type: "remote",
      remotePath:
        "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
    },
    puppeteer: {
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
    authStrategy: new LocalAuth(),
  });

  client.on("qr", (qr) => {
    console.clear();
    console.log("QR GENERADO! -> ", qr);
    qrCode = qr; // Guardamos el código QR generado
    setQrCode(qrCode); // Guardamos el código QR usando la función
    console.log("Puedes usar esto!");
    qrcode.generate(qr, { small: true });
  });

  client.once("ready", () => {
    console.log("Conexión con WhatsApp del cliente establecida!! 🎉🎉🎉");
    sessionIniciada = true; // Marcamos que la sesión ha sido iniciada

  });




  // --- !!! Router principal de mensajes entrantes !!! ---
  // Este callback se ejecuta por CADA mensaje que llega
  client.on('message', async (msg) => {
    // Log básico al inicio para ver qué tipo de mensaje llega
    console.log(`---> Mensaje recibido - Tipo: ${msg.type}, From: ${msg.from}, Author: ${msg.author}, Body: ${msg.body ? msg.body.substring(0, 50) + '...' : '[No body]'}`);

    // !!! CORRECCIÓN: Declara senderInfo CON 'let' ANTES del try e inicialízala !!!
    let senderInfo = null; // Inicializamos a null para que esté definida en el alcance del try/catch

    // Una variable para tener un identificador seguro del remitente en logs de error o mensajes al usuario
    let displayIdentifier = 'Unknown Sender';

    try {
      // --- Obtener detalles del remitente ---
      // Llama a la función de utilidad para obtener nombre, número, etc.
      // Esta función ahora está protegida contra _serialized: undefined
      senderInfo = await getSenderDetails(client, msg); // Llama a la función y asigna el resultado a senderInfo

      // Una vez que senderInfo se ha obtenido (incluso con valores por defecto si falló _serialized),
      // podemos crear un identificador más seguro para logs o replies
      displayIdentifier = senderInfo?.nombre || senderInfo?.numero || msg.from?._serialized || msg.from || 'Unknown Sender';
      console.log(`Router procesó mensaje de: ${displayIdentifier}`);


      // --- Decidir qué handler llamar basado en el tipo de mensaje ---
      // Usamos un switch para manejar diferentes tipos de mensajes de forma clara
      switch (msg.type) {
        case 'chat': // Tipo para mensajes de texto normales
          console.log(`Router: Ruta a handleTextMessage para ${displayIdentifier}`);
          // Llama al handler específico para mensajes de texto
          // Asegúrate de que handleTextMessage acepta client, msg, senderInfo
          await handleTextMessage(client, msg, senderInfo);
          break;

        case 'image': // Tipo para mensajes con imagen
          console.log(`Router: Ruta a handleImageMessage para ${displayIdentifier}`);
          // Llama al handler específico para mensajes de imagen
          // Asegúrate de que handleImageMessage acepta client, msg, senderInfo
          await handleImageMessage(client, msg, senderInfo);
          break;

        // --- Añade más casos aquí para otros tipos de mensajes si los manejas ---
        // case 'video':
        //      console.log(`Router: Ruta a handleVideoMessage para ${displayIdentifier}`);
        //      await handleVideoMessage(client, msg, senderInfo); // Asegúrate de que existe y acepta los args
        //      break;
        // case 'sticker':
        //      console.log(`Router: Ruta a handleStickerMessage para ${displayIdentifier}`);
        //      await handleStickerMessage(client, msg, senderInfo); // Asegúrate de que existe y acepta los args
        //      break;
        // case 'document':
        //     console.log(`Router: Ruta a handleDocumentMessage para ${displayIdentifier}`);
        //     await handleDocumentMessage(client, msg, senderInfo); // Asegúrate de que existe y acepta los args
        //     break;
        // case 'audio':
        //     console.log(`Router: Ruta a handleAudioMessage para ${displayIdentifier}`);
        //     await handleAudioMessage(client, msg, senderInfo); // Asegúrate de que existe y acepta los args
        //     break;
        // case 'location':
        //     console.log(`Router: Ruta a handleLocationMessage para ${displayIdentifier}`);
        //     await handleLocationMessage(client, msg, senderInfo); // Asegúrate de que existe y acepta los args
        //     break;


        default:
          // Este bloque maneja cualquier otro tipo de mensaje no listado arriba
          console.log(`Router: Tipo de mensaje ${msg.type} no manejado, recibido de ${displayIdentifier}.`);
          // Opcional: Puedes decidir si quieres responder al usuario en este caso.
          // Sé cuidadoso, algunos tipos de mensajes no soportan msg.reply().
          // try {
          //     // Verifica si msg.reply es una función antes de llamarla
          //     if (msg && typeof msg.reply === 'function') {
          //         await msg.reply(`Lo siento, no puedo procesar mensajes de tipo ${msg.type} en este momento.`);
          //     }
          // } catch(replyError) {
          //      console.error(`Router: Fallo al intentar responder a tipo no soportado (${msg.type}):`, replyError);
          // }
          break;
      }

    } catch (error) {
      // !!! CORRECCIÓN: Este catch ahora maneja errores que ocurran en getSenderDetails O DENTRO de los handlers específicos !!!
      // La variable 'senderInfo' aquí puede ser null si el error ocurrió en getSenderDetails ANTES de que se asignara exitosamente.
      // Usamos 'displayIdentifier' o accesos seguros para el log del error.
      console.error(`Router: Error general al procesar mensaje de ${displayIdentifier} (Tipo: ${msg.type}):`, error);

      // Opcional: Intentar enviar un mensaje de error genérico al usuario. Hazlo con mucho cuidado.
      // Solo intenta responder si msg es un objeto válido y crees que el usuario esperaría una respuesta de error.
      // try {
      //     if (msg && typeof msg.reply === 'function') {
      //         await msg.reply('Hubo un error interno al procesar tu mensaje. Por favor, intenta de nuevo más tarde.');
      //     }
      // } catch(replyError) {
      //      console.error("Router: Fallo al intentar responder al usuario sobre el error:", replyError);
      // }
      // !!! FIN CORRECCIÓN CATCH !!!
    }
  });
  // --- !!! FIN Router principal de mensajes entrantes !!! ---


  client.initialize(); // Iniciamos el cliente
};

// Función para obtener el estado de la sesión
const isSessionIniciada = () => sessionIniciada;
// Función para obtener el QR generado
const getQrCode = () => qrCode;
// Función para obtener el cliente de WhatsApp
const getClient = () => client;



module.exports = {
  initializeWhatsAppClient,
  isSessionIniciada,
  getQrCode,
  getClient,
  setQrCode // Exportamos la función para establecer el QR

};
