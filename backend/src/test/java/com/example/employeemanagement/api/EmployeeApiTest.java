package com.example.employeemanagement.api;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.employeemanagement.entity.Employee;
import com.example.employeemanagement.entity.EmploymentStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class EmployeeApiTest extends AbstractApiTest {

    private Employee saveEmployee(String employeeId, String name, String email, com.example.employeemanagement.entity.Department department,
                                  EmploymentStatus status, String salary, LocalDate joined) {
        Employee e = new Employee();
        e.setEmployeeId(employeeId);
        e.setFullName(name);
        e.setEmail(email);
        e.setPhone("+91 98765 43210");
        e.setDepartment(department);
        e.setDesignation("Engineer");
        e.setDateOfJoining(joined);
        e.setSalary(new BigDecimal(salary));
        e.setStatus(status);
        return employeeRepository.save(e);
    }

    // ---------------------------------------------------------------- create

    @Test
    void createReturns201WithLocationAndPersistsNormalisedValues() throws Exception {
        mockMvc.perform(asAdmin(post("/api/employees")).contentType(MediaType.APPLICATION_JSON)
                        .content(employeeJson("emp-1001", "Ananya Iyer", "Ananya.Iyer@Example.com", engineering.getId(), "ACTIVE")))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", startsWith("/api/employees/")))
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.employeeId").value("EMP-1001"))
                .andExpect(jsonPath("$.email").value("ananya.iyer@example.com"))
                .andExpect(jsonPath("$.department.name").value("Engineering"))
                .andExpect(jsonPath("$.salary").value(1850000.5))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.createdAt").exists());

        assertThat(employeeRepository.count()).isEqualTo(1);
    }

    @Test
    void createRejectsInvalidPayloadWithFieldErrors() throws Exception {
        mockMvc.perform(asAdmin(post("/api/employees")).contentType(MediaType.APPLICATION_JSON).content("""
                        {"employeeId":"","fullName":"","email":"not-an-email","phone":"abc","departmentId":null,
                         "designation":"","dateOfJoining":"1970-01-01","salary":-1,"status":"ACTIVE"}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors[?(@.field=='fullName')].message").value("Full name is required"))
                .andExpect(jsonPath("$.fieldErrors[?(@.field=='email')].message").value("Enter a valid email address"))
                .andExpect(jsonPath("$.fieldErrors[?(@.field=='salary')].message").value("Salary cannot be negative"))
                .andExpect(jsonPath("$.fieldErrors[?(@.field=='departmentId')]").exists())
                .andExpect(jsonPath("$.fieldErrors[?(@.field=='dateOfJoining')]").exists());
        assertThat(employeeRepository.count()).isZero();
    }

    @Test
    void createRejectsUnknownDepartmentAndInvalidEnum() throws Exception {
        mockMvc.perform(asAdmin(post("/api/employees")).contentType(MediaType.APPLICATION_JSON)
                        .content(employeeJson("EMP-1", "Ananya Iyer", "a@example.com", 999999, "ACTIVE")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("departmentId"));

        mockMvc.perform(asAdmin(post("/api/employees")).contentType(MediaType.APPLICATION_JSON)
                        .content(employeeJson("EMP-1", "Ananya Iyer", "a@example.com", engineering.getId(), "RETIRED")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("status"))
                .andExpect(jsonPath("$.message", containsString("ACTIVE")));
    }

    @Test
    void createRejectsMalformedJson() throws Exception {
        mockMvc.perform(asAdmin(post("/api/employees")).contentType(MediaType.APPLICATION_JSON).content("{broken"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MALFORMED_REQUEST"))
                .andExpect(content().string(not(containsString("Exception"))));
    }

    @Test
    void duplicateEmployeeIdAndEmailReturn409OnTheOffendingField() throws Exception {
        saveEmployee("EMP-1001", "Ananya Iyer", "ananya.iyer@example.com", engineering, EmploymentStatus.ACTIVE, "100", LocalDate.of(2023, 1, 1));

        mockMvc.perform(asAdmin(post("/api/employees")).contentType(MediaType.APPLICATION_JSON)
                        .content(employeeJson("emp-1001", "Other Person", "other@example.com", engineering.getId(), "ACTIVE")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DUPLICATE_EMPLOYEE_ID"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("employeeId"));

        mockMvc.perform(asAdmin(post("/api/employees")).contentType(MediaType.APPLICATION_JSON)
                        .content(employeeJson("EMP-2002", "Other Person", "ANANYA.IYER@example.com", engineering.getId(), "ACTIVE")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DUPLICATE_EMAIL"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("email"));
        assertThat(employeeRepository.count()).isEqualTo(1);
    }

    // ------------------------------------------------------------- read/update/delete

    @Test
    void getReturnsEmployeeOr404() throws Exception {
        Employee saved = saveEmployee("EMP-1", "Ananya Iyer", "a@example.com", engineering, EmploymentStatus.ACTIVE, "100", LocalDate.of(2023, 1, 1));

        mockMvc.perform(asAdmin(get("/api/employees/{id}", saved.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Ananya Iyer"))
                .andExpect(jsonPath("$.department.id").value(engineering.getId()));

        mockMvc.perform(asAdmin(get("/api/employees/{id}", 987654)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"))
                .andExpect(jsonPath("$.path").value("/api/employees/987654"));
    }

    @Test
    void nonNumericIdIsABadRequest() throws Exception {
        mockMvc.perform(asAdmin(get("/api/employees/abc")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void updateReplacesFieldsAndMovesDepartment() throws Exception {
        Employee saved = saveEmployee("EMP-1", "Ananya Iyer", "a@example.com", engineering, EmploymentStatus.ACTIVE, "100", LocalDate.of(2023, 1, 1));

        mockMvc.perform(asAdmin(put("/api/employees/{id}", saved.getId())).contentType(MediaType.APPLICATION_JSON)
                        .content(employeeJson("EMP-1", "Ananya R. Iyer", "a@example.com", design.getId(), "INACTIVE")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Ananya R. Iyer"))
                .andExpect(jsonPath("$.department.name").value("Design"))
                .andExpect(jsonPath("$.status").value("INACTIVE"));

        Employee reloaded = employeeRepository.findById(saved.getId()).orElseThrow();
        assertThat(reloaded.getStatus()).isEqualTo(EmploymentStatus.INACTIVE);
        assertThat(reloaded.getUpdatedAt()).isAfterOrEqualTo(reloaded.getCreatedAt());
    }

    @Test
    void updateMayKeepItsOwnIdAndEmailButNotTakeAnotherEmployeesEmail() throws Exception {
        Employee first = saveEmployee("EMP-1", "First", "first@example.com", engineering, EmploymentStatus.ACTIVE, "100", LocalDate.of(2023, 1, 1));
        saveEmployee("EMP-2", "Second", "second@example.com", engineering, EmploymentStatus.ACTIVE, "100", LocalDate.of(2023, 1, 1));

        mockMvc.perform(asAdmin(put("/api/employees/{id}", first.getId())).contentType(MediaType.APPLICATION_JSON)
                        .content(employeeJson("EMP-1", "First Renamed", "first@example.com", engineering.getId(), "ACTIVE")))
                .andExpect(status().isOk());

        mockMvc.perform(asAdmin(put("/api/employees/{id}", first.getId())).contentType(MediaType.APPLICATION_JSON)
                        .content(employeeJson("EMP-1", "First", "second@example.com", engineering.getId(), "ACTIVE")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DUPLICATE_EMAIL"));
    }

    @Test
    void updateOfMissingEmployeeReturns404() throws Exception {
        mockMvc.perform(asAdmin(put("/api/employees/{id}", 424242)).contentType(MediaType.APPLICATION_JSON)
                        .content(employeeJson("EMP-1", "Ananya Iyer", "a@example.com", engineering.getId(), "ACTIVE")))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteReturns204ThenEmployeeIsGone() throws Exception {
        Employee saved = saveEmployee("EMP-1", "Ananya Iyer", "a@example.com", engineering, EmploymentStatus.ACTIVE, "100", LocalDate.of(2023, 1, 1));

        mockMvc.perform(asAdmin(delete("/api/employees/{id}", saved.getId()))).andExpect(status().isNoContent());
        mockMvc.perform(asAdmin(get("/api/employees/{id}", saved.getId()))).andExpect(status().isNotFound());
        mockMvc.perform(asAdmin(delete("/api/employees/{id}", saved.getId()))).andExpect(status().isNotFound());
    }

    // ------------------------------------------------------------- list

    private void seedDirectory() {
        for (int i = 1; i <= 25; i++) {
            saveEmployee("EMP-%03d".formatted(i), "Employee %02d".formatted(i), "employee%02d@example.com".formatted(i),
                    i % 5 == 0 ? design : engineering, i % 4 == 0 ? EmploymentStatus.INACTIVE : EmploymentStatus.ACTIVE,
                    String.valueOf(1000 * i), LocalDate.of(2024, 1, 1).plusDays(i));
        }
    }

    @Test
    void listPaginatesWithZeroBasedPages() throws Exception {
        seedDirectory();

        mockMvc.perform(asAdmin(get("/api/employees").param("page", "0").param("size", "10")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(10)))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.totalElements").value(25))
                .andExpect(jsonPath("$.totalPages").value(3))
                .andExpect(jsonPath("$.first").value(true))
                .andExpect(jsonPath("$.last").value(false));

        mockMvc.perform(asAdmin(get("/api/employees").param("page", "2").param("size", "10")))
                .andExpect(jsonPath("$.content", hasSize(5)))
                .andExpect(jsonPath("$.last").value(true));

        mockMvc.perform(asAdmin(get("/api/employees").param("page", "7").param("size", "10")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements").value(25));
    }

    @Test
    void searchMatchesNameOrEmailCaseInsensitively() throws Exception {
        saveEmployee("EMP-1", "Anuj Shrivastava", "anuj@example.com", engineering, EmploymentStatus.ACTIVE, "1", LocalDate.of(2024, 1, 1));
        saveEmployee("EMP-2", "Priya Nair", "priya.nair@example.com", engineering, EmploymentStatus.ACTIVE, "1", LocalDate.of(2024, 1, 1));
        saveEmployee("EMP-3", "Rohan Das", "ANUJ.friend@example.com", design, EmploymentStatus.ACTIVE, "1", LocalDate.of(2024, 1, 1));

        mockMvc.perform(asAdmin(get("/api/employees").param("search", "ANUJ").param("sortBy", "employeeId")))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[*].employeeId", contains("EMP-1", "EMP-3")));

        mockMvc.perform(asAdmin(get("/api/employees").param("search", "nair@example")))
                .andExpect(jsonPath("$.content[*].fullName", contains("Priya Nair")));
    }

    @Test
    void searchTreatsWildcardsLiterally() throws Exception {
        saveEmployee("EMP-1", "Anuj", "anuj@example.com", engineering, EmploymentStatus.ACTIVE, "1", LocalDate.of(2024, 1, 1));

        mockMvc.perform(asAdmin(get("/api/employees").param("search", "%")))
                .andExpect(jsonPath("$.totalElements").value(0));
        mockMvc.perform(asAdmin(get("/api/employees").param("search", "an_j")))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void searchDepartmentAndStatusFiltersCombine() throws Exception {
        seedDirectory();

        // design: i = 5,10,15,20,25 ; inactive: i = 4,8,12,16,20,24 -> design & inactive = {20}
        mockMvc.perform(asAdmin(get("/api/employees").param("department", "design").param("status", "inactive")))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].employeeId").value("EMP-020"));

        mockMvc.perform(asAdmin(get("/api/employees").param("department", "Design").param("status", "ACTIVE")))
                .andExpect(jsonPath("$.totalElements").value(4));

        mockMvc.perform(asAdmin(get("/api/employees").param("department", "Design").param("search", "employee1")
                        .param("status", "ACTIVE").param("size", "50")))
                .andExpect(jsonPath("$.content[*].employeeId", contains("EMP-010", "EMP-015")));
    }

    @Test
    void filtersAndPaginationAgreeOnTotals() throws Exception {
        seedDirectory();

        mockMvc.perform(asAdmin(get("/api/employees").param("status", "INACTIVE").param("size", "4").param("page", "1")))
                .andExpect(jsonPath("$.totalElements").value(6))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.content", hasSize(2)));
    }

    @Test
    void sortingByAllowedFieldsAscendingAndDescending() throws Exception {
        seedDirectory();

        mockMvc.perform(asAdmin(get("/api/employees").param("sortBy", "salary").param("sortDir", "desc").param("size", "3")))
                .andExpect(jsonPath("$.content[*].employeeId", contains("EMP-025", "EMP-024", "EMP-023")));

        mockMvc.perform(asAdmin(get("/api/employees").param("sortBy", "dateOfJoining").param("sortDir", "asc").param("size", "2")))
                .andExpect(jsonPath("$.content[*].employeeId", contains("EMP-001", "EMP-002")));

        mockMvc.perform(asAdmin(get("/api/employees").param("sortBy", "department").param("sortDir", "asc").param("size", "5")))
                .andExpect(jsonPath("$.content[0].department.name").value("Design"));
    }

    @Test
    void rejectsInvalidPagingSortingAndFilterParameters() throws Exception {
        mockMvc.perform(asAdmin(get("/api/employees").param("page", "-1"))).andExpect(status().isBadRequest());
        mockMvc.perform(asAdmin(get("/api/employees").param("size", "0"))).andExpect(status().isBadRequest());
        mockMvc.perform(asAdmin(get("/api/employees").param("size", "101"))).andExpect(status().isBadRequest());
        mockMvc.perform(asAdmin(get("/api/employees").param("page", "abc"))).andExpect(status().isBadRequest());
        mockMvc.perform(asAdmin(get("/api/employees").param("sortBy", "salary; drop table employees")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("sortBy"));
        mockMvc.perform(asAdmin(get("/api/employees").param("sortDir", "up"))).andExpect(status().isBadRequest());
        mockMvc.perform(asAdmin(get("/api/employees").param("status", "RETIRED"))).andExpect(status().isBadRequest());
    }

    @Test
    void emptyDirectoryReturnsEmptyPage() throws Exception {
        mockMvc.perform(asAdmin(get("/api/employees")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.totalPages").value(0));
    }

    // ------------------------------------------------------------- stats

    @Test
    void statsReflectDatabaseContents() throws Exception {
        LocalDate today = LocalDate.now();
        saveEmployee("EMP-1", "Old Hand", "old@example.com", engineering, EmploymentStatus.ACTIVE, "1", today.minusYears(3));
        saveEmployee("EMP-2", "Newcomer", "new@example.com", engineering, EmploymentStatus.ACTIVE, "1", today.minusDays(2));
        saveEmployee("EMP-3", "Left Co", "left@example.com", design, EmploymentStatus.INACTIVE, "1", today.minusYears(1));
        saveEmployee("EMP-4", "Future Joiner", "future@example.com", design, EmploymentStatus.ACTIVE, "1", today.plusDays(20));

        mockMvc.perform(asAdmin(get("/api/employees/stats")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEmployees").value(4))
                .andExpect(jsonPath("$.activeEmployees").value(3))
                .andExpect(jsonPath("$.inactiveEmployees").value(1))
                .andExpect(jsonPath("$.totalDepartments").value(2))
                .andExpect(jsonPath("$.departmentDistribution[?(@.department=='Engineering')].count").value(2))
                .andExpect(jsonPath("$.departmentDistribution[?(@.department=='Design')].count").value(2))
                .andExpect(jsonPath("$.recentlyJoined[0].fullName").value("Newcomer"))
                .andExpect(jsonPath("$.recentlyJoined[*].fullName", not(org.hamcrest.Matchers.hasItem("Future Joiner"))));
    }

    @Test
    void statsIncludeTwelveMonthHiringTrend() throws Exception {
        java.time.YearMonth now = java.time.YearMonth.now();
        saveEmployee("EMP-1", "A", "a@example.com", engineering, EmploymentStatus.ACTIVE, "1", now.atDay(1));
        saveEmployee("EMP-2", "B", "b@example.com", engineering, EmploymentStatus.ACTIVE, "1", now.atDay(1));
        saveEmployee("EMP-3", "C", "c@example.com", design, EmploymentStatus.ACTIVE, "1", now.minusMonths(3).atDay(15));
        saveEmployee("EMP-4", "D", "d@example.com", design, EmploymentStatus.ACTIVE, "1", now.minusMonths(11).atDay(1)); // oldest month shown
        saveEmployee("EMP-5", "E", "e@example.com", design, EmploymentStatus.ACTIVE, "1", now.minusMonths(12).atDay(1)); // outside the window

        mockMvc.perform(asAdmin(get("/api/employees/stats")))
                .andExpect(jsonPath("$.hiringTrend", hasSize(12)))
                .andExpect(jsonPath("$.hiringTrend[0].month").value(now.minusMonths(11).toString()))
                .andExpect(jsonPath("$.hiringTrend[0].count").value(1))
                .andExpect(jsonPath("$.hiringTrend[8].month").value(now.minusMonths(3).toString()))
                .andExpect(jsonPath("$.hiringTrend[8].count").value(1))
                .andExpect(jsonPath("$.hiringTrend[11].month").value(now.toString()))
                .andExpect(jsonPath("$.hiringTrend[11].count").value(2))
                .andExpect(jsonPath("$.hiringTrend[5].count").value(0));
    }

    @Test
    void statsForEmptyDatabaseAreZero() throws Exception {
        mockMvc.perform(asAdmin(get("/api/employees/stats")))
                .andExpect(jsonPath("$.totalEmployees").value(0))
                .andExpect(jsonPath("$.recentlyJoined", hasSize(0)))
                .andExpect(jsonPath("$.departmentDistribution[0].count").value(0));
    }

    // ------------------------------------------------------------- export

    @Test
    void exportReturnsFilteredCsvDownload() throws Exception {
        saveEmployee("EMP-1", "=HYPERLINK(\"x\")", "evil@example.com", engineering, EmploymentStatus.ACTIVE, "1500.5", LocalDate.of(2024, 3, 9));
        saveEmployee("EMP-2", "Plain, Name", "plain@example.com", design, EmploymentStatus.ACTIVE, "2", LocalDate.of(2024, 3, 9));

        String csv = mockMvc.perform(asAdmin(get("/api/employees/export").param("department", "Engineering")))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", startsWith("text/csv")))
                .andExpect(header().string("Content-Disposition", startsWith("attachment; filename=\"employees-")))
                .andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);

        assertThat(csv).contains("Employee ID,Full Name,Email,Phone,Department,Designation,Date of Joining,Salary (INR),Status");
        assertThat(csv).contains("\"'=HYPERLINK(\"\"x\"\")\"").contains("2024-03-09").contains("1500.50");
        assertThat(csv).doesNotContain("Plain, Name");
    }

    @Test
    void exportWithNoMatchesStillReturnsHeader() throws Exception {
        String csv = mockMvc.perform(asAdmin(get("/api/employees/export").param("search", "nobody")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);

        assertThat(csv.trim().split("\r\n")).hasSize(1);
    }

    @Test
    void exportRejectsBadSort() throws Exception {
        mockMvc.perform(asAdmin(get("/api/employees/export").param("sortBy", "hax"))).andExpect(status().isBadRequest());
    }

    // ------------------------------------------------------------- database constraints

    @Test
    void databaseEnforcesUniquenessEvenWhenServiceChecksAreBypassed() {
        saveEmployee("EMP-1", "First", "same@example.com", engineering, EmploymentStatus.ACTIVE, "1", LocalDate.of(2024, 1, 1));

        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
                        saveEmployee("emp-1", "Second", "other@example.com", engineering, EmploymentStatus.ACTIVE, "1", LocalDate.of(2024, 1, 1)))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class)
                .hasMessageContaining("uk_employees_employee_id");
        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
                        saveEmployee("EMP-2", "Third", "SAME@example.com", engineering, EmploymentStatus.ACTIVE, "1", LocalDate.of(2024, 1, 1)))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class)
                .hasMessageContaining("uk_employees_email");
        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
                        saveEmployee("EMP-3", "Fourth", "neg@example.com", engineering, EmploymentStatus.ACTIVE, "-5", LocalDate.of(2024, 1, 1)))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
    }
}
