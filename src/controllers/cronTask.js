const cronTask = {
  obtenerConfig: async (req, res) => {
    // mostrar los aprametros de confuguracion del cron
    //Los parametros son, con cuanta frecuencia se va a hacer el seguimiento...
    res.send(`Revisar cada dia a las 9am`);
  },
};

module.exports = cronTask;
