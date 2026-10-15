package com.example.employeemanagement.dto;

import java.time.Instant;

public record DepartmentResponse(
        Long id,
        String name,
        String description,
        long employeeCount,
        Instant createdAt,
        Instant updatedAt) {
}
