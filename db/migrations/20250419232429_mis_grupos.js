/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('mis_grupos', (table) => {
        table.increments('id').primary();
        table.string('nombre').nullable(); // Nombre descriptivo del grupo (opcional)
        table.string('wid').unique().notNullable(); // El ID del grupo (WhatsApp Group ID u otro identificador)
      });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('mis_grupos');
};
