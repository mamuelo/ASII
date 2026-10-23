/**
 * Script de inicialización (Seed) para MongoDB
 * Taller 1 - Diagramas de Arquitectura (ITM)
 * 
 * Es idempotente: puede ejecutarse múltiples veces sin duplicar registros.
 */

require('dotenv').config();
const { conectarDB, desconectarDB, estaConectado } = require('../config/database');
const festivoRepositorio = require('../data/festivo.repositorio');
const { FESTIVOS_BASE } = require('./seed.data');

/**
 * Función principal de inicialización de datos de festivos en MongoDB.
 * @returns {Promise<{ total: number, resultado: object }>}
 */
async function seedFestivos() {
  const debedesconectar = !estaConectado();

  if (debedesconectar) {
    await conectarDB();
  }

  console.log(`[Seed] Sincronizando ${FESTIVOS_BASE.length} definiciones base de festivos...`);
  const resultado = await festivoRepositorio.sincronizarDefiniciones(FESTIVOS_BASE);
  const total = await festivoRepositorio.contar();

  console.log(`[Seed] Sincronización finalizada exitosamente.`);
  console.log(`[Seed] Documentos en base de datos: ${total}.`);

  if (debedesconectar) {
    await desconectarDB();
  }

  return { total, resultado };
}

// Ejecución directa desde CLI
if (require.main === module) {
  seedFestivos()
    .then(() => {
      console.log('[Seed] Proceso completado.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed] Error al inicializar datos:', err.message);
      process.exit(1);
    });
}

module.exports = {
  seedFestivos
};
