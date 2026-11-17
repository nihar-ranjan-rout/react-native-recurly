-- ==============================================================================
-- PHASE 1: INITIAL DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- Target: Supabase / PostgreSQL 15+
-- Generated: 2026-11-02
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLES
-- ==============================================================================

-- 2.1 PROFILES TABLE
-- Extends Supabase auth.users with public profile metadata and server-assigned role
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    avatar_url TEXT,
    currency TEXT NOT NULL DEFAULT 'INR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.2 CATEGORIES TABLE
-- Master catalog of subscription categories
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.3 SUBSCRIPTIONS TABLE
-- Core user subscriptions with user isolation
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly', 'yearly')),
    first_bill_date DATE,
    next_payment_date DATE NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
    active BOOLEAN NOT NULL DEFAULT true,
    remind_me BOOLEAN NOT NULL DEFAULT true,
    reminder_days INT NOT NULL DEFAULT 3 CHECK (reminder_days >= 0),
    notes TEXT,
    website TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_subscription_name UNIQUE (user_id, name)
);

-- 2.4 PAYMENT TRANSACTIONS TABLE
-- Financial payment ledger for each subscription renewal
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    subscription_name TEXT NOT NULL,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    payment_date DATE NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'failed', 'refunded')),
    invoice_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.5 USER PREFERENCES TABLE
-- User-specific alert and system settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL DEFAULT 'INR',
    push_notifications BOOLEAN NOT NULL DEFAULT true,
    email_alerts BOOLEAN NOT NULL DEFAULT true,
    biometric_lock BOOLEAN NOT NULL DEFAULT true,
    monthly_budget NUMERIC(10, 2) DEFAULT 5000.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. SEED DEFAULT CATEGORIES
-- ==============================================================================
INSERT INTO public.categories (id, name, icon, color, display_order)
VALUES
    ('streaming', 'Streaming', 'tv-outline', '#F28C45', 1),
    ('music', 'Music', 'musical-notes-outline', '#2E7D32', 2),
    ('software', 'Software', 'code-slash-outline', '#171717', 3),
    ('cloud', 'Cloud', 'cloud-outline', '#4A7C59', 4),
    ('fitness', 'Fitness', 'barbell-outline', '#D97706', 5),
    ('gaming', 'Gaming', 'game-controller-outline', '#7C3AED', 6),
    ('reading', 'Reading', 'book-outline', '#B45309', 7),
    ('utilities', 'Utilities', 'flash-outline', '#7D9D8B', 8),
    ('other', 'Other', 'grid-outline', '#777777', 9)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    display_order = EXCLUDED.display_order;

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- 4.1 CATEGORIES POLICIES
-- Categories are public to read for all authenticated users
CREATE POLICY "Allow authenticated read for categories"
    ON public.categories
    FOR SELECT
    TO authenticated
    USING (true);

-- 4.2 PROFILES POLICIES
-- Users can view and update only their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4.3 SUBSCRIPTIONS POLICIES (STRICT USER ISOLATION)
CREATE POLICY "Users can select own subscriptions"
    ON public.subscriptions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
    ON public.subscriptions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
    ON public.subscriptions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
    ON public.subscriptions
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 4.4 PAYMENT TRANSACTIONS POLICIES (STRICT USER ISOLATION)
CREATE POLICY "Users can select own payment transactions"
    ON public.payment_transactions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment transactions"
    ON public.payment_transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment transactions"
    ON public.payment_transactions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment transactions"
    ON public.payment_transactions
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 4.5 USER PREFERENCES POLICIES
CREATE POLICY "Users can view own preferences"
    ON public.user_preferences
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
    ON public.user_preferences
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
    ON public.user_preferences
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 5. AUTOMATIC TRIGGERS & FUNCTIONS
-- ==============================================================================

-- 5.1 Handle new user registration automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create corresponding user profile with safe default role 'user'
    INSERT INTO public.profiles (id, full_name, email, role, currency)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.email,
        'user', -- Strictly assign 'user', never automatically assign 'admin'
        'INR'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Create default user preferences
    INSERT INTO public.user_preferences (user_id, currency, push_notifications, email_alerts, biometric_lock)
    VALUES (new.id, 'INR', true, true, true)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger firing on auth.users creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5.2 Updated_at timestamp updater
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_timestamp
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_subscriptions_timestamp
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_preferences_timestamp
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- ==============================================================================
-- 6. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_payment ON public.subscriptions(user_id, next_payment_date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.payment_transactions(user_id, payment_date DESC);
