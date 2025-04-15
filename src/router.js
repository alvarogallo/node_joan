const express = require("express");
const router = express.Router();
const clienteController = require("./controllers/clienteController");
const apiDoc = require("./controllers/apiDoc");
const recordatorioController = require("./controllers/recordatorios");
const configMensajecliente = require("./controllers/mensajesConfig");
const cronTask = require("./controllers/cronTask");
const wwebjs = require("./controllers/api_whatsapp");
//documentacion de la api
router.get("/", apiDoc.welcome);

// ruta para iniciar session con whtasapp y cargar los contactos
router.get("/login", wwebjs.login);

// rutas para los clientes y contactos de whatsapp
router.get("/contactos", clienteController.getAllContactos);
router.get("/cliente-activo", clienteController.getClientesActivos);
router.get("/cliente-inactivo", clienteController.getClientesInactivos);
router.get("/cliente-con-deuda", clienteController.getClientesConDeudas);
router.get("/cliente/:id", clienteController.getClienteById);
router.post("/cliente", clienteController.createCliente);
router.put("/cliente", clienteController.updateProximoPagoDiasRestantes);
router.put("/contratar-cliente/:id", clienteController.updateCliente);
router.delete("/cliente/:id", clienteController.deleteCliente);

//rutas para obtener y enviar los recordatorios
router.get("/recordatorio", recordatorioController.getRecordatorios);
router.post(
  "/enviar-recordatorio/cliente/:id_cliente",
  recordatorioController.enviarRecordatorio
);

//ruta para configurar el cronTask
router.get("/recordatorios-config", cronTask.obtenerConfig);

//rutas para la configuracion de mensajes personalizados de cada cliente
router.get("/config-cliente-mensaje", configMensajecliente.getConfigClientes);

module.exports = router;
