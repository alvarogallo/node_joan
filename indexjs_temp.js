const { Client, LocalAuth } = require("whatsapp-web.js");
const {
  knex,
  insertarContactos,
  delNumerosDuplicados,
} = require("./lib/connection_db");

const qrcode = require("qrcode-terminal");

const client = new Client({
  webVersionCache: {
    type: "remote",
    remotePath:
      "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
  },
  authStrategy: new LocalAuth(),
});

client.once("ready", () => {
  console.log("conetion con el whastapp del cliente establecida!!");
  // Checamos si la db esta vacia...

  knex
    .select()
    .table("clientes")
    .then((clientes) => {
      if (1 >= clientes.length) {
        // si la db esta vacia intentamos llamar a la db y agregar a todos los contactos
        console.log("Cargando contactos a la db...");

        // obteniendo una lista copleta de los contactos del cliente conectado con el metodo getContact
        client
          .getContacts()
          .then((listContact) => {
            // Filtrar las propiedades necesarias y mapear los objetos a un nuevo formato
            const contactosFiltrados = [];
            listContact.forEach((contacto) => {
              if (
                contacto.isMyContact == false ||
                contacto.isUser == false ||
                contacto.number == undefined ||
                contacto.name == undefined ||
                contacto.number == null ||
                contacto.name == null ||
                contacto == null
              ) {
              } else {
                contactosFiltrados.push({
                  wid: contacto.id._serialized,
                  nombre: contacto.name,
                  w_number_tlf: contacto.number,
                  pushName: contacto.pushname,
                });
              }
            });
            // Ahora mandamos estos registros a la base de datos, a la tabla de clientes

            insertarContactos(contactosFiltrados)
              .then((exito) => {
                // Muchas veces los contactos nos llegan duplicados por eso eliminamos contantos que esten duplicados
                delNumerosDuplicados();

                console.log("Contactos Cargados!");
              })
              .catch((error) => {
                console.error("Error al insertar contactos:", error);
              });
          })
          .catch((err) => console.log(err));
      } else {
        // si ya estan cargados no se hace nada mas.
        console.log("Welcome!");
      }
    })
    .catch((err) => err);
});

// When the client received QR-Code
client.on("qr", (qr) => {
  console.log("QR RECEIVED", qr);
  qrcode.generate(qr, { small: true });
});

client.initialize();

module.exports = client;
