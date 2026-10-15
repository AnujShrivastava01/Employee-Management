package com.example.employeemanagement.repository;

/** Aggregate used by the dashboard: how many employees a department has. */
public record DepartmentHeadcount(String department, long count) {
}
