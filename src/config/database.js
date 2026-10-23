/**
 * Configuración y gestión de conexión a MongoDB mediante Mongoose
 * Taller 1 - Diagramas de Arquitectura (ITM)
 */

const mongoose = require('mongoose');

/**
 * Conecta a la base de datos MongoDB.
 * @param {string} [uri] URI de conexión (por defecto toma process.env.MONGODB_URI)
 * @returns {Promise<typeof mongoose>}
 */
async function conectarDB(uri) {
  const mongoUri = uri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/festivos_colombia';

  try {
    const conexion = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000 // Falla rápido si MongoDB no responde
    });

    console.log(`[MongoDB] Conectado exitosamente a: ${conexion.connection.host}:${conexion.connection.port}/${conexion.connection.name}`);
    return conexion;
  } catch (error) {
    console.error(`[MongoDB] Error crítico al conectar a MongoDB (${mongoUri}):`, error.message);
    throw error;
  }
}

/**
 * Desconecta de la base de datos MongoDB.
 * @returns {Promise<void>}
 */
async function desconectarDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('[MongoDB] Conexión cerrada correctamente.');
    }
  } catch (error) {
    console.error('[MongoDB] Error al desconectar de MongoDB:', error.message);
    throw error;
  }
}

/**
 * Verifica si la conexión con MongoDB se encuentra activa y lista.
 * @returns {boolean}
 */
function estaConectado() {
  return mongoose.connection.readyState === 1;
}

module.exports = {
  conectarDB,
  desconectarDB,
  estaConectado
};
