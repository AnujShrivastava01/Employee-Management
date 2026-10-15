package com.example.employeemanagement.dto;

import com.example.employeemanagement.repository.DepartmentHeadcount;
import java.util.List;

public record EmployeeStatsResponse(
        long totalEmployees,
        long activeEmployees,
        long inactiveEmployees,
        long totalDepartments,
        List<DepartmentHeadcount> departmentDistribution,
        List<EmployeeResponse> recentlyJoined) {
}
