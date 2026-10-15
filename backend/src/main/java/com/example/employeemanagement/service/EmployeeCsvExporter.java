package com.example.employeemanagement.service;

import com.example.employeemanagement.dto.EmployeeFilter;
import com.example.employeemanagement.dto.EmployeeResponse;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.UncheckedIOException;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class EmployeeCsvExporter {

    static final List<String> HEADERS = List.of(
            "Employee ID", "Full Name", "Email", "Phone", "Department", "Designation",
            "Date of Joining", "Salary (INR)", "Status");

    private static final char BYTE_ORDER_MARK = '﻿';

    private final EmployeeService employeeService;

    public EmployeeCsvExporter(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    /** Streams every matching employee as UTF-8 CSV (with BOM so Excel detects the encoding). */
    public void export(OutputStream target, EmployeeFilter filter, String sortBy, String sortDir) throws IOException {
        // Resolving the sort up-front fails fast with a 400 before any bytes are written.
        EmployeeSort.resolve(sortBy, sortDir);

        Writer writer = new OutputStreamWriter(target, StandardCharsets.UTF_8);
        writer.write(BYTE_ORDER_MARK);
        CsvWriter csv = new CsvWriter(writer);
        csv.writeRow(HEADERS);
        employeeService.forEachMatching(filter, sortBy, sortDir, employee -> {
            try {
                csv.writeRow(toRow(employee));
            } catch (IOException ex) {
                throw new UncheckedIOException(ex);
            }
        });
        writer.flush();
    }

    private static List<String> toRow(EmployeeResponse e) {
        return List.of(
                e.employeeId(),
                e.fullName(),
                e.email(),
                e.phone(),
                e.department().name(),
                e.designation(),
                e.dateOfJoining().toString(),
                e.salary().setScale(2, java.math.RoundingMode.HALF_UP).toPlainString(),
                e.status().name());
    }
}
