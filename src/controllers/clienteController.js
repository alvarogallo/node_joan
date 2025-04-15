// Importa el modelo del cliente si es necesario
const { error } = require("qrcode-terminal");
const { client } = require("../../knexfile");
const Cliente = require("../models/Cliente");

// Controlador para manejar las solicitudes relacionadas con los clientes
const clienteController = {
  getAllContactos: async (req, res) => {
    // Mandamos a llamar a todos los clientes de la db
    const page = parseInt(req.query.page || 1);
    const perPage = parseInt(req.query.perPage || 10);

    try {
      const cliente = await Cliente.obtenerClientes(
        page,
        perPage,
        req.query.nombre
      );
      res.send(cliente);
    } catch (error) {
      console.log(error);
      res.send({
        message:
          "Pija algo salio mal, no te preocupes que no es tu culpa, la culpa es de la vaca",
      });
    }
  },

  getClientesActivos: async (req, res) => {
    try {
      // Mandamos a llamar a todos los clientes de la db
      const page = parseInt(req.query.page || 1);
      const perPage = parseInt(req.query.perPage || 10);
      const clientesActivos = await Cliente.obtenerClientesActivos(
        page,
        perPage
      );
      res.send(clientesActivos);
    } catch (error) {
      console.log(error);
      res.send({
        message:
          "Pija algo salio mal, no te preocupes que no es tu culpa, la culpa es de la vaca",
      });
    }
  },
  getClientesInactivos: async (req, res) => {
    try {
      // Mandamos a llamar a todos los clientes que estan inactivos o nunan han ha contratado el servicio.
      const page = parseInt(req.query.page || 1);
      const perPage = parseInt(req.query.perPage || 10);
      const clientesInactivos = await Cliente.obtenerClientesInactivos(
        page,
        perPage
      );
      res.send(clientesInactivos);
    } catch (error) {
      console.log(error);
      res.send({
        error: true,
        message: "Ocurrio un error al intentar buscar a los clientes inactivos",
      });
    }
  },
  getClientesConDeudas: async (req, res) => {
    /*Devolver clientes con dias de atraso o deudas de servicios*/
    try {
      // Mandamos a llamar a todos los clientes que estan vencidos o tienen deudas pendientes
      const page = parseInt(req.query.page || 1);
      const perPage = parseInt(req.query.perPage || 10);
      const clientesConDeudas = await Cliente.obtenerClientesConDeudas(
        page,
        perPage
      );
      res.send(clientesConDeudas);
    } catch (error) {
      console.log(error);
      res.send({
        error: true,
        message:
          "Ocurrio un error al intentar buscar a los Con deundas pendientes",
      });
    }
  },
  getClienteById: async (req, res) => {
    try {
      const clienteFound = await Cliente.obtenerClientePorId(req.params.id);
      res.send(clienteFound);
    } catch (error) {
      console.log(error);
      res.send({
        message:
          "Pija algo salio mal, no te preocupes que no es tu culpa, la culpa es de la vaca",
      });
    }
  },

  createCliente: async (req, res, next) => {
    // Lógica para crear un nuevo cliente
    let { nombre, numero, fecha_contratacion } = req.body;
    if (!nombre || !numero || !fecha_contratacion) {
      return res.status(400).json({
        error: "Todos los campos son requeridos",
        message:
          "Revisa que en nombre numero y fecha de contratacion no sean null",
      });
    }
    //validando el formato del numero de telefono
    if (numero.length === 11) {
      // Si es así, agregar el prefijo 58 al principio
      numero = numero.slice(1); //Esto para eliminar el 0 al inicio del numero
      numero = "58" + numero;
      console.log(numero);
    } else {
      return res.status(400).json({
        error: "Numero de telefono invalido",
        message:
          "El formato de numero debe ser 04145057588 Y me estas enviando: " +
          numero,
      });
    }

    try {
      const queryResult = await Cliente.crearCliente(
        nombre,
        numero,
        fecha_contratacion
      );
      console.log(queryResult);
      res.status(200).send({
        idCliente: queryResult[0],
        message: "Cleinte ingresado con exito",
      });
    } catch (error) {
      return res.status(400).send({
        error: "Ocurrio un error al insertar el nuevo cliente",
        message: error.sqlMessage,
      });
    }
  },
  updateProximoPagoDiasRestantes: async (req, res) => {
    // Aui se actualizan todos los Proximo pagos y dias restante, de los clientes
    // Es una especie de update a las fechas de los clientes basandonos en la fecha
    // actual o curren_date esto sirve para actualizar los dias restantes y proximos pagos
    try {
      //Ejecutamos el metodo para actualizar los datos de los clientes los cuales son proximo
      // Proximo pago dias restantes y si esta activo o incactivo
      await Cliente.actualizarDatosClientes();
      res.send({
        message: "Todos los clientes fueron actualizado exitosamente..",
      });
    } catch (error) {
      console.error("Error al actualizar estados de los clientes:", error);
      res.status(500).send({
        error: "Ocurrió un error al actualizar los estados de los clientes.",
      });
    }
  },
  updateCliente: async (req, res, next) => {
    // Lógica para actualizar un cliente existente
    const { id } = req.params;

    const camposRecibidos = Object.entries(req.body);

    const camposFiltrados = camposRecibidos.filter(
      ([key, value]) => value !== undefined
    );

    const clienteToUpdate = Object.fromEntries(camposFiltrados);

    const { numero } = clienteToUpdate;
    const { fecha_contratacion } = clienteToUpdate;

    //validando el formato del numero de telefono
    if (typeof numero == "string") {
      if (numero.length == 11) {
        // Si es así, agregar el prefijo 58 al principio
        numero = numero.slice(1); //Esto para eliminar el 0 al inicio del numero
        numero = "58" + numero;
        console.log(numero);
      } else {
        return res.status(400).json({
          error: "Numero de telefono invalido",
          message:
            "El formato de numero debe ser 04145057588 Y me estas enviando: " +
            numero,
        });
      }
    }
    console.log(typeof numero);

    //comrpobando que fecha no sea una fecha superior a la actual.
    const fechaActual = new Date();
    const fechaDada = new Date(fecha_contratacion);
    if (fechaDada > fechaActual) {
      //si fecha de contratacion es mayor a la fecha actual disparamos un error
      return res.status(400).send({
        message:
          "No no puedes establecer una fecha futura para el pago del cliente",
        error: true,
      });
    }

    console.log(clienteToUpdate);

    try {
      const clienteActualizado = await Cliente.actualizar(clienteToUpdate, id);

      if (clienteActualizado != 0) {
        res
          .status(200)
          .send({ message: "actualizado con exito", clienteActualizado });
      } else {
        res.status(400).send({
          message: "Ese id de cliente no existe...",
          clienteActualizado,
        });
      }
    } catch (error) {
      console.log(error);
      return error;
    }
  },

  deleteCliente: async (req, res) => {
    // Lógica para eliminar un cliente
    const { id } = req.params;

    try {
      const result = await Cliente.deleteCliente(id);

      console.log(result);
      if (result == 1) {
        return res.status(200).send({
          error: false,
          message: `Cliente con id ${id} Eliminado correctamente`,
        });
      } else {
        return res.status(400).send({
          error: true,
          message: `Cliente con id ${id} No se pudo eliminar`,
        });
      }
    } catch (error) {
      console.log(error);
      return error;
    }
  },
};

module.exports = clienteController;
