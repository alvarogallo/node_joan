const express = require("express");
const router = express.Router();
const { login, sendMessage, removeCache ,listWsGroup, listWsParticipants , loteriaMedellin , mensajeTemplate , crearNuevoTemplate, mensajeProgramado , echoMessage}  = require("../controllers"); // Importa los handlers de las rutas
const e = require("express");

// Definición de las rutas
router.get("/login", login);
// Just Router get
router.get("/clearCache", removeCache);
router.get("/wsGroups" , listWsGroup);
router.get("/loteriaMedellin" , loteriaMedellin);
router.get("/mensajeTemplate", mensajeTemplate);
// just router post
router.post("/grupo/participantes" , listWsParticipants);
router.post("/send", sendMessage);
router.post("/prueba", echoMessage);


router.post("/mensajeTemplate", crearNuevoTemplate);
router.post("/mensajeProgramado", mensajeProgramado);

module.exports = router;