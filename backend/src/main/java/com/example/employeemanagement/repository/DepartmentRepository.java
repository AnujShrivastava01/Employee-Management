package com.example.employeemanagement.repository;

import com.example.employeemanagement.entity.Department;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DepartmentRepository extends JpaRepository<Department, Long> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    @Query("""
            select new com.example.employeemanagement.repository.DepartmentWithCount(d, count(e))
            from Department d left join Employee e on e.department = d
            group by d
            order by lower(d.name)
            """)
    List<DepartmentWithCount> findAllWithEmployeeCount();

    @Query("""
            select new com.example.employeemanagement.repository.DepartmentWithCount(d, count(e))
            from Department d left join Employee e on e.department = d
            where d.id = :id
            group by d
            """)
    Optional<DepartmentWithCount> findWithEmployeeCountById(@Param("id") Long id);
}
