/*
Funcion para reemplazar los marcadores de posicion en un mensaje
busca por el simbolo # y reemplaza los datos en el mensaje
dsa*/
function reemplazarPlaceholders(mensaje, data, keySimbolo = '#') {
    let mensajeFinal = mensaje;
    for (const key in data) {
      const placeholder = `${keySimbolo}${key}`;
      mensajeFinal = mensajeFinal.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), data[key]);
    }
    return mensajeFinal;
  }



module.exports = reemplazarPlaceholders;