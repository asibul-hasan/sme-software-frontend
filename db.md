Business Rules Reference (Middleware / Backend)
sys*module
module_code is the unique programmatic key (e.g. HR, INV, ACC) — used by backend for permission resolution
active_status = 1 means the module is visible and accessible; 0 hides it entirely
order_sl controls sidebar render order
A module with is_deleted = 1 must never appear in any menu tree resolution
sys_submodule
Always belongs to exactly one module_no — orphan submodules are invalid
submodule_code is scoped globally unique (e.g. HR-SETUP, HR-PAYROLL)
active_status = 0 on parent module cascades logically to all its submodules in the middleware (no DB cascade — middleware enforces this)
sys_menu
menu_type drives routing behavior: MODULE / SUBMODULE / MENU / FORM / REPORT / ACTION
form_id is the unique form identifier used by permission engine (e.g. HR1001, SYS0001)
level_no mirrors the tree depth: 0 = module, 1 = submodule, 2 = menu, 3 = form/report
Backend permission check order: module active → submodule active → menu active → role permission on form_id
parent_menu_no is nullable — top-level menus have no parent
sys_company
company_no is the universal tenant discriminator — every multi-tenant table carries it
Soft-delete via is_deleted = 1; deleted_by stores user_no from sys_user
active_status = 0 suspends all branches and users under the company (middleware enforces)
sys_branch
A branch must always have a valid company_no
manager_no references hr_employee.employee_no — added as deferred FK post employee table creation
Branch-level access is controlled via sys_user_role.access_branch
sys_role
can*_ flags are default role-level permissions; per-menu overrides live in sys*enroll_module_menu
A user can have multiple roles via sys_user_role; primary_role = 1 determines the default context
sys_user
user_no maps 1-to-1 with hr_employee.employee_no via employee_no FK — user is sourced from employee
Password must be stored as bcrypt/argon2 hash — never plain text
active_status = 0 immediately locks login regardless of role
sys_enroll_module
Defines which modules are licensed/activated per branch with date range enforcement
enrl_st_date and enrl_end_date must be checked by middleware on every request to validate module access
Expired enrollments (enrl_end_date < TODAY) must be treated as inactive even if active_status = 1
sys_enroll_module_menu
Per-menu permission record scoped to an enrolled module
Overrides the role-level can*_ defaults for specific menus
Backend resolves: enroll active → menu visible → role permission → enroll_menu permission (most restrictive wins)
hr_department
parent_department_no is self-referencing — build tree with recursive CTE in backend
department_head_no FK to hr_employee is DEFERRABLE to break circular dependency with employee table
hierarchy_level is application-managed (not DB-computed) — middleware sets it on insert based on parent chain depth
Unique constraint is scoped per company_no — same dept name allowed across companies
hr_designation
Always scoped to a department_no — a designation without a department is invalid
min_salary / max_salary enforced by DB CHECK; middleware should also validate before insert
job_category and grade_level map to lookup tables (to be defined in sys_lookup)
hr_employee
Master entity — employee_no is referenced by sys_user.employee_no, hr_department.department_head_no, sys_branch.manager_no
reporting_to is self-referencing org hierarchy — resolve with recursive CTE
At least one of nid_number or passport_number must be non-null (DB CHECK enforced)
active_status = 0 must trigger sys_user.active_status = 0 in middleware (no DB cascade)
basic_salary >= 0 and gross_salary >= basic_salary enforced at DB and middleware levels

-- ============================================================================
-- DROP (dependency order — children first)
-- ============================================================================
DROP TABLE IF EXISTS sys_enroll_module_menu CASCADE;
DROP TABLE IF EXISTS sys_enroll_module CASCADE;
DROP TABLE IF EXISTS sys_user_role CASCADE;
DROP TABLE IF EXISTS sys_user CASCADE;
DROP TABLE IF EXISTS sys_menu CASCADE;
DROP TABLE IF EXISTS sys_submodule CASCADE;
DROP TABLE IF EXISTS sys_module CASCADE;
DROP TABLE IF EXISTS sys_role CASCADE;
DROP TABLE IF EXISTS hr_employee CASCADE;
DROP TABLE IF EXISTS hr_designation CASCADE;
DROP TABLE IF EXISTS hr_department CASCADE;
DROP TABLE IF EXISTS sys_branch CASCADE;
DROP TABLE IF EXISTS sys_company CASCADE;

-- ============================================================================
-- SYS_COMPANY
-- ============================================================================
CREATE TABLE sys_company (

---

-- Primary Key

---

company_no BIGSERIAL PRIMARY KEY,

    -- -------------------------------------------------------------------------
    -- Identity
    -- -------------------------------------------------------------------------
    company_id              VARCHAR(50)         NOT NULL UNIQUE,
    company_name            VARCHAR(200)        NOT NULL,
    company_name_nls         VARCHAR(200),
    short_name              VARCHAR(50),
    company_type            VARCHAR(50),

    -- -------------------------------------------------------------------------
    -- Legal & Tax Registration
    -- -------------------------------------------------------------------------
    trade_license_no        VARCHAR(100),
    vat_reg_no              VARCHAR(100),
    tin_no                  VARCHAR(100),
    bin_no                  VARCHAR(100),
    reg_no                  VARCHAR(100),

    -- -------------------------------------------------------------------------
    -- Address
    -- -------------------------------------------------------------------------
    address1                TEXT,
    address2                TEXT,
    city                    VARCHAR(100),
    state_province          VARCHAR(100),
    post_code               VARCHAR(20),
    country                 VARCHAR(100),

    -- -------------------------------------------------------------------------
    -- Contact
    -- -------------------------------------------------------------------------
    mobile_number           VARCHAR(30),
    phone_number            VARCHAR(30),
    email                   VARCHAR(150),
    website                 VARCHAR(200),
    logo_path               TEXT,

    -- -------------------------------------------------------------------------
    -- Status & Config
    -- -------------------------------------------------------------------------
    active_status           SMALLINT            NOT NULL,
    -- 1 = Active | 0 = Inactive
    remarks                 TEXT,
    description             TEXT,
    display_sl              INTEGER,

    -- -------------------------------------------------------------------------
    -- Audit
    -- -------------------------------------------------------------------------
    created_by              BIGINT              NOT NULL,
    created_at              TIMESTAMPTZ         NOT NULL,
    updated_by              BIGINT,
    updated_at              TIMESTAMPTZ,

    is_deleted              SMALLINT            NOT NULL,
    -- 0 = Live | 1 = Deleted
    deleted_by              BIGINT,
    deleted_at              TIMESTAMPTZ,
    row_version             BIGINT,

    -- -------------------------------------------------------------------------
    -- Constraints
    -- -------------------------------------------------------------------------
    CONSTRAINT chk_company_active_status
        CHECK (active_status IN (0, 1)),

    CONSTRAINT chk_company_is_deleted
        CHECK (is_deleted IN (0, 1))

);

