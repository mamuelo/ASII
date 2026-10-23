/**
 * Servidor en Modo Autónomo / En Memoria
 * Permite ejecutar y probar la API completa sin requerir una instalación local previa de MongoDB.
 */

require('dotenv').config();
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('./app');
const { conectarDB, desconectarDB } = require('./config/database');
const { seedFestivos } = require('./scripts/seed');

const PUERTO = process.env.PORT || 8080;

async function iniciarServidorEnMemoria() {
  try {
    console.log('----------------------------------------------------');
    console.log('[Modo Autónomo] Iniciando instancia MongoDB en memoria...');
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    console.log(`[Modo Autónomo] MongoDB en memoria listo en: ${uri}`);

    // Conectar Mongoose
    await conectarDB(uri);

    // Cargar definiciones iniciales de festivos
    await seedFestivos();

    // Iniciar servidor Express
    const servidor = app.listen(PUERTO, () => {
      console.log('====================================================');
      console.log(`🚀 API Festivos Colombia (Modo Autónomo) lista`);
      console.log(`📍 URL Base: http://localhost:${PUERTO}`);
      console.log(`📖 Documentación Swagger UI: http://localhost:${PUERTO}/api-docs`);
      console.log(`🔍 Endpoint Verificar (Query): http://localhost:${PUERTO}/api/festivos/verificar?fecha=2023-06-12`);
      console.log(`🔍 Endpoint Verificar (Ruta):  http://localhost:${PUERTO}/api/festivos/verificar/2023/6/12`);
      console.log(`📅 Endpoint Año:               http://localhost:${PUERTO}/api/festivos/anio/2023`);
      console.log('====================================================');
    });

    const cerrar = async () => {
      console.log('\n[Servidor] Deteniendo servidor y cerrando MongoDB en memoria...');
      servidor.close(async () => {
        await desconectarDB();
        await mongoServer.stop();
        console.log('[Servidor] Apagado completado.');
        process.exit(0);
      });
    };

    process.on('SIGINT', cerrar);
    process.on('SIGTERM', cerrar);
  } catch (error) {
    console.error('[Error Crítico]', error);
    process.exit(1);
  }
}

iniciarServidorEnMemoria();
