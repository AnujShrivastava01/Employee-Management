package com.example.employeemanagement.repository;

/** Number of employees whose date of joining falls in the given calendar month. */
public record MonthlyHires(int year, int month, long count) {
}
