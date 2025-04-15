/**
 * formatea numeros de telefono para enviar a mensajes por WhatsApp
 * @param {string} numero
 * @returns {boolean}
 * @example
 * validarNumeroTelefonico("+57 123456789"); // Returns "57123456789@c.us"
 * validarNumeroTelefonico("+57123456789"); // Returns "57123456789@c.us"
 * validarNumeroTelefonico("+57123456789@c.us"); // Returns "57123456789@c.us"
 * validarNumeroTelefonico("123456789"); // Returns null
 * validarNumeroTelefonico("123456789@c.us"); // Returns null
 */
const validarNumeroTelefonico = (copiedNumber) => {
  // Remove parentheses and hyphens
  const cleanedNumber = copiedNumber.replace(/[\(\)-]/g, '');

  // Regular expression to match the format: +CC phone_number (with space)
  const regexWithSpace = /^\+(\d+) (\d+)$/;
  const matchWithSpace = cleanedNumber.match(regexWithSpace);

  if (matchWithSpace) {
    const countryCode = matchWithSpace[1];
    const numberPart = matchWithSpace[2];
    return countryCode + numberPart + "@c.us";
  }

  // Regular expression to match the format: +CCphone_number (without space)
  const regexNoSpace = /^\+(\d+)(\d+)$/;
  const matchNoSpace = cleanedNumber.match(regexNoSpace);

  if (matchNoSpace) {
    const countryCode = matchNoSpace[1];
    const numberPart = matchNoSpace[2];
    return countryCode + numberPart + "@c.us";
  }

  // Regular expression to match the format: CC phone_number (with space, assuming '+' might be omitted)
  const regexNoPlusWithSpace = /^(\d+) (\d+)$/;
  const matchNoPlusWithSpace = cleanedNumber.match(regexNoPlusWithSpace);

  if (matchNoPlusWithSpace) {
    // This is a bit more ambiguous as we are assuming the first part is the country code.
    // You might want to add more specific checks or have a list of valid country code lengths.
    const potentialCountryCode = matchNoPlusWithSpace[1];
    const numberPart = matchNoPlusWithSpace[2];

    // Basic check: Country codes are usually 1 to 3 digits.
    if (potentialCountryCode.length >= 1 && potentialCountryCode.length <= 3) {
      return potentialCountryCode + numberPart + "@c.us";
    }
  }

  // Regular expression to match the format: CCphone_number (without space, assuming '+' might be omitted)
  const regexNoPlusNoSpace = /^(\d+)(\d+)$/;
  const matchNoPlusNoSpace = cleanedNumber.match(regexNoPlusNoSpace);

  if (matchNoPlusNoSpace) {
    const potentialCountryCode = matchNoPlusNoSpace[1];
    const numberPart = matchNoPlusNoSpace[2];

    if (potentialCountryCode.length >= 1 && potentialCountryCode.length <= 3) {
      return potentialCountryCode + numberPart + "@c.us";
    }
  }

  return null; // Return null if no recognized format is found
};

module.exports = { validarNumeroTelefonico };