-- ============================================================================
-- SYS_BRANCH
-- ============================================================================
CREATE TABLE sys_branch (

---

-- Primary Key

---

branch_no BIGSERIAL PRIMARY KEY,

    -- -------------------------------------------------------------------------
    -- Identity
    -- -------------------------------------------------------------------------
    branch_id               VARCHAR(50)         NOT NULL,
    branch_name             VARCHAR(200)        NOT NULL,
    branch_name_nls          VARCHAR(200),
    branch_type             VARCHAR(50),

    -- -------------------------------------------------------------------------
    -- Address
    -- -------------------------------------------------------------------------
    address1                TEXT,
    address2                TEXT,
    city                    VARCHAR(100),
    state_province          VARCHAR(100),
    post_code               VARCHAR(20),

    -- -------------------------------------------------------------------------
    -- Contact
    -- -------------------------------------------------------------------------
    mobile_number           VARCHAR(30),
    phone_number            VARCHAR(30),
    email                   VARCHAR(150),

    -- -------------------------------------------------------------------------
    -- Hierarchy — manager_no FK added post hr_employee creation (DEFERRABLE)
    -- -------------------------------------------------------------------------
    manager_no              BIGINT,

    -- -------------------------------------------------------------------------
    -- Tenant Scoping
    -- -------------------------------------------------------------------------
    company_no              BIGINT              NOT NULL,

    -- -------------------------------------------------------------------------
    -- Status & Config
    -- -------------------------------------------------------------------------
    active_status           SMALLINT            NOT NULL,
    display_sl              INTEGER,
    remarks                 TEXT,
    description             TEXT,

    -- -------------------------------------------------------------------------
    -- Audit
    -- -------------------------------------------------------------------------
    created_by              BIGINT              NOT NULL,
    created_at              TIMESTAMPTZ         NOT NULL,
    updated_by              BIGINT,
    updated_at              TIMESTAMPTZ,

    is_deleted              SMALLINT            NOT NULL,
    deleted_by              BIGINT,
    deleted_at              TIMESTAMPTZ,
    row_version             BIGINT,

    -- -------------------------------------------------------------------------
    -- Constraints
    -- -------------------------------------------------------------------------
    CONSTRAINT uq_branch_id_company
        UNIQUE (branch_id, company_no),

    CONSTRAINT uq_branch_name_company
        UNIQUE (branch_name, company_no),

    CONSTRAINT chk_branch_active_status
        CHECK (active_status IN (0, 1)),

    CONSTRAINT chk_branch_is_deleted
        CHECK (is_deleted IN (0, 1)),

    CONSTRAINT fk_branch_company
        FOREIGN KEY (company_no)
        REFERENCES sys_company(company_no)
        ON DELETE RESTRICT

);

-- ============================================================================
-- SYS_MODULE
-- ============================================================================
CREATE TABLE sys_module (

---

-- Primary Key

---

module_no BIGSERIAL PRIMARY KEY,

    -- -------------------------------------------------------------------------
    -- Identity
    -- -------------------------------------------------------------------------
    module_code             VARCHAR(20)         NOT NULL UNIQUE,
    -- e.g. HR, INV, ACC, SYS
    module_name             VARCHAR(200)        NOT NULL,
    module_name_nls          VARCHAR(200),

    -- -------------------------------------------------------------------------
    -- UI Navigation
    -- -------------------------------------------------------------------------
    module_icon             VARCHAR(100),
    module_route            VARCHAR(200),
    order_sl                INTEGER,

    -- -------------------------------------------------------------------------
    -- Meta
    -- -------------------------------------------------------------------------
    description             TEXT,
    remarks                 TEXT,

    -- -------------------------------------------------------------------------
    -- Status
    -- -------------------------------------------------------------------------
    active_status           SMALLINT            NOT NULL,
    -- 1 = Active | 0 = Inactive

    -- -------------------------------------------------------------------------
    -- Audit
    -- -------------------------------------------------------------------------
    created_by              BIGINT              NOT NULL,
    created_at              TIMESTAMPTZ         NOT NULL,
    updated_by              BIGINT,
    updated_at              TIMESTAMPTZ,

    is_deleted              SMALLINT            NOT NULL,
    deleted_by              BIGINT,
    deleted_at              TIMESTAMPTZ,
    row_version             BIGINT,

    -- -------------------------------------------------------------------------
    -- Constraints
    -- -------------------------------------------------------------------------
    CONSTRAINT chk_module_active_status
        CHECK (active_status IN (0, 1)),

    CONSTRAINT chk_module_is_deleted
        CHECK (is_deleted IN (0, 1))

);

