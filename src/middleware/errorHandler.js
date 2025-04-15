const { error } = require("qrcode-terminal");

function validJson(err, res, message) {
  if (err instanceof SyntaxError && err.status === 400) {
    // Si el error es un SyntaxError y el código de estado es 400, significa que el cuerpo de la solicitud no es un JSON válido
    return res.status(400).send(
      JSON.stringify({
        error: "El cuerpo de tu solicitud no es un JSON válido.",
        message:
          "Revisa bien el json que me estas mandado, esta mal formateado",
      })
    );
  }
  // Para otros tipos de errores, simplemente registra el error y envía una respuesta 500
  console.log(err);
  res.status(500).send("Ha ocurrio un error inesperado");
}

module.exports = validJson;
