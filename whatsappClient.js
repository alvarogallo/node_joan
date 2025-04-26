const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { handleTextMessage, handleImageMessage } = require("./services/messageProcessorService");
const { getSenderDetails } = require("./utils/senderUtils");
let sessionIniciada = false;
let qrCode = null; 
let client; // Variable para almacenar la instancia del cliente
const setQrCode = (qr) => {
  qrCode = qr;
};
require('dotenv').config();

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
    qrCode = qr; 
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
    let senderInfo = null;
    // Una variable para tener un identificador seguro del remitente en logs de error o mensajes al usuario
    let displayIdentifier = 'Unknown Sender';

    try {
      // --- Obtener detalles del remitente ---
      // Llama a la función de utilidad para obtener nombre, número, etc.
      senderInfo = await getSenderDetails(client, msg); // Llama a la función y asigna el resultado a senderInfo

      // Una vez que senderInfo se ha obtenido (incluso con valores por defecto si falló _serialized),
      // podemos crear un identificador más seguro para logs o replies
      displayIdentifier = senderInfo?.nombre || senderInfo?.numero || msg.from?._serialized || msg.from || 'Unknown Sender';
      console.log(`--->🚩 Mensaje recibido 🚩 <---- \n Tipo: ${msg.type},\nFrom: ${msg.from},\nNombre de Usuario: ${msg.displayIdentifier},\nAuthor: ${msg.author},\nBody: ${msg.body ? msg.body.substring(0, 50) + '...' : '[No body]'}\n ---------\n`);


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
          break;
      }
    } catch (error) {
      console.error(`Router: Error general al procesar mensaje de ${displayIdentifier} (Tipo: ${msg.type}):`, error);
    }
  });


  client.initialize(); 
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
