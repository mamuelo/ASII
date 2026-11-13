package co.edu.itm.calendario.client;

import co.edu.itm.calendario.dto.FestivoExternoDto;
import co.edu.itm.calendario.exception.ExternalApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Collections;
import java.util.List;

/**
 * Cliente HTTP para consumir la API externa de festivos de Colombia (Express JS + MongoDB).
 */
@Component
public class FestivosClient {

    private static final Logger log = LoggerFactory.getLogger(FestivosClient.class);

    private final RestTemplate restTemplate;
    private final String baseUrl;
    private final String endpointPattern;

    public FestivosClient(
            RestTemplate restTemplate,
            @Value("${festivos.api.url:http://localhost:3000}") String baseUrl,
            @Value("${festivos.api.endpoint:/api/festivos/obtener/{anio}}") String endpointPattern
    ) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl.replaceAll("/+$", "");
        this.endpointPattern = endpointPattern.startsWith("/") ? endpointPattern : "/" + endpointPattern;
    }

    /**
     * Consulta la API externa para obtener la lista de festivos del año indicado.
     *
     * @param anio Año a consultar
     * @return Lista de festivos retornada por el servicio externo
     */
    public List<FestivoExternoDto> obtenerFestivosPorAnio(int anio) {
        String path = endpointPattern.replace("{anio}", String.valueOf(anio));
        URI targetUri = UriComponentsBuilder.fromHttpUrl(baseUrl + path).build().toUri();

        log.info("Consultando festivos del año {} en la API externa: {}", anio, targetUri);

        try {
            ResponseEntity<List<FestivoExternoDto>> response = restTemplate.exchange(
                    targetUri,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<FestivoExternoDto>>() {}
            );

            List<FestivoExternoDto> festivos = response.getBody();
            if (festivos == null) {
                log.warn("La API externa retornó un cuerpo nulo para el año {}", anio);
                return Collections.emptyList();
            }

            log.info("Se obtuvieron {} festivos para el año {}", festivos.size(), anio);
            return festivos;

        } catch (ResourceAccessException ex) {
            String msg = String.format("No fue posible comunicarse con la API externa de festivos en '%s'. Verifique que el servicio esté activo y accesible.", baseUrl);
            log.error(msg, ex);
            throw new ExternalApiException(msg, 503);

        } catch (HttpStatusCodeException ex) {
            String msg = String.format("La API externa de festivos respondió con estado HTTP %s: %s",
                    ex.getStatusCode(), ex.getResponseBodyAsString());
            log.error(msg, ex);
            throw new ExternalApiException(msg, ex.getStatusCode().value());

        } catch (RestClientException ex) {
            String msg = String.format("Error al procesar la respuesta de la API externa de festivos: %s", ex.getMessage());
            log.error(msg, ex);
            throw new ExternalApiException(msg, 502);
        }
    }

    public String getBaseUrl() {
        return baseUrl;
    }
}
