# API RESTful Festivos Colombia — Taller 1 ITM

Servicio web RESTful desarrollado en **Node.js**, **Express.js** y **MongoDB** con **Mongoose** para la consulta, verificación y cálculo dinámico de días festivos en Colombia.

Proyecto desarrollado para el **Taller 1: Diagramas de Arquitectura** de la asignatura **Arquitectura de Software II** en el **Instituto Tecnológico Metropolitano (ITM)**.

---

## 1. Objetivo de la API

La API implementa exclusivamente la **API #1** descrita en el taller:
1. **Verificar si una fecha es festiva en Colombia**: Dado un día específico en formato ISO `YYYY-MM-DD` (o vía parámetros de ruta), determina si corresponde a un día festivo nacional, su nombre, categoría y mensaje descriptivo.
2. **Listar los festivos de un año completo**: Dado un año, calcula y retorna cronológicamente la totalidad de los días festivos colombianos combinando festivos fijos, traslados de la Ley Emiliani y cálculos astronómicos/litúrgicos basados en el Domingo de Pascua.
3. **Persistencia de reglas base en MongoDB**: MongoDB almacena únicamente las definiciones y reglas base (no fechas precalculadas de un solo año), garantizando cálculo dinámico para cualquier año (1900–2199).

---

## 2. Tecnologías utilizadas

- **Entorno de ejecución**: Node.js (v18+)
- **Framework web**: Express.js (v4.21)
- **Base de datos NoSQL**: MongoDB
- **ODM (Object Data Modeling)**: Mongoose (v8.8)
- **Documentación OpenAPI / Swagger**: Swagger UI Express + OpenAPI 3.0
- **Variables de entorno**: Dotenv
- **Framework de pruebas**: Jest (v29.7)
- **Pruebas de endpoints HTTP**: Supertest (v7.0)
- **MongoDB en memoria para pruebas**: MongoDB Memory Server (v10.4)
- **CORS**: cors

---

## 3. Arquitectura del Sistema

La solución sigue con estricta fidelidad el diagrama de flujo y arquitectura por capas definido en `Festivo API Data Flow-2026-09-23-012605.mmd`:

```
Cliente (Postman / Swagger / Web)
   │
   ▼ 1. Petición HTTP
[src/index.js / src/app.js]               (Capa de Presentación / Entrada)
   │
   ▼ 2. Enrutamiento
[src/presentation/festivo.rutas.js]       (Rutas Express)
   │
   ▼ 3. Validación de fecha / año
[src/presentation/festivo.validador.js]   (Middlewares y Validadores)
   │
   ▼ 4. Coordinación de Lógica
[src/presentation/festivo.controlador.js] (Controlador)
   │
   ▼ 5. Reglas de Negocio y Algoritmos
[src/business/festivo.servicio.js]        (Servicio de Negocio)
[src/business/pascua.servicio.js]         (Algoritmo de Pascua de Gauss)
[src/utils/fecha.util.js]                 (Ley Emiliani / Validación Calendario)
   │
   ▼ 6. Consulta de Definiciones Base
[src/data/festivo.repositorio.js]         (Capa de Acceso a Datos / Repositorio)
   │
   ▼ 7. Esquema Mongoose
[src/data/festivo.modelo.js]              (Modelo Festivo)
   │
   ▼ 8. Persistencia Real
[(Base de Datos MongoDB)]                 (Colección 'festivos')
```

### Estructura de Carpetas

