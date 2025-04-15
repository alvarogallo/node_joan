const { error } = require("qrcode-terminal");
const Recordatorio = require("./../models/Recordatorio");

const recordatorio = {
  getRecordatorios: async (req, res) => {
    //Logica para mostrar todos los recordatorios enviados.
    console.log("Se activo el recordatorio");

    try {
      const recordatorios = await Recordatorio.obtenerRecordatorios();
      res.send(recordatorios);
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  enviarRecordatorio: async (req, res) => {
    const { id_cliente } = req.params;
    //scamos de la base de datos el mensaje que le corresponde a cada cliente.
    try {
      const recordatorioEnviado = await Recordatorio.insertar(id_cliente);
      console.log(recordatorioEnviado);

      res.status(200).send({
        error: false,
        message: `Se ha enviado el recordatorio exitosamente, codigo del recordatorio: ${recordatorioEnviado}`,
      });
    } catch (error) {
      console.log(error);
      res.send({
        error: true,
        message: "El recordatorio no pudo ser enviado.",
      });
    }
  },
};

module.exports = recordatorio;
