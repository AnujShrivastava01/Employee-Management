package com.example.employeemanagement.exception;

import com.example.employeemanagement.dto.ErrorResponse;
import com.example.employeemanagement.dto.FieldErrorDetail;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.fasterxml.jackson.databind.JsonMappingException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.time.Instant;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/** Translates every failure into the uniform {@link ErrorResponse} without leaking internals. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND, ex.getMessage(), request, List.of());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<ErrorResponse> handleNoResource(HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND, "The requested resource was not found", request, List.of());
    }

    @ExceptionHandler(ConflictException.class)
    ResponseEntity<ErrorResponse> handleConflict(ConflictException ex, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, ex.getCode(), ex.getMessage(), request, ex.getFieldErrors());
    }

    @ExceptionHandler(InvalidRequestException.class)
    ResponseEntity<ErrorResponse> handleInvalidRequest(InvalidRequestException ex, HttpServletRequest request) {
        List<FieldErrorDetail> details = ex.getField() == null
                ? List.of() : List.of(new FieldErrorDetail(ex.getField(), ex.getMessage()));
        return build(HttpStatus.BAD_REQUEST, ErrorCodes.VALIDATION_ERROR, ex.getMessage(), request, details);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorResponse> handleBodyValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        // A field can break several rules at once; report one message per field, "required" first.
        Map<String, FieldErrorDetail> byField = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().stream()
                .map(error -> new FieldErrorDetail(error.getField(), error.getDefaultMessage()))
                .sorted(Comparator.comparing((FieldErrorDetail detail) -> !detail.message().endsWith(" is required"))
                        .thenComparing(FieldErrorDetail::field))
                .forEach(detail -> byField.putIfAbsent(detail.field(), detail));
        return build(HttpStatus.BAD_REQUEST, ErrorCodes.VALIDATION_ERROR, "Validation failed", request,
                List.copyOf(byField.values()));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException ex, HttpServletRequest request) {
        List<FieldErrorDetail> details = ex.getConstraintViolations().stream()
                .map(v -> new FieldErrorDetail(lastSegment(v.getPropertyPath().toString()), v.getMessage()))
                .toList();
        return build(HttpStatus.BAD_REQUEST, ErrorCodes.VALIDATION_ERROR, "Validation failed", request, details);
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    ResponseEntity<ErrorResponse> handleParameterValidation(HandlerMethodValidationException ex, HttpServletRequest request) {
        List<FieldErrorDetail> details = ex.getParameterValidationResults().stream()
                .flatMap(result -> result.getResolvableErrors().stream()
                        .map(error -> new FieldErrorDetail(
                                result.getMethodParameter().getParameterName(), error.getDefaultMessage())))
                .toList();
        return build(HttpStatus.BAD_REQUEST, ErrorCodes.VALIDATION_ERROR, "Validation failed", request, details);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ErrorResponse> handleUnreadableBody(HttpMessageNotReadableException ex, HttpServletRequest request) {
        if (ex.getCause() instanceof InvalidFormatException invalid && !invalid.getPath().isEmpty()) {
            String field = fieldName(invalid);
            Object[] allowed = invalid.getTargetType() != null && invalid.getTargetType().isEnum()
                    ? invalid.getTargetType().getEnumConstants() : null;
            String message = allowed == null
                    ? "Invalid value for '" + field + "'"
                    : "Invalid value for '" + field + "'; allowed values: " + Arrays.toString(allowed);
            return build(HttpStatus.BAD_REQUEST, ErrorCodes.VALIDATION_ERROR, message, request,
                    List.of(new FieldErrorDetail(field, message)));
        }
        return build(HttpStatus.BAD_REQUEST, ErrorCodes.MALFORMED_REQUEST,
                "Request body is missing or is not valid JSON", request, List.of());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        String message = "Invalid value '" + ex.getValue() + "' for parameter '" + ex.getName() + "'";
        return build(HttpStatus.BAD_REQUEST, ErrorCodes.VALIDATION_ERROR, message, request,
                List.of(new FieldErrorDetail(ex.getName(), message)));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    ResponseEntity<ErrorResponse> handleMissingParameter(MissingServletRequestParameterException ex, HttpServletRequest request) {
        String message = "Required parameter '" + ex.getParameterName() + "' is missing";
        return build(HttpStatus.BAD_REQUEST, ErrorCodes.VALIDATION_ERROR, message, request,
                List.of(new FieldErrorDetail(ex.getParameterName(), message)));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex, HttpServletRequest request) {
        // Safety net for races that slip past the service-level duplicate checks.
        String detail = String.valueOf(ex.getMostSpecificCause().getMessage());
        if (detail.contains("uk_employees_employee_id")) {
            return conflict(ErrorCodes.DUPLICATE_EMPLOYEE_ID, "employeeId", "An employee with this ID already exists", request);
        }
        if (detail.contains("uk_employees_email")) {
            return conflict(ErrorCodes.DUPLICATE_EMAIL, "email", "An employee with this email address already exists", request);
        }
        if (detail.contains("uk_departments_name")) {
            return conflict(ErrorCodes.DUPLICATE_DEPARTMENT, "name", "A department with this name already exists", request);
        }
        if (detail.contains("fk_employees_department")) {
            return build(HttpStatus.CONFLICT, ErrorCodes.DEPARTMENT_IN_USE,
                    "The department is referenced by existing employees", request, List.of());
        }
        log.warn("Unclassified data integrity violation: {}", detail);
        return build(HttpStatus.CONFLICT, ErrorCodes.CONFLICT,
                "The request conflicts with existing data", request, List.of());
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    ResponseEntity<ErrorResponse> handleMethodNotAllowed(HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        return build(HttpStatus.METHOD_NOT_ALLOWED, ErrorCodes.METHOD_NOT_ALLOWED,
                "Method " + ex.getMethod() + " is not supported for this endpoint", request, List.of());
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    ResponseEntity<ErrorResponse> handleMediaType(HttpServletRequest request) {
        return build(HttpStatus.UNSUPPORTED_MEDIA_TYPE, ErrorCodes.MALFORMED_REQUEST,
                "Content type is not supported; use application/json", request, List.of());
    }

    @ExceptionHandler(BadCredentialsException.class)
    ResponseEntity<ErrorResponse> handleBadCredentials(HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, ErrorCodes.UNAUTHORIZED, "Invalid username or password", request, List.of());
    }

    @ExceptionHandler(AuthenticationException.class)
    ResponseEntity<ErrorResponse> handleAuthentication(HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, ErrorCodes.UNAUTHORIZED, "Authentication is required", request, List.of());
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ErrorResponse> handleAccessDenied(HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, ErrorCodes.FORBIDDEN, "You do not have permission to perform this action", request, List.of());
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ErrorResponse> handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Unhandled error for {} {}", request.getMethod(), request.getRequestURI(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR,
                "An unexpected error occurred. Please try again later.", request, List.of());
    }

    private ResponseEntity<ErrorResponse> conflict(String code, String field, String message, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, code, message, request, List.of(new FieldErrorDetail(field, message)));
    }

    private ResponseEntity<ErrorResponse> build(HttpStatus status, String code, String message,
                                                HttpServletRequest request, List<FieldErrorDetail> fieldErrors) {
        ErrorResponse body = new ErrorResponse(Instant.now(), status.value(), status.getReasonPhrase(),
                code, message, request.getRequestURI(), fieldErrors);
        return ResponseEntity.status(status).body(body);
    }

    private static String fieldName(JsonMappingException ex) {
        return ex.getPath().get(ex.getPath().size() - 1).getFieldName();
    }

    private static String lastSegment(String path) {
        int dot = path.lastIndexOf('.');
        return dot < 0 ? path : path.substring(dot + 1);
    }
}
