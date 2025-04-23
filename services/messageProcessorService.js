const { extractSenderInfo, processApiResponse } = require("../utils/messageUtils");
const fs = require('fs');
const path = require('path');
const axios = require('axios'); // Importa la librería axios
require('dotenv').config(); // Carga las variables de entorno desde el archivo .env



// Función para llamar a la API externa
const callExternalApi = async (apiUrl, phone, msgBody) => {
  try {
    const response = await axios.post(apiUrl, {
      phone: phone,
      msg: msgBody
    });
    return response.data; // Devolvemos los datos de la respuesta
  } catch (error) {
    console.error('Error al llamar a la API externa:', error.message);
    // Propagamos el error para que sea manejado por la función que llama
    throw new Error('Error al comunicarse con el servicio externo.');
  }
};

/*
*  Funcion principal controlar los emsanejs entrantes, los mandas a la api externa de Alvaro
para ser procesados y luego la respuesta de la api externa se envia al cliente.
*/
const handleIncomingMessage = async (msg) => {
  try {
    // 1. Extraer información del remitente o la persona que nos escribio.
    const senderNumber = extractSenderInfo(msg);
    console.log(`Número: ${senderNumber} - Mensaje: ${msg.body}`);

    // 1.5 Procesar la imagen si es una imagen
    // --- Verificar si el mensaje es una imagen ---
    if (msg.type === 'image') {
      // Si es una imagen, llamamos a la nueva función y terminamos el procesamiento aquí
      // para este tipo de mensaje.
      await handleIncomingImage(msg);
      return; // Detiene el procesamiento para mensajes de imagen
    }


    // 2. Validar URL de la API externa
    const apiUrl = process.env.API_SERVICE_URL;
    if (!apiUrl) {
      console.error('URL de la API externa no configurada.');
      //msg.reply("Lo siento, no puedo procesar tu solicitud en este momento. Estamos trabajando en ello.");
      return; // Detiene la ejecución
    }

    // 3. Llamar a la API externa
    const apiResponseData = await callExternalApi(apiUrl, senderNumber, msg.body);

    // 4. Procesar la respuesta de la API
    const responseMessage = processApiResponse(apiResponseData);

    // 5. Enviar respuesta al cliente
    await msg.reply(responseMessage);
    console.log(`Respuesta enviada a ${senderNumber}: ${responseMessage}`);

  } catch (error) {
    console.error('Error en el handler de mensaje:', error.message);
    // Puedes decidir si quieres enviar un mensaje de error al usuario en caso de errores inesperados
    // msg.reply("Hubo un error interno al procesar tu solicitud.");
  }
};



