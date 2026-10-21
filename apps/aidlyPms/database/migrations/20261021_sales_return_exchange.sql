-- ============================================================================
-- MIGRATION: 20261021_sales_return_exchange.sql
-- Description: Sales Return & Exchange server-authoritative schema, clearing account,
--              return window configuration, and permissions.
-- ============================================================================

-- 1. Add columns to sale_returns
ALTER TABLE sale_returns
    ADD COLUMN IF NOT EXISTS refund_method SMALLINT,
    ADD COLUMN IF NOT EXISTS exchange_invoice_no BIGINT REFERENCES sale_invoices(sale_invoice_no) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS idempotency_key UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_sale_returns_idempotency_key'
    ) THEN
        ALTER TABLE sale_returns ADD CONSTRAINT uq_sale_returns_idempotency_key UNIQUE (idempotency_key);
    END IF;
END $$;

-- 2. Add columns to sale_invoices
ALTER TABLE sale_invoices
    ADD COLUMN IF NOT EXISTS exchange_of_return_no BIGINT REFERENCES sale_returns(sale_return_no) ON DELETE SET NULL;

-- 3. Add return_window_days to cfg_sale_configs
ALTER TABLE cfg_sale_configs
    ADD COLUMN IF NOT EXISTS return_window_days INT NOT NULL DEFAULT 7;

-- 4. Seed Return Credit Clearing Account (Account Code 10901) dynamically per pharmacy & branch
INSERT INTO acc_transaction_accounts (
    account_no,
    pharmacy_no,
    branch_no,
    account_category,
    account_code,
    account_name,
    account_type,
    bank_account_number,
    bank_name,
    current_balance,
    is_active,
    created_at,
    updated_at
)
SELECT
    (COALESCE(m.max_acc, 0) + ROW_NUMBER() OVER (ORDER BY b.pharmacy_no, b.branch_no)),
    b.pharmacy_no,
    b.branch_no,
    1, -- Asset / Clearing
    '10901',
    'Return Credit Clearing',
    1, -- Cash / Clearing type
    NULL,
    NULL,
    0.0000,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM sys_branches b
CROSS JOIN (SELECT COALESCE(MAX(account_no), 0) AS max_acc FROM acc_transaction_accounts) m
WHERE NOT EXISTS (
    SELECT 1 FROM acc_transaction_accounts a
    WHERE a.pharmacy_no = b.pharmacy_no
      AND a.branch_no = b.branch_no
      AND (a.account_code = '10901' OR a.account_name = 'Return Credit Clearing')
);

-- 5. Seed 'sale.return' Permission Node in sys_permissions
INSERT INTO sys_permissions (permission_no, code, module_group, name, description, created_at)
VALUES (
    (SELECT COALESCE(MAX(permission_no), 0) + 1 FROM sys_permissions),
    'sale.return',
    'Sales',
    'Sales Return & Exchange',
    'Process customer sales returns and item exchanges',
    CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO NOTHING;

-- 6. Grant 'sale.return' permission to PMS Manager (Role 9) and PMS Salesman (Role 10) across all branches
INSERT INTO sys_role_permissions (role_no, permission_no, pharmacy_no, branch_no)
SELECT r.role_no, p.permission_no, r.pharmacy_no, r.branch_no
FROM sys_roles r
CROSS JOIN sys_permissions p
WHERE p.code = 'sale.return'
  AND r.alias IN ('PMS Manager', 'PMS Salesman')
ON CONFLICT DO NOTHING;
