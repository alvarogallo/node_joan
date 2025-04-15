
exports.seed = async function(knex) {
  // Borra cualquier registro existente con el nombre "MensajePorDefecto" (opcional)
  await knex('templates_mensajes').where('nombre', 'MensajePorDefecto').del();

  // Inserta el nuevo mensaje por defecto
  await knex('templates_mensajes').insert([
    {
      nombre: 'MensajePorDefecto',
      mensaje: 'El numero ganador de la loteria del techira es #numero, de la fecha #fecha.🎉🎉🎉'
    }
  ]);
};