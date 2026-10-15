package com.example.employeemanagement.service;

import com.example.employeemanagement.dto.EmployeeFilter;
import com.example.employeemanagement.dto.EmployeeRequest;
import com.example.employeemanagement.dto.EmployeeResponse;
import com.example.employeemanagement.dto.EmployeeStatsResponse;
import com.example.employeemanagement.dto.PageResponse;
import java.util.function.Consumer;

public interface EmployeeService {

    EmployeeResponse create(EmployeeRequest request);

    EmployeeResponse getById(Long id);

    EmployeeResponse update(Long id, EmployeeRequest request);

    void delete(Long id);

    PageResponse<EmployeeResponse> search(EmployeeFilter filter, int page, int size, String sortBy, String sortDir);

    EmployeeStatsResponse getStats();

    /** Visits every employee matching the filter, loading them in bounded batches. */
    void forEachMatching(EmployeeFilter filter, String sortBy, String sortDir, Consumer<EmployeeResponse> consumer);
}
