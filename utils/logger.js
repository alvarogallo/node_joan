const logger = {
    log: (message) => {
        console.log(`\x1b[32m${message}\x1b[0m`); // Verde
    },
    error: (message) => {
        console.log(`\x1b[31m${message}\x1b[0m`); // Rojo
    },
    warn: (message) => {
        console.log(`\x1b[33m${message}\x1b[0m`); // Amarillo
    },
    info: (message) => {
        console.log(`\x1b[36m${message}\x1b[0m`); // Cyan
    }
};

module.exports = logger;