-- ============================================================================
-- SYS_SUBMODULE
-- ============================================================================
CREATE TABLE sys_submodule (

---

-- Primary Key

---

submodule_no BIGSERIAL PRIMARY KEY,

    -- -------------------------------------------------------------------------
    -- Parent
    -- -------------------------------------------------------------------------
    module_no               BIGINT              NOT NULL,

    -- -------------------------------------------------------------------------
    -- Identity
    -- -------------------------------------------------------------------------
    submodule_code          VARCHAR(30)         NOT NULL UNIQUE,
    -- e.g. HR-SETUP, HR-PAYROLL, INV-PURCHASE
    submodule_name          VARCHAR(200)        NOT NULL,
    submodule_name_nls       VARCHAR(200),

    -- -------------------------------------------------------------------------
    -- UI Navigation
    -- -------------------------------------------------------------------------
    submodule_icon          VARCHAR(100),
    submodule_route         VARCHAR(200),
    order_sl                INTEGER,

    -- -------------------------------------------------------------------------
    -- Meta
    -- -------------------------------------------------------------------------
    description             TEXT,
    remarks                 TEXT,

    -- -------------------------------------------------------------------------
    -- Status
    -- -------------------------------------------------------------------------
    active_status           SMALLINT            NOT NULL,

    -- -------------------------------------------------------------------------
    -- Audit
    -- -------------------------------------------------------------------------
    created_by              BIGINT              NOT NULL,
    created_at              TIMESTAMPTZ         NOT NULL,
    updated_by              BIGINT,
    updated_at              TIMESTAMPTZ,

    is_deleted              SMALLINT            NOT NULL,
    deleted_by              BIGINT,
    deleted_at              TIMESTAMPTZ,
    row_version             BIGINT,

    -- -------------------------------------------------------------------------
    -- Constraints
    -- -------------------------------------------------------------------------
    CONSTRAINT chk_submodule_active_status
        CHECK (active_status IN (0, 1)),

    CONSTRAINT chk_submodule_is_deleted
        CHECK (is_deleted IN (0, 1)),

    CONSTRAINT fk_submodule_module
        FOREIGN KEY (module_no)
        REFERENCES sys_module(module_no)
        ON DELETE RESTRICT

);

-- ============================================================================
-- SYS_MENU
-- ============================================================================
CREATE TABLE sys_menu (

---

-- Primary Key

---

menu_no BIGSERIAL PRIMARY KEY,

    -- -------------------------------------------------------------------------
    -- Tree Parents
    -- -------------------------------------------------------------------------
    module_no               BIGINT              NOT NULL,
    submodule_no            BIGINT,
    parent_menu_no          BIGINT,

    -- -------------------------------------------------------------------------
    -- Classification
    -- -------------------------------------------------------------------------
    menu_type               VARCHAR(30)         NOT NULL,
    -- MODULE | SUBMODULE | MENU | FORM | REPORT | ACTION
    level_no                SMALLINT,
    -- 0=Module 1=Submodule 2=Menu 3=Form/Report

    -- -------------------------------------------------------------------------
    -- Identity
    -- -------------------------------------------------------------------------
    menu_code               VARCHAR(50)         NOT NULL UNIQUE,
    menu_name               VARCHAR(200)        NOT NULL,
    menu_name_nls            VARCHAR(200),

    -- -------------------------------------------------------------------------
    -- Form Binding (for FORM type entries)
    -- -------------------------------------------------------------------------
    form_id                 VARCHAR(100)        UNIQUE,
    -- e.g. HR1001, SYS0001 — used by permission engine
    form_name               VARCHAR(200),

    -- -------------------------------------------------------------------------
    -- Angular Routing & Component
    -- -------------------------------------------------------------------------
    route_path              VARCHAR(300),
    component_name          VARCHAR(200),
    icon_name               VARCHAR(100),

    -- -------------------------------------------------------------------------
    -- Render Control Flags
    -- -------------------------------------------------------------------------
    is_sidebar              SMALLINT,
    -- 1=Show in nav | 0=Route only (no nav item)
    is_route                SMALLINT,
    -- 1=Has Angular route | 0=Label/group only
    is_visible              SMALLINT,
    -- 1=Visible after permission check | 0=Hidden

    -- -------------------------------------------------------------------------
    -- Ordering & Meta
    -- -------------------------------------------------------------------------
    order_sl                INTEGER,
    menu_desc               TEXT,
    remarks                 TEXT,

    -- -------------------------------------------------------------------------
    -- Status
    -- -------------------------------------------------------------------------
    active_status           SMALLINT            NOT NULL,

    -- -------------------------------------------------------------------------
    -- Audit
    -- -------------------------------------------------------------------------
    created_by              BIGINT              NOT NULL,
    created_at              TIMESTAMPTZ         NOT NULL,
    updated_by              BIGINT,
    updated_at              TIMESTAMPTZ,

    is_deleted              SMALLINT            NOT NULL,
    deleted_by              BIGINT,
    deleted_at              TIMESTAMPTZ,
    row_version             BIGINT,

    -- -------------------------------------------------------------------------
    -- Constraints
    -- -------------------------------------------------------------------------

    CONSTRAINT chk_menu_active_status
        CHECK (active_status IN (0, 1)),

    CONSTRAINT chk_menu_is_sidebar
        CHECK (is_sidebar IN (0, 1)),

    CONSTRAINT chk_menu_is_route
        CHECK (is_route IN (0, 1)),

    CONSTRAINT chk_menu_is_visible
        CHECK (is_visible IN (0, 1)),

    CONSTRAINT chk_menu_is_deleted
        CHECK (is_deleted IN (0, 1)),

    CONSTRAINT fk_menu_module
        FOREIGN KEY (module_no)
        REFERENCES sys_module(module_no)
        ON DELETE RESTRICT,

    CONSTRAINT fk_menu_submodule
        FOREIGN KEY (submodule_no)
        REFERENCES sys_submodule(submodule_no)
        ON DELETE RESTRICT,

    CONSTRAINT fk_menu_parent
        FOREIGN KEY (parent_menu_no)
        REFERENCES sys_menu(menu_no)
        ON DELETE RESTRICT

);

