/**
 * Capa de Lógica de Negocio - Servicio de Festivos
 * Taller 1 - Diagramas de Arquitectura (ITM)
 * 
 * Implementa las reglas de cálculo de los festivos de Colombia:
 * 1. Festivos fijos
 * 2. Festivos trasladados al siguiente lunes (Ley Emiliani)
 * 3. Festivos basados en el Domingo de Pascua
 * 4. Festivos basados en Pascua y trasladados al lunes
 */

const festivoRepositorioPorDefecto = require('../data/festivo.repositorio');
const { calcularDomingoPascua } = require('./pascua.servicio');
const {
  validarFechaStr,
  formatearFechaISO,
  trasladarAlSiguienteLunes
} = require('../utils/fecha.util');

class FestivoServicio {
  /**
   * Permite inyectar un repositorio alternativo (por ejemplo para pruebas unitarias sin BD)
   * @param {object} [repositorio] 
   */
  constructor(repositorio = festivoRepositorioPorDefecto) {
    this.repositorio = repositorio;
  }

  /**
   * Mapea el número de tipo a una descripción textual entendible.
   * @param {number} tipo 
   * @returns {string}
   */
  obtenerDescripcionTipo(tipo) {
    switch (tipo) {
      case 1:
        return 'Fijo (No se traslada)';
      case 2:
        return 'Ley de Puente Festivo / Emiliani (Se traslada al siguiente lunes)';
      case 3:
        return 'Basado en el Domingo de Pascua (Fecha fija respecto a Pascua)';
      case 4:
        return 'Basado en el Domingo de Pascua y Ley de Puente (Trasladado al siguiente lunes)';
      default:
        return 'Desconocido';
    }
  }

  /**
   * Calcula la fecha exacta de un festivo para un año específico a partir de su definición base.
   * 
   * @param {object} definicion Definición base del festivo almacenada en MongoDB
   * @param {number} anio Año para el cálculo
   * @param {Date} fechaPascua Fecha del Domingo de Pascua precalculada
   * @returns {{ fecha: string, festivo: string, nombre: string, tipo: number, descripcionTipo: string, fechaOriginal?: string }}
   */
  calcularFechaFestivo(definicion, anio, fechaPascua) {
    let fechaFinalUtc;
    let fechaOriginalStr = null;

    switch (definicion.tipo) {
      case 1: {
        // Tipo 1: Fijo
        fechaFinalUtc = new Date(Date.UTC(anio, definicion.mes - 1, definicion.dia));
        break;
      }

      case 2: {
        // Tipo 2: Trasladado por Ley Emiliani al siguiente lunes
        const fechaOriginalUtc = new Date(Date.UTC(anio, definicion.mes - 1, definicion.dia));
        fechaOriginalStr = formatearFechaISO(fechaOriginalUtc);
        fechaFinalUtc = trasladarAlSiguienteLunes(fechaOriginalUtc);
        break;
      }

      case 3: {
        // Tipo 3: Basado en Pascua (sin traslado)
        fechaFinalUtc = new Date(fechaPascua.getTime());
        fechaFinalUtc.setUTCDate(fechaFinalUtc.getUTCDate() + (definicion.diasPascua || 0));
        break;
      }

      case 4: {
        // Tipo 4: Basado en Pascua y trasladado al siguiente lunes
        const fechaRelativaPascua = new Date(fechaPascua.getTime());
        fechaRelativaPascua.setUTCDate(fechaRelativaPascua.getUTCDate() + (definicion.diasPascua || 0));
        fechaOriginalStr = formatearFechaISO(fechaRelativaPascua);
        fechaFinalUtc = trasladarAlSiguienteLunes(fechaRelativaPascua);
        break;
      }

      default:
        throw new Error(`Tipo de festivo desconocido: ${definicion.tipo} para '${definicion.nombre}'`);
    }

    const fechaFormateada = formatearFechaISO(fechaFinalUtc);

    const resultado = {
      festivo: definicion.nombre,
      nombre: definicion.nombre,
      fecha: fechaFormateada,
      tipo: definicion.tipo,
      descripcionTipo: this.obtenerDescripcionTipo(definicion.tipo)
    };

    if (fechaOriginalStr && fechaOriginalStr !== fechaFormateada) {
      resultado.fechaOriginal = fechaOriginalStr;
    }

    return resultado;
  }

  /**
   * Obtiene la lista completa de festivos de Colombia para un año específico,
   * calculados dinámicamente consultando las definiciones base en MongoDB.
   * 
   * @param {number} anio 
   * @returns {Promise<Array<object>>}
   */
  async obtenerFestivosPorAnio(anio) {
    if (typeof anio !== 'number' || !Number.isInteger(anio) || anio < 1900 || anio > 2199) {
      const error = new Error(`Año inválido: '${anio}'. Debe ser un número entero entre 1900 y 2199.`);
      error.statusCode = 400;
      throw error;
    }

    // Consulta de definiciones base en MongoDB a través del repositorio
    const definiciones = await this.repositorio.obtenerTodosActivos();

    if (!definiciones || definiciones.length === 0) {
      const error = new Error(
        'No existen definiciones de festivos en la base de datos MongoDB. Ejecute el comando npm run seed para inicializarlas.'
      );
      error.statusCode = 500;
      throw error;
    }

    // Cálculo del Domingo de Pascua para el año correspondiente
    const fechaPascua = calcularDomingoPascua(anio);

    // Cálculo de cada festivo aplicando las reglas de negocio
    const festivosCalculados = definiciones.map((def) =>
      this.calcularFechaFestivo(def, anio, fechaPascua)
    );

    // Ordenamiento cronológico de la lista de festivos
    festivosCalculados.sort((a, b) => a.fecha.localeCompare(b.fecha));

    return festivosCalculados;
  }

  /**
   * Verifica si una fecha determinada es festiva en Colombia.
   * 
   * @param {string} fechaStr Fecha en formato ISO YYYY-MM-DD
   * @returns {Promise<object>}
   */
  async verificarFechaFestiva(fechaStr) {
    const validacion = validarFechaStr(fechaStr);
    if (!validacion.valida) {
      const error = new Error(validacion.error);
      error.statusCode = 400;
      throw error;
    }

    const { anio } = validacion;
    const festivosDelAnio = await this.obtenerFestivosPorAnio(anio);

    // Búsqueda de coincidencia con la fecha consultada
    const festivoEncontrado = festivosDelAnio.find((f) => f.fecha === fechaStr);

    if (festivoEncontrado) {
      return {
        fecha: fechaStr,
        esFestivo: true,
        festivo: festivoEncontrado.festivo,
        tipo: festivoEncontrado.tipo,
        descripcionTipo: festivoEncontrado.descripcionTipo,
        mensaje: 'Es Festivo'
      };
    }

    return {
      fecha: fechaStr,
      esFestivo: false,
      festivo: null,
      tipo: null,
      descripcionTipo: null,
      mensaje: 'No es festivo'
    };
  }
}

module.exports = new FestivoServicio();
module.exports.FestivoServicio = FestivoServicio;
