const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
let sessionIniciada = false; // Estado de la sesión
let qrCode = null; // Guardar el código QR generado
let client; // Variable para almacenar la instancia del cliente
const axios = require('axios'); // Importa la librería axios

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
    console.log("Puedes usar esto!");
    qrcode.generate(qr, { small: true });
  });

  client.once("ready", () => {
    console.log("Conexión con WhatsApp del cliente establecida!! 🎉🎉🎉");
    sessionIniciada = true; // Marcamos que la sesión ha sido iniciada

  });

  
  client.on("message", async (msg) => {
    let senderNumber;

    if (msg.author) {
      senderNumber = msg.author.split('@')[0];
    } else {
      senderNumber = msg.from.split('@')[0];
    }

    console.log(`Número: ${senderNumber} - Mensaje: ${msg.body}`);

    // **Enviar datos a la API externa**
    const apiUrl = 'https://apisbotman.unatecla.com/api/viene_de_joan'; // Reemplaza con la URL de tu API

    try {
      const response = await axios.post(apiUrl, {
        phone: senderNumber,
        msg: msg.body
      });
      console.log('Datos enviados a la API con éxito:', response.data); // Opcional: Log de la respuesta de la API
    } catch (error) {
      console.error('Error al enviar datos a la API:', error);
    }

    if (msg.body == 'REPOLLA') {
      msg.reply('pong');
    }
  });


  
  client.initialize(); // Iniciamos el cliente
};

// Función para obtener el estado de la sesión
const isSessionIniciada = () => sessionIniciada;

// Función para obtener el QR generado
const getQRCode = () => qrCode;

// Función para obtener el cliente de WhatsApp
const getClient = () => client;



module.exports = {
  initializeWhatsAppClient,
  isSessionIniciada,
  getQRCode,
  getClient,
};
