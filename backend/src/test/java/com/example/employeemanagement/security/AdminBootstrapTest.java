package com.example.employeemanagement.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.employeemanagement.entity.AppUser;
import com.example.employeemanagement.repository.AppUserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AdminBootstrapTest {

    @Mock
    private AppUserRepository users;

    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);

    @Test
    void createsAdminWithHashedConfiguredPassword() {
        when(users.count()).thenReturn(0L);

        new AdminBootstrap(users, encoder, "admin", "S3cret!pass").run(null);

        ArgumentCaptor<AppUser> saved = ArgumentCaptor.forClass(AppUser.class);
        verify(users).save(saved.capture());
        assertThat(saved.getValue().getUsername()).isEqualTo("admin");
        assertThat(saved.getValue().getPasswordHash()).isNotEqualTo("S3cret!pass");
        assertThat(encoder.matches("S3cret!pass", saved.getValue().getPasswordHash())).isTrue();
    }

    @Test
    void generatesRandomPasswordWhenNoneConfigured() {
        when(users.count()).thenReturn(0L);

        new AdminBootstrap(users, encoder, "admin", "").run(null);

        ArgumentCaptor<AppUser> saved = ArgumentCaptor.forClass(AppUser.class);
        verify(users).save(saved.capture());
        assertThat(saved.getValue().getPasswordHash()).startsWith("$2");
    }

    @Test
    void doesNothingWhenUsersAlreadyExist() {
        when(users.count()).thenReturn(1L);

        new AdminBootstrap(users, encoder, "admin", "x").run(null);

        verify(users, never()).save(any());
    }
}
