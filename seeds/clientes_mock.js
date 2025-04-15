/**
 * Datos mock de prueba
 */
const fs = require("fs");
const path = require("path");

exports.seed = async function (knex) {
  // Borramos todas los registros de la tabla
  await knex("clientes").del();

  // pasamos la ruta del sql con los datos de prueba
  const filePath = path.join(__dirname, "clientes_mock.sql");
  const sql = await fs.readFileSync(filePath, "utf8");
  // Ejecuta las consultas SQL en el archivo
  //console.log(sql);

  // Dividir el contenido del archivo SQL por punto y coma para obtener consultas individuales
  const consultas = sql.split(";");

  // Ejecutar cada consulta individualmente
  for (const consulta of consultas) {
    if (consulta.trim() !== "") {
      // Omitir consultas vacías
      await knex.raw(consulta);
    }
  }
};
