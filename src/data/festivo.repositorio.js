/**
 * Capa de Acceso a Datos - Repositorio de Festivos
 * Taller 1 - Diagramas de Arquitectura (ITM)
 * Corresponde a festivo.repositorio.js según el diagrama Mermaid.
 */

const FestivoModelo = require('./festivo.modelo');

class FestivoRepositorio {
  /**
   * Obtiene todas las definiciones base de festivos activos desde MongoDB.
   * @returns {Promise<Array<object>>}
   */
  async obtenerTodosActivos() {
    return await FestivoModelo.find({ activo: true }).lean().exec();
  }

  /**
   * Busca una definición de festivo por su nombre.
   * @param {string} nombre 
   * @returns {Promise<object|null>}
   */
  async obtenerPorNombre(nombre) {
    return await FestivoModelo.findOne({ nombre }).lean().exec();
  }

  /**
   * Inserta o actualiza una definición de festivo por nombre (operación idempotente).
   * @param {object} festivoData 
   * @returns {Promise<object>}
   */
  async guardarOActualizar(festivoData) {
    return await FestivoModelo.findOneAndUpdate(
      { nombre: festivoData.nombre },
      { $set: festivoData },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean().exec();
  }

  /**
   * Inserta o actualiza múltiples festivos de forma idempotente en lote.
   * @param {Array<object>} festivosList 
   * @returns {Promise<{ insertadosOActualizados: number }>}
   */
  async sincronizarDefiniciones(festivosList) {
    if (!Array.isArray(festivosList) || festivosList.length === 0) {
      return { insertadosOActualizados: 0 };
    }

    const operaciones = festivosList.map((festivo) => ({
      updateOne: {
        filter: { nombre: festivo.nombre },
        update: { $set: festivo },
        upsert: true
      }
    }));

    const resultado = await FestivoModelo.bulkWrite(operaciones);
    const totalAfectados = (resultado.upsertedCount || 0) + (resultado.modifiedCount || 0) + (resultado.matchedCount || 0);

    return {
      insertadosOActualizados: totalAfectados,
      upsertedCount: resultado.upsertedCount || 0,
      modifiedCount: resultado.modifiedCount || 0,
      matchedCount: resultado.matchedCount || 0
    };
  }

  /**
   * Retorna el número total de festivos registrados en la colección.
   * @returns {Promise<number>}
   */
  async contar() {
    return await FestivoModelo.countDocuments().exec();
  }

  /**
   * Elimina todos los documentos de la colección (usado en entornos de prueba aislados).
   * @returns {Promise<void>}
   */
  async limpiar() {
    await FestivoModelo.deleteMany({}).exec();
  }
}

module.exports = new FestivoRepositorio();
