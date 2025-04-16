const express = require("express");
const router = express.Router();
const { login, sendMessage, removeCache ,listWsGroup, listWsParticipants , loteriaMedellin , mensajeTemplate , crearNuevoTemplate, mensajeProgramado , echoMessage , showQrCodeInHtml}  = require("../controllers"); // Importa los handlers de las rutas

// Definición de las rutas
router.get("/isLogin", login);
// Just Router get
router.get("/clearCache", removeCache);
router.get("/grupos" , listWsGroup);
router.get("/loteriaMedellin" , loteriaMedellin);
router.get("/mensajes/plantillas", mensajeTemplate);
router.get('/qr', showQrCodeInHtml);
// just router post
router.post("/grupo/participantes" , listWsParticipants);
router.post("/enviar/mensaje", sendMessage);
router.post("/prueba", echoMessage); 


router.post("/mensajes/plantillas-crear", crearNuevoTemplate);
router.post("/enviar", mensajeProgramado);

module.exports = router;