```
ASII/
├── .env.example                               # Plantilla de variables de entorno
├── .env                                       # Configuración local de variables
├── .gitignore                                 # Exclusiones de control de versiones
├── package.json                               # Dependencias y scripts NPM
├── README.md                                  # Documentación completa del proyecto
├── Festivos_Colombia_API.postman_collection.json # Colección de pruebas para Postman
├── Festivo API Data Flow-2026-09-23-012605.mmd # Diagrama Mermaid de Arquitectura
├── Taller 1 - Diagramas de Arquitectura.pdf   # Enunciado original del taller
├── src/
│   ├── app.js                                 # Configuración Express, middlewares y Swagger
│   ├── index.js                               # Servidor principal con conexión a MongoDB local
│   ├── index.memory.js                        # Servidor autónomo (MongoDB en memoria)
│   ├── business/
│   │   ├── festivo.servicio.js                # Lógica de cálculo de los 4 tipos de festivos
│   │   └── pascua.servicio.js                 # Algoritmo de Gauss con excepciones gregorianas
│   ├── config/
│   │   ├── database.js                        # Conexión y desconexión Mongoose
│   │   └── swagger.json                       # Especificación OpenAPI 3.0
│   ├── data/
│   │   ├── festivo.modelo.js                  # Esquema Mongoose de la colección 'festivos'
│   │   └── festivo.repositorio.js             # Operaciones CRUD e inserción idempotente
│   ├── presentation/
│   │   ├── error.middleware.js                # Manejo centralizado de errores (400, 404, 500)
│   │   ├── festivo.controlador.js             # Controlador REST
│   │   ├── festivo.rutas.js                   # Definición de endpoints y rutas
│   │   └── festivo.validador.js               # Validadores de fechas, años y formatos
│   ├── scripts/
│   │   ├── seed.data.js                       # 19 festivos base oficiales de Colombia
│   │   └── seed.js                            # Script de carga inicial idempotente
│   └── utils/
│       └── fecha.util.js                      # Calendario estricto, bisiestos y Ley Emiliani
└── tests/
    ├── integration/
    │   └── festivo.api.test.js                # Pruebas de integración HTTP + MongoDB Memory
    └── unit/
        ├── fecha.util.test.js                 # Pruebas unitarias de fechas y traslados
        ├── festivo.servicio.test.js           # Pruebas unitarias de las reglas de negocio
        └── pascua.test.js                     # Pruebas del cálculo de Pascua y casos límite
```

---

## 4. Reglas de Negocio Implementadas

La API implementa las cuatro categorías reglamentarias de Colombia (19 festivos anuales):

### Tipo 1: Festivos Fijos (6 días)
Mantienen su fecha en cualquier día de la semana que caigan:
- **01/01**: Año nuevo
- **01/05**: Día del Trabajo
- **20/07**: Independencia de Colombia
- **07/08**: Batalla de Boyacá
- **08/12**: Inmaculada Concepción
- **25/12**: Navidad

### Tipo 2: Ley Emiliani / Ley 51 de 1983 (7 días)
Si caen en lunes, se celebran ese mismo día. Si caen en cualquier otro día (domingo, martes a sábado), se trasladan al siguiente lunes:
- **06/01**: Santos Reyes
- **19/03**: San José
- **29/06**: San Pedro y San Pablo
- **15/08**: Asunción de la Virgen
- **12/10**: Día de la Raza
- **01/11**: Todos los santos
- **11/11**: Independencia de Cartagena

### Tipo 3: Basados en el Domingo de Pascua (3 días)
Calculados con desplazamiento directo respecto a la fecha del Domingo de Pascua:
- **Jueves Santo**: -3 días
- **Viernes Santo**: -2 días
- **Domingo de Pascua**: 0 días

### Tipo 4: Basados en Pascua y Trasladados al Lunes (3 días)
Se calcula primero la fecha litúrgica según Pascua y posteriormente se traslada al siguiente lunes:
- **Ascensión del Señor**: +40 días respecto a Pascua $\rightarrow$ siguiente lunes (+44 días)
- **Corpus Christi**: +61 días respecto a Pascua $\rightarrow$ siguiente lunes (+65 días)
- **Sagrado Corazón de Jesús**: +68 días respecto a Pascua $\rightarrow$ siguiente lunes (+71 días)

---

## 5. Algoritmo de Cálculo de Pascua (Gauss y Hallazgos)

