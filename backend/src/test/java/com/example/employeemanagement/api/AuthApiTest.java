package com.example.employeemanagement.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MvcResult;

/** Exercises the real security filter chain (no mock users): session login, CSRF and Basic auth. */
class AuthApiTest extends AbstractApiTest {

    private static final String LOGIN = "{\"username\":\"it-admin\",\"password\":\"it-password-123\"}";

    @Test
    void protectedEndpointsRejectAnonymousRequestsWithJson401() throws Exception {
        for (String path : new String[] {"/api/employees", "/api/employees/stats", "/api/departments", "/api/employees/export", "/api/auth/me"}) {
            mockMvc.perform(get(path))
                    .andExpect(status().isUnauthorized())
                    .andExpect(header().doesNotExist(HttpHeaders.WWW_AUTHENTICATE))
                    .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
        }
    }

    @Test
    void swaggerAndHealthArePublic() throws Exception {
        mockMvc.perform(get("/v3/api-docs")).andExpect(status().isOk());
        mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }

    @Test
    void sessionLoginFlowWithCsrfToken() throws Exception {
        MvcResult csrfResult = mockMvc.perform(get("/api/auth/csrf")).andExpect(status().isNoContent()).andReturn();
        Cookie xsrf = csrfResult.getResponse().getCookie("XSRF-TOKEN");
        assertThat(xsrf).isNotNull();

        // Login without the CSRF header is refused.
        mockMvc.perform(post("/api/auth/login").cookie(xsrf).contentType(MediaType.APPLICATION_JSON).content(LOGIN))
                .andExpect(status().isForbidden());

        MockHttpSession session = new MockHttpSession();
        mockMvc.perform(post("/api/auth/login").session(session).cookie(xsrf).header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON).content(LOGIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("it-admin"))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(content().string(not(containsString("password"))));

        // The session now authorises reads...
        mockMvc.perform(get("/api/auth/me").session(session)).andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("it-admin"));
        mockMvc.perform(get("/api/employees").session(session)).andExpect(status().isOk());

        // ...but writes still need the CSRF token.
        String body = employeeJson("EMP-1", "Ananya Iyer", "a@example.com", engineering.getId(), "ACTIVE");
        mockMvc.perform(post("/api/employees").session(session).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/employees").session(session).cookie(xsrf).header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());

        // Logout invalidates the session.
        mockMvc.perform(post("/api/auth/logout").session(session).cookie(xsrf).header("X-XSRF-TOKEN", xsrf.getValue()))
                .andExpect(status().is2xxSuccessful());
        mockMvc.perform(get("/api/auth/me").session(session)).andExpect(status().isUnauthorized());
    }

    @Test
    void wrongPasswordAndUnknownUserGetTheSameGenericError() throws Exception {
        Cookie xsrf = mockMvc.perform(get("/api/auth/csrf")).andReturn().getResponse().getCookie("XSRF-TOKEN");

        for (String body : new String[] {
                "{\"username\":\"it-admin\",\"password\":\"wrong\"}",
                "{\"username\":\"ghost\",\"password\":\"wrong\"}"}) {
            mockMvc.perform(post("/api/auth/login").cookie(xsrf).header("X-XSRF-TOKEN", xsrf.getValue())
                            .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("Invalid username or password"));
        }
    }

    @Test
    void basicAuthenticationWorksForScriptedClientsWithoutCsrf() throws Exception {
        String basic = "Basic " + Base64.getEncoder().encodeToString("it-admin:it-password-123".getBytes(StandardCharsets.UTF_8));
        String wrong = "Basic " + Base64.getEncoder().encodeToString("it-admin:nope".getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(get("/api/employees").header(HttpHeaders.AUTHORIZATION, basic)).andExpect(status().isOk());
        mockMvc.perform(post("/api/departments").header(HttpHeaders.AUTHORIZATION, basic)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Legal\"}"))
                .andExpect(status().isCreated());
        mockMvc.perform(get("/api/employees").header(HttpHeaders.AUTHORIZATION, wrong))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist(HttpHeaders.WWW_AUTHENTICATE));
    }

    @Test
    void anonymousWriteWithoutCsrfIsRejected() throws Exception {
        mockMvc.perform(post("/api/departments").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Legal\"}"))
                .andExpect(status().isForbidden());
        assertThat(departmentRepository.count()).isEqualTo(2);
    }
}
