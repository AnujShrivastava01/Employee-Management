package com.example.employeemanagement.exception;

/** The request cannot be processed because of a client supplied value (HTTP 400). */
public class InvalidRequestException extends RuntimeException {

    private final String field;

    public InvalidRequestException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
