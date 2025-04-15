const {
    isSessionIniciada,
    getClient,
    getQRCode,
  } = require("../whatsappClient");

const enviarMensaje = async (number, message) => {
    if (isSessionIniciada()) {
      const client = getClient(); // Obtenemos el cliente de WhatsApp
  
      try {
        await client.sendMessage(number, message); // Enviamos el mensaje
        return "Mensaje enviado!"
      } catch (error) {
        console.error("Error al enviar mensaje: ", error);
        return error
      }
    } else {
        return "Sesión de WhatsApp no iniciada."
    }
  };

  module.exports = enviarMensaje;