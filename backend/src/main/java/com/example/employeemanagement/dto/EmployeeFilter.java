package com.example.employeemanagement.dto;

import com.example.employeemanagement.entity.EmploymentStatus;

/** Optional criteria shared by the employee listing and the CSV export. */
public record EmployeeFilter(String search, String department, EmploymentStatus status) {

    public static EmployeeFilter none() {
        return new EmployeeFilter(null, null, null);
    }
}
