/**
 * SaaS Subscription & Billing Domain Models
 * Direct 1:1 field mapping to PostgreSQL schema in `db_script.sql`.
 * Tables: `sub_subscription_plans`, `sub_pharmacy_subscriptions`, `sub_subscription_payments`.
 */

export interface SubSubscriptionPlan {
  plan_no: number;
  plan_name: string;
  monthly_fee: number;
  yearly_fee: number;
  trial_days: number;
  is_active: boolean;
}

export interface SubPharmacySubscription {
  subscription_no: number;
  pharmacy_no: number;
  branch_no: number;
  plan_no: number;
  billing_cycle: number;
  subscription_status: number;
  trial_end_date?: string | null;
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  next_payment_date?: string | null;
  monthly_rate: number;
  updated_at: string;

  // Navigation
  plan?: SubSubscriptionPlan;
}

export interface SubSubscriptionPayment {
  subscription_payment_no: number;
  pharmacy_no: number;
  branch_no: number;
  subscription_no: number;
  transaction_reference: string;
  payment_gateway: string;
  subtotal: number;
  discount_code?: string | null;
  discount_amount: number;
  final_amount: number;
  payment_status: string;
  payment_timestamp: string;
  download_invoice_url?: string | null;
}

// Backward-compatible type aliases
export type SubscriptionPlan = SubSubscriptionPlan;
export type PharmacySubscription = SubPharmacySubscription;
export type SubscriptionPayment = SubSubscriptionPayment;
