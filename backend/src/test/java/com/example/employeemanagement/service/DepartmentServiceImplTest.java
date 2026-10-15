package com.example.employeemanagement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.employeemanagement.dto.DepartmentRequest;
import com.example.employeemanagement.dto.DepartmentResponse;
import com.example.employeemanagement.entity.Department;
import com.example.employeemanagement.exception.ConflictException;
import com.example.employeemanagement.exception.ErrorCodes;
import com.example.employeemanagement.exception.ResourceNotFoundException;
import com.example.employeemanagement.mapper.DepartmentMapper;
import com.example.employeemanagement.repository.DepartmentRepository;
import com.example.employeemanagement.repository.DepartmentWithCount;
import com.example.employeemanagement.repository.EmployeeRepository;
import com.example.employeemanagement.support.TestData;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DepartmentServiceImplTest {

    @Mock
    private DepartmentRepository departmentRepository;
    @Mock
    private EmployeeRepository employeeRepository;

    private DepartmentServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new DepartmentServiceImpl(departmentRepository, employeeRepository, new DepartmentMapper());
    }

    @Test
    void listsDepartmentsWithHeadcount() {
        when(departmentRepository.findAllWithEmployeeCount()).thenReturn(List.of(
                new DepartmentWithCount(TestData.department(1L, "Design"), 3),
                new DepartmentWithCount(TestData.department(2L, "Engineering"), 12)));

        List<DepartmentResponse> result = service.findAll();

        assertThat(result).extracting(DepartmentResponse::name).containsExactly("Design", "Engineering");
        assertThat(result).extracting(DepartmentResponse::employeeCount).containsExactly(3L, 12L);
    }

    @Test
    void createsDepartment() {
        when(departmentRepository.saveAndFlush(any(Department.class))).thenAnswer(inv -> inv.getArgument(0));

        DepartmentResponse created = service.create(new DepartmentRequest("Legal", "Contracts and compliance"));

        assertThat(created.name()).isEqualTo("Legal");
        assertThat(created.employeeCount()).isZero();
    }

    @Test
    void rejectsDuplicateNameOnCreate() {
        when(departmentRepository.existsByNameIgnoreCase("legal")).thenReturn(true);

        assertThatThrownBy(() -> service.create(new DepartmentRequest("legal", null)))
                .isInstanceOfSatisfying(ConflictException.class,
                        ex -> assertThat(ex.getCode()).isEqualTo(ErrorCodes.DUPLICATE_DEPARTMENT));
        verify(departmentRepository, never()).saveAndFlush(any());
    }

    @Test
    void rejectsRenameToAnExistingName() {
        when(departmentRepository.findById(2L)).thenReturn(Optional.of(TestData.department(2L, "Design")));
        when(departmentRepository.existsByNameIgnoreCaseAndIdNot("Engineering", 2L)).thenReturn(true);

        assertThatThrownBy(() -> service.update(2L, new DepartmentRequest("Engineering", null)))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void updateThrowsWhenMissing() {
        when(departmentRepository.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(9L, new DepartmentRequest("X", null)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void refusesToDeleteDepartmentWithEmployees() {
        Department design = TestData.department(2L, "Design");
        when(departmentRepository.findById(2L)).thenReturn(Optional.of(design));
        when(employeeRepository.existsByDepartmentId(2L)).thenReturn(true);

        assertThatThrownBy(() -> service.delete(2L))
                .isInstanceOfSatisfying(ConflictException.class, ex -> {
                    assertThat(ex.getCode()).isEqualTo(ErrorCodes.DEPARTMENT_IN_USE);
                    assertThat(ex.getMessage()).contains("Design");
                });
        verify(departmentRepository, never()).delete(any());
    }

    @Test
    void deletesEmptyDepartment() {
        Department legal = TestData.department(3L, "Legal");
        when(departmentRepository.findById(3L)).thenReturn(Optional.of(legal));
        when(employeeRepository.existsByDepartmentId(3L)).thenReturn(false);

        service.delete(3L);

        verify(departmentRepository).delete(legal);
    }

    @Test
    void deleteThrowsWhenMissing() {
        when(departmentRepository.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(9L)).isInstanceOf(ResourceNotFoundException.class);
    }
}
