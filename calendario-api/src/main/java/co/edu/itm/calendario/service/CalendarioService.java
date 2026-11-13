package co.edu.itm.calendario.service;

import co.edu.itm.calendario.dto.CalendarioResponseDto;
import java.util.List;

public interface CalendarioService {

    /**
     * Genera y almacena en PostgreSQL el calendario completo de un año,
     * clasificando cada día como laboral, fin de semana o festivo según la API externa.
     *
     * @param anio Año a generar
     * @return true si el proceso finalizó exitosamente
     */
    boolean generarCalendario(int anio);

    /**
     * Consulta el calendario almacenado en PostgreSQL para un año específico.
     *
     * @param anio Año a consultar
     * @return Lista cronológica de los días del año
     */
    List<CalendarioResponseDto> listarCalendario(int anio);
}
