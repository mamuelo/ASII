/**
 * Capa de Presentación / Lógica de Negocio - Controlador de Festivos
 * Taller 1 - Diagramas de Arquitectura (ITM)
 * Corresponde a festivo.controlador.js según el diagrama Mermaid.
 */

const festivoServicio = require('../business/festivo.servicio');

class FestivoControlador {
  /**
   * Endpoint A: Verificar si una fecha es festiva en Colombia.
   * GET /api/festivos/verificar?fecha=YYYY-MM-DD
   * GET /api/festivos/verificar/:anio/:mes/:dia
   */
  async verificarFecha(req, res, next) {
    try {
      const fecha = req.fechaValidada;
      const resultado = await festivoServicio.verificarFechaFestiva(fecha);
      return res.status(200).json(resultado);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Endpoint B: Obtener la lista completa de festivos para un año dado.
   * GET /api/festivos/anio/:anio
   * GET /api/festivos/obtener/:anio
   */
  async obtenerFestivosPorAnio(req, res, next) {
    try {
      const anio = req.anioValidado;
      const festivos = await festivoServicio.obtenerFestivosPorAnio(anio);
      return res.status(200).json(festivos);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new FestivoControlador();
