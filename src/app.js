/**
 * Configuración de la Aplicación Express
 * Taller 1 - Diagramas de Arquitectura (ITM)
 * Corresponde a app.js según el diagrama Mermaid.
 */

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger.json');

const festivoRutas = require('./presentation/festivo.rutas');
const {
  rutaNoEncontradaHandler,
  manejadorGlobalErrores
} = require('./presentation/error.middleware');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Documentación interactiva Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Ruta raíz informativa
app.get('/', (req, res) => {
  res.status(200).json({
    nombre: 'API RESTful Festivos Colombia',
    version: '1.0.0',
    institucion: 'Instituto Tecnológico Metropolitano (ITM)',
    taller: 'Taller 1 - Diagramas de Arquitectura',
    documentacion: '/api-docs',
    endpoints: {
      verificarFecha: 'GET /api/festivos/verificar?fecha=YYYY-MM-DD',
      verificarFechaRuta: 'GET /api/festivos/verificar/:anio/:mes/:dia',
      listarFestivosPorAnio: 'GET /api/festivos/anio/:anio'
    }
  });
});

// Registro de rutas de la API
app.use('/api/festivos', festivoRutas);

// Captura de rutas inexistentes (404)
app.use(rutaNoEncontradaHandler);

// Manejador centralizado de errores
app.use(manejadorGlobalErrores);

module.exports = app;
