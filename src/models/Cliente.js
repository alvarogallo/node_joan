const { Knex } = require("knex");
const { knex } = require("../../lib/connection_db");

// Función para obtener todos los clientes
async function obtenerClientes(page, perPage, nombre) {
  let Query = knex("clientes")
    .select("*")
    .where("eliminado", "!=", "1")
    .paginate({
      perPage: perPage,
      currentPage: page,
    });

  if (nombre != null || nombre != undefined) {
    Query = knex("clientes")
      .select("*")
      .whereILike("nombre", `%${nombre}%`)
      .paginate({
        perPage: perPage,
        currentPage: page,
      });
    // console.log(Query.toSQL().toNative());
  }
  try {
    // esta sera la consulta principal paginada, me devuelve un array de metadata. junto a uno de data
    const clientes = await Query;
    // Consulta para contar el total de clientes
    const totalClientes = await knex("clientes").count("id as total");

    // Consulta para contar el total de clientes activos e inactivos
    const totalClientesActivos = await knex("clientes")
      .count("id as total_activos")
      .where("cliente_activo", 1);
    const totalClientesInactivos = await knex("clientes")
      .count("id as total_inactivos")
      .where("cliente_activo", 0);

    // Combinanado los resultados
    const respuesta = {
      ...clientes,
      totalClientes: totalClientes[0].total,
      totalClientesActivos: totalClientesActivos[0].total_activos,
      totalClientesInactivos: totalClientesInactivos[0].total_inactivos,
    };
    return respuesta;
  } catch (error) {
    throw error;
  }
}

// Función para obtener un cliente por su ID
async function obtenerClientePorId(clienteId) {
  try {
    const cliente = await knex("clientes").where({ id: clienteId }).first();
    return cliente;
  } catch (error) {
    throw error;
  }
}

async function actualizarDatosClientes() {
  /* Funcion para actualizar el campo proximo pago, dias restants y par determinar si el cliente 
est aactivo o incativo esta query Calcula si la fecha actual esta entre la fecha de contratacion 
es decir la fecha de pago inicial. Y la fecha del proximo pago. cada cliente que se consiedere activo
tiene que tener su fecha en la cual realizo el pago de su mensualidad. Entonces se calcula el
*/

  // Primera consulta: Actualizar 'proximo_pago'
  try {
    await knex.raw(
      "UPDATE clientes SET proximo_pago = DATE_ADD(fecha_contratacion, INTERVAL 1 MONTH)"
    );
    console.log("actualizacion de proximo_pago completada");
    // Segunda consulta: Actualizar 'dias_restante'
    await knex.raw(
      "UPDATE clientes SET dias_restante = DATEDIFF(proximo_pago, CURDATE())"
    );
    console.log("actualizacion de dias_restantes completada");

    // Tercera consulta: Actualizar 'cliente_activo' basado en una subconsulta
    await knex.raw(`WITH ClienteConSubActiva AS (
    SELECT id
    FROM clientes
    WHERE CURDATE() BETWEEN fecha_contratacion AND proximo_pago
    )
    UPDATE clientes SET cliente_activo = CASE WHEN id IN (SELECT id FROM ClienteConSubActiva) THEN 1 ELSE 0 END`);
    console.log("actualizacion de cliente_activo completada");
  } catch (error) {
    console.error("Error en la actualización de ", error);
  }
}

async function obtenerClientesActivos() {
  try {
    /*Funcion para obtener solo los clientes activos*/
    const clientesActivos = await knex("clientes")
      .where("cliente_activo", 1)
      .select("*");
    return clientesActivos;
  } catch (error) {
    throw error;
  }
}

async function obtenerClientesInactivos() {
  try {
    /*Funcion para obtener solo los clientes inactivos*/
    const clientesActivos = await knex("clientes")
      .where("cliente_activo", 0)
      .select("*");
    return clientesActivos;
  } catch (error) {
    throw error;
  }
}

async function obtenerClientesConDeudas() {
  try {
    /*Funcion para obtener solo los clientes Que deben o tienen dias de retraso*/
    const clientesConDeudas = await knex("clientes")
      .where("dias_restante", "<=", 0)
      .select("*");
    return clientesConDeudas;
  } catch (error) {
    throw error;
  }
}

async function crearCliente(nombre, numero, fecha_contratacion) {
  /** Funcion para insertar un nuevo cliente en la base de datos
   * Ojo existe un campo que se llama wid Que es el identifacor que le da
   * whasapp a cada cliente No lo podemos dejar vacio
   * este campo nos permite enviar mensaje atrabez de whasapp
   * asi que para ello vamos a crear ese campo para cada cleinte
   * nuevo que se ingrese manualmente
   */

  try {
    let wid = numero + "@c.us";
    const queryInsertNuevoCliente = knex("clientes").insert({
      wid: wid,
      nombre: nombre,
      w_number_tlf: numero,
      fecha_contratacion: fecha_contratacion,
    });
    return queryInsertNuevoCliente;
  } catch (error) {
    throw error;
  }
}

async function actualizar(clienteToUpdate, id) {
  try {
    //console.log(clienteToUpdate);
    //si la query falla deberia saltar al aerror
    const resultQuery = await knex("clientes")
      .where("id", id)
      .update(clienteToUpdate);

    console.log(resultQuery);
    if (resultQuery == 1) {
      //Si la actualizacion tuvo exito automaticamente actualizamos todos los datos de los clientes. refrescamos de forma global
      await actualizarDatosClientes();
      return id;
    }
    return resultQuery;
  } catch (error) {
    throw error;
  }
}

async function deleteCliente(id) {
  try {
    const deleteCliente = await knex("clientes")
      .where("id", "=", id)
      .update({ eliminado: true });
    return deleteCliente;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  obtenerClientes,
  obtenerClientePorId,
  actualizarDatosClientes,
  obtenerClientesActivos,
  crearCliente,
  actualizar,
  deleteCliente,
  obtenerClientesInactivos,
  obtenerClientesConDeudas,
};
