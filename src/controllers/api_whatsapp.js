const { Client, LocalAuth } = require("whatsapp-web.js");
const WebSocket = require("ws");
const fs = require("fs").promises;
const puerto = process.env.WSPORT || 8081;
let sessionIniciada = false;

// Crear un nuevo servidor WebSocket para poder enviar el qr automaticamente
const wss = new WebSocket.Server({ port: puerto });

const client = new Client({
  webVersionCache: {
    type: "remote",
    remotePath:
      "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
  },
  authStrategy: new LocalAuth(),
});

wss.on("connection", (socket) => {
  console.log("Cliente solicitando el codigo qr...");

  client.on("qr", (qr) => {
    console.log("QR GENERADO! -> ", qr);
    //enviamos el codigo qr al cliente
    socket.send(qr.toString());
  });

  socket.on("close", () => {
    console.log("Cliente desconectado");
  });

  socket.onerror = function () {
    console.log("Ocurrió un error");
  };

  //Si el evento ready ocurre mandamos el objeto de incio de session
  client.once("ready", () => {
    console.log("conetion con el whastapp del cliente establecida!!");
    //enviamos un objeto de identifiacion de logeo.
    //modificamos la variable golbal
    sessionIniciada = {
      login: true,
    };
    const dataToSend = JSON.stringify(sessionIniciada);
    socket.send(dataToSend);
    console.log("Se envio el objeto de session");
  });
});

//funcion para comprobar que existe una session iniciada whatsaapWebJs

async function wwebjsIsset() {
  // el objetivo de esta funcion es ver si la carpeta .wwwebjs_auth/session existe y reportar
  try {
    await fs.access("./.wwebjs_auth");
    console.log("1"); // La carpeta existe
    return 1;
  } catch {
    console.log("0"); // La carpeta no existe
    return 0;
  }
}

// Función modificada para manejar la respuesta del servidor
const login = async (req, res) => {
  //comprobar si existe una session iniciada
  sessionIniciada = await wwebjsIsset();
  if (sessionIniciada) {
    //tiene un objeto, lo enviamos al cliente
    res.send({
      login: true,
    });
  } else {
    res.send({ mensaje: "por favor espere a que se genere su codigo qr" });
  }
};

client.initialize();

module.exports = { login };
