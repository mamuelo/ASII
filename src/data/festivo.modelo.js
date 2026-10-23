/**
 * Modelo de Datos Mongoose para Definiciones Base de Festivos
 * Taller 1 - Diagramas de Arquitectura (ITM)
 * 
 * Cumple con los requerimientos de la Capa de Acceso a Datos / Modelo:
 * - nombre: Nombre oficial del festivo
 * - tipo: 1 = Fijo, 2 = Ley Emiliani, 3 = Pascua, 4 = Pascua + Emiliani
 * - dia: Día original (para tipos 1 y 2)
 * - mes: Mes original (para tipos 1 y 2)
 * - diasPascua: Desplazamiento respecto al Domingo de Pascua (para tipos 3 y 4)
 * - trasladable: Indica si aplica traslado al lunes
 * - activo: Bandera de habilitación lógica
 */

const mongoose = require('mongoose');

const FestivoEsquema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del festivo es obligatorio.'],
      unique: true,
      trim: true
    },
    tipo: {
      type: Number,
      required: [true, 'El tipo de festivo es obligatorio.'],
      enum: {
        values: [1, 2, 3, 4],
        message: 'El tipo debe ser 1 (Fijo), 2 (Ley de Puente), 3 (Pascua) o 4 (Pascua + Puente).'
      }
    },
    dia: {
      type: Number,
      min: [1, 'El día mínimo es 1.'],
      max: [31, 'El día máximo es 31.'],
      default: null,
      validate: {
        validator: function (v) {
          // Si el tipo es 1 o 2, el día es obligatorio
          if (this.tipo === 1 || this.tipo === 2) {
            return typeof v === 'number' && v >= 1 && v <= 31;
          }
          return true;
        },
        message: 'Para festivos de tipo 1 o 2, el día es obligatorio y debe estar entre 1 y 31.'
      }
    },
    mes: {
      type: Number,
      min: [1, 'El mes mínimo es 1.'],
      max: [12, 'El mes máximo es 12.'],
      default: null,
      validate: {
        validator: function (v) {
          // Si el tipo es 1 o 2, el mes es obligatorio
          if (this.tipo === 1 || this.tipo === 2) {
            return typeof v === 'number' && v >= 1 && v <= 12;
          }
          return true;
        },
        message: 'Para festivos de tipo 1 o 2, el mes es obligatorio y debe estar entre 1 y 12.'
      }
    },
    diasPascua: {
      type: Number,
      default: 0
    },
    trasladable: {
      type: Boolean,
      required: [true, 'El campo trasladable es obligatorio.'],
      default: false
    },
    activo: {
      type: Boolean,
      default: true
    },
    descripcion: {
      type: String,
      default: ''
    }
  },
  {
    collection: 'festivos',
    timestamps: true
  }
);

// Índice para búsquedas rápidas por nombre y estado activo
FestivoEsquema.index({ nombre: 1, activo: 1 });

const FestivoModelo = mongoose.model('Festivo', FestivoEsquema);

module.exports = FestivoModelo;
