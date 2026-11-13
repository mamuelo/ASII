package co.edu.itm.calendario.client;

import co.edu.itm.calendario.dto.FestivoExternoDto;
import co.edu.itm.calendario.exception.ExternalApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FestivosClientTest {

    @Mock
    private RestTemplate restTemplate;

    private FestivosClient festivosClient;

    @BeforeEach
    void setUp() {
        festivosClient = new FestivosClient(
                restTemplate,
                "http://localhost:3000",
                "/api/festivos/obtener/{anio}"
        );
    }

    @Test
    @DisplayName("Debe consultar la API externa y deserializar la lista de festivos correctamente")
    void testObtenerFestivosExitoso() {
        int anio = 2023;
        List<FestivoExternoDto> festivosMock = List.of(
                new FestivoExternoDto("Año Nuevo", LocalDate.of(2023, 1, 1)),
                new FestivoExternoDto("Santos Reyes", LocalDate.of(2023, 1, 9))
        );

        when(restTemplate.exchange(
                any(URI.class),
                eq(HttpMethod.GET),
                eq(null),
                any(ParameterizedTypeReference.class)
        )).thenReturn(ResponseEntity.ok(festivosMock));

        List<FestivoExternoDto> resultado = festivosClient.obtenerFestivosPorAnio(anio);

        assertNotNull(resultado);
        assertEquals(2, resultado.size());
        assertEquals("Año Nuevo", resultado.get(0).getFestivo());
        assertEquals(LocalDate.of(2023, 1, 1), resultado.get(0).getFecha());
    }

    @Test
    @DisplayName("Debe lanzar ExternalApiException (503) cuando no hay conexión con la API externa")
    void testErrorDeConexionLanzaExternalApiException() {
        when(restTemplate.exchange(
                any(URI.class),
                eq(HttpMethod.GET),
                eq(null),
                any(ParameterizedTypeReference.class)
        )).thenThrow(new ResourceAccessException("Connection refused"));

        ExternalApiException ex = assertThrows(
                ExternalApiException.class,
                () -> festivosClient.obtenerFestivosPorAnio(2023)
        );

        assertEquals(503, ex.getStatusCode());
        assertTrue(ex.getMessage().contains("No fue posible comunicarse"));
    }

    @Test
    @DisplayName("Debe lanzar ExternalApiException cuando la API externa responde con error HTTP 500")
    void testErrorServidorExternoLanzaExternalApiException() {
        when(restTemplate.exchange(
                any(URI.class),
                eq(HttpMethod.GET),
                eq(null),
                any(ParameterizedTypeReference.class)
        )).thenThrow(new HttpServerErrorException(HttpStatus.INTERNAL_SERVER_ERROR, "Database down"));

        ExternalApiException ex = assertThrows(
                ExternalApiException.class,
                () -> festivosClient.obtenerFestivosPorAnio(2023)
        );

        assertEquals(500, ex.getStatusCode());
    }
}
