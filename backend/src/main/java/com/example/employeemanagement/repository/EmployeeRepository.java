package com.example.employeemanagement.repository;

import com.example.employeemanagement.entity.Employee;
import com.example.employeemanagement.entity.EmploymentStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface EmployeeRepository extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {

    // The department is always rendered with the employee, so fetch it in the same query (no N+1).
    @Override
    @EntityGraph(attributePaths = "department")
    Optional<Employee> findById(Long id);

    @Override
    @EntityGraph(attributePaths = "department")
    Page<Employee> findAll(Specification<Employee> spec, Pageable pageable);

    boolean existsByEmployeeIdIgnoreCase(String employeeId);

    boolean existsByEmployeeIdIgnoreCaseAndIdNot(String employeeId, Long id);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    boolean existsByDepartmentId(Long departmentId);

    long countByStatus(EmploymentStatus status);

    @EntityGraph(attributePaths = "department")
    List<Employee> findTop5ByDateOfJoiningLessThanEqualOrderByDateOfJoiningDescIdDesc(LocalDate today);

    @Query("""
            select new com.example.employeemanagement.repository.DepartmentHeadcount(d.name, count(e))
            from Department d left join Employee e on e.department = d
            group by d.id, d.name
            order by count(e) desc, d.name
            """)
    List<DepartmentHeadcount> countByDepartment();
}
