/**
 * Datos base de los festivos de Colombia según el Taller 1 - Diagramas de Arquitectura (ITM)
 * 
 * Categorías:
 * 1. Fijo (No se puede variar)
 * 2. Ley de "Puente festivo" / Ley Emiliani (Se traslada la fecha al siguiente lunes)
 * 3. Basado en el domingo de pascua (Días respecto a Pascua)
 * 4. Basado en el domingo de pascua y Ley de "Puente festivo" (Pascua + días + traslado al lunes)
 */

const FESTIVOS_BASE = [
  // Tipo 1: Fijos
  {
    nombre: 'Año nuevo',
    tipo: 1,
    dia: 1,
    mes: 1,
    diasPascua: 0,
    trasladable: false,
    activo: true,
    descripcion: 'Festivo fijo de primero de año'
  },
  {
    nombre: 'Día del Trabajo',
    tipo: 1,
    dia: 1,
    mes: 5,
    diasPascua: 0,
    trasladable: false,
    activo: true,
    descripcion: 'Festivo fijo por el Día Internacional de los Trabajadores'
  },
  {
    nombre: 'Independencia de Colombia',
    tipo: 1,
    dia: 20,
    mes: 7,
    diasPascua: 0,
    trasladable: false,
    activo: true,
    descripcion: 'Festivo fijo conmemorativo del Grito de Independencia'
  },
  {
    nombre: 'Batalla de Boyacá',
    tipo: 1,
    dia: 7,
    mes: 8,
    diasPascua: 0,
    trasladable: false,
    activo: true,
    descripcion: 'Festivo fijo conmemorativo de la Batalla de Boyacá'
  },
  {
    nombre: 'Inmaculada Concepción',
    tipo: 1,
    dia: 8,
    mes: 12,
    diasPascua: 0,
    trasladable: false,
    activo: true,
    descripcion: 'Festivo fijo por el Día de la Inmaculada Concepción'
  },
  {
    nombre: 'Navidad',
    tipo: 1,
    dia: 25,
    mes: 12,
    diasPascua: 0,
    trasladable: false,
    activo: true,
    descripcion: 'Festivo fijo por la Natividad de Jesús'
  },

  // Tipo 2: Ley Emiliani (Trasladados al siguiente lunes)
  {
    nombre: 'Santos Reyes',
    tipo: 2,
    dia: 6,
    mes: 1,
    diasPascua: 0,
    trasladable: true,
    activo: true,
    descripcion: 'Epifanía del Señor / Reyes Magos (Ley Emiliani)'
  },
  {
    nombre: 'San José',
    tipo: 2,
    dia: 19,
    mes: 3,
    diasPascua: 0,
    trasladable: true,
    activo: true,
    descripcion: 'Día de San José (Ley Emiliani)'
  },
  {
    nombre: 'San Pedro y San Pablo',
    tipo: 2,
    dia: 29,
    mes: 6,
    diasPascua: 0,
    trasladable: true,
    activo: true,
    descripcion: 'Solemnidad de San Pedro y San Pablo (Ley Emiliani)'
  },
  {
    nombre: 'Asunción de la Virgen',
    tipo: 2,
    dia: 15,
    mes: 8,
    diasPascua: 0,
    trasladable: true,
    activo: true,
    descripcion: 'Asunción de la Virgen María (Ley Emiliani)'
  },
  {
    nombre: 'Día de la Raza',
    tipo: 2,
    dia: 12,
    mes: 10,
    diasPascua: 0,
    trasladable: true,
    activo: true,
    descripcion: 'Día de la Diversidad Étnica y Cultural / Raza (Ley Emiliani)'
  },
  {
    nombre: 'Todos los santos',
    tipo: 2,
    dia: 1,
    mes: 11,
    diasPascua: 0,
    trasladable: true,
    activo: true,
    descripcion: 'Solemnidad de Todos los Santos (Ley Emiliani)'
  },
  {
    nombre: 'Independencia de Cartagena',
    tipo: 2,
    dia: 11,
    mes: 11,
    diasPascua: 0,
    trasladable: true,
    activo: true,
    descripcion: 'Independencia de Cartagena de Indias (Ley Emiliani)'
  },

  // Tipo 3: Basados en Domingo de Pascua (sin traslado al lunes)
  {
    nombre: 'Jueves Santo',
    tipo: 3,
    dia: null,
    mes: null,
    diasPascua: -3,
    trasladable: false,
    activo: true,
    descripcion: 'Semana Santa - Jueves Santo (-3 días desde Pascua)'
  },
  {
    nombre: 'Viernes Santo',
    tipo: 3,
    dia: null,
    mes: null,
    diasPascua: -2,
    trasladable: false,
    activo: true,
    descripcion: 'Semana Santa - Viernes Santo (-2 días desde Pascua)'
  },
  {
    nombre: 'Domingo de Pascua',
    tipo: 3,
    dia: null,
    mes: null,
    diasPascua: 0,
    trasladable: false,
    activo: true,
    descripcion: 'Domingo de Pascua o Resurrección (0 días desde Pascua)'
  },

  // Tipo 4: Basados en Pascua y trasladados al lunes (Ley Emiliani)
  {
    nombre: 'Ascensión del Señor',
    tipo: 4,
    dia: null,
    mes: null,
    diasPascua: 40,
    trasladable: true,
    activo: true,
    descripcion: 'Ascensión de Jesús (+40 días desde Pascua, trasladado al lunes)'
  },
  {
    nombre: 'Corpus Christi',
    tipo: 4,
    dia: null,
    mes: null,
    diasPascua: 61,
    trasladable: true,
    activo: true,
    descripcion: 'Solemnidad del Cuerpo y la Sangre de Cristo (+61 días desde Pascua, trasladado al lunes)'
  },
  {
    nombre: 'Sagrado Corazón de Jesús',
    tipo: 4,
    dia: null,
    mes: null,
    diasPascua: 68,
    trasladable: true,
    activo: true,
    descripcion: 'Solemnidad del Sagrado Corazón (+68 días desde Pascua, trasladado al lunes)'
  }
];

module.exports = {
  FESTIVOS_BASE
};
