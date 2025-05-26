// Importar las funciones necesarias desde el archivo principal de WhatsApp Client
// Asegúrate de que la ruta '../whatsappClient' sea correcta según la ubicación de este archivo

const {
    getSessionInfo,     // Para obtener el estado de la sesión
    initializeClient,   // Para iniciar el proceso de conexión/autenticación
    getClientIdsFromDisk,
    resetClientSession  // <-- Agregar esta importación si existe
} = require("../whatsappClient");


const fs = require('fs'); // Para manejar archivos (necesario para LocalAuth)
const path = require('path'); // Para manejar rutas de archivos

const logger = require("../utils/logger");

// *** MODO TESTING ***
const TESTING_MODE = process.env.TESTING_MODE === 'true';

const getAllSessionsInfo = async (req, res) => {
    if (TESTING_MODE) {
        console.log('[TESTING MODE] getAllSessionsInfo - Retornando datos mock');
        const mockSessions = [
            { id: '12345678', status: 'ready', phoneNumber: 'TEST_PHONE_1' },
            { id: '87654321', status: 'qr_received', phoneNumber: null },
            { id: '11111111', status: 'initializing', phoneNumber: null }
        ];
        return res.json(mockSessions);
    }
    
    const sessions = getClientIdsFromDisk();
    return res.json(sessions);
}

/**
 * Maneja la petición POST a /login/:codeSession.
 * Verifica el estado del cliente y lo inicia si es necesario.
 * Retorna { login: true } si ya está listo, o { login: false, status: ... } si necesita QR o está en otro estado.
 * @param {object} req - Objeto de petición de Express.
 * @param {object} res - Objeto de respuesta de Express.
 */
