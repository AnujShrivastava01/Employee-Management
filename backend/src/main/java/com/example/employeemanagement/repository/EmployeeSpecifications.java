package com.example.employeemanagement.repository;

import com.example.employeemanagement.dto.EmployeeFilter;
import com.example.employeemanagement.entity.Employee;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.data.jpa.domain.Specification;

/** Builds the dynamic WHERE clause for the employee directory and export. */
public final class EmployeeSpecifications {

    private static final char ESCAPE = '\\';

    private EmployeeSpecifications() {
    }

    public static Specification<Employee> matching(EmployeeFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (hasText(filter.search())) {
                String pattern = "%" + escapeLike(filter.search().strip().toLowerCase(Locale.ROOT)) + "%";
                predicates.add(cb.or(
                        like(cb.lower(root.get("fullName")), pattern, cb),
                        like(cb.lower(root.get("email")), pattern, cb),
                        like(cb.lower(root.get("employeeId")), pattern, cb)));
            }
            if (hasText(filter.department())) {
                predicates.add(cb.equal(
                        cb.lower(root.get("department").get("name")),
                        filter.department().strip().toLowerCase(Locale.ROOT)));
            }
            if (filter.status() != null) {
                predicates.add(cb.equal(root.get("status"), filter.status()));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private static Predicate like(Expression<String> expression, String pattern,
                                  jakarta.persistence.criteria.CriteriaBuilder cb) {
        return cb.like(expression, pattern, ESCAPE);
    }

    /** Neutralises LIKE wildcards so user input is always matched literally. */
    static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
