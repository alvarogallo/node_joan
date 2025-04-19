// models/grupoDestino.js
const knex = require('knex')(require('../knexfile').development);

class GrupoDestino {
  static async getAll() {
    return knex('grupos_destino').select('*');
  }

  static async getById(id) {
    return knex('grupos_destino').where('id', id).first();
  }

  static async getByWid(wid) {
    return knex('grupos_destino').where('wid', wid).first();
  }

  static async create(nombre, wid) {
    return knex('grupos_destino').insert({ nombre, wid });
  }

  static async update(id, nombre, wid) {
    return knex('grupos_destino').where('id', id).update({ nombre, wid });
  }

  static async delete(id) {
    return knex('grupos_destino').where('id', id).del();
  }
}

module.exports = GrupoDestino;