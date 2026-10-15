package com.example.employeemanagement.config;

import com.example.employeemanagement.entity.EmploymentStatus;
import java.time.Clock;
import java.util.Locale;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;

@Configuration
public class AppConfig {

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }

    /** Lets clients write {@code ?status=active} as well as {@code ?status=ACTIVE}. */
    @Bean
    Converter<String, EmploymentStatus> employmentStatusConverter() {
        return source -> EmploymentStatus.valueOf(source.strip().toUpperCase(Locale.ROOT));
    }
}
