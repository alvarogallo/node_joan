// services/scraperService.js
require('dotenv').config();
const puppeteer = require('puppeteer');

async function obtenerNumeroGanadorLoteriaMedellin() { // Nombre más descriptivo
  let browser = null; // Inicializa a null
  console.log('Iniciando proceso de scraping para la Lotería de Medellín (Número y Fecha)...');

  try {
    browser = await puppeteer.launch({
      headless: true, // Importante para ejecución en servidor
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // A menudo necesarios en servidores/contenedores
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'); // Opcional pero recomendable

    const url = process.env.LOTERIA_MEDELLIN_BASE_URL; // URL de la Lotería de Medellín
    console.log(`Navegando a ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 }); // Aumenta timeout si es necesario

    // --- Extraer el número ganador ---
    const selectorNumeroGanador = '.elementor-lottery-jackpot-number'; // Selector del número ganador
    console.log(`Esperando por el selector del número ganador: "${selectorNumeroGanador}"`);
    await page.waitForSelector(selectorNumeroGanador, { timeout: 15000 }); // Aumenta timeout si es necesario
    const numeroGanador = await page.$eval(selectorNumeroGanador, el => el.textContent.trim());
    console.log(`Scraping completado. Número ganador encontrado: "${numeroGanador}"`);

    // --- Extraer la fecha del sorteo ---
    const fechaSorteo = await obtenerFechaSorteoLoteriaMedellin(page);

    // --- Construir el objeto con ambos datos ---
    const resultado = {
      Ganador: numeroGanador,
      Fecha: fechaSorteo
    };

    return resultado; // Devuelve el objeto

  } catch (error) {
    console.error('Error durante el scraping de la Lotería de Medellín:', error.message);
    throw new Error(`Scraping de la Lotería de Medellín fallido: ${error.message}`);

  } finally {
    if (browser) {
      console.log('Cerrando navegador...');
      await browser.close();
      console.log('Navegador cerrado.');
    }
  }
}

async function obtenerFechaSorteoLoteriaMedellin(page) {
  const selectorFecha = '.elementor-lottery-jackpot-date';
  console.log(`Esperando por el selector de fecha: "${selectorFecha}"`);
  await page.waitForSelector(selectorFecha, { timeout: 15000 });
  const fechaExtraida = await page.$eval(selectorFecha, el => el.textContent.trim());
  console.log(`Fecha del sorteo encontrada: "${fechaExtraida}"`);
  return fechaExtraida;
}

// Exporta la función principal
module.exports = {
  obtenerNumeroGanadorLoteriaMedellin
};