-- ============================================================================
-- SYS_ROLE
-- ============================================================================
CREATE TABLE sys_role (

---

-- Primary Key

---

role_no BIGSERIAL PRIMARY KEY,

    -- -------------------------------------------------------------------------
    -- Identity
    -- -------------------------------------------------------------------------
    role_id                 VARCHAR(50)         NOT NULL UNIQUE,
    role_name               VARCHAR(150)        NOT NULL,
    role_desc               TEXT,

    -- -------------------------------------------------------------------------
    -- Default Permission Flags
    -- -------------------------------------------------------------------------
    can_insert              SMALLINT,
    can_update              SMALLINT,
    can_view                SMALLINT,
    can_delete              SMALLINT,
    -- 1 = Allowed | 0 = Denied

    -- -------------------------------------------------------------------------
    -- Tenant Scoping
    -- -------------------------------------------------------------------------
    company_no              BIGINT              NOT NULL,
    branch_no               BIGINT              NOT NULL,

    -- -------------------------------------------------------------------------
    -- Status
    -- -------------------------------------------------------------------------
    active_status           SMALLINT            NOT NULL,
    display_sl              INTEGER,
    remarks                 TEXT,

    -- -------------------------------------------------------------------------
    -- Audit
    -- -------------------------------------------------------------------------
    created_by              BIGINT              NOT NULL,
    created_at              TIMESTAMPTZ         NOT NULL,
    updated_by              BIGINT,
    updated_at              TIMESTAMPTZ,

    is_deleted              SMALLINT            NOT NULL,
    deleted_by              BIGINT,
    deleted_at              TIMESTAMPTZ,
    row_version             BIGINT,

    -- -------------------------------------------------------------------------
    -- Constraints
    -- -------------------------------------------------------------------------
    CONSTRAINT uq_role_id_company
        UNIQUE (role_id, company_no),

    CONSTRAINT chk_role_active_status
        CHECK (active_status IN (0, 1)),

    CONSTRAINT chk_role_is_deleted
        CHECK (is_deleted IN (0, 1)),

    CONSTRAINT chk_role_can_insert  CHECK (can_insert  IN (0, 1)),
    CONSTRAINT chk_role_can_update  CHECK (can_update  IN (0, 1)),
    CONSTRAINT chk_role_can_view    CHECK (can_view    IN (0, 1)),
    CONSTRAINT chk_role_can_delete  CHECK (can_delete  IN (0, 1)),

    CONSTRAINT fk_role_company
        FOREIGN KEY (company_no)
        REFERENCES sys_company(company_no)
        ON DELETE RESTRICT,

    CONSTRAINT fk_role_branch
        FOREIGN KEY (branch_no)
        REFERENCES sys_branch(branch_no)
        ON DELETE RESTRICT

);

-- ============================================================================
-- HR_DEPARTMENT (before hr_employee — circular FK resolved via ALTER TABLE)
-- ============================================================================
CREATE TABLE hr_department (

---

-- Primary Key

---

department_no BIGSERIAL PRIMARY KEY,

    -- -------------------------------------------------------------------------
    -- Identity
    -- -------------------------------------------------------------------------
    department_id           VARCHAR(20)         NOT NULL,
    department_name         VARCHAR(150)        NOT NULL,
    short_name              VARCHAR(50),

    -- -------------------------------------------------------------------------
    -- Hierarchy
    -- -------------------------------------------------------------------------
    parent_department_no    BIGINT,
    department_head_no      BIGINT,
    -- FK to hr_employee added after hr_employee via ALTER TABLE (DEFERRABLE)
    hierarchy_level         SMALLINT,

    -- -------------------------------------------------------------------------
    -- Accounting Link
    -- -------------------------------------------------------------------------
    cost_center_no          BIGINT,

    -- -------------------------------------------------------------------------
    -- Tenant Scoping
    -- -------------------------------------------------------------------------
    company_no              BIGINT              NOT NULL,
    branch_no               BIGINT,

    -- -------------------------------------------------------------------------
    -- Status & Config
    -- -------------------------------------------------------------------------
    active_status           SMALLINT            NOT NULL,
    display_sl              INTEGER,
    remarks                 TEXT,
    description             TEXT,

    -- -------------------------------------------------------------------------
    -- Audit
    -- -------------------------------------------------------------------------
    created_by              BIGINT              NOT NULL,
    created_at              TIMESTAMPTZ         NOT NULL,
    updated_by              BIGINT,
    updated_at              TIMESTAMPTZ,

    is_deleted              SMALLINT            NOT NULL,
    deleted_by              BIGINT,
    deleted_at              TIMESTAMPTZ,
    row_version             BIGINT,

    -- -------------------------------------------------------------------------
    -- Constraints
    -- -------------------------------------------------------------------------
    CONSTRAINT uq_department_id_company
        UNIQUE (department_id, company_no),

    CONSTRAINT uq_department_name_company
        UNIQUE (department_name, company_no),

    CONSTRAINT chk_department_active_status
        CHECK (active_status IN (0, 1)),

    CONSTRAINT chk_department_is_deleted
        CHECK (is_deleted IN (0, 1)),

    CONSTRAINT fk_department_parent
        FOREIGN KEY (parent_department_no)
        REFERENCES hr_department(department_no)
        ON DELETE RESTRICT,

    CONSTRAINT fk_department_company
        FOREIGN KEY (company_no)
        REFERENCES sys_company(company_no)
        ON DELETE RESTRICT,

    CONSTRAINT fk_department_branch
        FOREIGN KEY (branch_no)
        REFERENCES sys_branch(branch_no)
        ON DELETE RESTRICT

);

