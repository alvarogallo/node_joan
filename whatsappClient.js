const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
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

  
  client.on("message", async (msg) => {
    let senderNumber;

    if (msg.author) {
      senderNumber = msg.author.split('@')[0];
    } else {
      senderNumber = msg.from.split('@')[0];
    }

    console.log(`Número: ${senderNumber} - Mensaje: ${msg.body}`);

    // **Enviar datos a la API externa**
    const apiUrl = process.env.API_SERVICE_URL; // Obtiene la URL de la API desde las variables de entorno

  

    if (!apiUrl) {
      console.error('Error: La variable de entorno API_URL no está definida en el archivo .env');
      return; // Detiene la ejecución si la URL no está configurada
    }

    try {
      const response = await axios.post(apiUrl, {
        phone: senderNumber,
        msg: msg.body
      });
      
      const respuesta_servidor = await response.data;
      //responder el mensaje
      console.log(respuesta_servidor);
     //recorremos el array del repsuesta del ser
     let respuesta = null;
     //**
     // Nota:el método join() de los arrays
     // en JavaScript. Este método une todos los elementos de un array en una cadena,
     //  utilizando un separador especificado. En tu caso, el separador que quieres es el salto de línea (\n).
     //  */
     if (respuesta_servidor && respuesta_servidor.msg && Array.isArray(respuesta_servidor.msg)) {
      respuesta = respuesta_servidor.msg.join('\n');
    } else {
      respuesta = "La estructura de respuesta_servidor.msg no es la esperada.";
    }

    // enviamos respuesta al cliente
     msg.reply(respuesta);

    } catch (error) {
      console.error('Error al enviar datos a la API:', error);
    }

  
  });


  
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
