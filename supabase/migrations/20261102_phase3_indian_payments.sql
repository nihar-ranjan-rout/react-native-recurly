-- ==============================================================================
-- PHASE 3 MIGRATION: INDIAN PAYMENT RAILS, UPI AUTOPAY & TRANSACTION MANAGEMENT
-- Target: Supabase / PostgreSQL 15+
-- Safe, non-destructive migration preserving existing records and RLS policies
-- ==============================================================================

-- 1. PAYMENT METHODS TABLE
-- Stores saved payment instruments (UPI VPAs, masked card identifiers, net banking)
-- NOTE: Never stores PINs, CVVs, or sensitive authentication secrets!
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    method_type TEXT NOT NULL CHECK (method_type IN ('upi', 'card', 'netbanking', 'wallet', 'cash', 'other')),
    provider_name TEXT NOT NULL, -- 'Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI', 'RuPay Card', 'Visa', etc.
    account_identifier TEXT, -- Masked identifier e.g. "•••• 7109"
    vpa TEXT, -- Masked UPI ID e.g. "alex***@okhdfcbank"
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. PAYMENT MANDATES TABLE (UPI AUTOPAY / RECURRING MANDATES)
-- Tracks NPCI / UPI AutoPay mandates for subscriptions
CREATE TABLE IF NOT EXISTS public.payment_mandates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    mandate_ref_id TEXT NOT NULL, -- Unique Mandate Number (UMN) or reference (e.g. UMN-2026-98124)
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('NOT_CREATED', 'PENDING', 'ACTIVE', 'PAUSED', 'FAILED', 'REVOKED', 'EXPIRED')),
    frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'half-yearly', 'yearly', 'custom')),
    max_amount NUMERIC(12, 2) NOT NULL CHECK (max_amount >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    payment_method_type TEXT NOT NULL DEFAULT 'upi',
    vpa TEXT, -- Masked VPA tied to mandate
    start_date DATE NOT NULL,
    expiry_date DATE,
    next_expected_debit_date DATE,
    last_debit_date DATE,
    cancellation_reason TEXT,
    auto_pay_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_mandate_ref_user UNIQUE (user_id, mandate_ref_id)
);

-- 3. EXTEND PAYMENT TRANSACTIONS TABLE
-- Safe column additions for Indian payment rails and financial audit trail
ALTER TABLE public.payment_transactions
    ADD COLUMN IF NOT EXISTS original_amount NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS original_currency VARCHAR(10) DEFAULT 'INR',
    ADD COLUMN IF NOT EXISTS inr_equivalent NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS payment_reference TEXT, -- UTR or bank reference number
    ADD COLUMN IF NOT EXISTS provider_reference TEXT, -- Gateway reference ID (e.g., pay_Nxxx)
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
    ADD COLUMN IF NOT EXISTS failure_reason TEXT,
    ADD COLUMN IF NOT EXISTS mandate_id UUID REFERENCES public.payment_mandates(id) ON DELETE SET NULL;

-- Ensure idempotency key has unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_transactions_idempotency 
    ON public.payment_transactions(idempotency_key) 
    WHERE idempotency_key IS NOT NULL;

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_mandates ENABLE ROW LEVEL SECURITY;

-- 4.1 PAYMENT METHODS POLICIES
DROP POLICY IF EXISTS "Users can view own payment methods" ON public.payment_methods;
CREATE POLICY "Users can view own payment methods"
    ON public.payment_methods
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payment methods" ON public.payment_methods;
CREATE POLICY "Users can insert own payment methods"
    ON public.payment_methods
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own payment methods" ON public.payment_methods;
CREATE POLICY "Users can update own payment methods"
    ON public.payment_methods
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own payment methods" ON public.payment_methods;
CREATE POLICY "Users can delete own payment methods"
    ON public.payment_methods
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 4.2 PAYMENT MANDATES POLICIES
DROP POLICY IF EXISTS "Users can view own payment mandates" ON public.payment_mandates;
CREATE POLICY "Users can view own payment mandates"
    ON public.payment_mandates
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payment mandates" ON public.payment_mandates;
CREATE POLICY "Users can insert own payment mandates"
    ON public.payment_mandates
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own payment mandates" ON public.payment_mandates;
CREATE POLICY "Users can update own payment mandates"
    ON public.payment_mandates
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own payment mandates" ON public.payment_mandates;
CREATE POLICY "Users can delete own payment mandates"
    ON public.payment_mandates
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON public.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_mandates_user ON public.payment_mandates(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_mandates_sub ON public.payment_mandates(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_mandates_status ON public.payment_mandates(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_sub ON public.payment_transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_date ON public.payment_transactions(payment_date);
