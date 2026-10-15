package com.example.employeemanagement.support;

import com.example.employeemanagement.dto.EmployeeRequest;
import com.example.employeemanagement.entity.Department;
import com.example.employeemanagement.entity.Employee;
import com.example.employeemanagement.entity.EmploymentStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.test.util.ReflectionTestUtils;

/** Builders shared by unit and integration tests. */
public final class TestData {

    private TestData() {
    }

    public static EmployeeRequest request(long departmentId) {
        return new EmployeeRequest("EMP-2001", "Ananya Iyer", "ananya.iyer@example.com", "+91 98765 43210",
                departmentId, "Senior Software Engineer", LocalDate.of(2023, 6, 12),
                new BigDecimal("1850000.00"), EmploymentStatus.ACTIVE);
    }

    public static EmployeeRequest request(String employeeId, String email, long departmentId) {
        EmployeeRequest base = request(departmentId);
        return new EmployeeRequest(employeeId, base.fullName(), email, base.phone(), departmentId,
                base.designation(), base.dateOfJoining(), base.salary(), base.status());
    }

    public static Department department(long id, String name) {
        Department department = new Department(name, null);
        ReflectionTestUtils.setField(department, "id", id);
        return department;
    }

    public static Employee employee(long id, Department department) {
        Employee employee = new Employee();
        ReflectionTestUtils.setField(employee, "id", id);
        employee.setEmployeeId("EMP-2001");
        employee.setFullName("Ananya Iyer");
        employee.setEmail("ananya.iyer@example.com");
        employee.setPhone("+91 98765 43210");
        employee.setDepartment(department);
        employee.setDesignation("Senior Software Engineer");
        employee.setDateOfJoining(LocalDate.of(2023, 6, 12));
        employee.setSalary(new BigDecimal("1850000.00"));
        employee.setStatus(EmploymentStatus.ACTIVE);
        return employee;
    }
}
