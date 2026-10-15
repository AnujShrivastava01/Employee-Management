package com.example.employeemanagement.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.time.LocalDate;
import java.time.ZoneOffset;

public class JoiningDateValidator implements ConstraintValidator<ReasonableJoiningDate, LocalDate> {

    static final LocalDate EARLIEST = LocalDate.of(1980, 1, 1);
    static final long MAX_DAYS_AHEAD = 90;

    @Override
    public boolean isValid(LocalDate value, ConstraintValidatorContext context) {
        if (value == null) {
            return true; // @NotNull reports missing values
        }
        LocalDate latest = LocalDate.now(ZoneOffset.UTC).plusDays(MAX_DAYS_AHEAD);
        return !value.isBefore(EARLIEST) && !value.isAfter(latest);
    }
}
