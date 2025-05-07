/**
 * Parsea una cadena de texto que combina información de remitente
 * y un array de datos con formato específico (separados por líneas)
 * a un objeto JSON más manejable.
 *
 * Formato esperado de la entrada:
 * :Número: [número] - Mensaje: [texto opcional]
 * [Línea de dato 1]
 * [Línea de dato 2]
 * ...
 *
 * @param {string} combinedString - La cadena de texto combinada a parsear.
 * @returns {object} Un objeto JSON con los datos parseados (incluyendo número y posible mensaje inicial).
 */
function parseNatilleraCombinedString(combinedString) {
    const parsedData = {};

    // 1. Validar que la entrada sea una cadena de texto
    if (typeof combinedString !== 'string') {
        console.error("Error de parseo: La entrada no es una cadena de texto.");
        return parsedData; // Retorna un objeto vacío si la entrada no es válida
    }

    // 2. Dividir la cadena en líneas
    const lines = combinedString.split('\n');

    // 3. Parsear la primera línea (Cabecera: Número y Mensaje inicial)
    if (lines.length > 0) {
        const firstLine = lines[0].trim();
        // Regex para buscar :Número: seguido de algo (el número) - Mensaje: seguido del resto
        const headerMatch = firstLine.match(/^:Número:\s*(\S+)\s*-\s*Mensaje:(.*)/);

        if (headerMatch) {
            // match[1] es el grupo 1 (el número después de :Número:)
            // match[2] es el grupo 2 (el texto después de - Mensaje:)
            parsedData.remitenteNumero = headerMatch[1].trim(); // Captura el número del remitente
            parsedData.remitenteMensajeInicial = headerMatch[2] ? headerMatch[2].trim() : ''; // Captura el texto del mensaje inicial (si existe)
        } else {
             console.warn("Advertencia de parseo: La primera línea no tiene el formato ':Número: ... - Mensaje: ...'");
             // Si la primera línea no es la cabecera, podemos asumir que también es una línea de dato
             // En este caso, la incluiremos en el array de líneas de datos para que se parseé después.
             // Si esperas SIEMPRE la cabecera, puedes eliminar la siguiente línea y solo loggear la advertencia.
             lines.unshift(lines.shift()); // Mueve la primera línea (que no era cabecera) al inicio del array de datos
        }
    }

    // 4. Procesar las líneas restantes como datos
    // dataLines contendrá todas las líneas *excepto* la primera si la primera fue una cabecera válida,
    // o contendrá todas las líneas si la primera NO fue una cabecera válida y la movimos de nuevo.
    const dataLines = (headerMatch && lines.length > 1) ? lines.slice(1) : lines;


    for (const item of dataLines) {
        // Asegurarse de que cada línea de datos sea un string no vacío después de trim
        if (typeof item !== 'string' || item.trim() === '') {
             continue; // Ignora líneas vacías o no-strings
        }

        const text = item.trim(); // Eliminar espacios al inicio y final de la línea de datos

        // --- Lógica de Parseo Basada en el Contenido (reutilizada) ---

        // Patrón: Natillera:ID Socio:ID Numero:Num
        if (text.startsWith("Natillera:")) {
            const natilleraMatch = text.match(/Natillera:(\d+)/);
            const socioMatch = text.match(/Socio:(\S+)/);
            const numeroMatch = text.match(/Numero:(\d+)/);

            if (natilleraMatch && natilleraMatch[1]) parsedData.natilleraId = parseInt(natilleraMatch[1], 10);
            if (socioMatch && socioMatch[1]) {
                const socioInt = parseInt(socioMatch[1], 10);
                parsedData.socioId = isNaN(socioInt) ? socioMatch[1] : socioInt;
            }
            if (numeroMatch && numeroMatch[1]) parsedData.numero = parseInt(numeroMatch[1], 10);
        }
        // Patrón: Clave: Valor
        else if (text.includes(':')) {
             const firstColonIndex = text.indexOf(':');
             const key = text.substring(0, firstColonIndex).trim();
             const valuePart = text.substring(firstColonIndex + 1).trim();
             const cleanedValue = valuePart.replace(/,/g, '');

             switch (key) {
                 case "Capital(Cuotas)":
                     parsedData.capital = parseInt(cleanedValue, 10);
                     break;
                 case "Prestamos":
                     parsedData.prestamos = parseInt(cleanedValue, 10);
                     break;
                 case "Ganancias Personales":
                     parsedData.gananciasPersonales = parseFloat(cleanedValue);
                     break;
                 // Puedes añadir más casos aquí si hay otros formatos Clave: Valor
             }
        }
        // Patrón: Loterias Natillera:Num Medellin:Num
        else if (text.startsWith("Loterias Natillera:")) {
             const medellinIndex = text.indexOf(' Medellin:');
             if (medellinIndex !== -1) {
                 const natilleraPart = text.substring("Loterias Natillera:".length, medellinIndex).trim();
                 const medellinPart = text.substring(medellinIndex + ' Medellin:'.length).trim();

                 parsedData.loteriasNatillera = parseInt(natilleraPart, 10);
                 parsedData.loteriasMedellin = parseInt(medellinPart, 10);
             } else {
                  console.warn("Advertencia de parseo: Formato 'Loterias Natillera: ... Medellin: ...' esperado pero no encontrado 'Medellin:'", text);
             }
        }
         // Patrón: Dolar COL Valor
        else if (text.startsWith("Dolar COL")) {
            const parts = text.split(' ');
            if (parts.length >= 3 && parts[0] === 'Dolar' && parts[1] === 'COL') {
                 const valuePart = parts[2].trim();
                 const cleanedValue = valuePart.replace(/,/g, '');
                 parsedData.dolarCOL = parseFloat(cleanedValue);
            } else {
                 console.warn("Advertencia de parseo: Formato 'Dolar COL ...' esperado pero no encontrado el valor", text);
            }
        }
        // Si hay otros formatos de strings en las líneas de datos, necesitarías agregar más condiciones aquí
        // Si una línea no coincide con ningún patrón conocido, puedes loggearla:
        // else {
        //     console.warn("Advertencia de parseo: Línea de datos con formato desconocido:", text);
        // }
        // --- Fin Lógica de Parseo ---

    } // Fin del bucle for...of para líneas de datos

    // Opcional: Limpieza de valores NaN si es necesario
    // for (const key in parsedData) {
    //     if (typeof parsedData[key] === 'number' && isNaN(parsedData[key])) {
    //         delete parsedData[key];
    //     }
    // }

    return parsedData; // Devuelve el objeto con todos los datos organizados
}



/*
// --- El resultado impreso será algo así ---
Resultado parseado 1: {
  remitenteNumero: '19784181717',
  remitenteMensajeInicial: 'Natillera:6776 Socio:67760695 Numero:27',
  natilleraId: 6776,
  socioId: 67760695,
  numero: 27,
  capital: 5000,
  prestamos: 400,
  gananciasPersonales: 120,
  loteriasNatillera: 2518,
  loteriasMedellin: 4266,
  dolarCOL: 4185
}
*/



// Exportar la función si la pones en un módulo separado
module.exports = {
    parseNatilleraCombinedString
};