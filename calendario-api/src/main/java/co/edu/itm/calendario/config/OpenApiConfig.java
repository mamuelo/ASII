package co.edu.itm.calendario.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("API RESTful Calendario Colombia - Entrega 4 ITM")
                        .version("1.0.0")
                        .description("API RESTful desarrollada en Spring Boot y PostgreSQL para la generación y persistencia del calendario anual colombiano (Entrega 4), consumiendo la API de festivos de la Entrega 3.")
                        .contact(new Contact().name("Instituto Tecnológico Metropolitano (ITM)"))
                )
                .servers(List.of(
                        new Server().url("/").description("Servidor actual"),
                        new Server().url("http://localhost:8080").description("Servidor local Spring Boot")
                ));
    }
}
