package com.example.employeemanagement.security;

import com.example.employeemanagement.entity.AppUser;
import com.example.employeemanagement.repository.AppUserRepository;
import java.security.SecureRandom;
import java.util.Base64;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates the initial administrator on first start. Credentials come from the environment; when no
 * password is configured a random one is generated and printed once.
 */
@Component
public class AdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String configuredPassword;

    public AdminBootstrap(AppUserRepository users,
                          PasswordEncoder passwordEncoder,
                          @Value("${app.security.admin-username}") String username,
                          @Value("${app.security.admin-password:}") String configuredPassword) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.username = username;
        this.configuredPassword = configuredPassword;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (users.count() > 0) {
            return;
        }
        String password = configuredPassword;
        boolean generated = password == null || password.isBlank();
        if (generated) {
            byte[] random = new byte[18];
            new SecureRandom().nextBytes(random);
            password = Base64.getUrlEncoder().withoutPadding().encodeToString(random);
        }
        users.save(new AppUser(username, passwordEncoder.encode(password), "ADMIN"));
        if (generated) {
            log.warn("Created administrator '{}' with generated password: {} (set ADMIN_PASSWORD to choose your own)",
                    username, password);
        } else {
            log.info("Created administrator '{}' from configured credentials", username);
        }
    }
}
