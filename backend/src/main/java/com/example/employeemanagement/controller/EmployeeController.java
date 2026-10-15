package com.example.employeemanagement.controller;

import com.example.employeemanagement.dto.EmployeeFilter;
import com.example.employeemanagement.dto.EmployeeRequest;
import com.example.employeemanagement.dto.EmployeeResponse;
import com.example.employeemanagement.dto.EmployeeStatsResponse;
import com.example.employeemanagement.dto.ErrorResponse;
import com.example.employeemanagement.dto.PageResponse;
import com.example.employeemanagement.entity.EmploymentStatus;
import com.example.employeemanagement.service.EmployeeCsvExporter;
import com.example.employeemanagement.service.EmployeeService;
import com.example.employeemanagement.service.EmployeeSort;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.io.IOException;
import java.net.URI;
import java.time.LocalDate;
import java.time.ZoneOffset;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/employees")
@Tag(name = "Employees", description = "Employee records, directory search, statistics and export")
public class EmployeeController {

    private static final String CSV_CONTENT_TYPE = "text/csv; charset=UTF-8";

    private final EmployeeService employeeService;
    private final EmployeeCsvExporter csvExporter;

    public EmployeeController(EmployeeService employeeService, EmployeeCsvExporter csvExporter) {
        this.employeeService = employeeService;
        this.csvExporter = csvExporter;
    }

    @PostMapping
    @Operation(summary = "Create an employee")
    @ApiResponse(responseCode = "201", description = "Employee created")
    @ApiResponse(responseCode = "400", description = "Validation failed",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Employee ID or email already exists",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<EmployeeResponse> create(@Valid @RequestBody EmployeeRequest request) {
        EmployeeResponse created = employeeService.create(request);
        return ResponseEntity.created(URI.create("/api/employees/" + created.id())).body(created);
    }

    @GetMapping
    @Operation(summary = "List employees",
            description = "Server-side search, filtering, sorting and zero-based pagination. "
                    + "`search` matches full name, email and employee ID (case-insensitive, partial).")
    public PageResponse<EmployeeResponse> list(
            @Parameter(description = "Zero-based page index") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size (1-100)") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Text to look for in name, email or employee ID") @RequestParam(required = false) String search,
            @Parameter(description = "Exact department name", example = "Engineering") @RequestParam(required = false) String department,
            @Parameter(description = "Employment status") @RequestParam(required = false) EmploymentStatus status,
            @Parameter(description = "One of employeeId, fullName, email, department, designation, dateOfJoining, salary, status, createdAt")
            @RequestParam(defaultValue = EmployeeSort.DEFAULT_SORT_BY) String sortBy,
            @Parameter(description = "asc or desc") @RequestParam(defaultValue = EmployeeSort.DEFAULT_SORT_DIR) String sortDir) {
        return employeeService.search(new EmployeeFilter(search, department, status), page, size, sortBy, sortDir);
    }

    @GetMapping("/stats")
    @Operation(summary = "Dashboard statistics")
    public EmployeeStatsResponse stats() {
        return employeeService.getStats();
    }

    @GetMapping("/export")
    @Operation(summary = "Export employees as CSV",
            description = "Accepts the same filters and sorting as the list endpoint and returns every match (no paging).")
    @ApiResponse(responseCode = "200", description = "CSV file",
            content = @Content(mediaType = "text/csv", schema = @Schema(type = "string")))
    public void export(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) EmploymentStatus status,
            @RequestParam(defaultValue = EmployeeSort.DEFAULT_SORT_BY) String sortBy,
            @RequestParam(defaultValue = EmployeeSort.DEFAULT_SORT_DIR) String sortDir,
            HttpServletResponse response) throws IOException {
        EmployeeSort.resolve(sortBy, sortDir); // reject bad input with a 400 before streaming starts
        response.setContentType(CSV_CONTENT_TYPE);
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"employees-" + LocalDate.now(ZoneOffset.UTC) + ".csv\"");
        csvExporter.export(response.getOutputStream(), new EmployeeFilter(search, department, status), sortBy, sortDir);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get an employee by id")
    @ApiResponse(responseCode = "404", description = "Employee not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public EmployeeResponse get(@PathVariable Long id) {
        return employeeService.getById(id);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an employee", description = "Replaces all editable fields.")
    @ApiResponse(responseCode = "404", description = "Employee not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Employee ID or email already exists",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public EmployeeResponse update(@PathVariable Long id, @Valid @RequestBody EmployeeRequest request) {
        return employeeService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an employee")
    @ApiResponse(responseCode = "204", description = "Employee deleted")
    @ApiResponse(responseCode = "404", description = "Employee not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        employeeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
