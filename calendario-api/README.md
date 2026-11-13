# API RESTful Calendario — Spring Boot + PostgreSQL (Taller 2 ITM)

Servicio web RESTful desarrollado en **Java 17**, **Spring Boot 3** y **PostgreSQL** con **Spring Data JPA / Hibernate**, diseñado para la generación, clasificación y consulta del calendario anual colombiano.

El microservicio consume una API externa previa desarrollada en **Node.js + Express + MongoDB** para obtener los días festivos de Colombia y generar el calendario completo del año clasificando cada fecha según las reglas de negocio del Instituto Tecnológico Metropolitano (ITM).

---

## 1. Objetivo del Proyecto

1. **Generar y Persistir el Calendario Anual**:
   - Dado un año `YYYY`, consulta la lista de festivos del servicio externo (Express + MongoDB).
   - Genera todas las fechas del año (365 días en años estándar o 366 días en años bisiestos).
   - Clasifica cada fecha con estricta prioridad:
     1. **Día festivo** (ID 3): Si la fecha está en la lista de festivos de la API externa (tiene prioridad incluso si cae en sábado o domingo).
     2. **Fin de Semana** (ID 2): Si no es festivo y cae en Sábado o Domingo.
     3. **Día laboral** (ID 1): Si no es festivo y cae de Lunes a Viernes.
   - Almacena todos los días de forma transaccional en PostgreSQL en la tabla `Calendario`, vinculándolos con la tabla `Tipo`.
   - Maneja la regeneración del mismo año de forma idempotente, reemplazando registros previos para evitar duplicación.
   - Retorna un booleano `true` tras finalizar exitosamente.

2. **Consultar el Calendario Almacenado**:
   - Consulta directamente PostgreSQL sin volver a llamar a la API externa ni recalcular días.
   - Retorna la lista ordenada cronológicamente con ID, fecha, tipo y nombre del día en español (`Lunes`, `Martes`, `Miércoles`, `Jueves`, `Viernes`, `Sábado`, `Domingo`).
   - Retorna código HTTP `404 Not Found` estructurado si el año solicitado aún no ha sido generado.

---

## 2. Tecnologías Utilizadas

- **Lenguaje**: Java 17 LTS (OpenJDK Temurin 17)
- **Framework Principal**: Spring Boot 3.2.5
- **Acceso a Datos**: Spring Data JPA / Hibernate 6
- **Base de Datos Principal**: PostgreSQL 15+
- **Base de Datos para Pruebas**: H2 Database (en memoria, modo compatibilidad PostgreSQL)
- **Cliente HTTP**: RestTemplate con timeouts configurados y serialización JSON (Jackson)
- **Gestor de Dependencias y Construcción**: Apache Maven 3.9+
- **Pruebas Automatizadas**: JUnit 5, Mockito, Spring Boot Test, MockMvc
- **Contenedores**: Docker y Docker Compose para PostgreSQL

---

## 3. Modelo de Base de Datos Relacional

### Tabla `tipo`
| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | PRIMARY KEY | Identificador numérico del tipo (1, 2, 3) |
| `tipo` | `VARCHAR(50)` | NOT NULL | Nombre de la clasificación |

**Registros Maestros (precargados por DataInitializer):**
- `ID: 1` -> `Día laboral`
- `ID: 2` -> `Fin de Semana`
- `ID: 3` -> `Día festivo`

