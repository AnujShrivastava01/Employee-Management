package com.example.employeemanagement.repository;

import com.example.employeemanagement.entity.Department;

/** Department together with the number of employees assigned to it. */
public record DepartmentWithCount(Department department, long employeeCount) {
}
