// services/cronService.js
const cron = require('node-cron');
const { obtenerNumeroGanadorLoteriaMedellin } = require('./scraperSites');
const TemplateMensaje = require('../models/TemplateMensajes.js');
const GrupoDestino = require('../models/GrupoDestino');
const reemplazarPlaceholders = require('../utils/remplazarPlaceholders.js');
const enviarMensaje  = require('./senderMessage.js');

async function enviarMensajeProgramado(grupoId) {
  if (grupoId) {
    console.log(`[Cron] Intentando enviar mensaje al grupo: ${grupoId} a las ${new Date()}`);
    try {
      const resultadoLoteria = await obtenerNumeroGanadorLoteriaMedellin();
      const templateData = await TemplateMensaje.getByName('MensajePorDefecto');

      if (templateData) {
        const mensajeFinal = reemplazarPlaceholders(templateData.mensaje, {
          numero: resultadoLoteria.Ganador,
          fecha: resultadoLoteria.Fecha
        }, templateData.metadata?.keySimbolo);

        // Llama directamente a la función sendMessage importada
        const resultadoEnvio = await enviarMensaje(grupoId, mensajeFinal);
        console.log(`[Cron] Resultado del envío al grupo ${grupoId}:`, resultadoEnvio);

      } else {
        console.error('[Cron] No se encontró la plantilla de mensaje para la tarea programada.');
      }
    } catch (error) {
      console.error(`[Cron] Error al ejecutar la tarea programada para el grupo ${grupoId}:`, error);
      throw error;
    }
  } else {
    console.log('[Cron] No se ha proporcionado un grupo destino para los mensajes.');
    
  }
}

// Función para iniciar el cron job
function iniciarCronJob() {
  cron.schedule('*/30 * * * * *', async () => {
    console.log('[Cron] Ejecutando tarea programada...');
    try {
      const gruposDestino = await GrupoDestino.getAll();
      if (gruposDestino && gruposDestino.length > 0) {
        for (const grupo of gruposDestino) {
          await enviarMensajeProgramado(grupo.wid); // Usa el 'wid' del grupo
        }
      } else {
        console.log('[Cron] No hay grupos destino configurados.');
      }
    } catch (error) {
      console.error('[Cron] Error al obtener la lista de grupos destino:', error);
    }
  });
  console.log('[Cron] Tarea programada iniciada para ejecutarse cada 2 minutos.');
}

module.exports = {
  iniciarCronJob,
  enviarMensajeProgramado
};