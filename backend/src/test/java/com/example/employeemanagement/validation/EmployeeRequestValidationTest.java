package com.example.employeemanagement.validation;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.employeemanagement.dto.EmployeeRequest;
import com.example.employeemanagement.entity.EmploymentStatus;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class EmployeeRequestValidationTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void init() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void close() {
        factory.close();
    }

    private static EmployeeRequest valid() {
        return new EmployeeRequest("EMP-1001", "Ananya Iyer", "ananya.iyer@example.com", "+91 98765 43210", 1L,
                "Engineer", LocalDate.of(2023, 6, 12), new BigDecimal("1850000.00"), EmploymentStatus.ACTIVE);
    }

    private static Set<String> invalidFields(EmployeeRequest request) {
        return validator.validate(request).stream()
                .map(ConstraintViolation::getPropertyPath).map(Object::toString).collect(Collectors.toSet());
    }

    @Test
    void acceptsValidRequest() {
        assertThat(validator.validate(valid())).isEmpty();
    }

    @Test
    void trimsWhitespaceBeforeValidating() {
        EmployeeRequest padded = new EmployeeRequest("  EMP-1001 ", "  Ananya Iyer  ", " a@b.co ", " 98765 43210 ", 1L,
                " Engineer ", LocalDate.of(2023, 6, 12), BigDecimal.TEN, EmploymentStatus.ACTIVE);
        assertThat(padded.fullName()).isEqualTo("Ananya Iyer");
        assertThat(validator.validate(padded)).isEmpty();
    }

    @Test
    void requiresEveryField() {
        EmployeeRequest empty = new EmployeeRequest(null, "   ", null, "", null, null, null, null, null);
        assertThat(invalidFields(empty)).containsExactlyInAnyOrder("employeeId", "fullName", "email", "phone",
                "departmentId", "designation", "dateOfJoining", "salary", "status");
    }

    @ParameterizedTest
    @ValueSource(strings = {"plainaddress", "missing@tld", "two@@example.com", "spaces in@example.com", "@example.com"})
    void rejectsMalformedEmail(String email) {
        EmployeeRequest r = valid();
        assertThat(invalidFields(new EmployeeRequest(r.employeeId(), r.fullName(), email, r.phone(), 1L,
                r.designation(), r.dateOfJoining(), r.salary(), r.status()))).containsExactly("email");
    }

    @ParameterizedTest
    @ValueSource(strings = {"12", "abcdefghij", "+91 98765 4321O", "98765 43210 98765 43210 1"})
    void rejectsMalformedPhone(String phone) {
        EmployeeRequest r = valid();
        assertThat(invalidFields(new EmployeeRequest(r.employeeId(), r.fullName(), r.email(), phone, 1L,
                r.designation(), r.dateOfJoining(), r.salary(), r.status()))).containsExactly("phone");
    }

    @ParameterizedTest
    @ValueSource(strings = {"-1", "-0.01", "10000000000.00", "100.123"})
    void rejectsInvalidSalary(String salary) {
        EmployeeRequest r = valid();
        assertThat(invalidFields(new EmployeeRequest(r.employeeId(), r.fullName(), r.email(), r.phone(), 1L,
                r.designation(), r.dateOfJoining(), new BigDecimal(salary), r.status()))).containsExactly("salary");
    }

    @Test
    void acceptsZeroSalary() {
        EmployeeRequest r = valid();
        assertThat(validator.validate(new EmployeeRequest(r.employeeId(), r.fullName(), r.email(), r.phone(), 1L,
                r.designation(), r.dateOfJoining(), BigDecimal.ZERO, r.status()))).isEmpty();
    }

    @Test
    void joiningDateBoundaries() {
        EmployeeRequest r = valid();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        assertThat(invalidFields(withDate(r, LocalDate.of(1979, 12, 31)))).containsExactly("dateOfJoining");
        assertThat(invalidFields(withDate(r, today.plusDays(91)))).containsExactly("dateOfJoining");
        assertThat(validator.validate(withDate(r, today.plusDays(30)))).isEmpty();
        assertThat(validator.validate(withDate(r, LocalDate.of(1980, 1, 1)))).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"E", "has space", "-leading", "emp/1001", "A234567890123456789012345678901"})
    void rejectsBadEmployeeIds(String employeeId) {
        EmployeeRequest r = valid();
        assertThat(invalidFields(new EmployeeRequest(employeeId, r.fullName(), r.email(), r.phone(), 1L,
                r.designation(), r.dateOfJoining(), r.salary(), r.status()))).containsExactly("employeeId");
    }

    @Test
    void enforcesMaximumLengths() {
        EmployeeRequest r = valid();
        String longText = "x".repeat(121);
        assertThat(invalidFields(new EmployeeRequest(r.employeeId(), longText, r.email(), r.phone(), 1L,
                "d".repeat(101), r.dateOfJoining(), r.salary(), r.status()))).containsExactlyInAnyOrder("fullName", "designation");
    }

    private static EmployeeRequest withDate(EmployeeRequest r, LocalDate date) {
        return new EmployeeRequest(r.employeeId(), r.fullName(), r.email(), r.phone(), 1L, r.designation(), date,
                r.salary(), r.status());
    }
}
