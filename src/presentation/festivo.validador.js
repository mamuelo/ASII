/**
 * Middleware y Validadores de Petición
 * Taller 1 - Diagramas de Arquitectura (ITM)
 * Corresponde a festivo.validador.js según el diagrama Mermaid.
 */

const { validarFechaStr } = require('../utils/fecha.util');

/**
 * Validador para el endpoint de verificación de fecha.
 * Admite:
 * 1. Query param: ?fecha=YYYY-MM-DD
 * 2. Path params: /:anio/:mes/:dia
 * 3. Path param: /:fecha (YYYY-MM-DD)
 */
function validarFecha(req, res, next) {
  let fechaStr = null;

  if (req.query && req.query.fecha) {
    fechaStr = req.query.fecha.trim();
  } else if (req.params && req.params.fecha) {
    fechaStr = req.params.fecha.trim();
  } else if (req.params && req.params.anio && req.params.mes && req.params.dia) {
    // Formato por segmentos en la ruta (ej: /2023/6/12 o /2023/06/12)
    const anioStr = String(req.params.anio).trim();
    const mesStr = String(req.params.mes).trim().padStart(2, '0');
    const diaStr = String(req.params.dia).trim().padStart(2, '0');
    fechaStr = `${anioStr}-${mesStr}-${diaStr}`;
  }

  if (!fechaStr) {
    return res.status(400).json({
      error: 'Bad Request',
      codigo: 400,
      mensaje: "Parámetro de fecha requerido. Debe enviar '?fecha=YYYY-MM-DD' o los parámetros de ruta '/:anio/:mes/:dia'."
    });
  }

  const resultado = validarFechaStr(fechaStr);

  if (!resultado.valida) {
    return res.status(400).json({
      error: 'Bad Request',
      codigo: 400,
      mensaje: resultado.error
    });
  }

  // Adjunta la fecha validada y formateada al objeto req para el controlador
  req.fechaValidada = fechaStr;
  req.anioValidado = resultado.anio;
  next();
}

/**
 * Validador para el endpoint de consulta de festivos por año.
 * Valida que el parámetro de ruta :anio sea un entero dentro del rango soportado.
 */
function validarAnio(req, res, next) {
  const anioRaw = req.params.anio;

  if (!anioRaw) {
    return res.status(400).json({
      error: 'Bad Request',
      codigo: 400,
      mensaje: "El parámetro de año ':anio' es obligatorio."
    });
  }

  const anio = Number(anioRaw);

  if (!Number.isInteger(anio) || isNaN(anio)) {
    return res.status(400).json({
      error: 'Bad Request',
      codigo: 400,
      mensaje: `Año inválido: '${anioRaw}'. Debe ser un número entero válido (ej: 2023).`
    });
  }

  if (anio < 1900 || anio > 2199) {
    return res.status(400).json({
      error: 'Bad Request',
      codigo: 400,
      mensaje: `Año fuera de rango: ${anio}. Debe estar comprendido entre 1900 y 2199.`
    });
  }

  req.anioValidado = anio;
  next();
}

module.exports = {
  validarFecha,
  validarAnio
};