-- ============================================================================
-- HR_DESIGNATION
-- ============================================================================
CREATE TABLE hr_designation (

---

-- Primary Key

---

designation_no BIGSERIAL PRIMARY KEY,

    -- -------------------------------------------------------------------------
    -- Identity
    -- -------------------------------------------------------------------------
    designation_id          VARCHAR(20)         NOT NULL,
    designation_name        VARCHAR(150)        NOT NULL,
    short_name              VARCHAR(50),

    -- -------------------------------------------------------------------------
    -- Structural Mapping
    -- -------------------------------------------------------------------------
    department_no           BIGINT              NOT NULL,
    job_category            SMALLINT,
    grade_level             VARCHAR(20),
    hierarchy_rank          INTEGER,

    -- -------------------------------------------------------------------------
    -- Compensation Guardrails
    -- -------------------------------------------------------------------------
    min_salary              NUMERIC(15,2),
    max_salary              NUMERIC(15,2),
    overtime_eligible       SMALLINT,
    -- 1 = Eligible | 0 = Not eligible

    -- -------------------------------------------------------------------------
    -- Tenant Scoping
    -- -------------------------------------------------------------------------
    company_no              BIGINT              NOT NULL,
    branch_no               BIGINT,

    -- -------------------------------------------------------------------------
    -- Status & Config
    -- -------------------------------------------------------------------------
    active_status           SMALLINT            NOT NULL,
    display_sl              INTEGER,
    remarks                 TEXT,
    description             TEXT,

    -- -------------------------------------------------------------------------
    -- Audit
    -- -------------------------------------------------------------------------
    created_by              BIGINT              NOT NULL,
    created_at              TIMESTAMPTZ         NOT NULL,
    updated_by              BIGINT,
    updated_at              TIMESTAMPTZ,

    is_deleted              SMALLINT            NOT NULL,
    deleted_by              BIGINT,
    deleted_at              TIMESTAMPTZ,
    row_version             BIGINT,

    -- -------------------------------------------------------------------------
    -- Constraints
    -- -------------------------------------------------------------------------
    CONSTRAINT uq_designation_id_company
        UNIQUE (designation_id, company_no),

    CONSTRAINT uq_designation_name_company
        UNIQUE (designation_name, company_no),

    CONSTRAINT chk_designation_salary_band
        CHECK (max_salary IS NULL OR min_salary IS NULL OR max_salary >= min_salary),

    CONSTRAINT chk_designation_active_status
        CHECK (active_status IN (0, 1)),

    CONSTRAINT chk_designation_is_deleted
        CHECK (is_deleted IN (0, 1)),

    CONSTRAINT chk_designation_overtime
        CHECK (overtime_eligible IN (0, 1)),

    CONSTRAINT fk_designation_department
        FOREIGN KEY (department_no)
        REFERENCES hr_department(department_no)
        ON DELETE RESTRICT,

    CONSTRAINT fk_designation_company
        FOREIGN KEY (company_no)
        REFERENCES sys_company(company_no)
        ON DELETE RESTRICT

);

