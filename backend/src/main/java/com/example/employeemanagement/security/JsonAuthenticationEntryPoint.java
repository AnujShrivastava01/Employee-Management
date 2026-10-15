package com.example.employeemanagement.security;

import com.example.employeemanagement.dto.ErrorResponse;
import com.example.employeemanagement.exception.ErrorCodes;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

/**
 * Answers unauthenticated requests with a JSON 401. It deliberately sends no {@code WWW-Authenticate}
 * header so browsers never pop up (and cache) a native Basic-auth dialog.
 */
@Component
public class JsonAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public JsonAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException ex)
            throws IOException {
        write(response, request, HttpStatus.UNAUTHORIZED, ErrorCodes.UNAUTHORIZED, "Authentication is required");
    }

    void write(HttpServletResponse response, HttpServletRequest request, HttpStatus status, String code, String message)
            throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getOutputStream(), new ErrorResponse(Instant.now(), status.value(),
                status.getReasonPhrase(), code, message, request.getRequestURI(), List.of()));
    }
}
