package com.example.employeemanagement.exception;

import com.example.employeemanagement.dto.FieldErrorDetail;
import java.util.List;

/** The request is valid but clashes with current state (duplicates, referenced rows...). */
public class ConflictException extends RuntimeException {

    private final String code;
    private final List<FieldErrorDetail> fieldErrors;

    public ConflictException(String code, String message, List<FieldErrorDetail> fieldErrors) {
        super(message);
        this.code = code;
        this.fieldErrors = List.copyOf(fieldErrors);
    }

    public ConflictException(String code, String message) {
        this(code, message, List.of());
    }

    public String getCode() {
        return code;
    }

    /** Request fields that caused the conflict; empty when no single field is to blame. */
    public List<FieldErrorDetail> getFieldErrors() {
        return fieldErrors;
    }
}
