/**
 * Middleware Centralizado de Manejo de Errores
 * Taller 1 - Diagramas de Arquitectura (ITM)
 */

/**
 * Middleware para capturar rutas no encontradas (404)
 */
function rutaNoEncontradaHandler(req, res, next) {
  return res.status(404).json({
    error: 'Not Found',
    codigo: 404,
    mensaje: `La ruta solicitada '${req.method} ${req.originalUrl}' no existe en esta API.`,
    rutasDisponibles: [
      'GET /api/festivos/verificar?fecha=YYYY-MM-DD',
      'GET /api/festivos/verificar/:anio/:mes/:dia',
      'GET /api/festivos/anio/:anio',
      'GET /api-docs'
    ]
  });
}

/**
 * Middleware global para captura y formateo de errores
 */
function manejadorGlobalErrores(err, req, res, next) {
  // Manejo de errores de conexión, desconexión o selección de servidor en MongoDB / Mongoose
  if (
    err.name === 'MongooseServerSelectionError' ||
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoTimeoutError' ||
    err.name === 'MongoServerSelectionError' ||
    err.name === 'MongoNotConnectedError' ||
    (err.name && err.name.startsWith('Mongo') && err.name !== 'MongoServerError') ||
    (err.message && (
      err.message.toLowerCase().includes('connect econrefused') ||
      err.message.toLowerCase().includes('must be connected') ||
      err.message.toLowerCase().includes('buffering timed out')
    ))
  ) {
    console.error('[Error de Base de Datos]', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      codigo: 500,
      mensaje: 'Error de persistencia: no se pudo establecer conexión con el servidor de MongoDB. Por favor verifique que el servicio de MongoDB esté activo.',
      tipoError: 'DatabaseConnectionError'
    });
  }

  // Errores de validación de Mongoose
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Bad Request',
      codigo: 400,
      mensaje: 'Error de validación de datos en el modelo de base de datos.',
      detalles: Object.values(err.errors).map((e) => e.message)
    });
  }

  // Errores de Cast / Conversión de tipos de Mongoose
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Bad Request',
      codigo: 400,
      mensaje: `Valor inválido para el campo '${err.path}': '${err.value}'.`
    });
  }

  // Código de estado explícito (por ejemplo 400 Bad Request lanzado desde la capa de negocio)
  const statusCode = err.statusCode || (err.status ? Number(err.status) : 500);

  if (statusCode >= 500) {
    console.error('[Error 500 Interno]', err.stack || err.message);
  }

  return res.status(statusCode).json({
    error: statusCode === 400 ? 'Bad Request' : (statusCode === 404 ? 'Not Found' : 'Internal Server Error'),
    codigo: statusCode,
    mensaje: err.message || 'Ha ocurrido un error inesperado en el servidor.'
  });
}

module.exports = {
  rutaNoEncontradaHandler,
  manejadorGlobalErrores
};
