const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const handleIncomingMessage = require("./services/messageProcessorService"); 

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


 

  // Eventos de mensajes entrantes, Se dispara el servico que maneja los mensajes entrantes 
  client.on("message", handleIncomingMessage);



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
