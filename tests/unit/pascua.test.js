/**
 * Pruebas Unitarias - Algoritmo de Cálculo del Domingo de Pascua
 * Taller 1 - Diagramas de Arquitectura (ITM)
 */

const {
  calcularDomingoPascua,
  obtenerDetalleCalculoPascua
} = require('../../src/business/pascua.servicio');
const { formatearFechaISO } = require('../../src/utils/fecha.util');

describe('Pruebas Unitarias: Cálculo del Domingo de Pascua', () => {
  test('Debe calcular correctamente el Domingo de Pascua para 1999 (ejemplo explícito del PDF del taller)', () => {
    // Según el PDF del ITM:
    // a = 1999 MOD 19 = 4
    // b = 1999 MOD 4 = 3
    // c = 1999 MOD 7 = 4
    // d = (19*4 + 24) MOD 30 = 10
    // dias = 10 + (2*3 + 4*4 + 6*10 + 5) MOD 7 = 13
    // Domingo de Ramos = 15 + 13 = 28 de marzo
    // Domingo de Pascua = 7 días después = 4 de abril de 1999
    const pascua = calcularDomingoPascua(1999);
    expect(formatearFechaISO(pascua)).toBe('1999-04-04');

    const detalle = obtenerDetalleCalculoPascua(1999);
    expect(detalle.variables.a).toBe(4);
    expect(detalle.variables.b).toBe(3);
    expect(detalle.variables.c).toBe(4);
    expect(detalle.variables.d).toBe(10);
    expect(detalle.diasSinAjuste).toBe(13);
    expect(detalle.domingoRamosStr).toBe('1999-03-28');
    expect(detalle.domingoPascuaStr).toBe('1999-04-04');
  });

  test('Debe calcular correctamente fechas de Pascua de años recientes y futuros conocidos', () => {
    const casos = [
      { anio: 2020, esperada: '2020-04-12' },
      { anio: 2021, esperada: '2021-04-04' },
      { anio: 2022, esperada: '2022-04-17' },
      { anio: 2023, esperada: '2023-04-09' },
      { anio: 2024, esperada: '2024-03-31' },
      { anio: 2025, esperada: '2025-04-20' },
      { anio: 2026, esperada: '2026-04-05' }
    ];

    casos.forEach(({ anio, esperada }) => {
      const pascua = calcularDomingoPascua(anio);
      expect(formatearFechaISO(pascua)).toBe(esperada);
    });
  });

  test('Debe resolver adecuadamente los casos límite y excepciones gregorianas de Gauss (1954 y 1981)', () => {
    // 1954: d=28, e=6, a=16 (>10) -> se restan 7 días (18 de abril en lugar del 25 de abril)
    const pascua1954 = calcularDomingoPascua(1954);
    expect(formatearFechaISO(pascua1954)).toBe('1954-04-18');

    // 1981: d=29, e=6 -> se restan 7 días (19 de abril en lugar del 26 de abril)
    const pascua1981 = calcularDomingoPascua(1981);
    expect(formatearFechaISO(pascua1981)).toBe('1981-04-19');
  });

  test('Debe lanzar error si el año es inválido o no es un entero positivo', () => {
    expect(() => calcularDomingoPascua('2023')).toThrow();
    expect(() => calcularDomingoPascua(null)).toThrow();
    expect(() => calcularDomingoPascua(-5)).toThrow();
    expect(() => calcularDomingoPascua(2023.5)).toThrow();
  });
});