-- ============================================================================
-- HR_EMPLOYEE
-- ============================================================================
CREATE TABLE hr_employee (

---

-- Primary Key

---

employee_no BIGSERIAL PRIMARY KEY,

    -- -------------------------------------------------------------------------
    -- Identity
    -- -------------------------------------------------------------------------
    employee_id                 VARCHAR(30)         NOT NULL,
    first_name                  VARCHAR(100)        NOT NULL,
    last_name                   VARCHAR(100),
    full_name                   VARCHAR(250),
    first_name_nls               VARCHAR(100),
    last_name_nls                VARCHAR(100),

    -- -------------------------------------------------------------------------
    -- Personal Core
    -- -------------------------------------------------------------------------
    date_of_birth               DATE                NOT NULL,
    gender                      SMALLINT,
    -- 1=Male 2=Female 3=Other
    marital_status              SMALLINT,
    -- 1=Single 2=Married 3=Divorced 4=Widowed
    blood_group                 VARCHAR(5),
    religion                    SMALLINT,
    nationality                 SMALLINT,
    photo_url                   TEXT,
    signature_url               TEXT,

    -- -------------------------------------------------------------------------
    -- Statutory Identifiers
    -- -------------------------------------------------------------------------
    nid_number                  VARCHAR(50),
    passport_number             VARCHAR(30),
    birth_certificate_no        VARCHAR(30),
    tin_number                  VARCHAR(30),

    -- -------------------------------------------------------------------------
    -- Org Mapping
    -- -------------------------------------------------------------------------
    department_no               BIGINT              NOT NULL,
    designation_no              BIGINT              NOT NULL,
    reporting_to                BIGINT,
    -- self-ref → hr_employee.employee_no

    -- -------------------------------------------------------------------------
    -- Tenant Scoping
    -- -------------------------------------------------------------------------
    branch_no                   BIGINT              NOT NULL,

    -- -------------------------------------------------------------------------
    -- Contract Milestones
    -- -------------------------------------------------------------------------
    joining_date                DATE                NOT NULL,
    confirmation_date           DATE,
    employment_type             SMALLINT,
    -- 1=Permanent 2=Contractual 3=Probationary 4=Intern
    employee_status             SMALLINT,
    -- 1=Active 2=Resigned 3=Terminated 4=Retired

    -- -------------------------------------------------------------------------
    -- Communication
    -- -------------------------------------------------------------------------
    mobile_number               VARCHAR(20)         NOT NULL,
    alternative_mobile_number   VARCHAR(20),
    official_email              VARCHAR(150),
    personal_email              VARCHAR(150),
    emergency_contact_name      VARCHAR(150)        NOT NULL,
    emergency_contact_number    VARCHAR(20)         NOT NULL,
    emergency_contact_relation  VARCHAR(50),

    -- -------------------------------------------------------------------------
    -- Address
    -- -------------------------------------------------------------------------
    present_address             TEXT                NOT NULL,
    permanent_address           TEXT,
    present_post_code           VARCHAR(20),
    permanent_post_code         VARCHAR(20),

    -- -------------------------------------------------------------------------
    -- Compensation
    -- -------------------------------------------------------------------------
    pay_schedule                SMALLINT,
    -- 1=Monthly 2=Weekly 3=Bi-weekly
    salary_grade_no             BIGINT,
    basic_salary                NUMERIC(15,2)       NOT NULL,
    gross_salary                NUMERIC(15,2),

    -- -------------------------------------------------------------------------
    -- Bank & MFS
    -- -------------------------------------------------------------------------
    bank_account_number         VARCHAR(30),
    bank_name                   VARCHAR(100),
    bank_branch                 VARCHAR(100),
    routing_number              VARCHAR(30),
    mfs_number                  VARCHAR(20),
    mfs_provider                VARCHAR(30),

    -- -------------------------------------------------------------------------
    -- Contract (for contractual employees)
    -- -------------------------------------------------------------------------
    contract_start_date         DATE,
    contract_end_date           DATE,
    contract_amount             NUMERIC(15,2),
    contract_notes              TEXT,

    -- -------------------------------------------------------------------------
    -- Status & Config
    -- -------------------------------------------------------------------------
    active_status               SMALLINT            NOT NULL,
    display_sl                  INTEGER,
    remarks                     TEXT,
    description                 TEXT,

    -- -------------------------------------------------------------------------
    -- Audit
    -- -------------------------------------------------------------------------
    created_by                  BIGINT              NOT NULL,
    created_at                  TIMESTAMPTZ         NOT NULL,
    updated_by                  BIGINT,
    updated_at                  TIMESTAMPTZ,

    is_deleted                  SMALLINT            NOT NULL,
    deleted_by                  BIGINT,
    deleted_at                  TIMESTAMPTZ,
    row_version                 BIGINT,

    -- -------------------------------------------------------------------------
    -- Domain Constraints
    -- -------------------------------------------------------------------------

CONSTRAINT uq_employee_id_branch
UNIQUE (employee_id, branch_no),

    CONSTRAINT uq_employee_mobile_branch
        UNIQUE (mobile_number, branch_no),

    CONSTRAINT chk_employee_active_status
        CHECK (active_status IN (0, 1)),

    CONSTRAINT chk_employee_is_deleted
        CHECK (is_deleted IN (0, 1)),


    CONSTRAINT chk_employee_basic_salary
        CHECK (basic_salary >= 0),

    CONSTRAINT chk_employee_gross_salary
        CHECK (gross_salary IS NULL OR gross_salary >= basic_salary),

    CONSTRAINT chk_employee_confirmation_date
        CHECK (confirmation_date IS NULL OR confirmation_date >= joining_date),

    CONSTRAINT chk_employee_contract_dates
        CHECK (contract_end_date IS NULL OR contract_start_date IS NULL
               OR contract_end_date >= contract_start_date),

    CONSTRAINT chk_employee_nid_or_passport
        CHECK (nid_number IS NOT NULL OR passport_number IS NOT NULL),

    CONSTRAINT fk_employee_department
        FOREIGN KEY (department_no)
        REFERENCES hr_department(department_no)
        ON DELETE RESTRICT,

    CONSTRAINT fk_employee_designation
        FOREIGN KEY (designation_no)
        REFERENCES hr_designation(designation_no)
        ON DELETE RESTRICT,


    CONSTRAINT fk_employee_branch
        FOREIGN KEY (branch_no)
        REFERENCES sys_branch(branch_no)
        ON DELETE RESTRICT,

    CONSTRAINT fk_employee_reporting
        FOREIGN KEY (reporting_to)
        REFERENCES hr_employee(employee_no)
        ON DELETE SET NULL

);

-- ============================================================================
-- SYS_USER (sourced from hr_employee — every user must be an employee)
-- ============================================================================
CREATE TABLE sys_user (

---

-- Primary Key

---

user_no BIGSERIAL PRIMARY KEY,

    -- -------------------------------------------------------------------------
    -- Link to Employee Master
    -- -------------------------------------------------------------------------
    employee_no             BIGINT              NOT NULL UNIQUE,

    -- -------------------------------------------------------------------------
    -- Credentials
    -- -------------------------------------------------------------------------
    user_name                 VARCHAR(50)         NOT NULL UNIQUE,
    password                VARCHAR(255)        NOT NULL,
    -- Store bcrypt/argon2 hash ONLY — never plain text

    -- -------------------------------------------------------------------------
    -- Session & Security
    -- -------------------------------------------------------------------------
    last_login_at           TIMESTAMPTZ,
    password_changed_at     TIMESTAMPTZ,
    failed_login_count      SMALLINT,
    is_locked               SMALLINT,
    -- 1=Locked | 0=Normal

    -- -------------------------------------------------------------------------
    -- Status
    -- -------------------------------------------------------------------------
    active_status           SMALLINT            NOT NULL,
    remarks                 TEXT,

    -- -------------------------------------------------------------------------
    -- Audit
    -- -------------------------------------------------------------------------
    created_by              BIGINT              NOT NULL,
    created_at              TIMESTAMPTZ         NOT NULL,
    updated_by              BIGINT,
    updated_at              TIMESTAMPTZ,

    is_deleted              SMALLINT            NOT NULL,
    deleted_by              BIGINT,
    deleted_at              TIMESTAMPTZ,
    row_version             BIGINT,

    -- -------------------------------------------------------------------------
    -- Constraints
    -- -------------------------------------------------------------------------
    CONSTRAINT chk_user_active_status
        CHECK (active_status IN (0, 1)),

    CONSTRAINT chk_user_is_deleted
        CHECK (is_deleted IN (0, 1)),

    CONSTRAINT chk_user_is_locked
        CHECK (is_locked IN (0, 1)),

    CONSTRAINT fk_user_employee
        FOREIGN KEY (employee_no)
        REFERENCES hr_employee(employee_no)
        ON DELETE RESTRICT

);

