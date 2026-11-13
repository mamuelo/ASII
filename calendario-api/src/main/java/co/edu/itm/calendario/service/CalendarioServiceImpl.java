package co.edu.itm.calendario.service;

import co.edu.itm.calendario.client.FestivosClient;
import co.edu.itm.calendario.config.DataInitializer;
import co.edu.itm.calendario.dto.CalendarioResponseDto;
import co.edu.itm.calendario.dto.FestivoExternoDto;
import co.edu.itm.calendario.dto.TipoDto;
import co.edu.itm.calendario.entity.Calendario;
import co.edu.itm.calendario.entity.Tipo;
import co.edu.itm.calendario.exception.AnioInvalidoException;
import co.edu.itm.calendario.exception.CalendarioNotFoundException;
import co.edu.itm.calendario.repository.CalendarioRepository;
import co.edu.itm.calendario.repository.TipoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CalendarioServiceImpl implements CalendarioService {

    private static final Logger log = LoggerFactory.getLogger(CalendarioServiceImpl.class);

    public static final int ANIO_MINIMO = 1900;
    public static final int ANIO_MAXIMO = 2199;

    private final CalendarioRepository calendarioRepository;
    private final TipoRepository tipoRepository;
    private final FestivosClient festivosClient;

    public CalendarioServiceImpl(
            CalendarioRepository calendarioRepository,
            TipoRepository tipoRepository,
            FestivosClient festivosClient
    ) {
        this.calendarioRepository = calendarioRepository;
        this.tipoRepository = tipoRepository;
        this.festivosClient = festivosClient;
    }

    @Override
    @Transactional
    public boolean generarCalendario(int anio) {
        validarRangoAnio(anio);

        log.info("Iniciando generación de calendario para el año {}", anio);

        // 1. Obtener los festivos de la API externa
        List<FestivoExternoDto> festivos = festivosClient.obtenerFestivosPorAnio(anio);
        Set<LocalDate> fechasFestivas = festivos.stream()
                .map(FestivoExternoDto::getFecha)
                .filter(fecha -> fecha != null && fecha.getYear() == anio)
                .collect(Collectors.toSet());

        log.info("Se identificaron {} fechas festivas para el año {}", fechasFestivas.size(), anio);

        // 2. Cargar los tipos requeridos
        Map<Integer, Tipo> tiposPorId = tipoRepository.findAll().stream()
                .collect(Collectors.toMap(Tipo::getId, t -> t));

        Tipo tipoLaboral = tiposPorId.get(DataInitializer.ID_DIA_LABORAL);
        Tipo tipoFinDeSemana = tiposPorId.get(DataInitializer.ID_FIN_DE_SEMANA);
        Tipo tipoFestivo = tiposPorId.get(DataInitializer.ID_DIA_FESTIVO);

        if (tipoLaboral == null || tipoFinDeSemana == null || tipoFestivo == null) {
            throw new IllegalStateException("Los tipos maestros (Día laboral, Fin de Semana, Día festivo) no están configurados en la base de datos.");
        }

        // 3. Generar todas las fechas del año (soporta años bisiestos: 365 o 366 días)
        LocalDate fechaInicio = LocalDate.of(anio, 1, 1);
        LocalDate fechaFin = LocalDate.of(anio, 12, 31);
        int totalDias = fechaInicio.lengthOfYear();

        List<Calendario> registrosCalendario = new ArrayList<>(totalDias);

        for (LocalDate fecha = fechaInicio; !fecha.isAfter(fechaFin); fecha = fecha.plusDays(1)) {
            String descripcion = obtenerNombreDiaEspanol(fecha);
            Tipo tipoAsignado;

            // Prioridad: Día festivo tiene máxima prioridad sobre fin de semana y día laboral
            if (fechasFestivas.contains(fecha)) {
                tipoAsignado = tipoFestivo;
            } else if (fecha.getDayOfWeek() == DayOfWeek.SATURDAY || fecha.getDayOfWeek() == DayOfWeek.SUNDAY) {
                tipoAsignado = tipoFinDeSemana;
            } else {
                tipoAsignado = tipoLaboral;
            }

            registrosCalendario.add(new Calendario(fecha, tipoAsignado, descripcion));
        }

        // 4. Limpieza previa del año si ya existía para evitar registros duplicados
        if (calendarioRepository.existsByFechaBetween(fechaInicio, fechaFin)) {
            log.info("Ya existía calendario para el año {}. Reemplazando registros de forma transaccional.", anio);
            calendarioRepository.deleteByFechaBetween(fechaInicio, fechaFin);
            calendarioRepository.flush();
        }

        // 5. Persistencia transaccional de todos los días del año
        calendarioRepository.saveAll(registrosCalendario);
        log.info("Calendario para el año {} generado y persistido exitosamente con {} días.", anio, registrosCalendario.size());

        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CalendarioResponseDto> listarCalendario(int anio) {
        validarRangoAnio(anio);

        LocalDate fechaInicio = LocalDate.of(anio, 1, 1);
        LocalDate fechaFin = LocalDate.of(anio, 12, 31);

        List<Calendario> registros = calendarioRepository.findByFechaBetweenOrderByFechaAsc(fechaInicio, fechaFin);

        if (registros.isEmpty()) {
            throw new CalendarioNotFoundException(
                    String.format("No existe calendario generado para el año %d. Debe generarlo previamente en /api/calendario/generar/%d", anio, anio)
            );
        }

        return registros.stream()
                .map(this::convertirAResponseDto)
                .collect(Collectors.toList());
    }

    private void validarRangoAnio(int anio) {
        if (anio < ANIO_MINIMO || anio > ANIO_MAXIMO) {
            throw new AnioInvalidoException(
                    String.format("El año %d es inválido. Debe encontrarse en el rango [%d - %d].", anio, ANIO_MINIMO, ANIO_MAXIMO)
            );
        }
    }

    /**
     * Retorna el nombre del día de la semana en español con mayúscula inicial y tildes correspondientes.
     */
    public static String obtenerNombreDiaEspanol(LocalDate fecha) {
        DayOfWeek dow = fecha.getDayOfWeek();
        switch (dow) {
            case MONDAY:
                return "Lunes";
            case TUESDAY:
                return "Martes";
            case WEDNESDAY:
                return "Miércoles";
            case THURSDAY:
                return "Jueves";
            case FRIDAY:
                return "Viernes";
            case SATURDAY:
                return "Sábado";
            case SUNDAY:
                return "Domingo";
            default:
                return dow.name();
        }
    }

    private CalendarioResponseDto convertirAResponseDto(Calendario calendario) {
        TipoDto tipoDto = null;
        if (calendario.getTipo() != null) {
            tipoDto = new TipoDto(calendario.getTipo().getId(), calendario.getTipo().getTipo());
        }
        return new CalendarioResponseDto(
                calendario.getId(),
                calendario.getFecha(),
                tipoDto,
                calendario.getDescripcion()
        );
    }
}
