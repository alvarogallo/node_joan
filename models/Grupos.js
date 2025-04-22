// models/grupoDestino.js
const knex = require('knex')(require('../knexfile').development);

class Grupos {
  static async getAll() {
    return knex('mis_grupos').select('*');
  }

  static async getById(id) {
    return knex('mis_grupos').where('id', id).first();
  }

  static async getByWid(wid) {
    return knex('mis_grupos').where('wid', wid).first();
  }

  static async create(nombre, wid) {
    return knex('mis_grupos').insert({ nombre, wid });
  }

  static async update(id, nombre, wid) {
    return knex('mis_grupos').where('id', id).update({ nombre, wid });
  }

  static async delete(id) {
    return knex('mis_grupos').where('id', id).del();
  }
}

module.exports = Grupos;