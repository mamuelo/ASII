/**
 * Pruebas Unitarias - Utilidades de Fecha y Ley Emiliani
 * Taller 1 - Diagramas de Arquitectura (ITM)
 */

const {
  esAnioBisiesto,
  diasEnMes,
  validarFechaStr,
  formatearFechaISO,
  trasladarAlSiguienteLunes
} = require('../../src/utils/fecha.util');

describe('Pruebas Unitarias: Utilidades de Fecha y Ley Emiliani', () => {
  describe('esAnioBisiesto', () => {
    test('Identifica correctamente años bisiestos y no bisiestos', () => {
      expect(esAnioBisiesto(2024)).toBe(true);
      expect(esAnioBisiesto(2020)).toBe(true);
      expect(esAnioBisiesto(2000)).toBe(true); // divisible entre 400
      expect(esAnioBisiesto(1900)).toBe(false); // divisible entre 100 pero no entre 400
      expect(esAnioBisiesto(2023)).toBe(false);
      expect(esAnioBisiesto(2025)).toBe(false);
      expect(esAnioBisiesto('2024')).toBe(false);
    });
  });

  describe('diasEnMes', () => {
    test('Calcula la cantidad exacta de días para cada mes', () => {
      expect(diasEnMes(2024, 2)).toBe(29); // Febrero bisiesto
      expect(diasEnMes(2023, 2)).toBe(28); // Febrero no bisiesto
      expect(diasEnMes(2023, 1)).toBe(31); // Enero
      expect(diasEnMes(2023, 4)).toBe(30); // Abril
      expect(diasEnMes(2023, 7)).toBe(31); // Julio
      expect(diasEnMes(2023, 12)).toBe(31); // Diciembre
      expect(diasEnMes(2023, 13)).toBe(0); // Mes inválido
    });
  });

  describe('validarFechaStr', () => {
    test('Acepta fechas válidas existentes en el calendario', () => {
      expect(validarFechaStr('2023-06-12').valida).toBe(true);
      expect(validarFechaStr('2023-02-28').valida).toBe(true);
      expect(validarFechaStr('2024-02-29').valida).toBe(true); // 2024 bisiesto
      expect(validarFechaStr('2023-12-31').valida).toBe(true);
    });

    test('Rechaza fechas inexistentes (como 35 de febrero o 29 de febrero no bisiesto)', () => {
      // Caso explícito del PDF: 35 de febrero de 2023
      const res35Feb = validarFechaStr('2023-02-35');
      expect(res35Feb.valida).toBe(false);
      expect(res35Feb.error).toContain('Fecha No valida');

      // Caso explícito del prompt: 2023-02-29 (año no bisiesto)
      const res29Feb = validarFechaStr('2023-02-29');
      expect(res29Feb.valida).toBe(false);
      expect(res29Feb.error).toContain('el año 2023 no es bisiesto');

      // 31 de abril (abril solo tiene 30 días)
      const res31Abril = validarFechaStr('2023-04-31');
      expect(res31Abril.valida).toBe(false);
      expect(res31Abril.error).toContain('solo tiene 30 días');
    });

    test('Rechaza formatos incorrectos y valores nulos', () => {
      expect(validarFechaStr('2023/06/12').valida).toBe(false);
      expect(validarFechaStr('12-06-2023').valida).toBe(false);
      expect(validarFechaStr('2023-6-12').valida).toBe(false);
      expect(validarFechaStr('texto').valida).toBe(false);
      expect(validarFechaStr('').valida).toBe(false);
      expect(validarFechaStr(null).valida).toBe(false);
      expect(validarFechaStr(undefined).valida).toBe(false);
    });

    test('Rechaza meses y años fuera de rango', () => {
      expect(validarFechaStr('2023-13-01').valida).toBe(false);
      expect(validarFechaStr('2023-00-10').valida).toBe(false);
      expect(validarFechaStr('1800-01-01').valida).toBe(false);
      expect(validarFechaStr('2500-01-01').valida).toBe(false);
    });
  });

  describe('trasladarAlSiguienteLunes (Ley Emiliani)', () => {
    test('Si la fecha ya es lunes, permanece intacta', () => {
      // 2023-05-01 fue lunes
      const lunes = new Date(Date.UTC(2023, 4, 1));
      const res = trasladarAlSiguienteLunes(lunes);
      expect(formatearFechaISO(res)).toBe('2023-05-01');
    });

    test('Si la fecha es domingo, se traslada al día siguiente (lunes)', () => {
      // 2023-01-01 fue domingo
      const domingo = new Date(Date.UTC(2023, 0, 1));
      const res = trasladarAlSiguienteLunes(domingo);
      expect(formatearFechaISO(res)).toBe('2023-01-02');
    });

    test('Si la fecha es martes, se traslada 6 días al siguiente lunes', () => {
      // 2024-03-19 (San José 2024) fue martes
      const martes = new Date(Date.UTC(2024, 2, 19));
      const res = trasladarAlSiguienteLunes(martes);
      expect(formatearFechaISO(res)).toBe('2024-03-25');
    });

    test('Si la fecha es jueves, se traslada 4 días al siguiente lunes', () => {
      // Corpus Christi 2023 cayó jueves 8 de junio de 2023
      const jueves = new Date(Date.UTC(2023, 5, 8));
      const res = trasladarAlSiguienteLunes(jueves);
      expect(formatearFechaISO(res)).toBe('2023-06-12');
    });

    test('Si la fecha es viernes, se traslada 3 días al siguiente lunes', () => {
      // 2023-01-06 (Santos Reyes 2023) fue viernes
      const viernes = new Date(Date.UTC(2023, 0, 6));
      const res = trasladarAlSiguienteLunes(viernes);
      expect(formatearFechaISO(res)).toBe('2023-01-09');
    });

    test('Si la fecha es sábado, se traslada 2 días al siguiente lunes', () => {
      // 2023-11-11 (Independencia de Cartagena 2023) fue sábado
      const sabado = new Date(Date.UTC(2023, 10, 11));
      const res = trasladarAlSiguienteLunes(sabado);
      expect(formatearFechaISO(res)).toBe('2023-11-13');
    });
  });
});
