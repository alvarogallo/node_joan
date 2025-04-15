
exports.up = function(knex) {
    return knex.schema.createTable('grupos_destino', (table) => {
      table.increments('id').primary();
      table.string('nombre').nullable(); // Nombre descriptivo del grupo (opcional)
      table.string('wid').unique().notNullable(); // El ID del grupo (WhatsApp Group ID u otro identificador)
      table.timestamps(true, true);
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('grupos_destino');
  };