### Tabla `calendario`
| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL / BIGINT` | PRIMARY KEY | Identificador único autoincremental |
| `fecha` | `DATE` | NOT NULL, UNIQUE | Fecha del día correspondiente (`YYYY-MM-DD`) |
| `id_tipo` | `INTEGER` | NOT NULL, FK -> `tipo(id)` | Llave foránea que referencia la tabla `tipo` |
| `descripcion` | `VARCHAR(50)` | NOT NULL | Nombre del día de la semana en español |

---

## 4. Estructura del Proyecto

```
calendario-api/
├── pom.xml                                       # Configuración Maven y dependencias
├── docker-compose.yml                            # Levantamiento de PostgreSQL en contenedor
├── .env.example                                  # Plantilla de variables de entorno
├── run.bat / run.ps1                             # Scripts para iniciar la aplicación
├── test.bat / test.ps1                           # Scripts para ejecutar la suite de pruebas
├── build.bat                                     # Script para compilar y empaquetar el JAR
├── Calendario_PostgreSQL_API.postman_collection.json # Colección de pruebas para Postman
└── src/
    ├── main/
    │   ├── java/co/edu/itm/calendario/
    │   │   ├── CalendarioApplication.java        # Clase principal Spring Boot
    │   │   ├── client/
    │   │   │   └── FestivosClient.java           # Cliente HTTP hacia la API 1 (Express JS)
    │   │   ├── config/
    │   │   │   ├── RestClientConfig.java         # Configuración de RestTemplate y Timeouts
    │   │   │   └── DataInitializer.java          # Carga automática de tipos maestros (1, 2, 3)
    │   │   ├── controller/
    │   │   │   └── CalendarioController.java     # Endpoints REST (/generar/{anio}, /listar/{anio})
    │   │   ├── dto/
    │   │   │   ├── CalendarioResponseDto.java    # DTO de respuesta para el listado de calendario
    │   │   │   ├── FestivoExternoDto.java        # DTO para deserializar festivos de la API 1
    │   │   │   ├── TipoDto.java                  # DTO del tipo de día
    │   │   │   └── ErrorResponseDto.java         # DTO estándar para errores HTTP
    │   │   ├── entity/
    │   │   │   ├── Calendario.java               # Entidad JPA para la tabla 'calendario'
    │   │   │   └── Tipo.java                     # Entidad JPA para la tabla 'tipo'
    │   │   ├── exception/
    │   │   │   ├── AnioInvalidoException.java    # Error HTTP 400 por año fuera de rango o inválido
    │   │   │   ├── CalendarioNotFoundException.java # Error HTTP 404 por año no generado
    │   │   │   ├── ExternalApiException.java     # Error HTTP 502/503 por fallas en la API externa
    │   │   │   └── GlobalExceptionHandler.java   # Manejo centralizado con @RestControllerAdvice
    │   │   ├── repository/
    │   │   │   ├── CalendarioRepository.java     # Spring Data JPA para 'calendario'
    │   │   │   └── TipoRepository.java           # Spring Data JPA para 'tipo'
    │   │   └── service/
    │   │       ├── CalendarioService.java        # Interfaz del servicio de negocio
    │   │       └── CalendarioServiceImpl.java    # Implementación con lógica de clasificación
    │   └── resources/
    │       └── application.yml                   # Configuración de PostgreSQL y API externa
    └── test/
        ├── java/co/edu/itm/calendario/
        │   ├── CalendarioControllerIntegrationTest.java # Pruebas de integración MockMvc + H2
        │   ├── client/
        │   │   └── FestivosClientTest.java       # Pruebas unitarias del cliente HTTP
        │   └── service/
        │       └── CalendarioServiceTest.java    # Pruebas de lógica (365/366 días, prioridades)
        └── resources/
            └── application-test.yml              # Configuración H2 para pruebas automatizadas
```

---

## 5. Requisitos Previos

- **Java JDK 17 o superior** (el workspace incluye OpenJDK 17 portátil en `.tools/jdk-17.0.21+9`).
- **Maven 3.8+** (el workspace incluye Apache Maven 3.9.9 en `.tools/apache-maven-3.9.9`).
- **PostgreSQL 15+** o **Docker Desktop** para levantar la base de datos con Docker Compose.
- **Node.js API de Festivos (API 1)**: Para generar el calendario con datos reales, la primera API de Express JS debe estar corriendo (por defecto en `http://localhost:3000`).

---

## 6. Variables de Entorno y Configuración

Todas las propiedades están parametrizadas con valores por defecto en `application.yml`:

| Variable de Entorno | Valor por Defecto | Descripción |
| :--- | :--- | :--- |
| `PORT` | `8080` | Puerto HTTP del microservicio Spring Boot |
| `DB_HOST` | `localhost` | Host del servidor PostgreSQL |
| `DB_PORT` | `5432` | Puerto del servidor PostgreSQL |
| `DB_NAME` | `calendario_db` | Nombre de la base de datos |
| `DB_USERNAME` | `postgres` | Usuario de PostgreSQL |
| `DB_PASSWORD` | `postgres` | Contraseña de PostgreSQL |
| `FESTIVOS_API_URL` | `http://localhost:3000` | URL base de la API 1 (Express JS) |
| `FESTIVOS_API_ENDPOINT`| `/api/festivos/obtener/{anio}` | Patrón de ruta del endpoint externo |

---

## 7. Levantamiento de PostgreSQL con Docker Compose

Para iniciar PostgreSQL sin instalarlo manualmente en el sistema operativo:

```bash
docker compose up -d
```

Esto creará automáticamente la base de datos `calendario_db` en el puerto `5432` con usuario `postgres` y contraseña `postgres`.

---

## 8. Cómo Ejecutar el Proyecto

### Opción A: Usando los scripts incluidos en Windows
```powershell
# En PowerShell:
.\run.ps1

# O en CMD:
run.bat
```

### Opción B: Usando Maven directamente
```bash
mvn spring-boot:run
```

### Opción C: Ejecutando el JAR empaquetado
```bash
java -jar target/calendario-api-1.0.0.jar
```

