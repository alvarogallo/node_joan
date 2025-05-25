    // Importar módulos necesarios
const { Client, LocalAuth, Status } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal"); // Para mostrar QR en la terminal (opcional, el QR también se guarda)
// Asumiendo que existen estos servicios y utilidades
const { handleTextMessage, handleImageMessage } = require("./services/messageProcessorService");
const { getSenderDetails } = require("./utils/senderUtils");
const fs = require('fs'); // Para manejar archivos (necesario para LocalAuth)
const path = require('path'); // Para manejar rutas de archivos
const logger  = require("./utils/logger");
// Cargar variables de entorno si usas un archivo .env
require('dotenv').config();

// --- Variables y Objetos de Gestión de Sesiones ---

// Directorio base para los archivos de sesión de LocalAuth
// LocalAuth creará subcarpetas aquí con el nombre 'session-' + clientId
const SESSIONS_DIR = './.wwebjs_auth';


/**
 * Obtiene los clientIds de las sesiones cuyos archivos existen físicamente en el directorio de LocalAuth.
 * Esto no garantiza que las sesiones estén actualmente cargadas en memoria ('sessions' object)
 * o que los archivos correspondientes a un 'ready' state sean válidos,
 * solo que LocalAuth ha creado una carpeta con ese nombre de sesión.
 * @returns {string[]} Un array de clientIds encontrados en el directorio de sesiones.
 *                    Retorna un array vacío si el directorio no existe o hay un error.
 */
function getClientIdsFromDisk() {
    const sessionIds = [];
    // Construye la ruta completa al directorio de sesiones
    // __dirname es la ruta del directorio del archivo actual (whatsappClient.js)
    const baseDir = path.join(__dirname, SESSIONS_DIR);

    // Verificar si el directorio de sesiones existe antes de intentar leerlo
    if (!fs.existsSync(baseDir)) {
        logger.warn(`getClientIdsFromDisk: Session directory not found: ${baseDir}`);
        return []; // Retorna un array vacío si el directorio no existe
    }

    try {
        // Leer el contenido del directorio base
        const entries = fs.readdirSync(baseDir);

        // Iterar sobre cada entrada en el directorio
        entries.forEach(entry => {
            const entryPath = path.join(baseDir, entry);
            try {
                // Obtener información del sistema sobre la entrada (si es un archivo, directorio, etc.)
                const stat = fs.statSync(entryPath);

                // LocalAuth guarda las sesiones en subcarpetas que empiezan con 'session-'
                // Verificamos si es un directorio Y si su nombre empieza con 'session-'
                if (stat.isDirectory() && entry.startsWith('session-')) {
                    // Extraer el clientId del nombre de la carpeta (quitarle 'session-')
                    const clientId = entry.substring('session-'.length);
                    // Opcional: Podrías añadir aquí una validación básica del clientId
                    sessionIds.push(clientId);
                }
            } catch (entryErr) {
                logger.error(`getClientIdsFromDisk: Error accessing entry ${entry}:`, entryErr);
                // Continuar con la siguiente entrada si hay un error al leer una
            }
        });

    } catch (error) {
        logger.error(`getClientIdsFromDisk: Error reading session directory ${baseDir}:`, error);
        // Retorna un array vacío si hay un error general al leer el directorio
        return [];
    }

    return sessionIds;
}



















// Objeto para almacenar la información de cada cliente/sesión en memoria
// La clave será el código arbitrario (el clientId)
// Cada entrada contendrá: { client: ClientInstance, status: string, phoneNumber: string | null, qr: string | null }
const sessions = {}; // <-- Este es el objeto central para almacenar las sesiones

// --- Funciones de Gestión de Sesiones ---

/**
 * Carga datos adicionales de usuario (si los guardas) por su clientId.
 * Puedes adaptar esto para cargar desde una DB si es necesario.
 * @param {string} clientId
 * @returns {object}
 */
function loadUserData(clientId) {
    // Implementa lógica para cargar datos adicionales si los necesitas
    // Por ahora, retorna un objeto vacío
    return {};
}

/**
 * Guarda datos adicionales de usuario (si los guardas) por su clientId.
 * Puedes adaptar esto para guardar en una DB si es necesario.
 * @param {string} clientId
 * @param {object} userData
 */
function saveUserData(clientId, userData) {
    // Implementa lógica para guardar datos adicionales si los necesitas
    // Por ahora, no hace nada
}


/**
 * Crea o recupera una instancia de cliente de whatsapp-web.js para un código dado.
 * Adjunta todos los manejadores de eventos a la nueva instancia (si se crea).
 * @param {string} clientId - El código arbitrario (ej. 8 dígitos) que identifica la sesión.
 * @returns {Client} La instancia del cliente (sin inicializar aún si es nueva).
 */
