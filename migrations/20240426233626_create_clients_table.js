/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable("clientes", function (table) {
      table.increments("id").primary();
      table
        .string("wid", 100)
        .notNullable()
        .collate("utf8mb4_0900_ai_ci")
        .comment("id del contacto de whasaap");
      // Define otras columnas aquí...
      table
        .string("nombre", 100)
        .nullable()
        .comment(
          "nombre del contacto del whasapp puede ser cualquier nombre comun"
        );
      table
        .string("w_number_tlf", 100)
        .nullable()
        .comment("Número de teléfono del WhatsApp")
        .unique();

      table
        .date("fecha_contratacion")
        .nullable()
        .comment(
          "Esta fecha representa el día y el mes en el cual adquirieron el servicio. Es decir, que desde esta fecha me pagaron el primer mes"
        );
      table
        .string("pushName", 100)
        .nullable()
        .comment("Nombre público del contacto");
      table
        .date("proximo_pago")
        .nullable()
        .comment(
          "Esta fecha represtena la fecha limite en donde se debe pagar el servicio"
        );
      table
        .integer("dias_restante")
        .nullable()
        .comment("Días restantes del servicio");
      table
        .integer("cliente_activo")
        .defaultTo(0)
        .comment(
          "Este campo determina si el cliente tiene una una mensaalidad o susbcrition activa"
        );
      table
        .boolean("eliminado")
        .defaultTo(0)
        .comment(
          "Con esto determinaoms si el cliente fue eliminado por el usuario"
        );
    })
    .createTable("recordatorios", function (table) {
      table.increments("id");
      table.timestamp("fecha").notNullable().defaultTo(knex.fn.now());
      table.integer("mensaje_template_id").notNullable();
      table.integer("enviado_cliente_id");
      table.text("mensaje");
      table.tinyint("eliminado").notNullable().defaultTo(0);
    })
    .createTable("template_mensaje", function (table) {
      table.increments("id");
      table.timestamp("created_ad").notNullable().defaultTo(knex.fn.now());
      table.text("body");
      table.string("description");
    })
    .createTable("cliente_mensaje_config", function (table) {
      table.increments("id");
      table.integer("cliente_id");
      table.integer("mensaje_template_id");
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("clientes")
    .dropTable("recordatorios")
    .dropTable("template_mensaje")
    .dropTable("cliente_mensaje_config");
};
