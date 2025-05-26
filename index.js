const express = require("express");
// const router = require("./routes/index"); // Ya no necesitamos importar esto directamente aquí
const morgan = require("morgan");
const cors = require("cors");
const app = express();
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const port = 6969;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const apiRoutes = require("./routes/api"); // Importamos el router que creamos
const path = require('path');
const logger = require("./utils/logger");
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
    const tokenFromHeader = authHeader && authHeader.split(' ')[1]; // Bearer <token>
    const tokenFromCookie = req.cookies && req.cookies.api_key; // Obtiene la cookie 'api_key'
    console.log(tokenFromCookie)
    console.log(tokenFromHeader)

    if (blockedIPs[ip] && blockedIPs[ip] > Date.now()) {
        return res.status(429).json({ message: 'Demasiadas peticiones fallidas. Tu IP ha sido bloqueada temporalmente.' });
    }

    let token = tokenFromHeader || tokenFromCookie;

    if (token == null) {
        failedAttempts[ip] = (failedAttempts[ip] || 0) + 1;
        if (failedAttempts[ip] >= MAX_FAILED_ATTEMPTS) {
            blockedIPs[ip] = Date.now() + BLOCK_DURATION;
            delete failedAttempts[ip];
            console.log(`IP bloqueada: ${ip}`);
            return res.status(429).json({ message: 'Demasiadas peticiones fallidas. Tu IP ha sido bloqueada temporalmente.' });
        }
        return res.status(401).json({ message: 'Token no encontrado' });
    }

    const secretKey = process.env.SECRET_KEY;

    if (token === secretKey) {
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

// *** CONFIGURAR MIDDLEWARES PRIMERO ***
app.use(cookieParser());

// *** CONFIGURAR EJS ANTES DE LAS RUTAS ***
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// *** CONFIGURAR SWAGGER CON NAVEGACIÓN ***
app.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customSiteTitle: "WhatsApp Bot API - 📱 Ir a /sesiones para ver sesiones activas"
}));

// *** DEFINIR RUTAS DESPUÉS DE CONFIGURAR EJS ***
app.get('/', (req, res) => {
    res.render('welcome');
});

// Ruta para mostrar la página de sesiones
app.get('/sesiones', (req, res) => {
    res.render('dashboard/sessions');
});

// *** RESTO DE MIDDLEWARES ***
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
// piiendo la contrase;a para poder acceder a la api desde el navegador y cualquier sitio
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/verificar-clave', (req, res) => {
    const claveIngresada = req.body.clave;
    const claveCorrecta = process.env.SECRET_KEY;

    if (claveIngresada === claveCorrecta) {
        res.cookie('api_key', claveIngresada, { httpOnly: true, secure: true });
        // La clave es correcta, redirige a la documentación
        res.redirect('/panel');
    } else {
        res.send('Clave incorrecta. Intente nuevamente.');
    }
});
// Agregar DESPUÉS de la ruta app.get('/sesiones', ...)
app.get('/panel', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Panel de Control - WhatsApp Bot</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    background: linear-gradient(135deg, #25D366, #128C7E);
                    min-height: 100vh; 
                    padding: 20px; 
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .container { 
                    background: white; 
                    padding: 50px; 
                    border-radius: 15px; 
                    max-width: 700px; 
                    width: 100%;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    text-align: center;
                }
                h1 { 
                    color: #333; 
                    margin-bottom: 10px; 
                    font-size: 2.5rem; 
                }
                .subtitle { 
                    color: #666; 
                    margin-bottom: 40px; 
                    font-size: 1.1rem; 
                }
                .btn { 
                    display: inline-block; 
                    background: linear-gradient(135deg, #25D366, #128C7E);
                    color: white; 
                    padding: 20px 40px; 
                    margin: 15px; 
                    text-decoration: none; 
                    border-radius: 10px; 
                    font-weight: bold; 
                    font-size: 1.2rem;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);
                    min-width: 250px;
                }
                .btn:hover { 
                    transform: translateY(-3px); 
                    box-shadow: 0 8px 25px rgba(37, 211, 102, 0.4);
                }
                .btn-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    align-items: center;
                }
                @media (max-width: 600px) {
                    .container { padding: 30px 20px; }
                    h1 { font-size: 2rem; }
                    .btn { min-width: 200px; padding: 15px 30px; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🤖 WhatsApp Bot API</h1>
                <p class="subtitle">Panel de Control y Navegación</p>
                
                <div class="btn-grid">
                    <a href="/" class="btn">🏠 Página Principal</a>
                    <a href="/sesiones" class="btn">📱 Monitor de Sesiones</a>
                    <a href="/doc" class="btn">📚 Documentación API</a>
                </div>
            </div>
        </body>
        </html>
    `);
});
// **Aplica el middleware de autenticación a todas las rutas bajo /api**
app.use("/api", apiRoutes);
//app.use("/api", authenticateToken,apiRoutes);

const hostname = '0.0.0.0'; 

app.listen(port, hostname, () => { // Pasa el hostname como segundo argumento
    logger.log(`Servicio escuchando en http://${hostname}:${port}`); // Actualiza el mensaje de log para reflejar que escucha en 0.0.0.0
    logger.info(`La aplicación Node.js está escuchando en el puerto ${port}`);
});