function getOrCreateClient(clientId) {
    // 1. Verificar si ya tenemos una instancia para este clientId en memoria (en el objeto sessions)
    if (sessions[clientId] && sessions[clientId].client) {
        logger.log(`[${clientId}] Returning existing client instance.`);
        // Si ya existe y tiene una instancia de cliente, la devolvemos
        return sessions[clientId].client;
    }

    // 2. Si no existe una instancia, vamos a crear una nueva

    logger.info(`[${clientId}] Creating new client instance.`);

    // Cargar datos existentes para este usuario si los hay (si implementaste loadUserData)
    const userData = loadUserData(clientId);

    // 3. Inicializar la entrada para este cliente en el objeto sessions si no existe
    // Esto asegura que tenemos un lugar donde guardar el estado, QR, etc.
    if (!sessions[clientId]) {
         sessions[clientId] = {
            client: null, // La instancia del cliente se asignará a continuación
            userData: userData, // Datos adicionales del usuario/bot (si implementaste loadUserData)
            status: 'initializing', // Estado inicial
            phoneNumber: null,
            qr: null,
        
        };
    } else {
        // Si la entrada existía pero no tenía una instancia (ej. después de un reset parcial)
        // Limpiar estados anteriores y asegurar que no haya instancia vieja
         sessions[clientId].client = null;
         sessions[clientId].status = 'initializing';
         sessions[clientId].qr = null
         sessions[clientId].phoneNumber = null;
    }


    // 4. Crear la nueva instancia de whatsapp-web.js Client
    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: clientId // *** Usamos el código arbitrario como clientId para LocalAuth ***
            // Esto hará que whatsapp-web.js guarde/cargue la sesión en .wwebjs_auth/session-clientId
        }),
        // Mantener la configuración de webVersionCache y puppeteer si las necesitas
        webVersionCache: {
          type: "remote",
          remotePath:
            "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
        },
        puppeteer: {
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        },
        // Otras opciones si las necesitas
    });

    // 5. Asignar la nueva instancia del cliente al objeto sessions
    sessions[clientId].client = client;

    // 6. --- Adjuntar manejadores de eventos a ESTA nueva instancia ---
    // Es crucial adjuntar los listeners aquí, justo después de crear la instancia.
    // Usamos el closure clientId para referenciar la sesión correcta en el objeto sessions
    // dentro de cada manejador.

    client.on('qr', (qr) => {
        sessions[clientId].status = 'qr_received';
        sessions[clientId].qr = qr; // Almacenar el string del QR original

        logger.log(`[${clientId}] QR STRING RECEIVED`);
        
        // *** MOSTRAR EL TOKEN/STRING DEL QR EN LA TERMINAL ***
        console.log(`\n=== TOKEN QR PARA CLIENTE ${clientId} ===`);
        console.log(qr); // ← AQUÍ SE MUESTRA EL STRING/TOKEN DEL QR
        console.log(`=== FIN TOKEN QR ===\n`); 
        //qrcodeTerminal.generate(qr, { small: true }); // Mostrar en terminal (opcional)
    });



    client.on('authenticated', () => {
        sessions[clientId].status = 'authenticated';
        sessions[clientId].qr = null; // Limpiar el QR una vez autenticado
        sessions[clientId].qrBase64 = null; // Limpiar el QR Base64
        logger.log(`[${clientId}] AUTHENTICATED`);
    });

    client.on('auth_failure', msg => {
        sessions[clientId].status = 'auth_failure';
        sessions[clientId].qr = null; // Limpiar el QR en caso de fallo
        sessions[clientId].phoneNumber = null;
        logger.error(`[${clientId}] AUTH FAILURE`, msg);
    });

    client.on('ready', () => {
        sessions[clientId].status = 'ready';
        sessions[clientId].qr = null; // Limpiar el QR una vez listo
        sessions[clientId].qrBase64 = null; // Limpiar el QR una vez listo

        client.getMe().then(me => {
             // me.user contiene el número (ej. 1234567890@c.us -> 1234567890)
             sessions[clientId].phoneNumber = me.user;
             logger.log(`[${clientId}] Client is ready! Phone Number: ${sessions[clientId].phoneNumber}`);
        }).catch(err => {
            logger.error(`[${clientId}] Error getting phone number on ready:`, err);
            logger.log(`[${clientId}] Client is ready, but could not get phone number.`);
        });
        logger.log(`[${clientId}] Client is ready! 🎉🎉🎉`);

        // Aquí puedes empezar a usar el cliente para enviar/recibir mensajes
        // Por ejemplo, enviar un mensaje de bienvenida:
        // client.sendMessage('some_chat_id@c.us', `¡Hola! Soy el bot del cliente ${clientId}.`);
    });

    // --- Router principal de mensajes entrantes (Adaptado para múltiples clientes) ---
    // Este callback se ejecuta por CADA mensaje que llega
    // El 'client' dentro de este closure es la instancia específica que recibió el mensaje
    client.on('message', async (msg) => {
        // Mensaje recibido!
        // Sabemos de qué cliente es gracias al closure clientId
        logger.info(`[${clientId}] <- ha recibido un mensaje.`);

        let senderInfo = null;
        let displayIdentifier = 'Unknown Sender';

        try {
             // --- Obtener detalles del remitente ---
             // Llama a la función de utilidad para obtener nombre, número, etc.
             // Pasamos la instancia específica del cliente que recibió el mensaje
             senderInfo = await getSenderDetails(client, msg); // Usa 'client' de este closure

             // Una vez que senderInfo se ha obtenido,
             // podemos crear un identificador más seguro para logs o replies
             displayIdentifier = senderInfo?.nombre || senderInfo?.numero || msg.from?._serialized || msg.from || 'Unknown Sender';
             logger.log(`--->🚩 Mensaje recibido 🚩 <---- \nCliente ID: ${clientId},\nTipo: ${msg.type},\nFrom: ${msg.from},\nNombre de Usuario: ${displayIdentifier},\nAuthor: ${msg.author},\nBody: ${msg.body ? msg.body.substring(0, 50) + '...' : '[No body]'}\n ---------\n`);


             // --- Decidir qué handler llamar basado en el tipo de mensaje ---
             // Usamos un switch para manejar diferentes tipos de mensajes de forma clara
             switch (msg.type) {
               case 'chat': // Tipo para mensajes de texto normales
                 logger.log(`Router: Ruta a handleTextMessage para cliente ${clientId}, remitente: "${displayIdentifier}"`); 
                 // Llama al handler específico para mensajes de texto
                 // Pasa la instancia específica del cliente que recibió el mensaje
                 await handleTextMessage(client, msg, senderInfo); // Usa 'client' de este closure
                 break;

               case 'image': // Tipo para mensajes con imagen
                 logger.log(`Router: Ruta a handleImageMessage para cliente ${clientId}, remitente: ${displayIdentifier}`);
                 // Llama al handler específico para mensajes de imagen
                 // Pasa la instancia específica del cliente que recibió el mensaje
                 await handleImageMessage(client, msg, senderInfo); // Usa 'client' de este closure
                 break;

               // --- Añade más casos aquí para otros tipos de mensajes si los manejas ---
               // Asegúrate de pasar 'client', 'msg', 'senderInfo' a tus handlers
               // case 'video':
               //   logger.log(`Router: Ruta a handleVideoMessage para ${displayIdentifier}`);
               //   await handleVideoMessage(client, msg, senderInfo);
               //   break;
               // case 'sticker':
               //   logger.log(`Router: Ruta a handleStickerMessage para ${displayIdentifier}`);
               //   await handleStickerMessage(client, msg, senderInfo);
               //   break;
               // case 'document':
               //    logger.log(`Router: Ruta a handleDocumentMessage para ${displayIdentifier}`);
               //    await handleDocumentMessage(client, msg, senderInfo);
               //    break;
               // case 'ptt':
               //    logger.log(`Router: Ruta a Notas de voz para ${displayIdentifier}`);
               //    await handleAudioMessage(client, msg, senderInfo);
               //    break;
               // case 'location':
               //    logger.log(`Router: Ruta a handleLocationMessage para ${displayIdentifier}`);
               //    await handleLocationMessage(client, msg, senderInfo);
               //    break;
               default:
                 // Este bloque maneja cualquier otro tipo de mensaje no listado arriba
                 logger.log(`Router: Tipo de mensaje ${msg.type} no manejado para cliente ${clientId}, recibido de ${displayIdentifier}.`);
                 break;
             }
        } catch (error) {
            logger.error(`Router: Error general al procesar mensaje de ${displayIdentifier} (Cliente ID: ${clientId}, Tipo: ${msg.type}):`, error);
        }
    });

    // --- Otros manejadores de eventos si los necesitas ---
    client.on('state', (state) => {
        logger.log(`[${clientId}] State changed: ${state}`);
        // sessions[clientId].status = state; // Opcional: mantener el estado sincronizado
    });

    client.on('change_state', state => {
        logger.log(`[${clientId}] Change state: ${state}`);
    });

    client.on('disconnected', (reason) => {
        sessions[clientId].status = 'disconnected';
        sessions[clientId].qr = null; // Limpiar QR al desconectar
        sessions[clientId].phoneNumber = null; // Limpiar número al desconectar
        sessions[clientId].qrBase64 = null; // Limpiar el QR Base64
        logger.log(`[${clientId}] Client was disconnected!`, reason);
        // Aquí podrías decidir si intentar reconectar automáticamente:
        // client.initialize();
    });


    // 7. No inicializamos el cliente aquí. La inicialización se hará bajo demanda
    // cuando se llame a initializeClient(clientId) (desde la ruta /login).

    // 8. Retornar la instancia del cliente (recién creada o recuperada)
    return client;
}

