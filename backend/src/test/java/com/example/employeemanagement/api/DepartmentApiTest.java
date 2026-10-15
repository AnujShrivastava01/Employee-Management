package com.example.employeemanagement.api;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class DepartmentApiTest extends AbstractApiTest {

    @Test
    void listsDepartmentsAlphabeticallyWithHeadcount() throws Exception {
        mockMvc.perform(asAdmin(post("/api/employees")).contentType(MediaType.APPLICATION_JSON)
                .content(employeeJson("EMP-1", "Ananya Iyer", "a@example.com", engineering.getId(), "ACTIVE")))
                .andExpect(status().isCreated());

        mockMvc.perform(asAdmin(get("/api/departments")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name").value("Design"))
                .andExpect(jsonPath("$[0].employeeCount").value(0))
                .andExpect(jsonPath("$[1].name").value("Engineering"))
                .andExpect(jsonPath("$[1].employeeCount").value(1));
    }

    @Test
    void createUpdateAndDeleteDepartment() throws Exception {
        String location = mockMvc.perform(asAdmin(post("/api/departments")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"  Legal \",\"description\":\"Contracts\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Legal"))
                .andReturn().getResponse().getHeader("Location");

        mockMvc.perform(asAdmin(put(location)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Legal & Compliance\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Legal & Compliance"));

        mockMvc.perform(asAdmin(delete(location))).andExpect(status().isNoContent());
        mockMvc.perform(asAdmin(get(location))).andExpect(status().isNotFound());
    }

    @Test
    void validatesNameAndRejectsDuplicatesIgnoringCase() throws Exception {
        mockMvc.perform(asAdmin(post("/api/departments")).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"  \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("name"));

        mockMvc.perform(asAdmin(post("/api/departments")).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"ENGINEERING\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DUPLICATE_DEPARTMENT"));
    }

    @Test
    void cannotDeleteDepartmentThatStillHasEmployees() throws Exception {
        mockMvc.perform(asAdmin(post("/api/employees")).contentType(MediaType.APPLICATION_JSON)
                .content(employeeJson("EMP-1", "Ananya Iyer", "a@example.com", engineering.getId(), "ACTIVE")))
                .andExpect(status().isCreated());

        mockMvc.perform(asAdmin(delete("/api/departments/{id}", engineering.getId())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DEPARTMENT_IN_USE"));
    }

    @Test
    void missingDepartmentReturns404() throws Exception {
        mockMvc.perform(asAdmin(get("/api/departments/{id}", 31337))).andExpect(status().isNotFound());
        mockMvc.perform(asAdmin(delete("/api/departments/{id}", 31337))).andExpect(status().isNotFound());
    }
}
