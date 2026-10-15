package com.example.employeemanagement.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * A date of joining must not predate {@link JoiningDateValidator#EARLIEST} and may be at most
 * {@link JoiningDateValidator#MAX_DAYS_AHEAD} days in the future (to allow onboarding upcoming hires).
 */
@Documented
@Constraint(validatedBy = JoiningDateValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface ReasonableJoiningDate {

    String message() default "Date of joining must be between 1 Jan 1980 and 90 days from today";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
