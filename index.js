const express = require("express");
// const router = require("./routes/index"); // Ya no necesitamos importar esto directamente aquí
const morgan = require("morgan");
const cors = require("cors");
const app = express();
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const port = 6969;
const { initializeWhatsAppClient , getQrCode } = require("./whatsappClient"); // Importamos la inicialización
const apiRoutes = require("./routes/api"); // Importamos el router que creamos
require('dotenv').config();


// Midelware para bloquear ip si intentan muchas peticiones de forma fallida
const failedAttempts = {}; // Objeto para almacenar el número de intentos fallidos por IP
const blockedIPs = {}; // Objeto para almacenar las IPs bloqueadas y su tiempo de bloqueo

const MAX_FAILED_ATTEMPTS = 10;
const BLOCK_DURATION = 60 * 60 * 1000; // 1 hora en milisegundos
// Chekear si la ip de la cual nos estan haciendo la peticion esta bloqueada
const checkBlockedIP = (req, res, next) => {
  const ip = req.ip; // Obtiene la dirección IP del cliente

  if (blockedIPs[ip] && blockedIPs[ip] > Date.now()) {
      return res.status(429).json({ message: 'Demasiadas peticiones fallidas. Tu IP ha sido bloqueada temporalmente.' });
  }

  next();
};

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const ip = req.ip;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (blockedIPs[ip] && blockedIPs[ip] > Date.now()) {
      return res.status(429).json({ message: 'Demasiadas peticiones fallidas. Tu IP ha sido bloqueada temporalmente.' });
  }

  if (token == null) {
      failedAttempts[ip] = (failedAttempts[ip] || 0) + 1;
      if (failedAttempts[ip] >= MAX_FAILED_ATTEMPTS) {
          blockedIPs[ip] = Date.now() + BLOCK_DURATION;
          delete failedAttempts[ip]; // Limpiamos los intentos fallidos al bloquear
          // Opcional: Puedes agregar un log aquí para registrar el bloqueo de la IP
          console.log(`IP bloqueada: ${ip}`);
          return res.status(429).json({ message: 'Demasiadas peticiones fallidas. Tu IP ha sido bloqueada temporalmente.' });
      }
      return res.status(401).json({ message: 'Token no encontrado' });
  }

  const secretKey = process.env.SECRET_KEY;

  if (token === secretKey) {
      // Si el token es válido, reinicia los intentos fallidos para esta IP
      delete failedAttempts[ip];
      next();
  } else {
      failedAttempts[ip] = (failedAttempts[ip] || 0) + 1;
      if (failedAttempts[ip] >= MAX_FAILED_ATTEMPTS) {
          blockedIPs[ip] = Date.now() + BLOCK_DURATION;
          delete failedAttempts[ip];
          console.log(`IP bloqueada: ${ip}`);
          return res.status(429).json({ message: 'Demasiadas peticiones fallidas. Tu IP ha sido bloqueada temporalmente.' });
      }
      return res.status(403).json({ message: 'Token inválido' });
  }
};



// Inicializamos el cliente de WhatsApp
initializeWhatsAppClient();

app.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// **Nueva ruta para redirigir la raíz a /doc**
app.get('/', (req, res) => {
  res.redirect('/doc');
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    morgan(":method :url :status :res[content-length] - :response-time ms")
);
app.use(
    //Solo respondo peticiones provenientes de cualquier origen del localhost
    cors({
        origin: "*",
    })
);


// **Aplica el middleware de autenticación a todas las rutas bajo /api**
app.use("/api", authenticateToken,authenticateToken, apiRoutes);

app.listen(port, () => {
    console.log(`Servicio escuchando en http://localhost:${port}`);
});