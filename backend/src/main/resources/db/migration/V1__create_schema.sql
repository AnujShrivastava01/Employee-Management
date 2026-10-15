-- Employee Management System: initial schema.
-- Trigram indexes make the case-insensitive "contains" search on name/email fast.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE departments (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_departments_name_not_blank CHECK (length(btrim(name)) > 0)
);

-- Department names are unique regardless of letter case.
CREATE UNIQUE INDEX uk_departments_name ON departments (lower(name));

CREATE TABLE employees (
    id              BIGSERIAL PRIMARY KEY,
    employee_id     VARCHAR(30)    NOT NULL,
    full_name       VARCHAR(120)   NOT NULL,
    email           VARCHAR(254)   NOT NULL,
    phone           VARCHAR(20)    NOT NULL,
    department_id   BIGINT         NOT NULL,
    designation     VARCHAR(100)   NOT NULL,
    date_of_joining DATE           NOT NULL,
    salary          NUMERIC(12, 2) NOT NULL,
    status          VARCHAR(10)    NOT NULL,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_employees_department FOREIGN KEY (department_id) REFERENCES departments (id),
    CONSTRAINT ck_employees_salary_non_negative CHECK (salary >= 0),
    CONSTRAINT ck_employees_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

-- Business identifiers and e-mail addresses are unique regardless of letter case.
CREATE UNIQUE INDEX uk_employees_employee_id ON employees (lower(employee_id));
CREATE UNIQUE INDEX uk_employees_email ON employees (lower(email));

CREATE INDEX idx_employees_department ON employees (department_id);
CREATE INDEX idx_employees_status ON employees (status);
CREATE INDEX idx_employees_date_of_joining ON employees (date_of_joining DESC);
CREATE INDEX idx_employees_full_name_trgm ON employees USING gin (lower(full_name) gin_trgm_ops);
CREATE INDEX idx_employees_email_trgm ON employees USING gin (lower(email) gin_trgm_ops);
