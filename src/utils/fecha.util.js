/**
 * Utilidades para manejo, validación y formateo de fechas
 * Taller 1 - API Festivos Colombia
 */

/**
 * Determina si un año es bisiesto según el calendario gregoriano.
 * @param {number} anio 
 * @returns {boolean}
 */
function esAnioBisiesto(anio) {
  if (typeof anio !== 'number' || !Number.isInteger(anio)) {
    return false;
  }
  return (anio % 4 === 0 && anio % 100 !== 0) || (anio % 400 === 0);
}

/**
 * Retorna el número de días que tiene un mes en un año específico.
 * @param {number} anio 
 * @param {number} mes (1 - 12)
 * @returns {number}
 */
function diasEnMes(anio, mes) {
  if (mes < 1 || mes > 12) return 0;
  // Meses de 31 días: Enero, Marzo, Mayo, Julio, Agosto, Octubre, Diciembre
  const meses31 = [1, 3, 5, 7, 8, 10, 12];
  if (meses31.includes(mes)) return 31;
  // Febrero: 29 si bisiesto, 28 si no
  if (mes === 2) return esAnioBisiesto(anio) ? 29 : 28;
  // Meses de 30 días: Abril, Junio, Septiembre, Noviembre
  return 30;
}

/**
 * Valida de forma estricta una cadena de fecha con formato YYYY-MM-DD.
 * Evita normalizaciones automáticas erróneas de JavaScript (por ejemplo 2023-02-35).
 * 
 * @param {string} fechaStr 
 * @returns {{ valida: boolean, anio?: number, mes?: number, dia?: number, error?: string }}
 */
function validarFechaStr(fechaStr) {
  if (!fechaStr || typeof fechaStr !== 'string') {
    return { valida: false, error: 'La fecha es obligatoria y debe ser un texto.' };
  }

  const patron = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = fechaStr.trim().match(patron);

  if (!match) {
    return {
      valida: false,
      error: `Formato de fecha inválido: '${fechaStr}'. Debe tener el formato ISO YYYY-MM-DD (ej: 2023-06-12).`
    };
  }

  const anio = parseInt(match[1], 10);
  const mes = parseInt(match[2], 10);
  const dia = parseInt(match[3], 10);

  if (anio < 1900 || anio > 2199) {
    return {
      valida: false,
      error: `El año ${anio} está fuera del rango permitido (1900 - 2199).`
    };
  }

  if (mes < 1 || mes > 12) {
    return {
      valida: false,
      error: `Mes inválido: ${mes}. Debe estar comprendido entre 01 y 12.`
    };
  }

  const maxDias = diasEnMes(anio, mes);
  if (dia < 1 || dia > maxDias) {
    if (mes === 2 && dia === 29 && !esAnioBisiesto(anio)) {
      return {
        valida: false,
        error: `Fecha No valida: el año ${anio} no es bisiesto, por lo que febrero solo tiene 28 días.`
      };
    }
    return {
      valida: false,
      error: `Fecha No valida: el mes ${mes} del año ${anio} solo tiene ${maxDias} días (se recibió día ${dia}).`
    };
  }

  return { valida: true, anio, mes, dia };
}

/**
 * Formatea una fecha en UTC a string YYYY-MM-DD
 * @param {Date} dateUtc 
 * @returns {string}
 */
function formatearFechaISO(dateUtc) {
  const anio = dateUtc.getUTCFullYear();
  const mes = String(dateUtc.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(dateUtc.getUTCDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/**
 * Aplica la regla de la Ley Emiliani (Ley 51 de 1983):
 * Si la fecha original cae en lunes, se mantiene.
 * Si cae en cualquier otro día de la semana, se traslada al siguiente lunes.
 * 
 * @param {Date} dateUtc Objeto Date configurado en UTC
 * @returns {Date} Nuevo objeto Date configurado en UTC trasladado al siguiente lunes
 */
function trasladarAlSiguienteLunes(dateUtc) {
  const diaSemana = dateUtc.getUTCDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  if (diaSemana === 1) {
    // Ya es lunes, no se traslada
    return new Date(dateUtc.getTime());
  }

  // Días que faltan para llegar al lunes siguiente:
  // Domingo (0) -> +1 día
  // Martes (2)  -> +6 días
  // Miércoles (3)-> +5 días
  // Jueves (4)  -> +4 días
  // Viernes (5) -> +3 días
  // Sábado (6)  -> +2 días
  const diasASumar = diaSemana === 0 ? 1 : 8 - diaSemana;
  const fechaTrasladada = new Date(dateUtc.getTime());
  fechaTrasladada.setUTCDate(fechaTrasladada.getUTCDate() + diasASumar);
  return fechaTrasladada;
}

module.exports = {
  esAnioBisiesto,
  diasEnMes,
  validarFechaStr,
  formatearFechaISO,
  trasladarAlSiguienteLunes
};
