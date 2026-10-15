package com.example.employeemanagement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.example.employeemanagement.dto.DepartmentSummary;
import com.example.employeemanagement.dto.EmployeeFilter;
import com.example.employeemanagement.dto.EmployeeResponse;
import com.example.employeemanagement.entity.EmploymentStatus;
import com.example.employeemanagement.exception.InvalidRequestException;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.function.Consumer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class EmployeeCsvExporterTest {

    @Mock
    private EmployeeService employeeService;

    private static EmployeeResponse employee(String name, String phone) {
        return new EmployeeResponse(1L, "EMP-1", name, "a@example.com", phone, new DepartmentSummary(1L, "Engineering"),
                "Engineer", LocalDate.of(2024, 1, 31), new BigDecimal("1200000.5"), EmploymentStatus.ACTIVE,
                Instant.now(), Instant.now());
    }

    @Test
    void writesBomHeaderAndFormattedRows() throws Exception {
        doAnswer(inv -> {
            Consumer<EmployeeResponse> consumer = inv.getArgument(3);
            consumer.accept(employee("Iyer, Ananya", "+91 98765 43210"));
            consumer.accept(employee("=cmd|' /C calc'!A0", "98765 43210"));
            return null;
        }).when(employeeService).forEachMatching(any(), any(), any(), any());
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        new EmployeeCsvExporter(employeeService).export(out, EmployeeFilter.none(), "fullName", "asc");

        String csv = out.toString(StandardCharsets.UTF_8);
        assertThat(csv).startsWith("﻿Employee ID,Full Name,Email,Phone,Department,Designation,Date of Joining,Salary (INR),Status\r\n");
        assertThat(csv).contains("EMP-1,\"Iyer, Ananya\",a@example.com,'+91 98765 43210,Engineering,Engineer,2024-01-31,1200000.50,ACTIVE\r\n");
        assertThat(csv).contains("'=cmd|' /C calc'!A0");
    }

    @Test
    void emptyResultStillContainsHeader() throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        new EmployeeCsvExporter(employeeService).export(out, EmployeeFilter.none(), "fullName", "asc");

        assertThat(out.toString(StandardCharsets.UTF_8).split("\r\n")).hasSize(1);
        verify(employeeService).forEachMatching(any(), eq("fullName"), eq("asc"), any());
    }

    @Test
    void invalidSortFailsBeforeAnythingIsWritten() {
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        assertThatThrownBy(() -> new EmployeeCsvExporter(employeeService).export(out, EmployeeFilter.none(), "nope", "asc"))
                .isInstanceOf(InvalidRequestException.class);
        assertThat(out.size()).isZero();
        verify(employeeService, never()).forEachMatching(any(), any(), any(), any());
    }
}