-- ============================================================================
-- SYS_USER_ROLE
-- ============================================================================
CREATE TABLE sys_user_role (

---

-- Primary Key

---

user_role_no BIGSERIAL PRIMARY KEY,

    -- -------------------------------------------------------------------------
    -- Links
    -- -------------------------------------------------------------------------
    user_no                 BIGINT              NOT NULL,
    role_no                 BIGINT              NOT NULL,
    access_branch           TEXT,
    -- NULL = all branches | comma separated values = scoped access

    -- -------------------------------------------------------------------------
    -- Role Context
    -- -------------------------------------------------------------------------
    primary_role            SMALLINT,
    -- 1 = Primary (default on login) | 0 = Secondary

    -- -------------------------------------------------------------------------
    -- Status
    -- -------------------------------------------------------------------------
    active_status           SMALLINT            NOT NULL,
    remarks                 TEXT,

    -- -------------------------------------------------------------------------
    -- Audit
    -- -------------------------------------------------------------------------
    created_by              BIGINT              NOT NULL,
    created_at              TIMESTAMPTZ         NOT NULL,
    updated_by              BIGINT,
    updated_at              TIMESTAMPTZ,
    is_deleted              SMALLINT            NOT NULL,
    deleted_by              BIGINT,
    deleted_at              TIMESTAMPTZ,
    row_version             BIGINT,

    -- -------------------------------------------------------------------------
    -- Constraints
    -- -------------------------------------------------------------------------
    CONSTRAINT chk_user_role_active_status
        CHECK (active_status IN (0, 1)),

    CONSTRAINT chk_user_role_is_deleted
        CHECK (is_deleted IN (0, 1)),

    CONSTRAINT chk_user_role_primary
        CHECK (primary_role IN (0, 1)),

    CONSTRAINT fk_user_role_user
        FOREIGN KEY (user_no)
        REFERENCES sys_user(user_no)
        ON DELETE RESTRICT,

    CONSTRAINT fk_user_role_role
        FOREIGN KEY (role_no)
        REFERENCES sys_role(role_no)
        ON DELETE RESTRICT

);

-- ============================================================================
-- SYS_ENROLL_MODULE
-- ============================================================================
CREATE TABLE sys_enroll_module (

---

-- Primary Key

---

enrl_module_no BIGSERIAL PRIMARY KEY,

    -- -------------------------------------------------------------------------
    -- Links
    -- -------------------------------------------------------------------------
    module_no               BIGINT              NOT NULL,
    branch_no               BIGINT              NOT NULL,
    company_no               BIGINT              NOT NULL,

    -- -------------------------------------------------------------------------
    -- License Window
    -- -------------------------------------------------------------------------
    enrl_start_date         DATE,
    enrl_end_date           DATE,

    -- -------------------------------------------------------------------------
    -- Status
    -- -------------------------------------------------------------------------
    active_status           SMALLINT            NOT NULL,
    remarks                 TEXT,

    -- -------------------------------------------------------------------------
    -- Audit
    -- -------------------------------------------------------------------------
    created_by              BIGINT              NOT NULL,
    created_at              TIMESTAMPTZ         NOT NULL,
    updated_by              BIGINT,
    updated_at              TIMESTAMPTZ,
    is_deleted              SMALLINT            NOT NULL,
    deleted_by              BIGINT,
    deleted_at              TIMESTAMPTZ,
    row_version             BIGINT,

    -- -------------------------------------------------------------------------
    -- Constraints
    -- -------------------------------------------------------------------------
    CONSTRAINT uq_enrl_module_branch
        UNIQUE (module_no, branch_no),

    CONSTRAINT chk_enrl_module_dates
        CHECK (enrl_end_date IS NULL OR enrl_start_date IS NULL
               OR enrl_end_date >= enrl_start_date),

    CONSTRAINT chk_enrl_module_active_status
        CHECK (active_status IN (0, 1)),

    CONSTRAINT chk_enrl_module_is_deleted
        CHECK (is_deleted IN (0, 1)),

    CONSTRAINT fk_enrl_module_module
        FOREIGN KEY (module_no)
        REFERENCES sys_module(module_no)
        ON DELETE RESTRICT,

    CONSTRAINT fk_enrl_module_branch
        FOREIGN KEY (branch_no)
        REFERENCES sys_branch(branch_no)
        ON DELETE RESTRICT,

    CONSTRAINT fk_enrl_module_company
        FOREIGN KEY (company_no)
        REFERENCES sys_company(company_no)
        ON DELETE RESTRICT

);

