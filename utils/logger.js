// logger.js

const chalk = require('chalk').default; // <-- Accede a la propiedad .default

// Creamos un objeto con funciones que envuelven console.*
const logger = {
  // Info (usando color azul)
  info: (message) => {
    console.log(chalk.blue(message));
  },

  // Log (usando color verde para mensajes generales/éxito)
  log: (message) => {
    console.log(chalk.green(message));
  },

  // Warn (usando color amarillo)
  warn: (message) => {
    console.warn(chalk.yellow('ADVERTENCIA: ' + message));
  },

  // Error (usando color rojo y aceptando múltiples argumentos)
  error: (...args) => {
    // chalk.red puede colorear todos los argumentos pasados, uniéndolos con espacios.
    // Pasamos 'ERROR:' como primer argumento a chalk para que aparezca primero y coloreado.
    console.error(chalk.red('ERROR:', ...args));
  },

  // Puedes agregar más tipos si necesitas (por ejemplo, debug, success, etc.)
  success: (message) => {
    console.log(chalk.green.bold('ÉXITO: ' + message));
  },

  debug: (message) => {
    console.log(chalk.gray('DEBUG: ' + message));
  }
};

module.exports = logger;