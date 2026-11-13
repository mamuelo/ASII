package co.edu.itm.calendario.dto;

public class TipoDto {

    private Integer id;
    private String tipo;

    public TipoDto() {
    }

    public TipoDto(Integer id, String tipo) {
        this.id = id;
        this.tipo = tipo;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }
}
