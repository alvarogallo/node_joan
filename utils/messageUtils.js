  // Función para extraer la información del remitente
  const extractSenderInfo = (msg) => {
    // Intentamos obtener el autor (si es un grupo) o el remitente (si es un chat individual)
    const senderId = msg.author ? msg.author : msg.from;
    // Dividimos para obtener solo el número antes del "@"
    const senderNumber = senderId.split('@')[0];
    return senderNumber;
  };

 

  // Función para procesar la respuesta de la API
  const processApiResponse = (responseData) => {
    // Verificamos si la estructura de respuesta_servidor.msg es un array
    if (responseData && responseData.msg && Array.isArray(responseData.msg)) {
      return responseData.msg.join('\n'); // Unimos los elementos con saltos de línea
    } else {
      console.warn('Estructura de respuesta de la API externa no esperada:', responseData);
      return "Oops! Recibí una respuesta inesperada del servicio. Inténtalo de nuevo más tarde."; // Mensaje amigable si la respuesta no es la esperada
    }
  };
module.exports = {
  extractSenderInfo,
  processApiResponse
};