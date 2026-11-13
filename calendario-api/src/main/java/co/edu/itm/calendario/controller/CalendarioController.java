package co.edu.itm.calendario.controller;

import co.edu.itm.calendario.dto.CalendarioResponseDto;
import co.edu.itm.calendario.service.CalendarioService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/calendario")
public class CalendarioController {

    private final CalendarioService calendarioService;

    public CalendarioController(CalendarioService calendarioService) {
        this.calendarioService = calendarioService;
    }

    /**
     * Endpoint de verificación de estado de la API (no requiere dependencias externas).
     * Ejemplo: GET /api/calendario/ping
     */
    @GetMapping("/ping")
    public ResponseEntity<Map<String, Object>> ping() {
        return ResponseEntity.ok(Map.of(
                "status", "OK",
                "api", "Calendario API - ITM Taller 2",
                "timestamp", LocalDateTime.now().toString()
        ));
    }

    /**
     * Endpoint para generar y almacenar el calendario de un año determinado.
     * Ejemplo: GET /api/calendario/generar/2023
     *
     * @param anio Año a generar
     * @return true si la operación se completó exitosamente
     */
    @GetMapping("/generar/{anio}")
    public ResponseEntity<Boolean> generarCalendario(@PathVariable("anio") int anio) {
        boolean resultado = calendarioService.generarCalendario(anio);
        return ResponseEntity.ok(resultado);
    }

    /**
     * Endpoint para consultar el calendario almacenado en PostgreSQL para un año específico.
     * Ejemplo: GET /api/calendario/listar/2023
     *
     * @param anio Año a consultar
     * @return Lista cronológica de los días del año
     */
    @GetMapping("/listar/{anio}")
    public ResponseEntity<List<CalendarioResponseDto>> listarCalendario(@PathVariable("anio") int anio) {
        List<CalendarioResponseDto> calendario = calendarioService.listarCalendario(anio);
        return ResponseEntity.ok(calendario);
    }
}