/**
 * Obtiene la información de una sesión por su código.
 * @param {string} clientId - El código del cliente.
 * @returns {object | undefined} La información de la sesión o undefined si no existe.
 */
function getSessionInfo(clientId) {
    return sessions[clientId];
}

/**
 * Inicia el proceso de inicialización para un cliente dado su código.
 * Si el cliente ya existe y está listo, no hace nada.
 * @param {string} clientId - El código del cliente.
 */
function initializeClient(clientId) {
    const session = sessions[clientId];
    if (session && session.client) {
        if (session.status === 'ready') {
            logger.log(`[${clientId}] Client is already ready.`);
        } else if (session.status === 'initializing') {
             logger.log(`[${clientId}] Client is already initializing.`);
        }
        else {
             logger.log(`[${clientId}] Initializing client...`);
             session.client.initialize(); // Inicia el proceso de conexión/autenticación
        }
    } else {
        logger.warn(`[${clientId}] Client instance not found for initialization. Creating and initializing.`);
        // Si la instancia no existe, la creamos y luego la inicializamos
        getOrCreateClient(clientId).initialize();
    }
}

/**
 * Reinicia/elimina una sesión por su código. Detiene el cliente y borra sus archivos de sesión.
 * @param {string} clientId - El código del cliente.
 */
