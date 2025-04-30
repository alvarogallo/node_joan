// Archivo: utils/senderUtils.js

/**
 * Extrae y busca información detallada del remitente de un mensaje.
 * Requiere acceso al objeto cliente para buscar el contacto y obtener el pushname.
 * Maneja casos donde el ID serializado puede faltar (mensajes del sistema, newsletters, etc.).
 * @param {Client} client - La instancia del cliente de whatsapp-web.js.
 * @param {Message} msg - El objeto de mensaje recibido.
 * @returns {Promise<{nombre: string, wid: object, numero: string, serializado: string}>} - Una promesa que resuelve con un objeto de detalles del remitente.
 */
const getSenderDetails = async (client, msg) => {
    // Logs de depuración
    // console.log('--- Debugging getSenderDetails ---');
    // console.log('msg.type:', msg.type);
    // console.log('msg.author:', msg.author); // Puede ser undefined
    // console.log('msg.from:', msg.from);     // Puede ser un objeto WUID o una string (ej: newsletter@...)
    // // Usamos optional chaining '?.' para acceder a _serialized de forma segura en caso de que sean objetos
    // console.log('msg.author?._serialized:', msg.author?._serialized);
    // console.log('msg.from?._serialized:', msg.from?._serialized);
    // console.log('-----------------------------------');


    // Intentar obtener el objeto WUID del remitente (puede ser undefined o una string)
    const potentialSenderWUID = msg.author || msg.from;

    // --- Intentar obtener el ID serializado string de forma robusta ---
    let senderSerialized = undefined;

    // Primero, intentar si potentialSenderWUID es un objeto y tiene _serialized
    if (typeof potentialSenderWUID === 'object' && potentialSenderWUID !== null && potentialSenderWUID._serialized) {
        senderSerialized = potentialSenderWUID._serialized;
    }
    // Si no se obtuvo así, y msg.from es una string, usar msg.from como fallback
    else if (typeof msg.from === 'string') {
        senderSerialized = msg.from; // Usar la string de msg.from como ID serializado (para newsletters, etc.)
        //console.warn(`_serialized faltante en WUID, usando msg.from como serializado: ${senderSerialized}`);
    }
    // Si no se obtuvo de ninguna de las dos formas, senderSerialized permanece undefined

    // Log para ver el valor final de senderSerialized
    console.log("Variable senderSerialized (resultado final): ", senderSerialized);
    // --- Fin: Obtener el ID serializado string ---


    // Inicializamos variables con valores por defecto
    let senderNumber = 'UnknownNumber';
    let senderName = 'UnknownUser';
    // potentialSenderWUID puede ser string, undefined o un objeto WUID


    // !!! Solo procedemos si hemos logrado obtener un ID serializado string usable !!!
    if (senderSerialized && typeof senderSerialized === 'string') {

        // Intentar obtener la parte numérica si el ID tiene el formato estándar con '@'
        if (senderSerialized.includes('@')) {
            senderNumber = senderSerialized.split('@')[0];
        } else {
            // Si no tiene '@', usamos la string completa como número (menos común)
            senderNumber = senderSerialized;
            console.warn(`ID serializado sin '@': ${senderSerialized}, usando como número.`);
        }


        // --- Intentar obtener el Pushname/Nombre del Contacto ---
        // client.getContactById puede fallar para IDs no estándar (newsletter, system, etc.)
        try {
            const contact = await client.getContactById(senderSerialized);

            if (contact) {
                if (contact.pushname) {
                    senderName = contact.pushname;
                } else if (contact.name) {
                    senderName = contact.name;

                } else if (contact.notifyName) {
                    senderName = contact.notifyName;
                }
                else {
                    senderName = senderNumber; // Fallback al número si no hay nombre
                }
            } else {
                // Contacto no encontrado (común para IDs no estándar)
                senderName = senderNumber; // Fallback al número si contacto no encontrado
                console.warn(`Contacto no encontrado para ID serializado: ${senderSerialized}`);
            }
        } catch (contactError) {
            // Error obteniendo contacto (también común para IDs no estándar)
            console.error(`Error al intentar obtener datos del contacto ${senderSerialized}:`, contactError);
            senderName = senderNumber; // Fallback al número en caso de error
        }
        // --- Fin: Obtener el Pushname/Nombre del Contacto ---

    } else {
        // Este bloque se ejecuta si senderSerialized es undefined o no es string
        console.warn(`No se pudo obtener un ID serializado string válido para el mensaje tipo: ${msg.type}. Usando valores por defecto.`);
        // senderNumber y senderName ya tienen los valores por defecto.
    }

    // Devolvemos un objeto con la información (usando los valores obtenidos o por defecto)
    return {
        nombre: senderName,      // Nombre obtenido o default
        wid: potentialSenderWUID, // El objeto o string original (puede ser string/undefined)
        numero: senderNumber,    // Solo el número o default
        serializado: senderSerialized // El ID serializado string obtenido (puede ser undefined)
    };
};

// Exportamos la función
module.exports = {
    getSenderDetails
};