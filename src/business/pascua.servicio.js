/**
 * Servicio de Cálculo del Domingo de Pascua
 * Taller 1 - Diagramas de Arquitectura (ITM)
 * 
 * Implementación basada en el algoritmo de Gauss presentado en el documento del taller:
 *   a = año MOD 19
 *   b = año MOD 4
 *   c = año MOD 7
 *   d = (19 * a + 24) MOD 30
 *   e = (2 * b + 4 * c + 6 * d + 5) MOD 7
 *   dias = d + e
 * 
 * Procedimiento según el taller:
 *   Domingo de Ramos = 15 de marzo + dias
 *   Domingo de Pascua = Domingo de Ramos + 7 días
 * 
 * NOTA TÉCNICA / CASOS LÍMITE (EXCEPCIONES GREGORIANAS DE GAUSS):
 * En el calendario gregoriano (para los siglos XX y XXI: 1900 a 2099), la fórmula básica
 * de Gauss presenta dos excepciones documentadas históricamente cuando la Pascua caería
 * después del límite eclesiástico (25 de abril):
 *   1) Si d = 29 y e = 6 => Se restan 7 días (Pascua cae el 19 de abril en lugar del 26, ej: 1981).
 *   2) Si d = 28, e = 6 y a > 10 => Se restan 7 días (Pascua cae el 18 de abril en lugar del 25, ej: 1954).
 * 
 * Esta implementación incluye estas dos excepciones para garantizar exactitud astronómica y litúrgica 
 * 100% fiel al calendario oficial en Colombia.
 */

/**
 * Calcula la fecha del Domingo de Pascua para un año dado en formato UTC.
 * 
 * @param {number} anio Año a calcular (ej: 2023, 1999)
 * @returns {Date} Objeto Date (UTC a medianoche) correspondiente al Domingo de Pascua
 */
function calcularDomingoPascua(anio) {
  if (typeof anio !== 'number' || !Number.isInteger(anio) || anio < 1) {
    throw new Error(`Año inválido para el cálculo de Pascua: ${anio}`);
  }

  // Constantes de Gauss para el periodo 1900 - 2099
  // M = 24, N = 5
  const a = anio % 19;
  const b = anio % 4;
  const c = anio % 7;
  const d = (19 * a + 24) % 30;
  const e = (2 * b + 4 * c + 6 * d + 5) % 7;

  let dias = d + e;

  // Ajuste de excepciones astronómicas gregorianas de Gauss (periodo 1900-2099)
  if (d === 29 && e === 6) {
    dias -= 7;
  } else if (d === 28 && e === 6 && a > 10) {
    dias -= 7;
  }

  // 15 de marzo + dias = Domingo de Ramos
  // Domingo de Pascua = Domingo de Ramos + 7 días
  // En JavaScript, el mes 2 corresponde a Marzo (0-indexed: 0 = Enero, 1 = Feb, 2 = Mar)
  const diaBaseRamos = 15;
  const diasRamos = diaBaseRamos + dias;

  // Creamos la fecha en UTC para evitar desfases horarios locales
  // Marzo tiene 31 días; Date.UTC maneja correctamente el avance hacia Abril
  const domingoPascua = new Date(Date.UTC(anio, 2, diasRamos + 7));

  return domingoPascua;
}

/**
 * Retorna el desglose matemático detallado del cálculo de Pascua para propósitos
 * de auditoría, trazabilidad y pruebas académicas.
 * 
 * @param {number} anio 
 * @returns {object}
 */
function obtenerDetalleCalculoPascua(anio) {
  const a = anio % 19;
  const b = anio % 4;
  const c = anio % 7;
  const d = (19 * a + 24) % 30;
  const e = (2 * b + 4 * c + 6 * d + 5) % 7;
  const diasSinAjuste = d + e;

  let ajusteAplicado = false;
  let diasFinales = diasSinAjuste;

  if (d === 29 && e === 6) {
    diasFinales -= 7;
    ajusteAplicado = true;
  } else if (d === 28 && e === 6 && a > 10) {
    diasFinales -= 7;
    ajusteAplicado = true;
  }

  const domingoPascua = new Date(Date.UTC(anio, 2, 15 + diasFinales + 7));

  return {
    anio,
    variables: { a, b, c, d, e },
    diasSinAjuste,
    ajusteAplicado,
    diasFinales,
    domingoRamosStr: new Date(Date.UTC(anio, 2, 15 + diasFinales)).toISOString().slice(0, 10),
    domingoPascuaStr: domingoPascua.toISOString().slice(0, 10)
  };
}

module.exports = {
  calcularDomingoPascua,
  obtenerDetalleCalculoPascua
};
