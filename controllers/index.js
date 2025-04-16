// *** IMPORTANTE ***
// Este archivo contiene los CONTROLADOREs de las rutas de la API. no son las rutas si no mas bien los controladores de rutas.
const {
    isSessionIniciada,
    getClient,
    getQrCode,
  } = require("../whatsappClient");

  
  const { obtenerNumeroGanadorLoteriaMedellin } = require("../services/scraperSites.js");
  const { getAll,getByName ,create} = require("../models/TemplateMensajes.js");
  const reemplazarPlaceholders = require("../utils/remplazarPlaceholders.js");
  const qrcode = require("qrcode");
  const fs = require("fs/promises");
  const { validarNumeroTelefonico } = require("../utils/dataValidation.js");
  //IMPORTANTE IMPORTANDO EL CRON JOB PARA LOS MENSAJES PROGRAMADOS
  const cronMessage = require("../services/cronMessage.js");
  
  


  //Funcion para mostrar el código QR en HTML
  const showQrCodeInHtml = async (req, res) => {
    const qrCode = getQrCode(); // Obtenemos el QR generado
    if (qrCode) {
      // Genera una imagen SVG del código QR y la envía como respuesta
      const QRCode = require('qrcode');
      QRCode.toDataURL(qrCode, (err, url) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error al generar el código QR');
        }
        res.send(`<img src="${url}" alt="QR Code">`);
      });
    } else {
      res.send('El código QR aún no se ha generado. Por favor, espera...');
    }
  };


  
  
  // Función que retorna el QR en base64 si está disponible
  const getQRCodeBase64 = async (qrString) => {
    try {
      // Convertimos el string QR a base64
      const qrBase64 = await qrcode.toDataURL(qrString);
      return qrBase64;
    } catch (error) {
      console.error("Error al convertir QR a base64:", error);
      return null;
    }
  };
  
  // El login ahora convierte el QR a base64 si está disponible
  const login = async (req, res) => {
    const qrCode = getQrCode(); // Obtenemos el QR generado
  
    if (isSessionIniciada()) {
      res.send({ login: true });
    } else if (qrCode) {
      // Si ya se ha generado el QR, lo convertimos a base64
      const qrCodeBase64 = await getQRCodeBase64(qrCode);
      if (qrCodeBase64) {
        res.send({
          login: false,
          qr: qrCodeBase64, // Enviamos el QR en base64
        });
      } else {
        res.status(500).send({ message: "Error al convertir el QR a base64." });
      }
    } else {
      res.send({
        login: false,
        message:
          "Generando código QR, por favor intente de nuevo en unos segundos.",
      });
    }
  };
  
  //**Funcion para enviar mensajes, recibe un id Whatsapp y un contenido, para enviar */
  const sendMessage = async (req, res) => {
    if (isSessionIniciada()) {
      const client = getClient(); // Obtenemos el cliente de WhatsApp
      const { phone, msg } = req.body;


      try {
     
        await client.sendMessage(phone, msg); // Enviamos el mensaje
        res.send({ success: true, message: "Mensaje enviado!" });
      } catch (error) {
        console.error("Error al enviar mensaje: ", error);
        res
          .status(500)
          .send({ success: false, message: "Error al enviar mensaje." });
      }
    } else {
      res
        .status(400)
        .send({ success: false, message: "Sesión de WhatsApp no iniciada." });
    }
  };

  //funcion de espejo para devolver el numero de telefono y el mensaje que me escriben
  const echoMessage = async (req, res) => {
    if (isSessionIniciada()) {
      const client = getClient(); // Obtenemos el cliente de WhatsApp
      const { phone, msg } = req.body;

      try {
    
        res.send({phone: phone, msg: [msg]});
      } catch (error) {
        console.error("Error al enviar mensaje: ", error);
        res
          .status(500)
          .send({ success: false, message: "Error al enviar mensaje." });
      }
    } else {
      res
        .status(400)
        .send({ success: false, message: "Sesión de WhatsApp no iniciada." });
    }
  }
  
  //depurar cualquier erro eliminando la carperta .wwebjs_auth
  const removeCache = async (req, res) => {
    const folderPath = "../.wwebjs_auth"; // Ruta de la carpeta que deseas eliminar
    try {
      await fs.rm(folderPath, { recursive: true, force: true });
      console.log("Carpeta y su contenido eliminados con éxito.");
      res.send({ message: "Cache limpiada con exito" });
    } catch (err) {
      console.error("Error al eliminar la carpeta:", err);
      res.send({
        message:
          "Ah ocurrido un problema al intentar eliminar la carpeta .wwebjs_auth",
      });
    }
  };
  
    // funcion para sacar la lista de grupos de whatsapp de un cliente. retorna una array con los nombres de los grupos.
    const listWsGroup = async (req, res) => {
      if (isSessionIniciada()) {
          const client = getClient(); // Obtenemos el cliente de WhatsApp
          console.log("sacando el cliente de whtasapp")
          const chats = await client.getChats();
          console.log("sacando el chats")
          // Ahora podemos usar la propiedad isGroup para identificar los grupos de forma más confiable
          const groups = chats.filter(chat => chat.isGroup);
          console.log("filtrando solo los grupos")
          // Creamos un array para almacenar los nombres de los grupos
          const groupNames = groups.map(group => {
            return {name: group.name , wid : group.id._serialized}
          });
       
          // Enviamos el array con los nombres de los grupos
          res.send(groupNames);
  
      } else {
          res
              .status(400)
              .send({ success: false, message: "Sesión de WhatsApp no iniciada." });
      }
  };
  
  
  
  //recibe un string con el nombre del grupo y retorna un arreglo con los numeros de telefono de cada participante.
  const listWsParticipants = async (req, res) => {
    if (isSessionIniciada()) {
        const client = getClient(); // Obtenemos el cliente de WhatsApp
        //Recibimos del body el nombre del grupo del cual se le quieren sacar los participantes.
        const { groupName } = req.body;
  
        const chats = await client.getChats();
        // Filtramos la lista de chats para encontrar el grupo por su nombre
        const group = chats.find(chat => chat.isGroup && chat.name === groupName);
        console.log(group)
        if (group) {
            try {
                const datosDelGrupo = group.groupMetadata;
                const participants = datosDelGrupo.participants;
                console.log(participants)
  
                res.send(participants);
            } catch (error) {
                console.error("Error al obtener metadatos del grupo:", error);
                res.status(500).send({ success: false, message: "Error al obtener la información del grupo." });
            }
        } else {
            res.status(404).send({ success: false, message: `No se encontró ningún grupo con el nombre: ${groupName}` });
        }
  
    } else {
        res
            .status(400)
            .send({ success: false, message: "Sesión de WhatsApp no iniciada." });
    }
  };
  
  
  //disparar la funcion de scraping de la loteria de medellin
  const loteriaMedellin = async (req, res) => {
    //obtener el nombre del menesaje params
    const { mensaje } = req.query || "MensajePorDefecto";
    try {
      const resultadoLoteria = await obtenerNumeroGanadorLoteriaMedellin();
      const templateData = await getByName(mensaje); // Busca por el nombre del seed
  
      if (templateData) {
        const mensajeFinal = reemplazarPlaceholders(templateData.mensaje, {
          numero: resultadoLoteria.Ganador,
          fecha: resultadoLoteria.Fecha
        }, templateData.metadata?.keySimbolo); // Usa el keySimbolo del metadata si existe
  
        res.send(mensajeFinal);
      } else {
        res.status(500).send({ success: false, message: "Plantilla de mensaje por defecto no encontrada." });
      }
    } catch (error) {
      console.error("Error al obtener el número ganador de la lotería de Medellín:", error);
      res.status(500).send({ success: false, message: `Error al obtener el número ganador de la lotería de Medellín: ${error.message}` });
    }
  };
  
  
  //funcion para leer los mensajes template que se guardan en la base de datos
  const mensajeTemplate = async (req, res) => {
    try {
      //extaer los mensajes de la base de datos
      const mensaje = await getAll();
      //agragando metadata a los mensajes
      mensaje.forEach((mensaje) => {
        //agragando la propiedad pleaceholders que son los marcadores de posicion en donde se van a renplazar los datos
        mensaje.metadata = {
          keySimbolo: "#",
          des: "Recuerda que el simbolo # es un marcador de posicion donde se van a reemplazar los datos.",
        };
      });
  
      res.send(mensaje);
    } catch (error) {
      console.error("Error al obtener el mensaje de un template:", error);
      res.status(500).send({ success: false, message: "Error al obtener el mensaje de un template." });
    }
  };
  
  
  
  //funcion para crear un mensaje personalizado para enviar a los grupos.
  const crearNuevoTemplate = async (req, res) => {
    try {
      //extraer los datos del request
      const { nombre, mensaje } = req.body;
      //guardar el mensaje en la base de datos
      const idNewMensaje = await create(nombre, mensaje);
      //enviar el id del mensaje creado
      res.send(idNewMensaje[0]);
    } catch (error) {
      console.error("Error al guardar el mensaje de un template:", error);
      res.status(500).send({ success: false, message: "Error al guardar el mensaje de un template." });
    }
  };
  
  
  
  //funcion para la configuracion y activacion del cron job
  const mensajeProgramado = async (req, res) => {
    try {
      const { grupoId } = req.body;
      await cronMessage.iniciarCronJob();
      await cronMessage.enviarMensajeProgramado(grupoId);
   
      res.send({ success: true, message: "Mensaje enviado!" });
    } catch (error) {
      console.error("Error al enviar el mensaje programado:", error);
      res.status(500).send({ success: false, message: "Error al enviar el mensaje programado." });
    }
  };
  
  
  module.exports = { login, sendMessage, removeCache, listWsGroup ,listWsParticipants, loteriaMedellin ,mensajeTemplate, crearNuevoTemplate, mensajeProgramado, echoMessage, showQrCodeInHtml};
  
  