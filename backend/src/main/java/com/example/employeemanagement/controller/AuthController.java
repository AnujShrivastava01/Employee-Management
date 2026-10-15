package com.example.employeemanagement.controller;

import com.example.employeemanagement.dto.LoginRequest;
import com.example.employeemanagement.dto.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextHolderStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Session based administrator login used by the web application")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final SecurityContextHolderStrategy contextHolder = SecurityContextHolder.getContextHolderStrategy();

    public AuthController(AuthenticationManager authenticationManager, SecurityContextRepository securityContextRepository) {
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
    }

    @PostMapping("/login")
    @Operation(summary = "Log in", description = "Creates an HttpOnly session cookie. Requires the X-XSRF-TOKEN header.")
    public UserResponse login(@Valid @RequestBody LoginRequest request,
                              HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(request.username(), request.password()));
        } catch (AuthenticationException ex) {
            // Same message for unknown users and wrong passwords so accounts cannot be enumerated.
            throw new BadCredentialsException("Invalid username or password");
        }
        if (httpRequest.getSession(false) != null) {
            httpRequest.changeSessionId(); // prevent session fixation
        }
        SecurityContext context = contextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        contextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);
        return toUser(authentication);
    }

    @GetMapping("/me")
    @Operation(summary = "Current user")
    public UserResponse me(Authentication authentication) {
        return toUser(authentication);
    }

    @GetMapping("/csrf")
    @Operation(summary = "Issue the CSRF cookie", description = "Sets the XSRF-TOKEN cookie needed by the first state changing call.")
    public ResponseEntity<Void> csrf() {
        return ResponseEntity.noContent().build();
    }

    private static UserResponse toUser(Authentication authentication) {
        String role = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst().orElse("ROLE_USER")
                .replaceFirst("^ROLE_", "");
        return new UserResponse(authentication.getName(), role);
    }
}
