package co.edu.itm.calendario.config;

import co.edu.itm.calendario.entity.Tipo;
import co.edu.itm.calendario.repository.TipoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Inicializador de datos maestros para la tabla Tipo.
 * Garantiza que siempre existan exactamente los tres tipos exigidos por el taller:
 * 1. Día laboral
 * 2. Fin de Semana
 * 3. Día festivo
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    public static final int ID_DIA_LABORAL = 1;
    public static final int ID_FIN_DE_SEMANA = 2;
    public static final int ID_DIA_FESTIVO = 3;

    public static final String NOMBRE_DIA_LABORAL = "Día laboral";
    public static final String NOMBRE_FIN_DE_SEMANA = "Fin de Semana";
    public static final String NOMBRE_DIA_FESTIVO = "Día festivo";

    private final TipoRepository tipoRepository;

    public DataInitializer(TipoRepository tipoRepository) {
        this.tipoRepository = tipoRepository;
    }

    @Override
    public void run(String... args) {
        crearTipoSiNoExiste(ID_DIA_LABORAL, NOMBRE_DIA_LABORAL);
        crearTipoSiNoExiste(ID_FIN_DE_SEMANA, NOMBRE_FIN_DE_SEMANA);
        crearTipoSiNoExiste(ID_DIA_FESTIVO, NOMBRE_DIA_FESTIVO);
        log.info("Inicialización de tipos de calendario completada exitosamente.");
    }

    private void crearTipoSiNoExiste(int id, String nombre) {
        if (!tipoRepository.existsById(id)) {
            tipoRepository.save(new Tipo(id, nombre));
            log.info("Tipo creado: ID {} - '{}'", id, nombre);
        }
    }
}
