/**
 * Rutas de la API de Festivos
 * Taller 1 - Diagramas de Arquitectura (ITM)
 * Corresponde a festivo.rutas.js según el diagrama Mermaid.
 */

const { Router } = require('express');
const festivoControlador = require('./festivo.controlador');
const { validarFecha, validarAnio } = require('./festivo.validador');

const router = Router();

/**
 * @route   GET /api/festivos/verificar?fecha=YYYY-MM-DD
 * @desc    Verifica si una fecha específica es festiva en Colombia (Endpoint A principal)
 */
router.get('/verificar', validarFecha, (req, res, next) =>
  festivoControlador.verificarFecha(req, res, next)
);

/**
 * @route   GET /api/festivos/verificar/:anio/:mes/:dia
 * @desc    Ruta alternativa con parámetros de ruta (fiel a la captura Postman del taller ITM)
 */
router.get('/verificar/:anio/:mes/:dia', validarFecha, (req, res, next) =>
  festivoControlador.verificarFecha(req, res, next)
);

/**
 * @route   GET /api/festivos/verificar/:fecha
 * @desc    Ruta alternativa con fecha ISO como parámetro de ruta
 */
router.get('/verificar/:fecha', validarFecha, (req, res, next) =>
  festivoControlador.verificarFecha(req, res, next)
);

/**
 * @route   GET /api/festivos/anio/:anio
 * @desc    Devuelve la lista completa de festivos de Colombia para un año (Endpoint B principal)
 */
router.get('/anio/:anio', validarAnio, (req, res, next) =>
  festivoControlador.obtenerFestivosPorAnio(req, res, next)
);

/**
 * @route   GET /api/festivos/obtener/:anio
 * @desc    Alias de ruta para listar festivos (fiel a la captura Postman página 5 del taller ITM)
 */
router.get('/obtener/:anio', validarAnio, (req, res, next) =>
  festivoControlador.obtenerFestivosPorAnio(req, res, next)
);

module.exports = router;
