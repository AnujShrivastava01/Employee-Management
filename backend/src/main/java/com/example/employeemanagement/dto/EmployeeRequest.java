package com.example.employeemanagement.dto;

import com.example.employeemanagement.entity.EmploymentStatus;
import com.example.employeemanagement.validation.ReasonableJoiningDate;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

@Schema(description = "Payload used to create or fully replace an employee")
public record EmployeeRequest(
        @Schema(example = "EMP-1001", description = "Unique business identifier (letters, digits, '-' and '_')")
        @NotBlank(message = "Employee ID is required")
        @Pattern(regexp = "^[A-Za-z0-9][A-Za-z0-9_-]{1,29}$",
                message = "Employee ID must be 2-30 characters: letters, digits, '-' or '_'")
        String employeeId,

        @Schema(example = "Ananya Iyer")
        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 120, message = "Full name must be between 2 and 120 characters")
        String fullName,

        @Schema(example = "ananya.iyer@example.com")
        @NotBlank(message = "Email address is required")
        @Size(max = 254, message = "Email address must be at most 254 characters")
        @Pattern(regexp = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]{2,}$", message = "Enter a valid email address")
        String email,

        @Schema(example = "+91 98765 43210")
        @NotBlank(message = "Phone number is required")
        @Pattern(regexp = "^\\+?[0-9][0-9 ()-]{5,18}[0-9]$",
                message = "Enter a valid phone number (7-20 digits; spaces, '-' and brackets allowed)")
        String phone,

        @Schema(example = "1", description = "Id of an existing department")
        @NotNull(message = "Department is required")
        Long departmentId,

        @Schema(example = "Senior Software Engineer")
        @NotBlank(message = "Designation is required")
        @Size(max = 100, message = "Designation must be at most 100 characters")
        String designation,

        @Schema(example = "2023-06-12", type = "string", format = "date")
        @NotNull(message = "Date of joining is required")
        @ReasonableJoiningDate
        LocalDate dateOfJoining,

        @Schema(example = "1850000.00", description = "Annual salary in INR")
        @NotNull(message = "Salary is required")
        @DecimalMin(value = "0.00", message = "Salary cannot be negative")
        @Digits(integer = 10, fraction = 2, message = "Salary must have at most 10 digits and 2 decimals")
        BigDecimal salary,

        @Schema(example = "ACTIVE")
        @NotNull(message = "Employment status is required")
        EmploymentStatus status) {

    /** Leading/trailing whitespace is never meaningful, so values are trimmed before validation. */
    public EmployeeRequest {
        employeeId = trim(employeeId);
        fullName = trim(fullName);
        email = trim(email);
        phone = trim(phone);
        designation = trim(designation);
    }

    private static String trim(String value) {
        return value == null ? null : value.strip();
    }
}