-- ============================================================================
-- SYS_ENROLL_MODULE_MENU
-- ============================================================================
CREATE TABLE sys_enroll_module_menu (

---

-- Primary Key

---

enrl_module_menu_no BIGSERIAL PRIMARY KEY,

    -- -------------------------------------------------------------------------
    -- Links
    -- -------------------------------------------------------------------------
    enrl_module_no          BIGINT              NOT NULL,
    menu_no                 BIGINT              NOT NULL,

    -- -------------------------------------------------------------------------
    -- Per-Menu Permission Overrides
    -- -------------------------------------------------------------------------
    can_insert              SMALLINT,
    can_update              SMALLINT,
    can_view                SMALLINT,
    can_delete              SMALLINT,

    -- 1 = Allowed | 0 = Denied

    -- -------------------------------------------------------------------------
    -- Status
    -- -------------------------------------------------------------------------
    active_status           SMALLINT            NOT NULL,
    remarks                 TEXT,

    -- -------------------------------------------------------------------------
    -- Audit
    -- -------------------------------------------------------------------------
    created_by              BIGINT              NOT NULL,
    created_at              TIMESTAMPTZ         NOT NULL,
    updated_by              BIGINT,
    updated_at              TIMESTAMPTZ,
    is_deleted              SMALLINT            NOT NULL,
    deleted_by              BIGINT,
    deleted_at              TIMESTAMPTZ,
    row_version             BIGINT,

    -- -------------------------------------------------------------------------
    -- Constraints
    -- -------------------------------------------------------------------------
    CONSTRAINT uq_enrl_module_menu
        UNIQUE (enrl_module_no, menu_no),

    CONSTRAINT chk_enrl_menu_active_status
        CHECK (active_status IN (0, 1)),

    CONSTRAINT chk_enrl_menu_is_deleted
        CHECK (is_deleted IN (0, 1)),

    CONSTRAINT chk_enrl_menu_can_insert  CHECK (can_insert  IN (0, 1)),
    CONSTRAINT chk_enrl_menu_can_update  CHECK (can_update  IN (0, 1)),
    CONSTRAINT chk_enrl_menu_can_view    CHECK (can_view    IN (0, 1)),
    CONSTRAINT chk_enrl_menu_can_delete  CHECK (can_delete  IN (0, 1)),

    CONSTRAINT fk_enrl_module_menu_enroll
        FOREIGN KEY (enrl_module_no)
        REFERENCES sys_enroll_module(enrl_module_no)
        ON DELETE RESTRICT,

    CONSTRAINT fk_enrl_module_menu_menu
        FOREIGN KEY (menu_no)
        REFERENCES sys_menu(menu_no)
        ON DELETE RESTRICT

);

-- ============================================================================
-- CIRCULAR FK RESOLUTIONS (applied after both tables exist)
-- ============================================================================

ALTER TABLE hr_department
ADD CONSTRAINT fk_department_head
FOREIGN KEY (department_head_no)
REFERENCES hr_employee(employee_no)
ON DELETE SET NULL
DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE sys_branch
ADD CONSTRAINT fk_branch_manager
FOREIGN KEY (manager_no)
REFERENCES hr_employee(employee_no)
ON DELETE SET NULL
DEFERRABLE INITIALLY DEFERRED;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- sys_company
CREATE INDEX idx_company_active ON sys_company(active_status);

-- sys_branch
CREATE INDEX idx_branch_company ON sys_branch(company_no) WHERE is_deleted = 0;
CREATE INDEX idx_branch_active ON sys_branch(active_status);

-- sys_module
CREATE INDEX idx_module_active ON sys_module(active_status) WHERE is_deleted = 0;

-- sys_submodule
CREATE INDEX idx_submodule_module ON sys_submodule(module_no) WHERE is_deleted = 0;

-- sys_menu
CREATE INDEX idx_menu_module ON sys_menu(module_no) WHERE is_deleted = 0;
CREATE INDEX idx_menu_submodule ON sys_menu(submodule_no) WHERE is_deleted = 0;
CREATE INDEX idx_menu_parent ON sys_menu(parent_menu_no);
CREATE INDEX idx_menu_type ON sys_menu(menu_type);
CREATE INDEX idx_menu_form_id ON sys_menu(form_id);

-- sys_role
CREATE INDEX idx_role_company ON sys_role(company_no) WHERE is_deleted = 0;

-- sys_user
CREATE INDEX idx_user_employee ON sys_user(employee_no);
CREATE INDEX idx_user_active ON sys_user(active_status);

-- sys_user_role
CREATE INDEX idx_user_role_user ON sys_user_role(user_no) WHERE is_deleted = 0;
CREATE INDEX idx_user_role_role ON sys_user_role(role_no) WHERE is_deleted = 0;

-- sys_enroll_module
CREATE INDEX idx_enrl_module_branch ON sys_enroll_module(branch_no) WHERE is_deleted = 0;
CREATE INDEX idx_enrl_module_module ON sys_enroll_module(module_no) WHERE is_deleted = 0;

-- sys_enroll_module_menu
CREATE INDEX idx_enrl_menu_enroll ON sys_enroll_module_menu(enrl_module_no) WHERE is_deleted = 0;
CREATE INDEX idx_enrl_menu_menu ON sys_enroll_module_menu(menu_no) WHERE is_deleted = 0;

-- hr_department
CREATE INDEX idx_dept_company ON hr_department(company_no) WHERE is_deleted = 0;
CREATE INDEX idx_dept_branch ON hr_department(branch_no) WHERE is_deleted = 0;
CREATE INDEX idx_dept_parent ON hr_department(parent_department_no);
CREATE INDEX idx_dept_active ON hr_department(active_status);

-- hr_designation
CREATE INDEX idx_desig_department ON hr_designation(department_no) WHERE is_deleted = 0;
CREATE INDEX idx_desig_company ON hr_designation(company_no) WHERE is_deleted = 0;
CREATE INDEX idx_desig_branch ON hr_designation(branch_no) WHERE is_deleted = 0;
CREATE INDEX idx_desig_active ON hr_designation(active_status);

-- hr_employee
CREATE INDEX idx_emp_branch ON hr_employee(branch_no) WHERE is_deleted = 0;
CREATE INDEX idx_emp_department ON hr_employee(department_no) WHERE is_deleted = 0;
CREATE INDEX idx_emp_designation ON hr_employee(designation_no) WHERE is_deleted = 0;
CREATE INDEX idx_emp_reporting ON hr_employee(reporting_to);
CREATE INDEX idx_emp_status ON hr_employee(employee_status) WHERE is_deleted = 0;
CREATE INDEX idx_emp_joining_date ON hr_employee(joining_date);
CREATE INDEX idx_emp_mobile ON hr_employee(mobile_number);
CREATE INDEX idx_emp_official_email ON hr_employee(official_email);
