package com.example.employeemanagement.config;

import com.example.employeemanagement.entity.Department;
import com.example.employeemanagement.entity.Employee;
import com.example.employeemanagement.entity.EmploymentStatus;
import com.example.employeemanagement.repository.DepartmentRepository;
import com.example.employeemanagement.repository.EmployeeRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Development / demo only: loads realistic departments and employees into an empty database.
 * Enabled with {@code SEED_DEMO_DATA=true}; never overwrites existing data.
 */
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class DemoDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    private record Seed(String name, String department, String designation, int daysAgo, int annualSalary, boolean active) {
    }

    private static final Map<String, String> DEPARTMENTS = new LinkedHashMap<>();

    static {
        DEPARTMENTS.put("Engineering", "Builds and operates the product platform");
        DEPARTMENTS.put("Product", "Owns roadmap, discovery and delivery");
        DEPARTMENTS.put("Design", "Product, brand and research design");
        DEPARTMENTS.put("Data Science", "Analytics, machine learning and insights");
        DEPARTMENTS.put("Human Resources", "Talent acquisition, people operations and culture");
        DEPARTMENTS.put("Finance", "Accounting, payroll and financial planning");
        DEPARTMENTS.put("Sales & Marketing", "Revenue generation and brand awareness");
        DEPARTMENTS.put("Customer Success", "Onboarding, support and customer outcomes");
        DEPARTMENTS.put("Operations", "IT, facilities and business operations");
    }

    private static final List<Seed> EMPLOYEES = List.of(
            new Seed("Aarav Mehta", "Engineering", "Engineering Manager", 2650, 4200000, true),
            new Seed("Ananya Iyer", "Engineering", "Senior Software Engineer", 1480, 2600000, true),
            new Seed("Rohan Kulkarni", "Engineering", "Backend Engineer", 820, 1750000, true),
            new Seed("Priya Nair", "Engineering", "Frontend Engineer", 540, 1650000, true),
            new Seed("Vikram Singh", "Engineering", "DevOps Engineer", 960, 2100000, true),
            new Seed("Sneha Reddy", "Engineering", "QA Engineer", 410, 1350000, true),
            new Seed("Karthik Subramanian", "Engineering", "Staff Engineer", 2210, 3800000, true),
            new Seed("Meera Joshi", "Engineering", "Software Engineer", 36, 1450000, true),
            new Seed("Arjun Bhatia", "Engineering", "Software Engineer", 1130, 1600000, false),
            new Seed("Divya Menon", "Product", "Product Manager", 690, 2400000, true),
            new Seed("Siddharth Rao", "Product", "Senior Product Manager", 1750, 3300000, true),
            new Seed("Neha Kapoor", "Product", "Product Analyst", 18, 1200000, true),
            new Seed("Ishaan Verma", "Design", "UX Designer", 305, 1500000, true),
            new Seed("Kavya Pillai", "Design", "Lead Product Designer", 1320, 2800000, true),
            new Seed("Rahul Desai", "Design", "Visual Designer", 75, 1250000, true),
            new Seed("Tanvi Shah", "Data Science", "Data Scientist", 620, 2200000, true),
            new Seed("Aditya Choudhury", "Data Science", "ML Engineer", 255, 2500000, true),
            new Seed("Pooja Banerjee", "Data Science", "Data Analyst", 12, 1150000, true),
            new Seed("Nikhil Agarwal", "Data Science", "Head of Data Science", 2480, 4500000, true),
            new Seed("Shreya Gupta", "Human Resources", "HR Business Partner", 890, 1800000, true),
            new Seed("Manish Tiwari", "Human Resources", "Talent Acquisition Lead", 1210, 2000000, true),
            new Seed("Lakshmi Narayanan", "Human Resources", "HR Executive", 150, 780000, true),
            new Seed("Gaurav Malhotra", "Finance", "Finance Controller", 2030, 3600000, true),
            new Seed("Ritika Sharma", "Finance", "Senior Accountant", 770, 1400000, true),
            new Seed("Suresh Babu", "Finance", "Payroll Specialist", 1560, 1050000, true),
            new Seed("Farhan Qureshi", "Sales & Marketing", "Account Executive", 330, 1500000, true),
            new Seed("Deepika Chawla", "Sales & Marketing", "Sales Manager", 1410, 2900000, true),
            new Seed("Amit Saxena", "Sales & Marketing", "Business Development Representative", 48, 900000, true),
            new Seed("Harini Raman", "Sales & Marketing", "Marketing Manager", 980, 2300000, true),
            new Seed("Yash Patel", "Customer Success", "Customer Success Manager", 470, 1700000, true),
            new Seed("Aisha Khan", "Customer Success", "Support Engineer", 205, 1100000, true),
            new Seed("Varun Bhargava", "Customer Success", "Solutions Architect", 1670, 3100000, true),
            new Seed("Pallavi Deshmukh", "Operations", "Operations Manager", 1890, 2700000, true),
            new Seed("Sandeep Naik", "Operations", "IT Administrator", 730, 1300000, true),
            new Seed("Jyoti Mishra", "Operations", "Office Administrator", 95, 720000, true),
            new Seed("Rajesh Kumar", "Operations", "Facilities Coordinator", 2320, 680000, false));

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    private final Clock clock;

    public DemoDataSeeder(DepartmentRepository departmentRepository, EmployeeRepository employeeRepository, Clock clock) {
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
        this.clock = clock;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (employeeRepository.count() > 0 || departmentRepository.count() > 0) {
            log.info("Demo data not loaded: database already contains data");
            return;
        }
        Map<String, Department> departments = new LinkedHashMap<>();
        DEPARTMENTS.forEach((name, description) ->
                departments.put(name, departmentRepository.save(new Department(name, description))));

        LocalDate today = LocalDate.now(clock);
        int sequence = 1001;
        for (Seed seed : EMPLOYEES) {
            Employee employee = new Employee();
            employee.setEmployeeId("EMP-" + sequence);
            employee.setFullName(seed.name());
            employee.setEmail(seed.name().toLowerCase().replace(' ', '.') + "@example.com");
            employee.setPhone(String.format("+91 98%03d %05d", sequence % 1000, 10000 + (sequence * 37) % 89999));
            employee.setDepartment(departments.get(seed.department()));
            employee.setDesignation(seed.designation());
            employee.setDateOfJoining(today.minusDays(seed.daysAgo()));
            employee.setSalary(BigDecimal.valueOf(seed.annualSalary()).setScale(2));
            employee.setStatus(seed.active() ? EmploymentStatus.ACTIVE : EmploymentStatus.INACTIVE);
            employeeRepository.save(employee);
            sequence++;
        }
        log.info("Loaded demo data: {} departments, {} employees", departments.size(), EMPLOYEES.size());
    }
}
