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



// Middleware de autenticación
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (token == null) {
        return res.status(401).json({ message: 'Token no encontrado' });
    }

    // Aquí debes comparar el token con tu clave secreta
    const secretKey = process.env.SECRET_KEY; // Carga la clave secreta desde las variables de entorno

    if (token === secretKey) {
        next(); // El token es válido, permite el acceso a la siguiente middleware o ruta
    } else {
        return res.status(403).json({ message: 'Token inválido' }); // 403 Forbidden si el token no coincide
    }
};



// Inicializamos el cliente de WhatsApp
initializeWhatsAppClient();

app.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
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


// Ruta para mostrar el código QR
app.get('/qr', (req, res) => {
    const qr = getQrCode();
    if (qr) {
      // Genera una imagen SVG del código QR y la envía como respuesta
      const QRCode = require('qrcode');
      QRCode.toDataURL(qr, (err, url) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error al generar el código QR');
        }
        res.send(`<img src="${url}" alt="QR Code">`);
      });
    } else {
      res.send('El código QR aún no se ha generado. Por favor, espera...');
    }
  });
  

// **Aplica el middleware de autenticación a todas las rutas bajo /api**
app.use("/api", authenticateToken, apiRoutes);

app.listen(port, () => {
    console.log(`Servicio escuchando en http://localhost:${port}`);
});