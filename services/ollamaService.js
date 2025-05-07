const axios = require('axios');
const { logger } = require('../utils/logger');

// Funcion que recibe los datos del cliente, mas el mensaje que el le envio al bot. Se reciben y se mandan a la api de ollama
const mensajeToOllama = async (DataUserObjet, msgBodyUser) => {

    /* ASi es la estrucutra del DataUserObjet
    {"msg":["Natillera:6776 Socio:67760695 Numero:27","Capital(Cuotas): 5,000","Prestamos: 400","Ganancias Personales: 120","Loterias Natillera:2518 Medellin:4266","Dolar COL 4185"]}
   */
    console.log("FUNCION MENSAJETOOLLAMA -> ", DataUserObjet);
    let dataUserParsed = DataUserObjet;



    // Creamos el objeto que enviaremos a la api de ollama
    const dataOllama = {
        "model": "gemma3:1b",
        "messages": [
            {
                "role": "system",
                "content": `"Eres un asistente virtual que responde via Whatsapp. Tu propósito principal es ofrecerle inforomacion a los usuarios sobre la natillera, (que es un fondo de ahorro colectivo) Y aca Tiene los datos basicos del usuario:" ${dataUserParsed} \n " Si detectas que los datos del usuario tienen un campo error dile de forma amable que ocurrio un problema al cargar tus datos, dile que muy probablemente se deba a que el no pertenece a ninguna natillera. y que le escriba a su adminstrador en caso de que si pertenzca a una natillera.`
            },
            {
                "role": "user",
                "content": `${msgBodyUser}`
            }
        ],
        "stream": false
    }


    try {
        // Ahora enviamos la informacion al servicio de ollama
        const response = await axios.post('http://localhost:11434/api/chat', dataOllama);
        console.log(response.data);
        return response.data;
    } catch (error) {
        logger.error("Ocurrio un problema al llamar a la IA..." + error)
        throw error;
    }


}


module.exports = {
    mensajeToOllama
};