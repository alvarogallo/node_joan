const knexConfig = require("../knexfile");

const knex = require("knex")(knexConfig);

// Verificar la conexión
knex
  .raw("SELECT 1+1 as resultado")
  .then((result) => {
    console.log("Conexion establecida con exito!");
  })
  .catch((err) => {
    console.error("Error al conectar con la base de datos:", err);
  });

//Fucnion insertar contactos!
function insertarContactos(contactos) {
  return knex("clientes")
    .insert(contactos)
    .then(() => {
      console.log("Registros insertados correctamente.");
      return true;
    })
    .catch((error) => {
      console.error("Error al insertar registros:", error);
      return false;
    });
}

// funcion para borrar todos los numeros de telefonos que sean de otro pais
function delNumerosDuplicados() {
  /*
  esta funcion lo que hace es eliminar de la base de datos contactos repetidos
  el metodo getContact de la liberira de whatsapp web js regresa algunos valores raros... 
  entonces apenas se inserte los contactos a la tabla clientes, se ejecuta esta funcion para depurar un 
  poco los contactos, ademas solo nos interesan los contactos de numero venezolano por eso solo
  borraremos los que sean diferentes de +58 para limpiar la data
  */
  return knex("clientes")
    .whereRaw("w_number_tlf NOT REGEXP '^58'")
    .del()
    .then((result) => {
      console.log(`${result} Contactos depurados`);
    })
    .catch((err) => {
      console.error("Error al depurar la lista de clientes filas:", err);
    });
}

module.exports = { knex, insertarContactos, delNumerosDuplicados };
