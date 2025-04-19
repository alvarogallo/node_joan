// models/TemplateMensaje.js
const knex = require('knex')(require('../knexfile').development); // Importa la configuración de Knex

class TemplateMensajes {
  static async getAll() {
    return knex('templates_mensajes').select('*');
  }

  static async getByName(nombre) {
    return knex('templates_mensajes').where('nombre', nombre).first();
  }

  static async create(nombre, mensaje) {
    return knex('templates_mensajes').insert({ nombre, mensaje });
  }

  static async update(id, nombre, mensaje) {
    return knex('templates_mensajes').where('id', id).update({ nombre, mensaje });
  }

  static async delete(id) {
    return knex('templates_mensajes').where('id', id).del();
  }
}

module.exports = TemplateMensajes;