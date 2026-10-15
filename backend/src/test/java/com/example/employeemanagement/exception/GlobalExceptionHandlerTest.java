package com.example.employeemanagement.exception;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.employeemanagement.dto.ErrorResponse;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();
    private final MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/employees");

    private ResponseEntity<ErrorResponse> integrityViolation(String message) {
        return handler.handleDataIntegrity(
                new DataIntegrityViolationException("could not execute statement", new RuntimeException(message)), request);
    }

    @Test
    void mapsDuplicateEmailRaceToConflictOnEmailField() {
        ResponseEntity<ErrorResponse> response =
                integrityViolation("ERROR: duplicate key value violates unique constraint \"uk_employees_email\"");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().code()).isEqualTo(ErrorCodes.DUPLICATE_EMAIL);
        assertThat(response.getBody().fieldErrors()).extracting("field").containsExactly("email");
    }

    @Test
    void mapsDuplicateEmployeeIdRace() {
        ResponseEntity<ErrorResponse> response =
                integrityViolation("duplicate key value violates unique constraint \"uk_employees_employee_id\"");

        assertThat(response.getBody().code()).isEqualTo(ErrorCodes.DUPLICATE_EMPLOYEE_ID);
        assertThat(response.getBody().fieldErrors()).extracting("field").containsExactly("employeeId");
    }

    @Test
    void mapsForeignKeyViolationToDepartmentInUse() {
        ResponseEntity<ErrorResponse> response =
                integrityViolation("update or delete on table \"departments\" violates foreign key constraint \"fk_employees_department\"");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().code()).isEqualTo(ErrorCodes.DEPARTMENT_IN_USE);
    }

    @Test
    void unknownIntegrityViolationDoesNotLeakDatabaseDetails() {
        ResponseEntity<ErrorResponse> response = integrityViolation("some SQL internals: table secret_table");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().message()).doesNotContain("secret_table");
    }

    @Test
    void unexpectedErrorsReturnGenericMessageWithoutStackTrace() {
        ResponseEntity<ErrorResponse> response =
                handler.handleUnexpected(new IllegalStateException("db password is hunter2"), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().message()).doesNotContain("hunter2");
        assertThat(response.getBody().code()).isEqualTo(ErrorCodes.INTERNAL_ERROR);
    }
}
