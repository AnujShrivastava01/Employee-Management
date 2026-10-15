package com.example.employeemanagement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.employeemanagement.dto.EmployeeFilter;
import com.example.employeemanagement.dto.EmployeeRequest;
import com.example.employeemanagement.dto.EmployeeResponse;
import com.example.employeemanagement.dto.EmployeeStatsResponse;
import com.example.employeemanagement.dto.PageResponse;
import com.example.employeemanagement.entity.Department;
import com.example.employeemanagement.entity.Employee;
import com.example.employeemanagement.entity.EmploymentStatus;
import com.example.employeemanagement.exception.ConflictException;
import com.example.employeemanagement.exception.ErrorCodes;
import com.example.employeemanagement.exception.InvalidRequestException;
import com.example.employeemanagement.exception.ResourceNotFoundException;
import com.example.employeemanagement.mapper.EmployeeMapper;
import com.example.employeemanagement.repository.DepartmentHeadcount;
import com.example.employeemanagement.repository.DepartmentRepository;
import com.example.employeemanagement.repository.EmployeeRepository;
import com.example.employeemanagement.support.TestData;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceImplTest {

    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-10-15T10:00:00Z"), ZoneOffset.UTC);

    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private DepartmentRepository departmentRepository;

    private EmployeeServiceImpl service;
    private Department engineering;

    @BeforeEach
    void setUp() {
        service = new EmployeeServiceImpl(employeeRepository, departmentRepository, new EmployeeMapper(), CLOCK, 2);
        engineering = TestData.department(1L, "Engineering");
    }

    @Nested
    class Create {

        @Test
        void savesEmployeeWithNormalisedIdentifiers() {
            when(departmentRepository.findById(1L)).thenReturn(Optional.of(engineering));
            when(employeeRepository.saveAndFlush(any(Employee.class))).thenAnswer(inv -> inv.getArgument(0));
            EmployeeRequest request = TestData.request("emp-2001", "  Ananya.Iyer@Example.COM ", 1L);

            EmployeeResponse response = service.create(request);

            ArgumentCaptor<Employee> saved = ArgumentCaptor.forClass(Employee.class);
            verify(employeeRepository).saveAndFlush(saved.capture());
            assertThat(saved.getValue().getEmployeeId()).isEqualTo("EMP-2001");
            assertThat(saved.getValue().getEmail()).isEqualTo("ananya.iyer@example.com");
            assertThat(saved.getValue().getDepartment()).isSameAs(engineering);
            assertThat(response.employeeId()).isEqualTo("EMP-2001");
            assertThat(response.department().name()).isEqualTo("Engineering");
            assertThat(response.salary()).isEqualByComparingTo("1850000.00");
        }

        @Test
        void rejectsDuplicateEmployeeId() {
            when(departmentRepository.findById(1L)).thenReturn(Optional.of(engineering));
            when(employeeRepository.existsByEmployeeIdIgnoreCase("EMP-2001")).thenReturn(true);

            assertThatThrownBy(() -> service.create(TestData.request(1L)))
                    .isInstanceOfSatisfying(ConflictException.class, ex -> {
                        assertThat(ex.getCode()).isEqualTo(ErrorCodes.DUPLICATE_EMPLOYEE_ID);
                        assertThat(ex.getFieldErrors()).extracting("field").containsExactly("employeeId");
                    });
            verify(employeeRepository, never()).saveAndFlush(any());
        }

        @Test
        void rejectsDuplicateEmailIgnoringCase() {
            when(departmentRepository.findById(1L)).thenReturn(Optional.of(engineering));
            when(employeeRepository.existsByEmailIgnoreCase("ananya.iyer@example.com")).thenReturn(true);

            assertThatThrownBy(() -> service.create(TestData.request("EMP-2001", "Ananya.Iyer@EXAMPLE.com", 1L)))
                    .isInstanceOfSatisfying(ConflictException.class, ex -> {
                        assertThat(ex.getCode()).isEqualTo(ErrorCodes.DUPLICATE_EMAIL);
                        assertThat(ex.getFieldErrors()).extracting("field").containsExactly("email");
                    });
            verify(employeeRepository, never()).saveAndFlush(any());
        }

        @Test
        void reportsBothFieldsWhenIdAndEmailAreTaken() {
            when(departmentRepository.findById(1L)).thenReturn(Optional.of(engineering));
            when(employeeRepository.existsByEmployeeIdIgnoreCase(any())).thenReturn(true);
            when(employeeRepository.existsByEmailIgnoreCase(any())).thenReturn(true);

            assertThatThrownBy(() -> service.create(TestData.request(1L)))
                    .isInstanceOfSatisfying(ConflictException.class, ex ->
                            assertThat(ex.getFieldErrors()).extracting("field").containsExactly("employeeId", "email"));
        }

        @Test
        void rejectsUnknownDepartment() {
            when(departmentRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.create(TestData.request(99L)))
                    .isInstanceOfSatisfying(InvalidRequestException.class,
                            ex -> assertThat(ex.getField()).isEqualTo("departmentId"));
            verify(employeeRepository, never()).saveAndFlush(any());
        }
    }

    @Nested
    class Read {

        @Test
        void returnsEmployeeWhenFound() {
            when(employeeRepository.findById(7L)).thenReturn(Optional.of(TestData.employee(7L, engineering)));

            EmployeeResponse response = service.getById(7L);

            assertThat(response.id()).isEqualTo(7L);
            assertThat(response.fullName()).isEqualTo("Ananya Iyer");
        }

        @Test
        void throwsWhenMissing() {
            when(employeeRepository.findById(404L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getById(404L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("404");
        }
    }

    @Nested
    class Update {

        @Test
        void replacesFieldsAndChecksDuplicatesExcludingItself() {
            Employee existing = TestData.employee(7L, engineering);
            Department design = TestData.department(2L, "Design");
            when(employeeRepository.findById(7L)).thenReturn(Optional.of(existing));
            when(departmentRepository.findById(2L)).thenReturn(Optional.of(design));
            when(employeeRepository.saveAndFlush(existing)).thenReturn(existing);
            EmployeeRequest request = new EmployeeRequest("EMP-2001", "Ananya R. Iyer", "ananya.iyer@example.com",
                    "+91 98765 43210", 2L, "Design Lead", LocalDate.of(2023, 6, 12),
                    new java.math.BigDecimal("2000000"), EmploymentStatus.INACTIVE);

            EmployeeResponse response = service.update(7L, request);

            verify(employeeRepository).existsByEmployeeIdIgnoreCaseAndIdNot("EMP-2001", 7L);
            verify(employeeRepository).existsByEmailIgnoreCaseAndIdNot("ananya.iyer@example.com", 7L);
            assertThat(response.fullName()).isEqualTo("Ananya R. Iyer");
            assertThat(response.department().name()).isEqualTo("Design");
            assertThat(response.status()).isEqualTo(EmploymentStatus.INACTIVE);
        }

        @Test
        void rejectsEmailBelongingToAnotherEmployee() {
            when(employeeRepository.findById(7L)).thenReturn(Optional.of(TestData.employee(7L, engineering)));
            when(departmentRepository.findById(1L)).thenReturn(Optional.of(engineering));
            when(employeeRepository.existsByEmailIgnoreCaseAndIdNot("ananya.iyer@example.com", 7L)).thenReturn(true);

            assertThatThrownBy(() -> service.update(7L, TestData.request(1L)))
                    .isInstanceOfSatisfying(ConflictException.class,
                            ex -> assertThat(ex.getCode()).isEqualTo(ErrorCodes.DUPLICATE_EMAIL));
            verify(employeeRepository, never()).saveAndFlush(any());
        }

        @Test
        void throwsWhenEmployeeMissing() {
            when(employeeRepository.findById(404L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.update(404L, TestData.request(1L)))
                    .isInstanceOf(ResourceNotFoundException.class);
            verify(employeeRepository, never()).saveAndFlush(any());
        }
    }

    @Nested
    class Delete {

        @Test
        void deletesExistingEmployee() {
            when(employeeRepository.existsById(7L)).thenReturn(true);

            service.delete(7L);

            verify(employeeRepository).deleteById(7L);
        }

        @Test
        void throwsWhenMissing() {
            when(employeeRepository.existsById(404L)).thenReturn(false);

            assertThatThrownBy(() -> service.delete(404L)).isInstanceOf(ResourceNotFoundException.class);
            verify(employeeRepository, never()).deleteById(anyLong());
        }
    }

    @Nested
    class Search {

        @Test
        void buildsPageableFromParametersAndMapsResult() {
            Employee employee = TestData.employee(1L, engineering);
            when(employeeRepository.findAll(anySpec(), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(employee), org.springframework.data.domain.PageRequest.of(2, 5), 11));

            PageResponse<EmployeeResponse> result = service.search(
                    new EmployeeFilter("ana", "Engineering", EmploymentStatus.ACTIVE), 2, 5, "salary", "desc");

            ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
            verify(employeeRepository).findAll(anySpec(), pageable.capture());
            assertThat(pageable.getValue().getPageNumber()).isEqualTo(2);
            assertThat(pageable.getValue().getPageSize()).isEqualTo(5);
            Sort.Order first = pageable.getValue().getSort().iterator().next();
            assertThat(first.getProperty()).isEqualTo("salary");
            assertThat(first.getDirection()).isEqualTo(Sort.Direction.DESC);
            assertThat(result.page()).isEqualTo(2);
            assertThat(result.size()).isEqualTo(5);
            assertThat(result.totalElements()).isEqualTo(11);
            assertThat(result.totalPages()).isEqualTo(3);
            assertThat(result.last()).isTrue();
            assertThat(result.content()).hasSize(1);
        }

        @Test
        void mapsDepartmentSortKeyToJoinedProperty() {
            when(employeeRepository.findAll(anySpec(), any(Pageable.class))).thenReturn(Page.empty());

            service.search(EmployeeFilter.none(), 0, 10, "department", "asc");

            ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
            verify(employeeRepository).findAll(anySpec(), pageable.capture());
            assertThat(pageable.getValue().getSort().iterator().next().getProperty()).isEqualTo("department.name");
        }

        @Test
        void rejectsNegativePage() {
            assertThatThrownBy(() -> service.search(EmployeeFilter.none(), -1, 10, "fullName", "asc"))
                    .isInstanceOfSatisfying(InvalidRequestException.class, ex -> assertThat(ex.getField()).isEqualTo("page"));
        }

        @ParameterizedTest
        @ValueSource(ints = {0, -5, 101, 1000})
        void rejectsOutOfRangePageSize(int size) {
            assertThatThrownBy(() -> service.search(EmployeeFilter.none(), 0, size, "fullName", "asc"))
                    .isInstanceOfSatisfying(InvalidRequestException.class, ex -> assertThat(ex.getField()).isEqualTo("size"));
        }

        @Test
        void rejectsSortFieldOutsideAllowlist() {
            assertThatThrownBy(() -> service.search(EmployeeFilter.none(), 0, 10, "passwordHash", "asc"))
                    .isInstanceOfSatisfying(InvalidRequestException.class, ex -> assertThat(ex.getField()).isEqualTo("sortBy"));
            verify(employeeRepository, never()).findAll(anySpec(), any(Pageable.class));
        }

        @Test
        void rejectsUnknownSortDirection() {
            assertThatThrownBy(() -> service.search(EmployeeFilter.none(), 0, 10, "fullName", "sideways"))
                    .isInstanceOfSatisfying(InvalidRequestException.class, ex -> assertThat(ex.getField()).isEqualTo("sortDir"));
        }
    }

    @Nested
    class Stats {

        @Test
        void aggregatesCountsDistributionAndRecentJoiners() {
            when(employeeRepository.countByStatus(EmploymentStatus.ACTIVE)).thenReturn(30L);
            when(employeeRepository.countByStatus(EmploymentStatus.INACTIVE)).thenReturn(4L);
            when(departmentRepository.count()).thenReturn(9L);
            when(employeeRepository.countByDepartment())
                    .thenReturn(List.of(new DepartmentHeadcount("Engineering", 12), new DepartmentHeadcount("Design", 3)));
            when(employeeRepository.findTop5ByDateOfJoiningLessThanEqualOrderByDateOfJoiningDescIdDesc(LocalDate.of(2026, 10, 15)))
                    .thenReturn(List.of(TestData.employee(1L, engineering)));

            EmployeeStatsResponse stats = service.getStats();

            assertThat(stats.totalEmployees()).isEqualTo(34);
            assertThat(stats.activeEmployees()).isEqualTo(30);
            assertThat(stats.inactiveEmployees()).isEqualTo(4);
            assertThat(stats.totalDepartments()).isEqualTo(9);
            assertThat(stats.departmentDistribution()).extracting(DepartmentHeadcount::department)
                    .containsExactly("Engineering", "Design");
            assertThat(stats.recentlyJoined()).hasSize(1);
        }

        @Test
        void handlesEmptyDatabase() {
            when(employeeRepository.countByDepartment()).thenReturn(List.of());
            when(employeeRepository.findTop5ByDateOfJoiningLessThanEqualOrderByDateOfJoiningDescIdDesc(any()))
                    .thenReturn(List.of());

            EmployeeStatsResponse stats = service.getStats();

            assertThat(stats.totalEmployees()).isZero();
            assertThat(stats.departmentDistribution()).isEmpty();
            assertThat(stats.recentlyJoined()).isEmpty();
        }
    }

    @Nested
    class Export {

        @Test
        void visitsEveryPageUntilExhausted() {
            Employee a = TestData.employee(1L, engineering);
            Employee b = TestData.employee(2L, engineering);
            Employee c = TestData.employee(3L, engineering);
            when(employeeRepository.findAll(anySpec(), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(a, b), org.springframework.data.domain.PageRequest.of(0, 2), 3))
                    .thenReturn(new PageImpl<>(List.of(c), org.springframework.data.domain.PageRequest.of(1, 2), 3));

            List<Long> visited = new ArrayList<>();
            service.forEachMatching(EmployeeFilter.none(), "fullName", "asc", e -> visited.add(e.id()));

            assertThat(visited).containsExactly(1L, 2L, 3L);
            verify(employeeRepository).findAll(anySpec(), eq(org.springframework.data.domain.PageRequest.of(1, 2, EmployeeSort.resolve("fullName", "asc"))));
        }
    }

    private static Specification<Employee> anySpec() {
        return any();
    }
}
