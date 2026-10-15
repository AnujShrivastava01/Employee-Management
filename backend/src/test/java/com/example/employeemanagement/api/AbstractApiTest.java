package com.example.employeemanagement.api;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

import com.example.employeemanagement.entity.Department;
import com.example.employeemanagement.repository.DepartmentRepository;
import com.example.employeemanagement.repository.EmployeeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/** Full-stack tests: Spring MVC + Security + JPA against a real PostgreSQL schema built by Flyway. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
abstract class AbstractApiTest {

    @Autowired
    protected MockMvc mockMvc;
    @Autowired
    protected ObjectMapper objectMapper;
    @Autowired
    protected EmployeeRepository employeeRepository;
    @Autowired
    protected DepartmentRepository departmentRepository;

    protected Department engineering;
    protected Department design;

    @BeforeEach
    void resetData() {
        employeeRepository.deleteAll();
        departmentRepository.deleteAll();
        engineering = departmentRepository.save(new Department("Engineering", "Builds the product"));
        design = departmentRepository.save(new Department("Design", null));
    }

    /** Authenticated administrator with a valid CSRF token. */
    protected <T extends MockHttpServletRequestBuilder> T asAdmin(T request) {
        request.with(user("it-admin").roles("ADMIN")).with(csrf());
        return request;
    }

    protected String employeeJson(String employeeId, String name, String email, long departmentId, String status) {
        return """
                {"employeeId":"%s","fullName":"%s","email":"%s","phone":"+91 98765 43210","departmentId":%d,
                 "designation":"Engineer","dateOfJoining":"2023-06-12","salary":1850000.50,"status":"%s"}
                """.formatted(employeeId, name, email, departmentId, status);
    }
}