El taller indica la fórmula:
- $a = \text{año MOD } 19$
- $b = \text{año MOD } 4$
- $c = \text{año MOD } 7$
- $d = (19a + 24) \text{ MOD } 30$
- $días = d + (2b + 4c + 6d + 5) \text{ MOD } 7$
- Domingo de Ramos $= 15 \text{ de marzo} + días$
- Domingo de Pascua $= \text{Domingo de Ramos} + 7 \text{ días}$

### Documentación de Casos Límite y Excepciones Gregorianas
Durante el análisis matemático se comprobó que esta fórmula corresponde al **algoritmo de Gauss para Pascua** con constantes $M=24, N=5$ (válidas para el periodo 1900–2099).

En el calendario gregoriano astronómico existen dos excepciones históricas documentadas por Gauss para evitar que la Pascua caiga después del 25 de abril (límite eclesiástico):
1. **Si $d = 29$ y $e = 6$**: la fórmula directa daría 26 de abril. El ajuste resta 7 días resultando en el **19 de abril** (ejemplo: año **1981**).
2. **Si $d = 28$, $e = 6$ y $a > 10$**: la fórmula directa daría 25 de abril. El ajuste resta 7 días resultando en el **18 de abril** (ejemplo: año **1954**).

El módulo `src/business/pascua.servicio.js` incorpora estos ajustes garantizando **100% de coincidencia** con el calendario litúrgico oficial de Colombia y el algoritmo de Butcher/Meeus para todos los años entre 1900 y 2099.

---

## 6. Instalación y Puesta en Marcha

### Requisitos Previos
- **Node.js** v18 o superior instalado (`node -v`).
- **NPM** v9 o superior (`npm -v`).
- **MongoDB** (opcional si se utiliza el modo autónomo en memoria).

### Paso 1: Clonar o abrir el repositorio
```bash
cd "c:\Users\elmam\OneDrive\Desktop\Semestre 8\ASII\ASII"
```

### Paso 2: Instalar dependencias
```bash
npm install
```

### Paso 3: Configurar variables de entorno
Copie el archivo de ejemplo o edite `.env`:
```bash
cp .env.example .env
```
Contenido por defecto de `.env`:
```env
PORT=8080
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/festivos_colombia
```

### Paso 4: Cargar definiciones base en MongoDB (Seed)
> **Nota**: Si dispone de una instancia de MongoDB ejecutándose localmente o en MongoDB Atlas:
```bash
npm run seed
```
Este script es **estrictamente idempotente**: si se ejecuta varias veces actualizará las definiciones sin crear documentos duplicados.

---

## 7. Formas de Ejecución

### Opción A: Ejecución Estándar (Requiere MongoDB local/remoto)
Inicia la API conectándose a la base de datos configurada en `MONGODB_URI`:
```bash
npm start
```
O en modo desarrollo con reinicio automático:
```bash
npm run dev
```

### Opción B: Modo Autónomo (MongoDB en memoria — Ideal para Evaluación Rápida)
Si no tiene MongoDB instalado en su máquina local, ejecute:
```bash
npm run start:memory
```
Este comando levanta una instancia real de MongoDB en memoria, ejecuta el seed automáticamente y deja la API lista para recibir peticiones sin requerir configuración adicional.

---

## 8. Documentación de Endpoints

