package co.edu.itm.calendario.service;

import co.edu.itm.calendario.client.FestivosClient;
import co.edu.itm.calendario.config.DataInitializer;
import co.edu.itm.calendario.dto.CalendarioResponseDto;
import co.edu.itm.calendario.dto.FestivoExternoDto;
import co.edu.itm.calendario.entity.Calendario;
import co.edu.itm.calendario.entity.Tipo;
import co.edu.itm.calendario.exception.AnioInvalidoException;
import co.edu.itm.calendario.exception.CalendarioNotFoundException;
import co.edu.itm.calendario.exception.ExternalApiException;
import co.edu.itm.calendario.repository.CalendarioRepository;
import co.edu.itm.calendario.repository.TipoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CalendarioServiceTest {

    @Mock
    private CalendarioRepository calendarioRepository;

    @Mock
    private TipoRepository tipoRepository;

    @Mock
    private FestivosClient festivosClient;

    @InjectMocks
    private CalendarioServiceImpl calendarioService;

    @Captor
    private ArgumentCaptor<List<Calendario>> calendarioListCaptor;

    private Tipo tipoLaboral;
    private Tipo tipoFinDeSemana;
    private Tipo tipoFestivo;

    @BeforeEach
    void setUp() {
        tipoLaboral = new Tipo(DataInitializer.ID_DIA_LABORAL, DataInitializer.NOMBRE_DIA_LABORAL);
        tipoFinDeSemana = new Tipo(DataInitializer.ID_FIN_DE_SEMANA, DataInitializer.NOMBRE_FIN_DE_SEMANA);
        tipoFestivo = new Tipo(DataInitializer.ID_DIA_FESTIVO, DataInitializer.NOMBRE_DIA_FESTIVO);
    }

    private void mockTipos() {
        when(tipoRepository.findAll()).thenReturn(Arrays.asList(tipoLaboral, tipoFinDeSemana, tipoFestivo));
    }

    @Test
    @DisplayName("1. Debe generar exactamente 365 días para un año común (2023)")
    void testGenerarCalendarioAnioComun365Dias() {
        int anio = 2023;
        mockTipos();

        List<FestivoExternoDto> festivos = List.of(
                new FestivoExternoDto("Año Nuevo", LocalDate.of(anio, 1, 1)),
                new FestivoExternoDto("Día del Trabajo", LocalDate.of(anio, 5, 1))
        );
        when(festivosClient.obtenerFestivosPorAnio(anio)).thenReturn(festivos);
        when(calendarioRepository.existsByFechaBetween(any(LocalDate.class), any(LocalDate.class))).thenReturn(false);

        boolean resultado = calendarioService.generarCalendario(anio);

        assertTrue(resultado);
        verify(calendarioRepository).saveAll(calendarioListCaptor.capture());
        List<Calendario> guardados = calendarioListCaptor.getValue();
        assertEquals(365, guardados.size(), "Un año no bisiesto debe generar exactamente 365 días.");
    }

    @Test
    @DisplayName("2. Debe generar exactamente 366 días para un año bisiesto (2024)")
    void testGenerarCalendarioAnioBisiesto366Dias() {
        int anio = 2024;
        mockTipos();

        when(festivosClient.obtenerFestivosPorAnio(anio)).thenReturn(Collections.emptyList());
        when(calendarioRepository.existsByFechaBetween(any(LocalDate.class), any(LocalDate.class))).thenReturn(false);

        boolean resultado = calendarioService.generarCalendario(anio);

        assertTrue(resultado);
        verify(calendarioRepository).saveAll(calendarioListCaptor.capture());
        List<Calendario> guardados = calendarioListCaptor.getValue();
        assertEquals(366, guardados.size(), "Un año bisiesto debe generar exactamente 366 días.");

        // Verificar existencia del 29 de febrero
        boolean tiene29Febrero = guardados.stream()
                .anyMatch(c -> c.getFecha().equals(LocalDate.of(2024, 2, 29)));
        assertTrue(tiene29Febrero, "El calendario 2024 debe incluir el 29 de febrero.");
    }

    @Test
    @DisplayName("3. Clasificación correcta de lunes a viernes como 'Día laboral'")
    void testClasificacionLunesAViernesLaboral() {
        int anio = 2023;
        mockTipos();
        when(festivosClient.obtenerFestivosPorAnio(anio)).thenReturn(Collections.emptyList());

        calendarioService.generarCalendario(anio);

        verify(calendarioRepository).saveAll(calendarioListCaptor.capture());
        List<Calendario> guardados = calendarioListCaptor.getValue();

        // 2023-01-02 fue Lunes
        Calendario lunes = guardados.stream()
                .filter(c -> c.getFecha().equals(LocalDate.of(2023, 1, 2)))
                .findFirst()
                .orElseThrow();
        assertEquals("Lunes", lunes.getDescripcion());
        assertEquals("Día laboral", lunes.getTipo().getTipo());
        assertEquals(DataInitializer.ID_DIA_LABORAL, lunes.getTipo().getId());

        // 2023-01-06 fue Viernes
        Calendario viernes = guardados.stream()
                .filter(c -> c.getFecha().equals(LocalDate.of(2023, 1, 6)))
                .findFirst()
                .orElseThrow();
        assertEquals("Viernes", viernes.getDescripcion());
        assertEquals("Día laboral", viernes.getTipo().getTipo());
    }

    @Test
    @DisplayName("4. Clasificación correcta de sábados y domingos como 'Fin de Semana'")
    void testClasificacionFinDeSemana() {
        int anio = 2023;
        mockTipos();
        when(festivosClient.obtenerFestivosPorAnio(anio)).thenReturn(Collections.emptyList());

        calendarioService.generarCalendario(anio);

        verify(calendarioRepository).saveAll(calendarioListCaptor.capture());
        List<Calendario> guardados = calendarioListCaptor.getValue();

        // 2023-01-07 fue Sábado
        Calendario sabado = guardados.stream()
                .filter(c -> c.getFecha().equals(LocalDate.of(2023, 1, 7)))
                .findFirst()
                .orElseThrow();
        assertEquals("Sábado", sabado.getDescripcion());
        assertEquals("Fin de Semana", sabado.getTipo().getTipo());
        assertEquals(DataInitializer.ID_FIN_DE_SEMANA, sabado.getTipo().getId());

        // 2023-01-08 fue Domingo
        Calendario domingo = guardados.stream()
                .filter(c -> c.getFecha().equals(LocalDate.of(2023, 1, 8)))
                .findFirst()
                .orElseThrow();
        assertEquals("Domingo", domingo.getDescripcion());
        assertEquals("Fin de Semana", domingo.getTipo().getTipo());
    }

    @Test
    @DisplayName("5. Prioridad de días festivos sobre fin de semana y día laboral")
    void testPrioridadDiasFestivos() {
        int anio = 2023;
        mockTipos();

        // 2023-01-01 fue Domingo Y festivo (Año Nuevo)
        // 2023-01-09 fue Lunes Y festivo (Reyes Magos)
        List<FestivoExternoDto> festivos = List.of(
                new FestivoExternoDto("Año Nuevo", LocalDate.of(2023, 1, 1)),
                new FestivoExternoDto("Santos Reyes", LocalDate.of(2023, 1, 9))
        );
        when(festivosClient.obtenerFestivosPorAnio(anio)).thenReturn(festivos);

        calendarioService.generarCalendario(anio);

        verify(calendarioRepository).saveAll(calendarioListCaptor.capture());
        List<Calendario> guardados = calendarioListCaptor.getValue();

        // Domingo 1 de enero: DEBE ser "Día festivo" y NO "Fin de Semana"
        Calendario anioNuevo = guardados.stream()
                .filter(c -> c.getFecha().equals(LocalDate.of(2023, 1, 1)))
                .findFirst()
                .orElseThrow();
        assertEquals("Domingo", anioNuevo.getDescripcion());
        assertEquals("Día festivo", anioNuevo.getTipo().getTipo());
        assertEquals(DataInitializer.ID_DIA_FESTIVO, anioNuevo.getTipo().getId());

        // Lunes 9 de enero: DEBE ser "Día festivo" y NO "Día laboral"
        Calendario reyesMagos = guardados.stream()
                .filter(c -> c.getFecha().equals(LocalDate.of(2023, 1, 9)))
                .findFirst()
                .orElseThrow();
        assertEquals("Lunes", reyesMagos.getDescripcion());
        assertEquals("Día festivo", reyesMagos.getTipo().getTipo());
    }

    @Test
    @DisplayName("6. Debe reemplazar registros anteriores y evitar duplicados al regenerar el mismo año")
    void testEvitarDuplicadosAlRegenerar() {
        int anio = 2023;
        mockTipos();
        when(festivosClient.obtenerFestivosPorAnio(anio)).thenReturn(Collections.emptyList());
        when(calendarioRepository.existsByFechaBetween(any(LocalDate.class), any(LocalDate.class))).thenReturn(true);

        calendarioService.generarCalendario(anio);

        verify(calendarioRepository).deleteByFechaBetween(eq(LocalDate.of(2023, 1, 1)), eq(LocalDate.of(2023, 12, 31)));
        verify(calendarioRepository).flush();
        verify(calendarioRepository).saveAll(any());
    }

    @Test
    @DisplayName("7. Consulta de calendario por año retorna la lista correctamente")
    void testListarCalendarioPorAnio() {
        int anio = 2023;
        List<Calendario> registros = List.of(
                new Calendario(1L, LocalDate.of(2023, 1, 1), tipoFestivo, "Domingo"),
                new Calendario(2L, LocalDate.of(2023, 1, 2), tipoLaboral, "Lunes")
        );

        when(calendarioRepository.findByFechaBetweenOrderByFechaAsc(LocalDate.of(2023, 1, 1), LocalDate.of(2023, 12, 31)))
                .thenReturn(registros);

        List<CalendarioResponseDto> resultado = calendarioService.listarCalendario(anio);

        assertNotNull(resultado);
        assertEquals(2, resultado.size());
        assertEquals(LocalDate.of(2023, 1, 1), resultado.get(0).getFecha());
        assertEquals("Día festivo", resultado.get(0).getTipo().getTipo());
        assertEquals("Domingo", resultado.get(0).getDescripcion());
    }

    @Test
    @DisplayName("8. Consulta de año sin calendario generado debe lanzar CalendarioNotFoundException")
    void testListarCalendarioNoEncontrado() {
        int anio = 2025;
        when(calendarioRepository.findByFechaBetweenOrderByFechaAsc(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        assertThrows(CalendarioNotFoundException.class, () -> calendarioService.listarCalendario(anio));
    }

    @Test
    @DisplayName("9. Falla de la API externa debe propagar ExternalApiException sin guardar nada")
    void testFalloApiExternaPropagaExcepcion() {
        int anio = 2023;
        when(festivosClient.obtenerFestivosPorAnio(anio))
                .thenThrow(new ExternalApiException("Error de conexión con la API externa", 503));

        assertThrows(ExternalApiException.class, () -> calendarioService.generarCalendario(anio));
        verify(calendarioRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("10. Rechazar años inválidos fuera del rango 1900-2199")
    void testRechazarAnioInvalido() {
        assertThrows(AnioInvalidoException.class, () -> calendarioService.generarCalendario(1800));
        assertThrows(AnioInvalidoException.class, () -> calendarioService.generarCalendario(2500));
        assertThrows(AnioInvalidoException.class, () -> calendarioService.listarCalendario(-1));
    }
}
