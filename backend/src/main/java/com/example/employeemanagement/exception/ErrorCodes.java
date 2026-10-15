package com.example.employeemanagement.exception;

public final class ErrorCodes {

    public static final String VALIDATION_ERROR = "VALIDATION_ERROR";
    public static final String MALFORMED_REQUEST = "MALFORMED_REQUEST";
    public static final String NOT_FOUND = "NOT_FOUND";
    public static final String DUPLICATE_EMPLOYEE_ID = "DUPLICATE_EMPLOYEE_ID";
    public static final String DUPLICATE_EMAIL = "DUPLICATE_EMAIL";
    public static final String DUPLICATE_DEPARTMENT = "DUPLICATE_DEPARTMENT";
    public static final String DEPARTMENT_IN_USE = "DEPARTMENT_IN_USE";
    public static final String CONFLICT = "CONFLICT";
    public static final String UNAUTHORIZED = "UNAUTHORIZED";
    public static final String FORBIDDEN = "FORBIDDEN";
    public static final String METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED";
    public static final String INTERNAL_ERROR = "INTERNAL_ERROR";

    private ErrorCodes() {
    }
}
