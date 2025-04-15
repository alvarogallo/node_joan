exports.up = function(knex) {
    return knex.schema.createTable('templates_mensajes', (table) => {
      table.increments('id').primary();
      table.string('nombre').unique().notNullable();
      table.text('mensaje').notNullable();
      table.timestamps(true, true); // Añade las columnas created_at y updated_at
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('templates_mensajes');
  };