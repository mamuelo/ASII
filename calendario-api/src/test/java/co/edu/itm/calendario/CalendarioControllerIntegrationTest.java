package co.edu.itm.calendario;

import co.edu.itm.calendario.client.FestivosClient;
import co.edu.itm.calendario.config.DataInitializer;
import co.edu.itm.calendario.dto.FestivoExternoDto;
import co.edu.itm.calendario.exception.ExternalApiException;
import co.edu.itm.calendario.repository.CalendarioRepository;
import co.edu.itm.calendario.repository.TipoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CalendarioControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CalendarioRepository calendarioRepository;

    @Autowired
    private TipoRepository tipoRepository;

    @MockBean
    private FestivosClient festivosClient;

    @BeforeEach
    void setUp() {
        calendarioRepository.deleteAll();
    }

    @Test
    @DisplayName("Integración: GET /api/calendario/generar/2023 genera y almacena 365 días en base de datos")
    void testGenerarCalendario2023Exitoso() throws Exception {
        int anio = 2023;
        List<FestivoExternoDto> festivosMock = List.of(
                new FestivoExternoDto("Año Nuevo", LocalDate.of(anio, 1, 1)),
                new FestivoExternoDto("Santos Reyes", LocalDate.of(anio, 1, 9)),
                new FestivoExternoDto("Día del Trabajo", LocalDate.of(anio, 5, 1))
        );
        when(festivosClient.obtenerFestivosPorAnio(anio)).thenReturn(festivosMock);

        // Generar
        mockMvc.perform(get("/api/calendario/generar/{anio}", anio))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));

        // Verificar en base de datos
        long totalGuardado = calendarioRepository.count();
        assertEquals(365, totalGuardado, "Debe haber guardado exactamente 365 registros en base de datos.");

        // Listar
        mockMvc.perform(get("/api/calendario/listar/{anio}", anio)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(365)))
                .andExpect(jsonPath("$[0].fecha", is("2023-01-01")))
                .andExpect(jsonPath("$[0].descripcion", is("Domingo")))
                .andExpect(jsonPath("$[0].tipo.id", is(DataInitializer.ID_DIA_FESTIVO)))
                .andExpect(jsonPath("$[0].tipo.tipo", is(DataInitializer.NOMBRE_DIA_FESTIVO)))
                .andExpect(jsonPath("$[1].fecha", is("2023-01-02")))
                .andExpect(jsonPath("$[1].descripcion", is("Lunes")))
                .andExpect(jsonPath("$[1].tipo.id", is(DataInitializer.ID_DIA_LABORAL)));
    }

    @Test
    @DisplayName("Integración: Regenerar el mismo año reemplaza registros sin duplicar")
    void testRegenerarMismoAnioNoDuplica() throws Exception {
        int anio = 2023;
        when(festivosClient.obtenerFestivosPorAnio(anio)).thenReturn(List.of());

        // Primera generación
        mockMvc.perform(get("/api/calendario/generar/{anio}", anio))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));
        assertEquals(365, calendarioRepository.count());

        // Segunda generación del mismo año
        mockMvc.perform(get("/api/calendario/generar/{anio}", anio))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));
        assertEquals(365, calendarioRepository.count(), "La segunda generación no debe duplicar registros.");
    }

    @Test
    @DisplayName("Integración: GET /api/calendario/listar/{anio} sin generar retorna 404 NOT_FOUND")
    void testListarAnioSinGenerarRetorna404() throws Exception {
        mockMvc.perform(get("/api/calendario/listar/2026"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.mensaje", containsString("No existe calendario generado")));
    }

    @Test
    @DisplayName("Integración: GET /api/calendario/generar/invalido con texto retorna 400 BAD_REQUEST")
    void testGenerarConParametroNoNumericoRetorna400() throws Exception {
        mockMvc.perform(get("/api/calendario/generar/invalido"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.mensaje", containsString("no es válido")));
    }

    @Test
    @DisplayName("Integración: GET /api/calendario/generar/1800 fuera de rango retorna 400 BAD_REQUEST")
    void testGenerarConAnioFueraDeRangoRetorna400() throws Exception {
        mockMvc.perform(get("/api/calendario/generar/1800"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.mensaje", containsString("inválido")));
    }

    @Test
    @DisplayName("Integración: Error de la API externa retorna 503 SERVICE_UNAVAILABLE")
    void testErrorApiExternaRetorna503() throws Exception {
        when(festivosClient.obtenerFestivosPorAnio(2023))
                .thenThrow(new ExternalApiException("API externa no disponible", 503));

        mockMvc.perform(get("/api/calendario/generar/2023"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status", is(503)))
                .andExpect(jsonPath("$.mensaje", containsString("API externa no disponible")));
    }
}
