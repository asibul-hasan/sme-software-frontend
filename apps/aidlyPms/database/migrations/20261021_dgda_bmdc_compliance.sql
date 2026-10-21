-- Migration: 20261021_dgda_bmdc_compliance.sql
-- Description: Add DGDA DAR Number, Drug Schedule Classification, and Doctor BMDC Registration Number for Bangladesh Model Pharmacy compliance.

-- 1. DGDA Compliance on Medicines / Products
ALTER TABLE prod_products 
ADD COLUMN IF NOT EXISTS dar_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS drug_schedule VARCHAR(20) DEFAULT 'OTC';

-- Ensure drug_schedule has valid values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_prod_products_drug_schedule'
    ) THEN
        ALTER TABLE prod_products
        ADD CONSTRAINT chk_prod_products_drug_schedule 
        CHECK (drug_schedule IN ('OTC', 'POM', 'ANTIBIOTIC', 'NARCOTIC'));
    END IF;
END $$;

-- Index for searching and filtering by schedule or DAR
CREATE INDEX IF NOT EXISTS idx_prod_products_dar_number ON prod_products(dar_number);
CREATE INDEX IF NOT EXISTS idx_prod_products_drug_schedule ON prod_products(drug_schedule);

-- 2. Doctor BMDC Registration Number for Model Pharmacy Compliance
ALTER TABLE doc_doctors 
ADD COLUMN IF NOT EXISTS bmdc_reg_no VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_doc_doctors_bmdc_reg_no ON doc_doctors(bmdc_reg_no);
