package com.example.employeemanagement.mapper;

import com.example.employeemanagement.dto.DepartmentResponse;
import com.example.employeemanagement.entity.Department;
import com.example.employeemanagement.repository.DepartmentWithCount;
import org.springframework.stereotype.Component;

@Component
public class DepartmentMapper {

    public DepartmentResponse toResponse(DepartmentWithCount row) {
        return toResponse(row.department(), row.employeeCount());
    }

    public DepartmentResponse toResponse(Department department, long employeeCount) {
        return new DepartmentResponse(
                department.getId(),
                department.getName(),
                department.getDescription(),
                employeeCount,
                department.getCreatedAt(),
                department.getUpdatedAt());
    }
}
