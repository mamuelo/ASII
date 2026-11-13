package co.edu.itm.calendario.exception;

public class ExternalApiException extends RuntimeException {

    private final int statusCode;

    public ExternalApiException(String message) {
        super(message);
        this.statusCode = 502;
    }

    public ExternalApiException(String message, Throwable cause) {
        super(message, cause);
        this.statusCode = 502;
    }

    public ExternalApiException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }
}