### Interfaz Interactiva Swagger UI
Una vez iniciado el servidor, abra en su navegador:
👉 **[http://localhost:8080/api-docs](http://localhost:8080/api-docs)**

---

### Endpoint A: Consultar si una Fecha es Festiva

#### `GET /api/festivos/verificar?fecha=YYYY-MM-DD`
Verifica si una fecha es festiva. También admite la variante de ruta `GET /api/festivos/verificar/:anio/:mes/:dia`.

#### Parámetros
| Parámetro | Tipo | Ubicación | Descripción | Ejemplo |
|---|---|---|---|---|
| `fecha` | String | Query | Fecha en formato ISO YYYY-MM-DD | `2023-06-12` |

#### Respuestas Exitosas (200 OK)

**1. Caso Festivo (ejemplo Corpus Christi trasladado al lunes):**
- Solicitud: `GET http://localhost:8080/api/festivos/verificar?fecha=2023-06-12`
```json
{
  "fecha": "2023-06-12",
  "esFestivo": true,
  "festivo": "Corpus Christi",
  "tipo": 4,
  "descripcionTipo": "Basado en el Domingo de Pascua y Ley de Puente (Trasladado al siguiente lunes)",
  "mensaje": "Es Festivo"
}
```

**2. Caso No Festivo (fecha válida no festiva):**
- Solicitud: `GET http://localhost:8080/api/festivos/verificar?fecha=2023-02-28`
```json
{
  "fecha": "2023-02-28",
  "esFestivo": false,
  "festivo": null,
  "tipo": null,
  "descripcionTipo": null,
  "mensaje": "No es festivo"
}
```

**3. Caso Variante de Ruta (ejemplo del PDF):**
- Solicitud: `GET http://localhost:8080/api/festivos/verificar/2023/6/12`
```json
{
  "fecha": "2023-06-12",
  "esFestivo": true,
  "festivo": "Corpus Christi",
  "tipo": 4,
  "descripcionTipo": "Basado en el Domingo de Pascua y Ley de Puente (Trasladado al siguiente lunes)",
  "mensaje": "Es Festivo"
}
```

#### Respuestas de Error de Validación (400 Bad Request)

**1. Día inexistente (35 de febrero - ejemplo del PDF):**
- Solicitud: `GET http://localhost:8080/api/festivos/verificar?fecha=2023-02-35`
```json
{
  "error": "Bad Request",
  "codigo": 400,
  "mensaje": "Fecha No valida: el mes 2 del año 2023 solo tiene 28 días (se recibió día 35)."
}
```

**2. 29 de febrero en año no bisiesto:**
- Solicitud: `GET http://localhost:8080/api/festivos/verificar?fecha=2023-02-29`
```json
{
  "error": "Bad Request",
  "codigo": 400,
  "mensaje": "Fecha No valida: el año 2023 no es bisiesto, por lo que febrero solo tiene 28 días."
}
```

**3. Parámetro ausente:**
- Solicitud: `GET http://localhost:8080/api/festivos/verificar`
```json
{
  "error": "Bad Request",
  "codigo": 400,
  "mensaje": "Parámetro de fecha requerido. Debe enviar '?fecha=YYYY-MM-DD' o los parámetros de ruta '/:anio/:mes/:dia'."
}
```

---

### Endpoint B: Consultar Festivos de un Año

#### `GET /api/festivos/anio/:anio`
Devuelve la lista completa y cronológicamente ordenada de todos los festivos colombianos para el año especificado.
*(También disponible mediante el alias `GET /api/festivos/obtener/:anio` de la captura de pantalla del taller).*

#### Parámetros
| Parámetro | Tipo | Ubicación | Descripción | Ejemplo |
|---|---|---|---|---|
| `anio` | Entero | Path | Año entre 1900 y 2199 | `2023` |

#### Respuesta Exitosa (200 OK)
- Solicitud: `GET http://localhost:8080/api/festivos/anio/2023`
```json
[
  {
    "festivo": "Año nuevo",
    "nombre": "Año nuevo",
    "fecha": "2023-01-01",
    "tipo": 1,
    "descripcionTipo": "Fijo (No se traslada)"
  },
  {
    "festivo": "Santos Reyes",
    "nombre": "Santos Reyes",
    "fecha": "2023-01-09",
    "tipo": 2,
    "descripcionTipo": "Ley de Puente Festivo / Emiliani (Se traslada al siguiente lunes)",
    "fechaOriginal": "2023-01-06"
  },
  {
    "festivo": "San José",
    "nombre": "San José",
    "fecha": "2023-03-20",
    "tipo": 2,
    "descripcionTipo": "Ley de Puente Festivo / Emiliani (Se traslada al siguiente lunes)",
    "fechaOriginal": "2023-03-19"
  },
  {
    "festivo": "Jueves Santo",
    "nombre": "Jueves Santo",
    "fecha": "2023-04-06",
    "tipo": 3,
    "descripcionTipo": "Basado en el Domingo de Pascua (Fecha fija respecto a Pascua)"
  },
  {
    "festivo": "Viernes Santo",
    "nombre": "Viernes Santo",
    "fecha": "2023-04-07",
    "tipo": 3,
    "descripcionTipo": "Basado en el Domingo de Pascua (Fecha fija respecto a Pascua)"
  },
  {
    "festivo": "Domingo de Pascua",
    "nombre": "Domingo de Pascua",
    "fecha": "2023-04-09",
    "tipo": 3,
    "descripcionTipo": "Basado en el Domingo de Pascua (Fecha fija respecto a Pascua)"
  },
  {
    "festivo": "Día del Trabajo",
    "nombre": "Día del Trabajo",
    "fecha": "2023-05-01",
    "tipo": 1,
    "descripcionTipo": "Fijo (No se traslada)"
  },
  {
    "festivo": "Ascensión del Señor",
    "nombre": "Ascensión del Señor",
    "fecha": "2023-05-22",
    "tipo": 4,
    "descripcionTipo": "Basado en el Domingo de Pascua y Ley de Puente (Trasladado al siguiente lunes)",
    "fechaOriginal": "2023-05-19"
  },
  {
    "festivo": "Corpus Christi",
    "nombre": "Corpus Christi",
    "fecha": "2023-06-12",
    "tipo": 4,
    "descripcionTipo": "Basado en el Domingo de Pascua y Ley de Puente (Trasladado al siguiente lunes)",
    "fechaOriginal": "2023-06-08"
  },
  {
    "festivo": "Sagrado Corazón de Jesús",
    "nombre": "Sagrado Corazón de Jesús",
    "fecha": "2023-06-19",
    "tipo": 4,
    "descripcionTipo": "Basado en el Domingo de Pascua y Ley de Puente (Trasladado al siguiente lunes)",
    "fechaOriginal": "2023-06-16"
  },
  {
    "festivo": "San Pedro y San Pablo",
    "nombre": "San Pedro y San Pablo",
    "fecha": "2023-07-03",
    "tipo": 2,
    "descripcionTipo": "Ley de Puente Festivo / Emiliani (Se traslada al siguiente lunes)",
    "fechaOriginal": "2023-06-29"
  },
  {
    "festivo": "Independencia de Colombia",
    "nombre": "Independencia de Colombia",
    "fecha": "2023-07-20",
    "tipo": 1,
    "descripcionTipo": "Fijo (No se traslada)"
  },
  {
    "festivo": "Batalla de Boyacá",
    "nombre": "Batalla de Boyacá",
    "fecha": "2023-08-07",
    "tipo": 1,
    "descripcionTipo": "Fijo (No se traslada)"
  },
  {
    "festivo": "Asunción de la Virgen",
    "nombre": "Asunción de la Virgen",
    "fecha": "2023-08-21",
    "tipo": 2,
    "descripcionTipo": "Ley de Puente Festivo / Emiliani (Se traslada al siguiente lunes)",
    "fechaOriginal": "2023-08-15"
  },
  {
    "festivo": "Día de la Raza",
    "nombre": "Día de la Raza",
    "fecha": "2023-10-16",
    "tipo": 2,
    "descripcionTipo": "Ley de Puente Festivo / Emiliani (Se traslada al siguiente lunes)",
    "fechaOriginal": "2023-10-12"
  },
  {
    "festivo": "Todos los santos",
    "nombre": "Todos los santos",
    "fecha": "2023-11-06",
    "tipo": 2,
    "descripcionTipo": "Ley de Puente Festivo / Emiliani (Se traslada al siguiente lunes)",
    "fechaOriginal": "2023-11-01"
  },
  {
    "festivo": "Independencia de Cartagena",
    "nombre": "Independencia de Cartagena",
    "fecha": "2023-11-13",
    "tipo": 2,
    "descripcionTipo": "Ley de Puente Festivo / Emiliani (Se traslada al siguiente lunes)",
    "fechaOriginal": "2023-11-11"
  },
  {
    "festivo": "Inmaculada Concepción",
    "nombre": "Inmaculada Concepción",
    "fecha": "2023-12-08",
    "tipo": 1,
    "descripcionTipo": "Fijo (No se traslada)"
  },
  {
    "festivo": "Navidad",
    "nombre": "Navidad",
    "fecha": "2023-12-25",
    "tipo": 1,
    "descripcionTipo": "Fijo (No se traslada)"
  }
]
```

---

## 9. Ejemplos con cURL

```bash
# 1. Verificar fecha festiva (Corpus Christi)
curl -X GET "http://localhost:8080/api/festivos/verificar?fecha=2023-06-12"

# 2. Verificar fecha no festiva
curl -X GET "http://localhost:8080/api/festivos/verificar?fecha=2023-02-28"

# 3. Verificar fecha por ruta
curl -X GET "http://localhost:8080/api/festivos/verificar/2023/6/12"

# 4. Obtener todos los festivos de 2024
curl -X GET "http://localhost:8080/api/festivos/anio/2024"

# 5. Probar fecha inválida (400 Bad Request)
curl -X GET "http://localhost:8080/api/festivos/verificar?fecha=2023-02-35"
```

---

## 10. Pruebas Automatizadas

El proyecto incluye 43 pruebas automatizadas organizadas en suites unitarias y de integración:

```bash
# Ejecutar toda la suite de pruebas
npm test

# Ejecutar pruebas con reporte de cobertura
npm run test:coverage
```

### Cobertura de las 10 Pruebas Obligatorias

| # | Requisito Obligatorio de Prueba | Archivo de Prueba | Estado |
|---|---|---|---|
| 1 | Consulta de un festivo fijo (01/01/2023) | `tests/integration/festivo.api.test.js` | ✅ Aprobada |
| 2 | Consulta de fecha válida no festiva (28/02/2023) | `tests/integration/festivo.api.test.js` | ✅ Aprobada |
| 3 | Traslado de un festivo al lunes (Santos Reyes) | `tests/integration/festivo.api.test.js` | ✅ Aprobada |
| 4 | Festivos de Semana Santa (Jueves y Viernes Santo) | `tests/integration/festivo.api.test.js` | ✅ Aprobada |
| 5 | Basados en Pascua y trasladados (Corpus Christi) | `tests/integration/festivo.api.test.js` | ✅ Aprobada |
| 6 | Lista completa de festivos de distintos años (2023, 2024) | `tests/integration/festivo.api.test.js` | ✅ Aprobada |
| 7 | Fechas inválidas (35/02/2023, 29/02/2023 no bisiesto, 29/02/2024 bisiesto) | `tests/integration/festivo.api.test.js` | ✅ Aprobada |
| 8 | Parámetros ausentes o mal formados | `tests/integration/festivo.api.test.js` | ✅ Aprobada |
| 9 | Errores de acceso a base de datos (MongoDB desconectado) | `tests/integration/festivo.api.test.js` | ✅ Aprobada |
| 10| Ejecuciones repetidas del seed sin duplicados (idempotencia) | `tests/integration/festivo.api.test.js` | ✅ Aprobada |

---

## 11. Colección de Postman

Se incluye el archivo listo para importar en Postman:
`Festivos_Colombia_API.postman_collection.json`

Permite ejecutar de inmediato los 12 casos de prueba principales con variables de entorno preconfiguradas hacia `http://localhost:8080`.
