package co.edu.itm.calendario.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDate;

/**
 * DTO que representa un día festivo devuelto por la API externa (Express JS + MongoDB).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class FestivoExternoDto {

    private String festivo;
    private String nombre;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate fecha;

    private Integer tipo;
    private String descripcionTipo;

    public FestivoExternoDto() {
    }

    public FestivoExternoDto(String festivo, LocalDate fecha) {
        this.festivo = festivo;
        this.nombre = festivo;
        this.fecha = fecha;
    }

    public String getFestivo() {
        return festivo;
    }

    public void setFestivo(String festivo) {
        this.festivo = festivo;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public Integer getTipo() {
        return tipo;
    }

    public void setTipo(Integer tipo) {
        this.tipo = tipo;
    }

    public String getDescripcionTipo() {
        return descripcionTipo;
    }

    public void setDescripcionTipo(String descripcionTipo) {
        this.descripcionTipo = descripcionTipo;
    }

    @Override
    public String toString() {
        return "FestivoExternoDto{" +
                "festivo='" + festivo + '\'' +
                ", fecha=" + fecha +
                ", tipo=" + tipo +
                '}';
    }
}
