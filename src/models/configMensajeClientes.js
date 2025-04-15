const { Knex } = require("knex");
const { knex } = require("../../lib/connection_db");

// funcion para devolver la configuracion de los mensajes de cada cleinte
async function getAllConfigMensajes() {
  try {
    const allconfigMensajesCliente =
      await knex.raw(`Select cliente_mensaje_config.id,cliente_id,clientes.nombre,template_mensaje.body as mensaje_establecido,
    template_mensaje.id as mensaje_template_id
    from cliente_mensaje_config inner join clientes on cliente_id = clientes.id
    inner join template_mensaje on mensaje_template_id = template_mensaje.id
    `);
    return allconfigMensajesCliente[0];
  } catch (error) {
    throw error;
  }
}

module.exports = { getAllConfigMensajes };
