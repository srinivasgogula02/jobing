-- Supabase Migration: Dodo Payments Subscriptions

-- 1. Add fields to existing users table
-- Adding dodo_customer_id, current_subscription_id, and credits
ALTER TABLE users ADD COLUMN IF NOT EXISTS dodo_customer_id text UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_subscription_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits integer DEFAULT 0;

-- 2. Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    subscription_id text PRIMARY KEY,
    user_id text REFERENCES users(id) ON DELETE CASCADE,
    recurring_pre_tax_amount real NOT NULL,
    tax_inclusive boolean NOT NULL,
    currency text NOT NULL,
    status text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    product_id text NOT NULL,
    quantity integer NOT NULL,
    trial_period_days integer,
    subscription_period_interval text,
    payment_period_interval text,
    subscription_period_count integer,
    payment_frequency_count integer,
    next_billing_date timestamp with time zone NOT NULL,
    previous_billing_date timestamp with time zone NOT NULL,
    customer_id text NOT NULL,
    customer_name text,
    customer_email text NOT NULL,
    metadata jsonb,
    discount_id text,
    cancelled_at timestamp with time zone,
    cancel_at_next_billing_date boolean,
    billing jsonb NOT NULL,
    on_demand boolean,
    addons jsonb
);

-- 3. Create payments table
CREATE TABLE IF NOT EXISTS payments (
    payment_id text PRIMARY KEY,
    status text NOT NULL,
    total_amount real NOT NULL,
    currency text NOT NULL,
    payment_method text,
    payment_method_type text,
    customer_id text NOT NULL,
    customer_name text,
    customer_email text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    subscription_id text NOT NULL,
    brand_id text NOT NULL,
    digital_product_delivered boolean,
    metadata jsonb,
    webhook_data jsonb NOT NULL,
    billing jsonb NOT NULL,
    business_id text NOT NULL,
    card_issuing_country text,
    card_last_four text,
    card_network text,
    card_type text,
    discount_id text,
    disputes jsonb,
    error_code text,
    error_message text,
    payment_link text,
    product_cart jsonb,
    refunds jsonb,
    settlement_amount real,
    settlement_currency text,
    settlement_tax real,
    tax real,
    updated_at timestamp with time zone
);

-- 4. Update users table relation for current_subscription
ALTER TABLE users 
ADD CONSTRAINT fk_current_subscription 
FOREIGN KEY (current_subscription_id) 
REFERENCES subscriptions(subscription_id) 
ON DELETE SET NULL;
