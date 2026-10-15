package com.example.employeemanagement.dto;

/** One point of the hiring trend: {@code month} is {@code yyyy-MM}. */
public record HiringTrendPoint(String month, long count) {
}
