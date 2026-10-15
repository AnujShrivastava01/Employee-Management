package com.example.employeemanagement.service;

import com.example.employeemanagement.exception.InvalidRequestException;
import java.util.Locale;
import java.util.Map;
import org.springframework.data.domain.Sort;

/** Allowlist that maps public sort keys to entity properties, so clients can never sort by arbitrary paths. */
public final class EmployeeSort {

    public static final String DEFAULT_SORT_BY = "fullName";
    public static final String DEFAULT_SORT_DIR = "asc";

    private static final Map<String, String> SORTABLE = Map.of(
            "employeeId", "employeeId",
            "fullName", "fullName",
            "email", "email",
            "department", "department.name",
            "designation", "designation",
            "dateOfJoining", "dateOfJoining",
            "salary", "salary",
            "status", "status",
            "createdAt", "createdAt");

    private EmployeeSort() {
    }

    public static Sort resolve(String sortBy, String sortDir) {
        String key = sortBy == null || sortBy.isBlank() ? DEFAULT_SORT_BY : sortBy.strip();
        String property = SORTABLE.get(key);
        if (property == null) {
            throw new InvalidRequestException("sortBy",
                    "Unsupported sort field '" + key + "'; allowed: " + String.join(", ", SORTABLE.keySet().stream().sorted().toList()));
        }
        String dir = sortDir == null || sortDir.isBlank() ? DEFAULT_SORT_DIR : sortDir.strip().toLowerCase(Locale.ROOT);
        Sort.Direction direction = switch (dir) {
            case "asc" -> Sort.Direction.ASC;
            case "desc" -> Sort.Direction.DESC;
            default -> throw new InvalidRequestException("sortDir", "Sort direction must be 'asc' or 'desc'");
        };
        // The id tiebreaker keeps paging stable when many rows share the sorted value.
        return Sort.by(new Sort.Order(direction, property).ignoreCase(), new Sort.Order(direction, "id"));
    }
}
