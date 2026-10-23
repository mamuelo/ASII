/**
 * Pruebas Unitarias - Servicio de Festivos (Lógica de Negocio Pura)
 * Taller 1 - Diagramas de Arquitectura (ITM)
 * 
 * Se ejecutan de manera aislada sin depender de una conexión real a MongoDB
 * mediante la inyección de un repositorio simulado (Mock).
 */

const { FestivoServicio } = require('../../src/business/festivo.servicio');
const { FESTIVOS_BASE } = require('../../src/scripts/seed.data');

describe('Pruebas Unitarias: Servicio de Festivos (Reglas de Negocio)', () => {
  let servicio;
  let mockRepositorio;

  beforeEach(() => {
    mockRepositorio = {
      obtenerTodosActivos: jest.fn().mockResolvedValue(FESTIVOS_BASE)
    };
    servicio = new FestivoServicio(mockRepositorio);
  });

  describe('Cálculo de Festivos Tipo 1 (Fijos)', () => {
    test('Calcula correctamente festivos fijos que no varían de fecha', async () => {
      const festivos = await servicio.obtenerFestivosPorAnio(2023);
      
      const anoNuevo = festivos.find((f) => f.festivo === 'Año nuevo');
      expect(anoNuevo).toBeDefined();
      expect(anoNuevo.fecha).toBe('2023-01-01');
      expect(anoNuevo.tipo).toBe(1);

      const diaTrabajo = festivos.find((f) => f.festivo === 'Día del Trabajo');
      expect(diaTrabajo.fecha).toBe('2023-05-01');

      const independencia = festivos.find((f) => f.festivo === 'Independencia de Colombia');
      expect(independencia.fecha).toBe('2023-07-20');

      const batalla = festivos.find((f) => f.festivo === 'Batalla de Boyacá');
      expect(batalla.fecha).toBe('2023-08-07');

      const inmaculada = festivos.find((f) => f.festivo === 'Inmaculada Concepción');
      expect(inmaculada.fecha).toBe('2023-12-08');

      const navidad = festivos.find((f) => f.festivo === 'Navidad');
      expect(navidad.fecha).toBe('2023-12-25');
    });
  });

  describe('Cálculo de Festivos Tipo 2 (Ley Emiliani / Puente)', () => {
    test('Traslada festivos al siguiente lunes cuando no caen en lunes', async () => {
      const festivos = await servicio.obtenerFestivosPorAnio(2023);

      // Santos Reyes (6 de enero de 2023 fue viernes -> se traslada al lunes 9 de enero)
      const reyes = festivos.find((f) => f.festivo === 'Santos Reyes');
      expect(reyes.fecha).toBe('2023-01-09');
      expect(reyes.tipo).toBe(2);
      expect(reyes.fechaOriginal).toBe('2023-01-06');

      // San José (19 de marzo de 2023 fue domingo -> se traslada al lunes 20 de marzo)
      const sanJose = festivos.find((f) => f.festivo === 'San José');
      expect(sanJose.fecha).toBe('2023-03-20');
      expect(sanJose.fechaOriginal).toBe('2023-03-19');

      // San Pedro y San Pablo (29 de junio de 2023 fue jueves -> se traslada al lunes 3 de julio)
      const sanPedro = festivos.find((f) => f.festivo === 'San Pedro y San Pablo');
      expect(sanPedro.fecha).toBe('2023-07-03');

      // Asunción de la Virgen (15 de agosto de 2023 fue martes -> se traslada al lunes 21 de agosto)
      const asuncion = festivos.find((f) => f.festivo === 'Asunción de la Virgen');
      expect(asuncion.fecha).toBe('2023-08-21');

      // Día de la Raza (12 de octubre de 2023 fue jueves -> se traslada al lunes 16 de octubre)
      const raza = festivos.find((f) => f.festivo === 'Día de la Raza');
      expect(raza.fecha).toBe('2023-10-16');

      // Todos los santos (1 de noviembre de 2023 fue miércoles -> se traslada al lunes 6 de noviembre)
      const santos = festivos.find((f) => f.festivo === 'Todos los santos');
      expect(santos.fecha).toBe('2023-11-06');

      // Independencia de Cartagena (11 de noviembre de 2023 fue sábado -> se traslada al lunes 13 de noviembre)
      const cartagena = festivos.find((f) => f.festivo === 'Independencia de Cartagena');
      expect(cartagena.fecha).toBe('2023-11-13');
    });
  });

  describe('Cálculo de Festivos Tipo 3 (Semana Santa y Pascua)', () => {
    test('Calcula con exactitud los festivos basados en Pascua para 2023 (Pascua: 2023-04-09)', async () => {
      const festivos = await servicio.obtenerFestivosPorAnio(2023);

      // Jueves Santo (-3 días): 2023-04-06
      const juevesSanto = festivos.find((f) => f.festivo === 'Jueves Santo');
      expect(juevesSanto.fecha).toBe('2023-04-06');
      expect(juevesSanto.tipo).toBe(3);

      // Viernes Santo (-2 días): 2023-04-07
      const viernesSanto = festivos.find((f) => f.festivo === 'Viernes Santo');
      expect(viernesSanto.fecha).toBe('2023-04-07');
      expect(viernesSanto.tipo).toBe(3);

      // Domingo de Pascua (0 días): 2023-04-09
      const pascua = festivos.find((f) => f.festivo === 'Domingo de Pascua');
      expect(pascua.fecha).toBe('2023-04-09');
      expect(pascua.tipo).toBe(3);
    });
  });

  describe('Cálculo de Festivos Tipo 4 (Pascua + Ley Emiliani)', () => {
    test('Calcula festivos dependientes de Pascua y los traslada al siguiente lunes para 2023', async () => {
      const festivos = await servicio.obtenerFestivosPorAnio(2023);

      // Ascensión del Señor (+40 días desde Pascua):
      // 2023-04-09 + 40 días = 2023-05-19 (viernes/jueves) -> trasladado al lunes 2023-05-22
      const ascension = festivos.find((f) => f.festivo === 'Ascensión del Señor');
      expect(ascension.fecha).toBe('2023-05-22');
      expect(ascension.tipo).toBe(4);

      // Corpus Christi (+61 días desde Pascua):
      // 2023-04-09 + 61 días = 2023-06-08 (jueves) -> trasladado al lunes 2023-06-12 (ejemplo del PDF)
      const corpus = festivos.find((f) => f.festivo === 'Corpus Christi');
      expect(corpus.fecha).toBe('2023-06-12');
      expect(corpus.tipo).toBe(4);

      // Sagrado Corazón de Jesús (+68 días desde Pascua):
      // 2023-04-09 + 68 días = 2023-06-16 (viernes) -> trasladado al lunes 2023-06-19
      const sagradoCorazon = festivos.find((f) => f.festivo === 'Sagrado Corazón de Jesús');
      expect(sagradoCorazon.fecha).toBe('2023-06-19');
      expect(sagradoCorazon.tipo).toBe(4);
    });
  });

  describe('Verificación de Fecha Específica (verificarFechaFestiva)', () => {
    test('Confirma que 2023-06-12 es festivo (Corpus Christi - ejemplo del PDF)', async () => {
      const res = await servicio.verificarFechaFestiva('2023-06-12');
      expect(res.esFestivo).toBe(true);
      expect(res.festivo).toBe('Corpus Christi');
      expect(res.tipo).toBe(4);
      expect(res.mensaje).toBe('Es Festivo');
    });

    test('Confirma que 2023-02-28 no es festivo (ejemplo del PDF)', async () => {
      const res = await servicio.verificarFechaFestiva('2023-02-28');
      expect(res.esFestivo).toBe(false);
      expect(res.festivo).toBeNull();
      expect(res.tipo).toBeNull();
      expect(res.mensaje).toBe('No es festivo');
    });

    test('Confirma que 2024-02-29 es fecha válida de año bisiesto pero no festiva', async () => {
      const res = await servicio.verificarFechaFestiva('2024-02-29');
      expect(res.esFestivo).toBe(false);
      expect(res.mensaje).toBe('No es festivo');
    });

    test('Rechaza fechas inexistentes lanzando un error 400', async () => {
      await expect(servicio.verificarFechaFestiva('2023-02-35')).rejects.toMatchObject({
        statusCode: 400
      });
      await expect(servicio.verificarFechaFestiva('2023-02-29')).rejects.toMatchObject({
        statusCode: 400
      });
    });
  });

  describe('Manejo de distintos años y orden cronológico', () => {
    test('Calcula festivos para el año 2024 en estricto orden cronológico', async () => {
      const festivos2024 = await servicio.obtenerFestivosPorAnio(2024);
      expect(festivos2024.length).toBe(19);

      // Comprobar orden cronológico
      for (let i = 0; i < festivos2024.length - 1; i++) {
        expect(festivos2024[i].fecha <= festivos2024[i + 1].fecha).toBe(true);
      }
    });

    test('Lanza error si la base de datos no contiene definiciones', async () => {
      mockRepositorio.obtenerTodosActivos.mockResolvedValueOnce([]);
      await expect(servicio.obtenerFestivosPorAnio(2023)).rejects.toMatchObject({
        statusCode: 500
      });
    });
  });
});
