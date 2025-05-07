// Importar las funciones necesarias desde el archivo principal de WhatsApp Client
// Asegúrate de que la ruta '../whatsappClient' sea correcta según la ubicación de este archivo
const {
    getSessionInfo,     // Para obtener el estado de la sesión
    initializeClient,   // Para iniciar el proceso de conexión/autenticación
} = require("../whatsappClient"); // <-- Importamos desde tu archivo whatsappClient.js

/**
 * Maneja la petición POST a /login/:codeSession.
 * Verifica el estado del cliente y lo inicia si es necesario.
 * Retorna { login: true } si ya está listo, o { login: false, status: ... } si necesita QR o está en otro estado.
 * @param {object} req - Objeto de petición de Express.
 * @param {object} res - Objeto de respuesta de Express.
 */
const loginClient = async (req, res) => {
    // 1. Obtener el código de sesión de los parámetros de la URL
    const codeSession = req.params.codeSession;

    // Validación básica del parámetro de ruta
    if (!codeSession) {
        return res.status(400).json({ error: 'Debes enviarme un codigo de session en la URL (ej. /login/12345678)' });
    }

    // TODO: Opcional: Validar el formato del codeSession (ej. 8 dígitos)
    if (!/^\d{8}$/.test(codeSession)) {
        return res.status(400).json({ error: 'Formato de CodeSession inválido. Debe ser de 8 dígitos.' });
    }

    console.log(`Codigo recibido para login: ${codeSession}`);

    try {
        // 2. Obtener la información actual de la sesión usando la función importada
        let sessionInfo = getSessionInfo(codeSession);

        // 3. Verificar si el cliente ya existe y está en estado 'ready'
        if (sessionInfo && sessionInfo.status === 'ready') {
            console.log(`[${codeSession}] Client is already ready. Returning login: true.`);
            // Si ya está listo, devolvemos éxito
            return res.json({ login: true, status: 'ready', phoneNumber: sessionInfo.phoneNumber });
        }

        // 4. Si no está listo o no existe, iniciar el proceso de conexión/autenticación
        console.log(`[${codeSession}] Client is not ready or not found. Initiating process.`);

        // Iniciar el proceso de inicialización usando la función importada
        // getOrCreateClient es llamado INTERNAMENTE por initializeClient si es necesario.
        initializeClient(codeSession);

        // 5. Obtener la información de la sesión DE NUEVO, ya que el estado pudo haber cambiado
        // initializeClient pudo haber creado la entrada en 'sessions' si no existía.
        sessionInfo = getSessionInfo(codeSession);

        // 6. Devolver una respuesta indicando que el login no es inmediato y cuál es el estado actual
        // El frontend usará el 'status' para saber si debe esperar el QR.
        console.log(`[${codeSession}] Initialization started. Current status: ${sessionInfo?.status || 'unknown'}. Returning login: false.`);
        return res.json({
            login: false,
            status: sessionInfo?.status || 'initializing', // Devolver el estado actual (probablemente 'initializing' o 'qr_received')
            message: 'Client not ready. Please check status or wait for QR.'
        });

    } catch (error) {
        console.error(`Error processing login for CodeSession ${codeSession}:`, error);
        // En caso de error interno, devolver un error 500
        res.status(500).json({ error: 'Internal server error during login process' });
    }
};



/**
 * Maneja la petición GET a /qr/:code.
 * Busca la sesión por el código, y devuelve el string de datos del código QR si está disponible,
 * o un estado indicando que no.
 * @param {object} req - Objeto de petición de Express.
 * @param {object} res - Objeto de respuesta de Express.
 */const getQrCodeController = (req, res) => {
    // 1. Obtener el código de sesión de los parámetros de la URL
    // Asegúrate de que el nombre del parámetro en la URL coincida con el de la ruta (ej. /qr/:code)
    const code = req.params.codeSession; // Usamos 'code' si la ruta es /qr/:code

    // Validación básica del parámetro de ruta
    if (!code) {
        return res.status(400).json({ error: 'Debes enviar un codigo de session en la URL (ej. /qr/12345678)' });
    }

    // TODO: Opcional: Validar el formato del code (ej. 8 dígitos)
    if (!/^\d{8}$/.test(code)) {
        return res.status(400).json({ error: 'Formato de código inválido. Debe ser de 8 dígitos.' });
    }

    console.log(`Received QR request for code: ${code}`);

    // 2. Obtener la información de la sesión usando la función importada
    const sessionInfo = getSessionInfo(code);

    // 3. Verificar si la sesión existe y si el string de datos del QR está disponible
    if (!sessionInfo) {
        // Si no hay información de sesión en memoria, puede que el código sea incorrecto
        // o que el proceso de login no se haya iniciado para este código.
        console.log(`[${code}] Session info not found for QR request.`);
        return res.status(404).json({ error: 'Session not found for this code. Please initiate login first.' });
    }

    // Con la lógica en whatsappClient.js, el string QR se almacena
    // cuando el estado es 'qr_received'.
    // Ahora verificamos si el estado es 'qr_received' Y si la propiedad .qr tiene un valor
    if (sessionInfo.status === 'qr_received' && sessionInfo.qr) {
        // Si la sesión existe, está en estado 'qr_received' y tiene el string del QR
        console.log(`[${code}] QR string found. Returning.`);
        return res.json({
            status: sessionInfo.status, // Devolver el estado actual ('qr_received')
            qr: sessionInfo.qr, // <-- Devolver el STRING de datos del QR
            message: 'QR code data available.',
        });
    } else {
        // Si la sesión existe pero el string del QR no está en estado 'qr_received'
        // (ej. 'initializing', 'authenticated', 'ready', 'disconnected')
        // o el string del QR aún no se ha generado/almacenado
        console.log(`[${code}] QR string not available yet. Current status: ${sessionInfo.status}`);
        return res.status(202).json({ // 202 Accepted - La petición es válida, pero el resultado no está listo
            status: sessionInfo.status,
            message: 'QR code data not available yet. Please try again.',
        });
    }
};


//MOstrando la vista para el login.
showLoginView = async (req, res) => {

   // Obtener el protocolo (http o https)
   const protocol = req.protocol;
   // Obtener el host (nombre de dominio o IP + puerto)
   const host = req.get('host'); // req.get('host') es preferible
    console.log("HOST ME DICE QUE ES: " + host);
   // Construir la URL base del servidor
   const serverBaseUrl = `${protocol}://${host}`;
    res.render('loginClient' , { serverBaseUrl: serverBaseUrl });
};

// Exportar la función controladora para ser utilizada en la definición de rutas de Express
module.exports = {
    loginClient,
    getQrCodeController, // <-- Exportamos la nueva función controladora
    showLoginView
};
