/**
 * Pruebas de Integración - API REST Festivos Colombia
 * Taller 1 - Diagramas de Arquitectura (ITM)
 * 
 * Utiliza Supertest y MongoMemoryServer para ejecutar las pruebas contra una
 * instancia real de MongoDB en memoria, garantizando aislamiento total.
 */

const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const app = require('../../src/app');
const { conectarDB, desconectarDB } = require('../../src/config/database');
const festivoRepositorio = require('../../src/data/festivo.repositorio');
const { seedFestivos } = require('../../src/scripts/seed');

describe('Pruebas de Integración: API Festivos Colombia', () => {
  let mongoServer;

  beforeAll(async () => {
    // Iniciar servidor MongoDB en memoria
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await conectarDB(uri);

    // Cargar definiciones iniciales de festivos
    await seedFestivos();
  }, 60000);

  afterAll(async () => {
    await desconectarDB();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe('10. Inicialización Idempotente en MongoDB', () => {
    test('Ejecutar seed múltiples veces no genera duplicados', async () => {
      const conteoInicial = await festivoRepositorio.contar();
      expect(conteoInicial).toBe(19);

      // Segunda ejecución del seed
      await seedFestivos();
      const conteoSegunda = await festivoRepositorio.contar();
      expect(conteoSegunda).toBe(19);

      // Tercera ejecución del seed
      await seedFestivos();
      const conteoTercera = await festivoRepositorio.contar();
      expect(conteoTercera).toBe(19);
    });
  });

  describe('Endpoint A: GET /api/festivos/verificar', () => {
    test('1. Consulta de un festivo fijo (2023-01-01)', async () => {
      const res = await request(app)
        .get('/api/festivos/verificar?fecha=2023-01-01')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toMatchObject({
        fecha: '2023-01-01',
        esFestivo: true,
        festivo: 'Año nuevo',
        tipo: 1,
        mensaje: 'Es Festivo'
      });
    });

    test('2. Consulta de una fecha válida que no sea festiva (2023-02-28)', async () => {
      const res = await request(app)
        .get('/api/festivos/verificar?fecha=2023-02-28')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toMatchObject({
        fecha: '2023-02-28',
        esFestivo: false,
        festivo: null,
        tipo: null,
        mensaje: 'No es festivo'
      });
    });

    test('3. Traslado de un festivo al lunes (Santos Reyes: 2023-01-09)', async () => {
      // 6 de enero fue viernes -> se trasladó al lunes 9 de enero
      const res = await request(app)
        .get('/api/festivos/verificar?fecha=2023-01-09')
        .expect(200);

      expect(res.body.esFestivo).toBe(true);
      expect(res.body.festivo).toBe('Santos Reyes');
      expect(res.body.tipo).toBe(2);

      // El 6 de enero ya no es festivo porque fue trasladado
      const resOriginal = await request(app)
        .get('/api/festivos/verificar?fecha=2023-01-06')
        .expect(200);
      expect(resOriginal.body.esFestivo).toBe(false);
    });

    test('4. Festivos de Semana Santa (Jueves y Viernes Santo 2023)', async () => {
      // Jueves Santo 2023: 2023-04-06
      const resJueves = await request(app)
        .get('/api/festivos/verificar?fecha=2023-04-06')
        .expect(200);
      expect(resJueves.body.esFestivo).toBe(true);
      expect(resJueves.body.festivo).toBe('Jueves Santo');
      expect(resJueves.body.tipo).toBe(3);

      // Viernes Santo 2023: 2023-04-07
      const resViernes = await request(app)
        .get('/api/festivos/verificar?fecha=2023-04-07')
        .expect(200);
      expect(resViernes.body.esFestivo).toBe(true);
      expect(resViernes.body.festivo).toBe('Viernes Santo');
    });

    test('5. Festivos calculados a partir de Pascua y trasladados al lunes (Corpus Christi: 2023-06-12)', async () => {
      // Ejemplo explícito del PDF del taller
      const res = await request(app)
        .get('/api/festivos/verificar?fecha=2023-06-12')
        .expect(200);

      expect(res.body).toMatchObject({
        fecha: '2023-06-12',
        esFestivo: true,
        festivo: 'Corpus Christi',
        tipo: 4,
        mensaje: 'Es Festivo'
      });
    });

    test('Verificación mediante parámetros de ruta (/api/festivos/verificar/2023/6/12)', async () => {
      const res = await request(app)
        .get('/api/festivos/verificar/2023/6/12')
        .expect(200);

      expect(res.body.esFestivo).toBe(true);
      expect(res.body.festivo).toBe('Corpus Christi');
    });

    test('7. Fechas inválidas: día inexistente 35 de febrero de 2023 (ejemplo del PDF)', async () => {
      const res = await request(app)
        .get('/api/festivos/verificar?fecha=2023-02-35')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(res.body.error).toBe('Bad Request');
      expect(res.body.codigo).toBe(400);
      expect(res.body.mensaje).toContain('Fecha No valida');
    });

    test('7b. Fechas inválidas: 29 de febrero en año no bisiesto (2023-02-29)', async () => {
      const res = await request(app)
        .get('/api/festivos/verificar?fecha=2023-02-29')
        .expect(400);

      expect(res.body.mensaje).toContain('no es bisiesto');
    });

    test('7c. Fechas válidas en año bisiesto (2024-02-29)', async () => {
      const res = await request(app)
        .get('/api/festivos/verificar?fecha=2024-02-29')
        .expect(200);

      expect(res.body.esFestivo).toBe(false);
      expect(res.body.fecha).toBe('2024-02-29');
    });

    test('8. Parámetros ausentes o mal formados', async () => {
      const resVacio = await request(app)
        .get('/api/festivos/verificar')
        .expect(400);
      expect(resVacio.body.mensaje).toContain('Parámetro de fecha requerido');

      const resFormato = await request(app)
        .get('/api/festivos/verificar?fecha=12-06-2023')
        .expect(400);
      expect(resFormato.body.mensaje).toContain('Formato de fecha inválido');
    });
  });

  describe('Endpoint B: GET /api/festivos/anio/:anio', () => {
    test('6. Consulta de la lista completa de festivos de distintos años (2023 y 2024)', async () => {
      const res2023 = await request(app)
        .get('/api/festivos/anio/2023')
        .expect(200);

      expect(Array.isArray(res2023.body)).toBe(true);
      expect(res2023.body.length).toBe(19);

      // Comprobar presencia de campos mínimos requeridos
      res2023.body.forEach((f) => {
        expect(f).toHaveProperty('fecha');
        expect(f).toHaveProperty('festivo');
        expect(f).toHaveProperty('tipo');
      });

      // Comprobar orden cronológico
      for (let i = 0; i < res2023.body.length - 1; i++) {
        expect(res2023.body[i].fecha <= res2023.body[i + 1].fecha).toBe(true);
      }

      // Probar otro año (2024)
      const res2024 = await request(app)
        .get('/api/festivos/anio/2024')
        .expect(200);
      expect(res2024.body.length).toBe(19);
      expect(res2024.body[0].fecha).toBe('2024-01-01');
    });

    test('Alias GET /api/festivos/obtener/:anio (fiel a captura página 5)', async () => {
      const res = await request(app)
        .get('/api/festivos/obtener/2023')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(19);
    });

    test('8b. Año con formato inválido o fuera de rango', async () => {
      const resTexto = await request(app)
        .get('/api/festivos/anio/invalido')
        .expect(400);
      expect(resTexto.body.mensaje).toContain('Año inválido');

      const resRango = await request(app)
        .get('/api/festivos/anio/1850')
        .expect(400);
      expect(resRango.body.mensaje).toContain('fuera de rango');
    });
  });

  describe('Rutas 404 y Documentación', () => {
    test('Rutas inexistentes retornan 404 Not Found con mensaje descriptivo', async () => {
      const res = await request(app)
        .get('/api/festivos/no-existe')
        .expect(404);

      expect(res.body.error).toBe('Not Found');
      expect(res.body.codigo).toBe(404);
      expect(res.body.rutasDisponibles).toBeDefined();
    });

    test('Ruta raíz devuelve información del servicio', async () => {
      const res = await request(app)
        .get('/')
        .expect(200);

      expect(res.body.nombre).toBe('API RESTful Festivos Colombia');
      expect(res.body.endpoints).toBeDefined();
    });
  });

  describe('9. Manejo de Errores de Base de Datos', () => {
    test('Manejo centralizado de errores cuando la conexión a MongoDB se interrumpe', async () => {
      // Simular desconexión temporal de MongoDB
      await mongoose.disconnect();

      const res = await request(app)
        .get('/api/festivos/anio/2023')
        .expect(500);

      expect(res.body.error).toBe('Internal Server Error');
      expect(res.body.codigo).toBe(500);
      expect(res.body.mensaje).toContain('MongoDB');

      // Reconectar para no afectar el teardown
      await conectarDB(mongoServer.getUri());
    });
  });
});
