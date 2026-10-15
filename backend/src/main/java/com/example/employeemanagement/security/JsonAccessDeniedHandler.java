package com.example.employeemanagement.security;

import com.example.employeemanagement.exception.ErrorCodes;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

@Component
public class JsonAccessDeniedHandler implements AccessDeniedHandler {

    private final JsonAuthenticationEntryPoint writer;

    public JsonAccessDeniedHandler(JsonAuthenticationEntryPoint writer) {
        this.writer = writer;
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException ex)
            throws IOException {
        // Covers both authorisation failures and missing/invalid CSRF tokens.
        writer.write(response, request, HttpStatus.FORBIDDEN, ErrorCodes.FORBIDDEN,
                "Request forbidden (missing or invalid CSRF token, or insufficient permissions)");
    }
}
