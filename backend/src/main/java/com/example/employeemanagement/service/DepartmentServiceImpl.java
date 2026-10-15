package com.example.employeemanagement.service;

import com.example.employeemanagement.dto.DepartmentRequest;
import com.example.employeemanagement.dto.DepartmentResponse;
import com.example.employeemanagement.dto.FieldErrorDetail;
import com.example.employeemanagement.entity.Department;
import com.example.employeemanagement.exception.ConflictException;
import com.example.employeemanagement.exception.ErrorCodes;
import com.example.employeemanagement.exception.ResourceNotFoundException;
import com.example.employeemanagement.mapper.DepartmentMapper;
import com.example.employeemanagement.repository.DepartmentRepository;
import com.example.employeemanagement.repository.EmployeeRepository;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DepartmentServiceImpl implements DepartmentService {

    private static final Logger log = LoggerFactory.getLogger(DepartmentServiceImpl.class);

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    private final DepartmentMapper mapper;

    public DepartmentServiceImpl(DepartmentRepository departmentRepository,
                                 EmployeeRepository employeeRepository,
                                 DepartmentMapper mapper) {
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
        this.mapper = mapper;
    }

    @Override
    public List<DepartmentResponse> findAll() {
        return departmentRepository.findAllWithEmployeeCount().stream().map(mapper::toResponse).toList();
    }

    @Override
    public DepartmentResponse getById(Long id) {
        return departmentRepository.findWithEmployeeCountById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id));
    }

    @Override
    @Transactional
    public DepartmentResponse create(DepartmentRequest request) {
        if (departmentRepository.existsByNameIgnoreCase(request.name())) {
            throw duplicateName(request.name());
        }
        Department saved = departmentRepository.saveAndFlush(new Department(request.name(), request.description()));
        log.info("Created department id={} name={}", saved.getId(), saved.getName());
        return mapper.toResponse(saved, 0);
    }

    @Override
    @Transactional
    public DepartmentResponse update(Long id, DepartmentRequest request) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id));
        if (departmentRepository.existsByNameIgnoreCaseAndIdNot(request.name(), id)) {
            throw duplicateName(request.name());
        }
        department.setName(request.name());
        department.setDescription(request.description());
        Department saved = departmentRepository.saveAndFlush(department);
        return departmentRepository.findWithEmployeeCountById(id)
                .map(mapper::toResponse)
                .orElseGet(() -> mapper.toResponse(saved, 0));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id));
        if (employeeRepository.existsByDepartmentId(id)) {
            throw new ConflictException(ErrorCodes.DEPARTMENT_IN_USE,
                    "Department '" + department.getName() + "' still has employees. Reassign them before deleting it.");
        }
        departmentRepository.delete(department);
        log.info("Deleted department id={} name={}", id, department.getName());
    }

    private static ConflictException duplicateName(String name) {
        String message = "A department named '" + name + "' already exists";
        return new ConflictException(ErrorCodes.DUPLICATE_DEPARTMENT, message,
                List.of(new FieldErrorDetail("name", message)));
    }
}
