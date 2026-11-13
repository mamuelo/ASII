package co.edu.itm.calendario.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Controlador para la ruta raíz ("/") de la API Spring Boot.
 * Proporciona información sobre el servicio, estado y enlaces a los endpoints y documentación.
 */
@RestController
public class RootController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("nombre", "API RESTful Calendario Colombia");
        response.put("tecnologia", "Spring Boot 3 + PostgreSQL");
        response.put("institucion", "Instituto Tecnológico Metropolitano (ITM)");
        response.put("entrega", "Entrega 4 - Microservicios y Persistencia (Calendario)");
        response.put("estado", "UP");

        Map<String, String> endpoints = new LinkedHashMap<>();
        endpoints.put("ping", "GET /api/calendario/ping");
        endpoints.put("generar", "GET /api/calendario/generar/{anio}");
        endpoints.put("listar", "GET /api/calendario/listar/{anio}");
        endpoints.put("health", "GET /actuator/health");
        endpoints.put("documentacionSwagger", "GET /swagger-ui.html");
        endpoints.put("apiDocsJson", "GET /v3/api-docs");
        response.put("endpoints", endpoints);

        return ResponseEntity.ok(response);
    }
}
