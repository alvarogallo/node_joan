const { Knex } = require("knex");
const { knex } = require("../../lib/connection_db");
const moment = require("moment");
const api_whatasapp = require("./../controllers/api_whatsapp");

// Función para obtener todos los recordatorios
async function obtenerRecordatorios(page, perPage, nombre) {
  let Query = knex("recordatorios")
    .select("*")
    .where("eliminado", "!=", "1", "or", "eliminado", "!=", "NULL")
    .paginate({
      perPage: perPage,
      currentPage: page,
    });

  try {
    const resultados = await Query;
    console.log(resultados);
    return resultados;
  } catch (error) {
    throw error;
  }
}

async function insertar(id_cliente) {
  //buscamos el mensaje plantilla que tenga configurado el cliente para saber que tipo de mensaje se le va a enviar
  try {
    let result = await knex.raw(`WITH mensaje_para_el_cliente AS (
      select template_mensaje.id as mensaje_template_id, cliente_mensaje_config.cliente_id as cliente_id , template_mensaje.body as mensajeEstablecido from cliente_mensaje_config 
      inner join template_mensaje on cliente_mensaje_config.mensaje_template_id = template_mensaje.id where cliente_id = ${id_cliente}
    )
    select * from mensaje_para_el_cliente`);

    //Si el cliente no tiene un mensaje seteado le agregamos el mensaje por defecto que siempre sera el de id 1
    if (result[0] == false) {
      //Si es vacio quiere decir que el cliente no tiene un mensaje establecido por defecto entonces. vamos a estalbecerle uno
      const mensajePorDefecto = await knex.raw(`insert into
      cliente_mensaje_config (cliente_id, mensaje_template_id)
    values
      ('${id_cliente}', '1');`);

      //Ya el cliente tiene un mensaje por defecto seteado, Ahora volvermos a consultarlo para extraer la plantilla que acabomos de ponerle
      result = await knex.raw(`WITH mensaje_para_el_cliente AS (
        select template_mensaje.id as mensaje_template_id, cliente_mensaje_config.cliente_id as cliente_id , template_mensaje.body as mensajeEstablecido from cliente_mensaje_config 
        inner join template_mensaje on cliente_mensaje_config.mensaje_template_id = template_mensaje.id where cliente_id = ${id_cliente}
      )
      select * from mensaje_para_el_cliente`);
    }

    //esto regresa el mensaje template del cliente. es decir el mensaje por defecto
    const mensajeTemplate = result[0][0].mensajeEstablecido;
    const mensaje_template_id = result[0][0].mensaje_template_id;

    //AHora que tenemos el mensaje template, debemos rellenarlo es decir meter las variables personalisadas, para eso buscamos los datos del cliente
    const cliente = await knex.raw(
      `SELECT * FROM clientes WHERE clientes.id = ${id_cliente}`
    );
    let { nombre, proximo_pago, dias_restante, wid } = cliente[0][0];
    //formateando el proximo pago
    proximo_pago = moment(proximo_pago).format("DD-MM-YYYY");

    const clienteData = {
      nombre,
      proximo_pago,
      dias: dias_restante,
      wid,
      mensaje_template_id,
    };

    // ya tenemos al  los datos del cliente
    // @cliente , @proximo_pago , @dias

    // Función para reemplazar los marcadores de posición con los valores de las variables
    function reemplazarMarcadoresDePosicion(texto, data) {
      // Crear una expresión regular que busque los marcadores de posición
      const regex = /@(\w+)/g;

      // Reemplazar los marcadores de posición con los valores del objeto
      return texto.replace(regex, (match) => data[match.slice(1)] || match);
    }
    //le pasamos los datos del cliente al que se le quiera enviar el mensaje
    const mensajeFinal = reemplazarMarcadoresDePosicion(
      mensajeTemplate,
      clienteData
    );
    //le decimos a la libreria que envie el mensaje
    const enviarMensaje = await api_whatasapp.sendMessage(wid, mensajeFinal);
    //finalmente insertamos el recordatorio en la tabla recordatorio
    const guardarRecordatorio = await knex("recordatorios").insert({
      mensaje_template_id: clienteData.mensaje_template_id,
      enviado_cliente_id: id_cliente,
      mensaje: mensajeFinal,
    });

    return guardarRecordatorio;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

module.exports = {
  obtenerRecordatorios,
  insertar,
};
