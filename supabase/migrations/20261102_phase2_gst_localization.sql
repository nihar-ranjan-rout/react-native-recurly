-- ==============================================================================
-- PHASE 2 MIGRATION: INDIAN CURRENCY, GST TRACKING & BILLING CYCLES
-- Safe, non-destructive migration preserving existing records and RLS policies
-- ==============================================================================

-- 1. EXPAND BILLING CYCLES TO INCLUDE 'half-yearly' AND 'custom'
ALTER TABLE subscriptions 
  DROP CONSTRAINT IF EXISTS subscriptions_billing_cycle_check;

ALTER TABLE subscriptions 
  ADD CONSTRAINT subscriptions_billing_cycle_check 
  CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly', 'half-yearly', 'yearly', 'custom'));

-- 2. ADD GST & TAX FIELDS TO SUBSCRIPTIONS
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS tax_applicable BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5, 2) DEFAULT 18.00,
  ADD COLUMN IF NOT EXISTS tax_inclusive BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS base_price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS gstin VARCHAR(15),
  ADD COLUMN IF NOT EXISTS currency_code VARCHAR(10) DEFAULT 'INR';

-- 3. ADD GST & TAX FIELDS TO PAYMENT TRANSACTIONS
ALTER TABLE payment_transactions
  ADD COLUMN IF NOT EXISTS tax_applicable BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS base_price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS gstin VARCHAR(15),
  ADD COLUMN IF NOT EXISTS currency_code VARCHAR(10) DEFAULT 'INR';

-- 4. UPDATE USER PREFERENCES TO DEFAULT TO INR
ALTER TABLE user_preferences 
  ALTER COLUMN currency SET DEFAULT 'INR';

-- 5. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_subscriptions_currency ON subscriptions(currency_code);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tax_applicable ON subscriptions(tax_applicable);
CREATE INDEX IF NOT EXISTS idx_subscriptions_gstin ON subscriptions(gstin) WHERE gstin IS NOT NULL;
