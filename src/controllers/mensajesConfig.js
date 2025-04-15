const { getAllConfigMensajes } = require("../models/configMensajeClientes");

const configMensajeclientes = {
  getConfigClientes: async (req, res) => {
    try {
      const resultado = await getAllConfigMensajes();
      res.send(resultado);
    } catch (error) {
      console.log(error);
      res.status(500);
    }
  },
};

module.exports = configMensajeclientes;
