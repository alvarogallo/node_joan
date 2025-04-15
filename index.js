const express = require("express");
// const router = require("./routes/index"); // Ya no necesitamos importar esto directamente aquí
const morgan = require("morgan");
const cors = require("cors");
const app = express();
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const port = 6969;
const { initializeWhatsAppClient } = require("./whatsappClient"); // Importamos la inicialización
const apiRoutes = require("./routes/api"); // Importamos el router que creamos

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

// Usamos el router que importamos para manejar las rutas bajo el prefijo "/api"
app.use("/api", apiRoutes);

app.listen(port, () => {
    console.log(`Servicio escuchando en http://localhost:${port}`);
});