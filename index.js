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

app.use(cookieParser());
app.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: `
        .swagger-ui .topbar { 
            background-color: #25D366; 
        }
        .custom-nav {
            background: linear-gradient(135deg, #25D366, #128C7E);
            padding: 15px;
            text-align: center;
            margin-bottom: 20px;
            border-radius: 8px;
        }
        .nav-button {
            background: white;
            color: #25D366;
            border: none;
            padding: 12px 24px;
            margin: 0 10px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .nav-button:hover {
            background: #f8f9fa;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        .nav-title {
            color: white;
            margin: 0 0 15px 0;
            font-size: 1.2rem;
        }
    `,
    customSiteTitle: "WhatsApp Bot API - Documentación",
    customfavIcon: "/favicon.ico",
    customJs: `
        window.onload = function() {
            // Crear barra de navegación personalizada
            const topbar = document.querySelector('.swagger-ui .topbar');
            if (topbar) {
                const customNav = document.createElement('div');
                customNav.className = 'custom-nav';
                customNav.innerHTML = \`
                    <h3 class="nav-title">🤖 WhatsApp Bot API - Panel de Control</h3>
                    <a href="/" class="nav-button">🏠 Inicio</a>
                    <a href="/sesiones" class="nav-button">📱 Monitor de Sesiones</a>
                    <a href="/doc" class="nav-button">📚 Documentación</a>
                \`;
                
                // Insertar después del topbar
                topbar.parentNode.insertBefore(customNav, topbar.nextSibling);
            }
        }
    `
}));

app.set('view engine', 'ejs');
// Opcional: Especificar la carpeta donde se encontrarán tus vistas (.ejs)
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// **RUTAS - Después de configurar EJS**
app.get('/', (req, res) => {
    res.render('welcome');
});

// **Ruta para mostrar la página de sesiones - MOVIDA AQUÍ**
app.get('/sesiones', (req, res) => {
    res.render('dashboard/sessions');
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
// piiendo la contrase;a para poder acceder a la api desde el navegador y cualquier sitio
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/verificar-clave', (req, res) => {
    const claveIngresada = req.body.clave;
    const claveCorrecta = process.env.SECRET_KEY;

    if (claveIngresada === claveCorrecta) {
        res.cookie('api_key', claveIngresada, { httpOnly: true, secure: true });
        // La clave es correcta, redirige a la documentación
        res.redirect('/doc');
    } else {
        res.send('Clave incorrecta. Intente nuevamente.');
    }
});

// **Aplica el middleware de autenticación a todas las rutas bajo /api**
app.use("/api", apiRoutes);
//app.use("/api", authenticateToken,apiRoutes);

const hostname = '0.0.0.0'; 

app.listen(port, hostname, () => { // Pasa el hostname como segundo argumento
    logger.log(`Servicio escuchando en http://${hostname}:${port}`); // Actualiza el mensaje de log para reflejar que escucha en 0.0.0.0
    logger.info(`La aplicación Node.js está escuchando en el puerto ${port}`);
});