/**
 * Punto de Entrada del Servidor
 * Taller 1 - Diagramas de Arquitectura (ITM)
 * Corresponde a index.js según el diagrama Mermaid.
 */

require('dotenv').config();
const app = require('./app');
const { conectarDB, desconectarDB } = require('./config/database');

const PUERTO = process.env.PORT || 8080;

async function iniciarServidor() {
  try {
    // Conectar a MongoDB
    await conectarDB();

    // Iniciar escucha del servidor Express
    const servidor = app.listen(PUERTO, () => {
      console.log('====================================================');
      console.log(`🚀 Servidor API Festivos Colombia ejecutándose`);
      console.log(`📍 URL Base: http://localhost:${PUERTO}`);
      console.log(`📖 Documentación Swagger UI: http://localhost:${PUERTO}/api-docs`);
      console.log(`🔍 Endpoint Verificar: http://localhost:${PUERTO}/api/festivos/verificar?fecha=2023-06-12`);
      console.log(`📅 Endpoint Año: http://localhost:${PUERTO}/api/festivos/anio/2023`);
      console.log('====================================================');
    });

    // Cierre limpio (Graceful Shutdown)
    const cerrar = async (signal) => {
      console.log(`\n[Servidor] Recibida señal ${signal}. Cerrando servidor y desconectando MongoDB...`);
      servidor.close(async () => {
        await desconectarDB();
        console.log('[Servidor] Servidor detenido exitosamente.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => cerrar('SIGINT'));
    process.on('SIGTERM', () => cerrar('SIGTERM'));
  } catch (error) {
    console.error('[Servidor] Error al iniciar la aplicación:', error.message);
    process.exit(1);
  }
}

iniciarServidor();
