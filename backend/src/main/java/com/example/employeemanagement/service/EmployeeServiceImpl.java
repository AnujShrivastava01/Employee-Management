package com.example.employeemanagement.service;

import com.example.employeemanagement.dto.EmployeeFilter;
import com.example.employeemanagement.dto.EmployeeRequest;
import com.example.employeemanagement.dto.EmployeeResponse;
import com.example.employeemanagement.dto.EmployeeStatsResponse;
import com.example.employeemanagement.dto.FieldErrorDetail;
import com.example.employeemanagement.dto.PageResponse;
import com.example.employeemanagement.entity.Department;
import com.example.employeemanagement.entity.Employee;
import com.example.employeemanagement.entity.EmploymentStatus;
import com.example.employeemanagement.exception.ConflictException;
import com.example.employeemanagement.exception.ErrorCodes;
import com.example.employeemanagement.exception.InvalidRequestException;
import com.example.employeemanagement.exception.ResourceNotFoundException;
import com.example.employeemanagement.mapper.EmployeeMapper;
import com.example.employeemanagement.repository.DepartmentRepository;
import com.example.employeemanagement.repository.EmployeeRepository;
import com.example.employeemanagement.repository.EmployeeSpecifications;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class EmployeeServiceImpl implements EmployeeService {

    static final int MAX_PAGE_SIZE = 100;

    private static final Logger log = LoggerFactory.getLogger(EmployeeServiceImpl.class);

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeMapper mapper;
    private final Clock clock;
    private final int exportBatchSize;

    public EmployeeServiceImpl(EmployeeRepository employeeRepository,
                               DepartmentRepository departmentRepository,
                               EmployeeMapper mapper,
                               Clock clock,
                               @Value("${app.export.batch-size:500}") int exportBatchSize) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.mapper = mapper;
        this.clock = clock;
        this.exportBatchSize = exportBatchSize;
    }

    @Override
    @Transactional
    public EmployeeResponse create(EmployeeRequest request) {
        Department department = requireDepartment(request.departmentId());
        assertUnique(request, null);

        Employee employee = new Employee();
        mapper.apply(employee, request, department);
        Employee saved = employeeRepository.saveAndFlush(employee);
        log.info("Created employee id={} employeeId={}", saved.getId(), saved.getEmployeeId());
        return mapper.toResponse(saved);
    }

    @Override
    public EmployeeResponse getById(Long id) {
        return mapper.toResponse(findOrThrow(id));
    }

    @Override
    @Transactional
    public EmployeeResponse update(Long id, EmployeeRequest request) {
        Employee employee = findOrThrow(id);
        Department department = requireDepartment(request.departmentId());
        assertUnique(request, id);

        mapper.apply(employee, request, department);
        Employee saved = employeeRepository.saveAndFlush(employee);
        log.info("Updated employee id={} employeeId={}", saved.getId(), saved.getEmployeeId());
        return mapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!employeeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Employee", id);
        }
        employeeRepository.deleteById(id);
        log.info("Deleted employee id={}", id);
    }

    @Override
    public PageResponse<EmployeeResponse> search(EmployeeFilter filter, int page, int size, String sortBy, String sortDir) {
        if (page < 0) {
            throw new InvalidRequestException("page", "Page index must not be negative");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new InvalidRequestException("size", "Page size must be between 1 and " + MAX_PAGE_SIZE);
        }
        Sort sort = EmployeeSort.resolve(sortBy, sortDir);
        Page<Employee> result = employeeRepository.findAll(
                EmployeeSpecifications.matching(filter), PageRequest.of(page, size, sort));
        return PageResponse.from(result, mapper::toResponse);
    }

    @Override
    public EmployeeStatsResponse getStats() {
        long active = employeeRepository.countByStatus(EmploymentStatus.ACTIVE);
        long inactive = employeeRepository.countByStatus(EmploymentStatus.INACTIVE);
        List<EmployeeResponse> recent = employeeRepository
                .findTop5ByDateOfJoiningLessThanEqualOrderByDateOfJoiningDescIdDesc(LocalDate.now(clock))
                .stream()
                .map(mapper::toResponse)
                .toList();
        return new EmployeeStatsResponse(
                active + inactive,
                active,
                inactive,
                departmentRepository.count(),
                employeeRepository.countByDepartment(),
                recent);
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED) // each batch gets its own short transaction
    public void forEachMatching(EmployeeFilter filter, String sortBy, String sortDir, Consumer<EmployeeResponse> consumer) {
        Sort sort = EmployeeSort.resolve(sortBy, sortDir);
        Specification<Employee> spec = EmployeeSpecifications.matching(filter);
        int pageIndex = 0;
        Page<Employee> batch;
        do {
            batch = employeeRepository.findAll(spec, PageRequest.of(pageIndex++, exportBatchSize, sort));
            batch.forEach(employee -> consumer.accept(mapper.toResponse(employee)));
        } while (batch.hasNext());
    }

    private Employee findOrThrow(Long id) {
        return employeeRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Employee", id));
    }

    private Department requireDepartment(Long departmentId) {
        return departmentRepository.findById(departmentId).orElseThrow(
                () -> new InvalidRequestException("departmentId", "Selected department does not exist"));
    }

    /** Rejects duplicate employee ids / e-mails; {@code excludeId} skips the row being updated. */
    private void assertUnique(EmployeeRequest request, Long excludeId) {
        String employeeId = EmployeeMapper.normalizeEmployeeId(request.employeeId());
        String email = EmployeeMapper.normalizeEmail(request.email());
        boolean idTaken = excludeId == null
                ? employeeRepository.existsByEmployeeIdIgnoreCase(employeeId)
                : employeeRepository.existsByEmployeeIdIgnoreCaseAndIdNot(employeeId, excludeId);
        boolean emailTaken = excludeId == null
                ? employeeRepository.existsByEmailIgnoreCase(email)
                : employeeRepository.existsByEmailIgnoreCaseAndIdNot(email, excludeId);

        List<FieldErrorDetail> errors = new ArrayList<>();
        if (idTaken) {
            errors.add(new FieldErrorDetail("employeeId", "Employee ID " + employeeId + " is already in use"));
        }
        if (emailTaken) {
            errors.add(new FieldErrorDetail("email", "Email address " + email + " is already in use"));
        }
        if (errors.isEmpty()) {
            return;
        }
        String code = idTaken ? ErrorCodes.DUPLICATE_EMPLOYEE_ID : ErrorCodes.DUPLICATE_EMAIL;
        String message = idTaken && emailTaken
                ? "Employee ID and email address are already in use"
                : errors.get(0).message();
        throw new ConflictException(code, message, errors);
    }
}