---

## 9. Endpoints de la API

### 1. Generar Calendario de un Año
- **Método**: `GET`
- **Ruta**: `/api/calendario/generar/{anio}`
- **Parámetro**: `anio` (entero entre 1900 y 2199)
- **Descripción**: Consulta la API 1, genera y clasifica los 365 o 366 días y los guarda en PostgreSQL.
- **Respuesta Exitosa (200 OK)**:
```json
true
```

#### Ejemplo con cURL:
```bash
curl -X GET "http://localhost:8080/api/calendario/generar/2023"
```

---

### 2. Listar Calendario de un Año
- **Método**: `GET`
- **Ruta**: `/api/calendario/listar/{anio}`
- **Parámetro**: `anio` (entero entre 1900 y 2199)
- **Descripción**: Consulta los registros almacenados en PostgreSQL ordenados cronológicamente.
- **Respuesta Exitosa (200 OK)**:
```json
[
  {
    "id": 1,
    "fecha": "2023-01-01",
    "tipo": {
      "id": 3,
      "tipo": "Día festivo"
    },
    "descripcion": "Domingo"
  },
  {
    "id": 2,
    "fecha": "2023-01-02",
    "tipo": {
      "id": 1,
      "tipo": "Día laboral"
    },
    "descripcion": "Lunes"
  },
  {
    "id": 7,
    "fecha": "2023-01-07",
    "tipo": {
      "id": 2,
      "tipo": "Fin de Semana"
    },
    "descripcion": "Sábado"
  }
]
```

#### Ejemplo con cURL:
```bash
curl -X GET "http://localhost:8080/api/calendario/listar/2023" -H "Accept: application/json"
```

---

### 3. Respuestas de Error Centralizadas

#### Año no generado (404 Not Found):
`GET /api/calendario/listar/2099`
```json
{
  "timestamp": "2026-11-13T13:30:00",
  "status": 404,
  "error": "Not Found",
  "mensaje": "No existe calendario generado para el año 2099. Debe generarlo previamente en /api/calendario/generar/2099",
  "path": "/api/calendario/listar/2099"
}
```

#### Parámetro inválido o fuera de rango (400 Bad Request):
`GET /api/calendario/generar/1800`
```json
{
  "timestamp": "2026-11-13T13:30:00",
  "status": 400,
  "error": "Bad Request",
  "mensaje": "El año 1800 es inválido. Debe encontrarse en el rango [1900 - 2199].",
  "path": "/api/calendario/generar/1800"
}
```

#### API Externa de Festivos no disponible (503 Service Unavailable):
```json
{
  "timestamp": "2026-11-13T13:30:00",
  "status": 503,
  "error": "Service Unavailable",
  "mensaje": "No fue posible comunicarse con la API externa de festivos en 'http://localhost:3000'. Verifique que el servicio esté activo y accesible.",
  "path": "/api/calendario/generar/2023"
}
```

---

## 10. Pruebas Automatizadas

Se implementaron **19 pruebas automatizadas** que cubren todos los requisitos solicitados por el taller:

1. **Generación de 365 días**: Verifica que un año estándar (2023) genere exactamente 365 registros.
2. **Generación de 366 días (Bisiesto)**: Verifica que un año bisiesto (2024) genere exactamente 366 registros incluyendo el 29 de febrero.
3. **Clasificación de Lunes a Viernes**: Verifica que los días hábiles no festivos sean clasificados como `Día laboral` (ID 1).
4. **Clasificación de Sábados y Domingos**: Verifica que los fines de semana no festivos sean clasificados como `Fin de Semana` (ID 2).
5. **Prioridad de Días Festivos**: Verifica que si un festivo cae en Domingo (ej. 1 de enero de 2023) o en Lunes (ej. 9 de enero de 2023), se clasifique como `Día festivo` (ID 3) con prioridad absoluta.
6. **Reemplazo Transaccional sin Duplicados**: Verifica que al regenerar un mismo año, los registros previos se eliminen limpiamente y no se dupliquen.
7. **Consulta por Año**: Verifica el retorno ordenado cronológicamente de los registros desde PostgreSQL.
8. **Manejo de 404**: Verifica que consultar un año sin generar arroje `CalendarioNotFoundException` (404).
9. **Fallas de API Externa**: Verifica que la desconexión o falla de la API externa arroje `ExternalApiException` (503/502) sin alterar la base de datos.
10. **Validación de Rango de Año**: Verifica el rechazo de años menores a 1900 o mayores a 2199.
11. **Pruebas de Integración con MockMvc y H2**: Valida el flujo HTTP de extremo a extremo en base de datos.

### Para ejecutar las pruebas:
```bash
mvn test
```
o en Windows:
```powershell
.\test.ps1
```
