// const express = require("express");
// const router = express.Router();
// const { login, sendMessage, removeCache ,listWsGroup, listWsParticipants , loteriaMedellin , mensajeTemplate , crearNuevoTemplate, mensajeProgramado , echoMessage , showQrCodeInHtml, listaGruposDestino, crearGrupoDestino}  = require("../controllers"); // Importa los handlers de las rutas
// const { loginClient,getQrCodeController, getAllSessionsInfo , deleteSession} = require("../controllers/multiClient");
// // Definición de las rutas
// router.get("/isLogin", login);
// // Just Router get
// router.get("/clearCache", removeCache);
// router.get("/grupos" , listWsGroup);
// router.get("/loteriaMedellin" , loteriaMedellin);
// router.get("/mensajes/plantillas", mensajeTemplate);

// router.get('/grupos/destinos', listaGruposDestino);
// router.get('/sesiones', getAllSessionsInfo);
// // just router post
// router.post("/grupo/participantes" , listWsParticipants);
// router.post("/enviar/mensaje", sendMessage);
// router.post("/prueba", echoMessage); 
// router.post("/grupos/destinos", crearGrupoDestino);
// //Rutas para iniciar sessiones
// router.post("/login", loginClient)
// //ruta de pollin del qr
// router.post('/qr', getQrCodeController);


// router.post("/mensajes/plantillas-crear", crearNuevoTemplate);
// router.post("/mensajesProgramados/activar", mensajeProgramado);

// router.delete("/sesiones", deleteSession);

// module.exports = router;

const express = require("express");
const router = express.Router();
const { login, sendMessage, removeCache ,listWsGroup, listWsParticipants , loteriaMedellin , mensajeTemplate , crearNuevoTemplate, mensajeProgramado , echoMessage , showQrCodeInHtml, listaGruposDestino, crearGrupoDestino}  = require("../controllers"); // Importa los handlers de las rutas
const { loginClient, getQrCodeController, getAllSessionsInfo, deleteSession} = require("../controllers/multiClient");

// Definición de las rutas
router.get("/isLogin", login);
// Just Router get
router.get("/clearCache", removeCache);
router.get("/grupos" , listWsGroup);
router.get("/loteriaMedellin" , loteriaMedellin);
router.get("/mensajes/plantillas", mensajeTemplate);

router.get('/grupos/destinos', listaGruposDestino);
router.get('/sesiones', getAllSessionsInfo);

// just router post
router.post("/grupo/participantes" , listWsParticipants);
router.post("/enviar/mensaje", sendMessage);
router.post("/prueba", echoMessage); 
router.post("/grupos/destinos", crearGrupoDestino);

//Rutas para iniciar sessiones
router.post("/login", loginClient)
//ruta de pollin del qr
router.post('/qr', getQrCodeController);

router.post("/mensajes/plantillas-crear", crearNuevoTemplate);
router.post("/mensajesProgramados/activar", mensajeProgramado);

// *** RUTA PARA ELIMINAR SESIONES - CAMBIADA A DELETE METHOD ***
router.delete("/sesiones", deleteSession);

module.exports = router;