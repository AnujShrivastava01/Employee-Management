package com.example.employeemanagement.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Payload used to create or replace a department")
public record DepartmentRequest(
        @Schema(example = "Engineering")
        @NotBlank(message = "Department name is required")
        @Size(max = 100, message = "Department name must be at most 100 characters")
        String name,

        @Schema(example = "Builds and operates the product platform")
        @Size(max = 500, message = "Description must be at most 500 characters")
        String description) {

    public DepartmentRequest {
        name = name == null ? null : name.strip();
        description = description == null || description.isBlank() ? null : description.strip();
    }
}