async function resetClientSession(clientId) {
    const session = sessions[clientId];
    if (session && session.client) {
        logger.log(`Attempting to reset session for ${clientId}`);
        try {
            // Desconectar el cliente
            // Usamos un timeout por si destroy() se queda colgado
            const destroyPromise = session.client.destroy();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Client destroy timed out')), 10000) // 10 segundos de timeout
            );
            await Promise.race([destroyPromise, timeoutPromise]);
            logger.log(`Client ${clientId} destroyed.`);

            // Eliminar los archivos de sesión local
            const sessionDir = path.join(__dirname, '.wwebjs_auth', `session-${clientId}`);
             if (fs.existsSync(sessionDir)) {
                logger.log(`Removing session files for ${clientId} at ${sessionDir}`);
                 fs.rmSync(sessionDir, { recursive: true, force: true });
             }

            // Eliminar la entrada de la sesión del objeto en memoria
            delete sessions[clientId];
            logger.log(`Session data for ${clientId} removed from memory.`);

            // No volvemos a crear el cliente aquí; se creará de nuevo cuando se llame a /login con ese código.

        } catch (error) {
            logger.error(`Error resetting session for ${clientId}:`, error);
             // Si destroy falla o hay otro error, al menos intenta eliminar los archivos y la entrada en memoria
             const sessionDir = path.join(__dirname, '.wwebjs_auth', `session-${clientId}`);
             if (fs.existsSync(sessionDir)) {
                logger.log(`Attempting to remove session files after error for ${clientId}`);
                 fs.rmSync(sessionDir, { recursive: true, force: true });
             }
             delete sessions[clientId];
        }
    } else {
        logger.warn(`Client ${clientId} not found or not initialized for reset.`);
    }
}

/**
 * Obtiene todos los códigos de cliente actualmente cargados en memoria.
 * @returns {string[]} Array de clientIds.
 */
function getAllClientIds() {
    return Object.keys(sessions);
}

/**
 * Obtiene la información de todas las sesiones cargadas en memoria.
 * @returns {object} Objeto con la información de todas las sesiones.
 */
function getAllSessionsInfo() {
    // Retorna una copia para evitar modificaciones externas directas
    const allSessions = {};
    for (const clientId in sessions) {
         allSessions[clientId] = {
            status: sessions[clientId].status,
            phoneNumber: sessions[clientId].phoneNumber,
            qr: sessions[clientId].qr ? 'available' : 'not_available', // No exponer el QR directamente aquí
            // Añadir otros datos relevantes si los tienes en userData
        };
    }
    return allSessions;
}


// --- Exportar las funciones necesarias para ser usadas por el servidor web (server.js) ---
module.exports = {
    // No exportamos initializeWhatsAppClient, isSessionIniciada, getQrCode, getClient, setQrCode
    // ya que eran para el modo de una sola sesión.
    getSessionInfo,
    initializeClient, // server.js llamará a esta para iniciar un cliente
    resetClientSession,
    getAllClientIds,
    getAllSessionsInfo,
    getClientIdsFromDisk
   
};