// OJO funcion para detectar y procesar las imagenes que me llegan, estas imagenes se van a guardar en el directorio public/pagos
// luego se va a llamar a otro servicio externo para procesar esta imagen, Pero por ahora solo se va a guardar en el directorio
// Nota el nombre de la imagen de debe guardar con el formato pago_{timestamp}_{identificador_del_remitente}.{extension}
const handleIncomingImage = async (msg) => { // Aceptar 'client' como primer parámetro
  console.log('¡Mensaje entrante detectado como IMAGEN!');
  try {
      if (msg.hasMedia) {
          console.log('El mensaje tiene datos de medios adjuntos. Descargando...');

          const mediaData = await msg.downloadMedia();

          if (mediaData) { // Verificar si la descarga fue exitosa
              console.log('Datos de la imagen obtenidos.');
              console.log('Tipo MIME:', mediaData.mimetype);
              console.log('Nombre de archivo original (si disponible):', mediaData.filename || 'N/A');

              // --- Obtener identificador serializado y Pushname ---
              // Obtenemos el ID del remitente. En grupos, msg.author es el usuario; en DMs, msg.from es el usuario.
              // Usamos msg.author || msg.from para obtener el ID del usuario en ambos casos.
              const senderWUID = msg.author || msg.from;
              const senderSerialized = senderWUID._serialized; // Este es el ID serializado (ej: 584121234567@c.us)

              let senderPushname = 'Unknown'; // Valor por defecto si no se puede obtener el pushname
              try {
                  // Obtener el objeto Contact usando el ID serializado y el cliente
                  const contact = await client.getContactById(senderSerialized);
                  if (contact) {
                     // El pushname es la propiedad que buscas
                     if (contact.pushname) {
                          senderPushname = contact.pushname;
                     } else if (contact.name) {
                         // A veces, si el pushname no está configurado, el nombre de contacto guardado por el bot puede estar en 'name'
                         senderPushname = contact.name;
                         console.log(`Pushname no disponible para ${senderSerialized}, usando nombre de contacto: ${senderPushname}`);
                     } else {
                         console.log(`No se pudo obtener pushname ni nombre para ${senderSerialized}`);
                         senderPushname = 'NoName'; // Indicar que no se encontró un nombre
                     }
                  } else {
                       console.log(`No se encontró el contacto para ${senderSerialized}`);
                       senderPushname = 'ContactNotFound'; // Indicar que el contacto no fue encontrado
                  }
              } catch (contactError) {
                  console.error(`Error al obtener datos del contacto ${senderSerialized}:`, contactError);
                  senderPushname = 'ErrorFetchingName'; // Indicar que hubo un error al intentar obtener el nombre
              }
              console.log(`Identificador Serializado: ${senderSerialized}, Pushname obtenido: ${senderPushname}`);
              // --- Fin: Obtener identificador serializado y Pushname ---


              // --- Código para GUARDAR la imagen ---

              // ... (define uploadDir y asegúrate de que existe - igual que antes) ...
              const uploadDir = path.join(__dirname, '..', 'public', 'pagos');
              if (!fs.existsSync(uploadDir)) {
                  console.log(`Creando directorio: ${uploadDir}`);
                  fs.mkdirSync(uploadDir, { recursive: true });
              }

              // 3. Genera un nombre de archivo incluyendo el identificador serializado y el pushname
              const mimeType = mediaData.mimetype;
              const fileExtension = mimeType.split('/')[1];

              // Limpiar el identificador serializado y el pushname para nombres de archivo seguros
              // Reemplazar caracteres no permitidos por guiones bajos
              const cleanSenderSerialized = senderSerialized.replace(/[^a-zA-Z0-9]/g, '_');
              const cleanSenderPushname = senderPushname.replace(/[^a-zA-Z0-9]/g, '_');


              // Formato del nombre: pago_{identificador_serializado_limpio}_{pushname_limpio}.{extension}
              const filename = `pago_${cleanSenderSerialized}_${cleanSenderPushname}.${fileExtension}`;
              const filePath = path.join(uploadDir, filename);

              // 4. Convierte la string base64 a Buffer.
              const imageBuffer = Buffer.from(mediaData.data, 'base64');

              // 5. Escribe el archivo.
              fs.writeFile(filePath, imageBuffer, (err) => {
                  if (err) {
                      console.error('Error al guardar la imagen:', err);
                      // ... notificar al usuario si falla el guardado del archivo ...
                      // msg.reply('Lo siento, hubo un error al guardar la imagen del pago.');
                  } else {
                      console.log(`Imagen de pago guardada correctamente en: ${filePath}`);
                      // ... notificar al usuario si el archivo se guardó bien ...
                      // msg.reply('¡Imagen de pago recibida y guardada para revisión!');

                      // --- Aquí podrías luego integrar el OCR ---
                      // Llama a la función de OCR con la ruta del archivo guardado:
                      // detectText(filePath); // Asegúrate de que esta función exista y acepte la ruta

                      // O si prefieres el OCR con Base64, hazlo aquí justo DESPUÉS de guardar, usando mediaData.data
                      // console.log('\nLlamando al OCR de Google con string Base64...');
                      // try {
                      //    const textoExtraido = await detectTextFromBase64(mediaData.data); // Necesitas esta función
                      //    console.log('Texto extraído por OCR (desde Base64):', textoExtraido);
                      //    // await msg.reply(`Texto en la imagen: ${textoExtraido}`); // Responder con el texto
                      // } catch (ocrError) {
                      //    console.error('Error durante el OCR (desde Base64):', ocrError);
                      //    // msg.reply('No pude leer el texto de la imagen.');
                      // }

                  }
              });

              // --- Fin del código para GUARDAR la imagen ---


          } else {
              console.log('Error: No se pudieron descargar los datos del medio.');
              // ... notificar al usuario si falla la descarga ...
              // msg.reply('Lo siento, no pude descargar esta imagen.');
          }


      } else {
          console.log('Mensaje de imagen sin datos de medios inesperadamente.');
      }
  } catch (error) {
      console.error('Error general al procesar el mensaje de imagen:', error);
      // ... notificar al usuario sobre un error interno ...
      // msg.reply('Hubo un error interno al procesar la imagen.');
  }
};




module.exports = handleIncomingMessage;