package com.example.employeemanagement.mapper;

import com.example.employeemanagement.dto.DepartmentSummary;
import com.example.employeemanagement.dto.EmployeeRequest;
import com.example.employeemanagement.dto.EmployeeResponse;
import com.example.employeemanagement.entity.Department;
import com.example.employeemanagement.entity.Employee;
import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class EmployeeMapper {

    /** Canonical form of the business identifier, used both for storage and duplicate checks. */
    public static String normalizeEmployeeId(String employeeId) {
        return employeeId.strip().toUpperCase(Locale.ROOT);
    }

    /** E-mail addresses are stored lower-cased so equality and display are predictable. */
    public static String normalizeEmail(String email) {
        return email.strip().toLowerCase(Locale.ROOT);
    }

    /** Copies the request onto the entity, normalising identifiers. */
    public void apply(Employee employee, EmployeeRequest request, Department department) {
        employee.setEmployeeId(normalizeEmployeeId(request.employeeId()));
        employee.setFullName(request.fullName());
        employee.setEmail(normalizeEmail(request.email()));
        employee.setPhone(request.phone());
        employee.setDepartment(department);
        employee.setDesignation(request.designation());
        employee.setDateOfJoining(request.dateOfJoining());
        employee.setSalary(request.salary());
        employee.setStatus(request.status());
    }

    public EmployeeResponse toResponse(Employee employee) {
        Department department = employee.getDepartment();
        return new EmployeeResponse(
                employee.getId(),
                employee.getEmployeeId(),
                employee.getFullName(),
                employee.getEmail(),
                employee.getPhone(),
                new DepartmentSummary(department.getId(), department.getName()),
                employee.getDesignation(),
                employee.getDateOfJoining(),
                employee.getSalary(),
                employee.getStatus(),
                employee.getCreatedAt(),
                employee.getUpdatedAt());
    }
}
