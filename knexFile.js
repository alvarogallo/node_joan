// knexfile.js
module.exports = {
    development: {
      client: 'sqlite3',
      connection: {
        filename: './mensajes.db' // La misma ruta que usaste antes
      },
      useNullAsDefault: true, // Necesario para SQLite
      migrations: {
        directory: './db/migrations' // Directorio donde guardarás tus migraciones
      },
      seeds: {
        directory: './db/seeds' // Directorio para archivos de seed (datos iniciales)
      }
    },

  };