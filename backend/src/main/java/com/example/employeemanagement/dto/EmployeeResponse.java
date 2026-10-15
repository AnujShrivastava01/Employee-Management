package com.example.employeemanagement.dto;

import com.example.employeemanagement.entity.EmploymentStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record EmployeeResponse(
        Long id,
        String employeeId,
        String fullName,
        String email,
        String phone,
        DepartmentSummary department,
        String designation,
        LocalDate dateOfJoining,
        BigDecimal salary,
        EmploymentStatus status,
        Instant createdAt,
        Instant updatedAt) {
}