const loginClient = async (req, res) => {
    // 1. Obtener el código de sesión de los parámetros de la URL
    const codeSession = req.body.codeSession || undefined;

    // Validación básica del parámetro de ruta
    if (!codeSession) {
        return res.status(400).json({ error: 'Debes enviarme un codigo de session en el body (ej. 12345678)' });
    }

    // TODO: Opcional: Validar el formato del code (ej. mínimo 8 dígitos numéricos)
    if (!/^\d{8,}$/.test(codeSession)) {
        return res.status(400).json({ error: 'Formato de código inválido. Debe tener al menos 8 dígitos y contener solo números.' });
    }

    console.log(`Codigo recibido para login: ${codeSession}`);

    try {
        // *** MODO TESTING ***
        if (TESTING_MODE) {
            console.log(`[${codeSession}] MODO TESTING ACTIVADO - WhatsApp deshabilitado`);
            
            // Simular diferentes estados para testing basado en el último dígito del code
            const lastDigit = parseInt(codeSession.slice(-1));
            
            if (lastDigit % 3 === 0) {
                // Simular login exitoso
                return res.json({
                    login: true,
                    status: 'ready',
                    phoneNumber: `TEST_PHONE_${codeSession}`,
                    message: 'TESTING MODE - Login simulado exitoso'
                });
            } else if (lastDigit % 3 === 1) {
                // Simular necesidad de QR
                return res.json({
                    login: false,
                    status: 'qr_received',
                    message: 'TESTING MODE - QR requerido (simulado)'
                });
            } else {
                // Simular inicializando
                return res.json({
                    login: false,
                    status: 'initializing',
                    message: 'TESTING MODE - Inicializando (simulado)'
                });
            }
        }

        // *** CÓDIGO NORMAL DE WHATSAPP (cuando TESTING_MODE = false) ***
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
 */
const getQrCodeController = (req, res) => {
    // 1. Obtener el código de sesión de los parámetros de la URL
    // Asegúrate de que el nombre del parámetro en la URL coincida con el de la ruta (ej. /qr/:code)
    const code = req.body.codeSession || undefined; // Usamos 'code' si la ruta es /qr/:code

    // Validación básica del parámetro de ruta
    if (!code) {
        return res.status(400).json({ error: 'Debes enviar un codigo de session en el BODY (ej. /qr/12345678)' });
    }

    // TODO: Opcional: Validar el formato del code (ej. mínimo 8 dígitos numéricos)
    if (!/^\d{8,}$/.test(code)) {
        return res.status(400).json({ error: 'Formato de código inválido. Debe tener al menos 8 dígitos y contener solo números.' });
    }

    console.log(`Received QR request for code: ${code}`);

    // *** MODO TESTING ***
    if (TESTING_MODE) {
        console.log(`[${code}] MODO TESTING - QR simulado`);
        
        // Generar QR mock realista
        const mockQR = `2@ABCDEFGH123456789IJKLMNOP,QRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz+/=_MOCK_QR_FOR_TESTING_${code}_${Date.now()}`;
        
        return res.json({
            status: 'qr_received',
            qr: mockQR,
            message: 'TESTING MODE - QR simulado generado. Puedes usar este string para generar QR en tu cliente.'
        });
    }

    // *** CÓDIGO NORMAL DE WHATSAPP ***
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

// Reemplazar la función deleteSession completa en multiClient.js

// Reemplazar la función deleteSession completa en multiClient.js

const deleteSession = async (req, res) => {
    // 1. Primero extraer codeSession
    const codeSession = req.body.codeSession || undefined;
    
    // 2. Debug logs DESPUÉS de declarar la variable
    console.log('=== DEBUG DELETE SESSION ===');
    console.log('TESTING_MODE:', TESTING_MODE);
    console.log('codeSession:', codeSession);
    console.log('Request body:', req.body);
    
    // 3. Validaciones
    if (!codeSession) {
        return res.status(400).json({ 
            error: 'Debes enviar un codigo de session en el BODY (ej. {"codeSession": "12345678"})' 
        });
    }

    // Validar formato del código
    if (!/^\d{8,}$/.test(codeSession)) {
        return res.status(400).json({ 
            error: 'Formato de código inválido. Debe tener al menos 8 dígitos y contener solo números.' 
        });
    }

    console.log(`[DELETE SESSION] Intentando eliminar sesión: ${codeSession}`);

    try {
        // *** MODO TESTING ***
        if (TESTING_MODE) {
            console.log(`[${codeSession}] MODO TESTING - Eliminación simulada (pero real para testing)`);
            
            // En modo testing, simular delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Intentar eliminar archivos reales incluso en modo testing para debug
            const sessionDir = path.join(__dirname, '../.wwebjs_auth/', `session-${codeSession}`);
            console.log('Buscando archivos en:', sessionDir);
            
            let filesExisted = false;
            if (fs.existsSync(sessionDir)) {
                console.log('Archivos encontrados, eliminando...');
                fs.rmSync(sessionDir, { recursive: true, force: true });
                filesExisted = true;
                console.log('Archivos eliminados en modo testing');
            } else {
                console.log('No se encontraron archivos para eliminar');
            }
            
            return res.json({ 
                success: true, 
                message: `TESTING MODE - Sesión ${codeSession} eliminada`,
                deletedSession: codeSession,
                mode: 'testing',
                filesExisted: filesExisted,
                searchPath: sessionDir
            });
        }

        // *** CÓDIGO NORMAL - ELIMINACIÓN REAL ***
        let sessionDeleted = false;
        let filesDeleted = false;

        console.log('Modo producción - eliminación real');

        // 1. Intentar eliminar de memoria si tenemos la función
        try {
            if (typeof getSessionInfo === 'function') {
                const sessionInfo = getSessionInfo(codeSession);
                
                if (sessionInfo && sessionInfo.client) {
                    console.log(`[${codeSession}] Destruyendo cliente activo...`);
                    await sessionInfo.client.destroy();
                    console.log(`[${codeSession}] Cliente destruido exitosamente`);
                    sessionDeleted = true;
                }
            }
        } catch (clientError) {
            console.warn(`[${codeSession}] Advertencia al destruir cliente:`, clientError.message);
        }

        // 2. Eliminar archivos de sesión del disco
        const sessionDir = path.join(__dirname, '../.wwebjs_auth/', `session-${codeSession}`);
        console.log('Buscando archivos en:', sessionDir);
        
        if (fs.existsSync(sessionDir)) {
            console.log(`[${codeSession}] Eliminando archivos en: ${sessionDir}`);
            fs.rmSync(sessionDir, { recursive: true, force: true });
            filesDeleted = true;
            console.log(`[${codeSession}] Archivos eliminados exitosamente`);
        } else {
            console.log(`[${codeSession}] No se encontraron archivos de sesión`);
            
            // Listar directorio padre para debug
            const parentDir = path.join(__dirname, '../.wwebjs_auth/');
            if (fs.existsSync(parentDir)) {
                const files = fs.readdirSync(parentDir);
                console.log('Archivos en .wwebjs_auth:', files);
            } else {
                console.log('El directorio .wwebjs_auth no existe');
            }
        }

        // 3. Verificar si se eliminó algo
        if (!filesDeleted && !sessionDeleted) {
            return res.status(404).json({ 
                success: false,
                error: `Sesión ${codeSession} no encontrada`,
                codeSession: codeSession,
                searchPath: sessionDir
            });
        }

        // 4. Respuesta de éxito
        const message = filesDeleted 
            ? `Sesión ${codeSession} eliminada correctamente`
            : `Sesión ${codeSession} eliminada de memoria (no había archivos)`;

        console.log(`[${codeSession}] Eliminación completada: ${message}`);
        
        return res.json({ 
            success: true, 
            message: message,
            deletedSession: codeSession,
            filesDeleted: filesDeleted,
            sessionDeleted: sessionDeleted,
            mode: 'production'
        });

    } catch (error) {
        console.error(`[${codeSession}] Error durante eliminación:`, error);
        
        return res.status(500).json({ 
            success: false,
            error: `Error al eliminar sesión ${codeSession}: ${error.message}`,
            codeSession: codeSession
        });
    }
};

// Exportar la función controladora para ser utilizada en la definición de rutas de Express
module.exports = {
    loginClient,
    getQrCodeController, // <-- Exportamos la nueva función controladora
    getAllSessionsInfo,
    deleteSession
};