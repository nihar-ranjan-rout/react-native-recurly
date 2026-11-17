import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSession } from "@/lib/auth";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  calculateGST,
  formatCurrency,
  formatIndianDate,
  formatIndianDateWithMonth,
  formatIndianNumber,
  formatIndianTime,
  SupportedCurrency,
} from "@/lib/localization";
import { BillingCycle, SubscriptionCategory } from "@/lib/subscriptions";

// ==============================================================================
// 1. TYPES & DATA CONTRACTS
// ==============================================================================

export type IndianPaymentCategory =
  | "upi"
  | "card"
  | "netbanking"
  | "wallet"
  | "cash"
  | "other";

export interface SavedPaymentMethod {
  id: string;
  userId: string;
  methodType: IndianPaymentCategory;
  providerName: string; // e.g., 'Google Pay', 'PhonePe', 'Paytm', 'RuPay Debit Card', 'HDFC Net Banking'
  accountIdentifier?: string; // Masked identifier, e.g. "•••• 7109"
  vpa?: string; // Masked UPI ID, e.g. "alex***@okhdfcbank" (Never PINs/secrets!)
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MandateStatus =
  | "NOT_CREATED"
  | "PENDING"
  | "ACTIVE"
  | "PAUSED"
  | "FAILED"
  | "REVOKED"
  | "EXPIRED";

export interface PaymentMandate {
  id: string;
  userId: string;
  subscriptionId?: string;
  subscriptionName?: string;
  mandateRefId: string; // Unique Mandate Number (UMN) e.g., "UMN-2026-98124"
  status: MandateStatus;
  frequency: BillingCycle;
  maxAmount: number;
  currency: string;
  paymentMethodType: string;
  vpa?: string;
  startDate: string; // ISO date YYYY-MM-DD
  expiryDate?: string;
  nextExpectedDebitDate?: string;
  lastDebitDate?: string;
  cancellationReason?: string;
  autoPayEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PaymentTransactionStatus =
  | "INITIATED"
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "paid";

export interface DetailedPaymentTransaction {
  id: string;
  subscriptionId: string;
  subscriptionName: string;
  category: SubscriptionCategory;
  amount: number;
  currency: string;
  currencyCode: SupportedCurrency;
  originalAmount: number;
  originalCurrency: string;
  inrEquivalent: number;
  basePrice?: number;
  taxRate?: number;
  taxAmount?: number;
  taxApplicable?: boolean;
  date: string; // DD/MM/YYYY
  rawDate: string; // ISO string
  paymentMethod: string;
  status: PaymentTransactionStatus;
  paymentReference?: string; // UTR or Bank Ref Number
  providerReference?: string; // Payment Gateway Ref
  description?: string;
  idempotencyKey?: string;
  failureReason?: string;
  gstin?: string;
  mandateId?: string;
}

export interface PaymentReceipt {
  receiptNumber: string;
  transactionReference: string;
  subscriptionName: string;
  category: SubscriptionCategory;
  paymentDateFormatted: string; // DD/MM/YYYY
  paymentTimeFormatted: string; // 12-hour AM/PM IST
  paymentMethod: string;
  accountIdentifier?: string;
  currency: string;
  currencyCode: SupportedCurrency;
  baseAmount: number;
  taxApplicable: boolean;
  taxRate: number;
  cgstAmount: number;
  sgstAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: PaymentTransactionStatus;
  mandateRefId?: string;
  gstin?: string;
  isCompliantInvoice: false; // Explicit disclaimer: Not a GST tax invoice
  disclaimer: string;
}

// ==============================================================================
// 2. CONSTANTS & PRESETS
// ==============================================================================

export const INDIAN_PAYMENT_METHOD_OPTIONS = [
  // UPI Apps
  { id: "UPI (Google Pay)", category: "upi" as const, label: "Google Pay (UPI)", icon: "logo-google" },
  { id: "UPI (PhonePe)", category: "upi" as const, label: "PhonePe (UPI)", icon: "phone-portrait-outline" },
  { id: "UPI (Paytm)", category: "upi" as const, label: "Paytm (UPI)", icon: "wallet-outline" },
  { id: "BHIM UPI", category: "upi" as const, label: "BHIM UPI", icon: "qr-code-outline" },
  { id: "Generic UPI", category: "upi" as const, label: "Any UPI App / VPA", icon: "send-outline" },
  // Indian & International Cards
  { id: "RuPay Debit Card", category: "card" as const, label: "RuPay Debit Card", icon: "card-outline" },
  { id: "RuPay Credit Card", category: "card" as const, label: "RuPay Credit Card", icon: "card-outline" },
  { id: "Visa Card", category: "card" as const, label: "Visa Card", icon: "card-outline" },
  { id: "Mastercard", category: "card" as const, label: "Mastercard", icon: "card-outline" },
  // Net Banking & Wallets
  { id: "HDFC NetBanking", category: "netbanking" as const, label: "HDFC Bank Net Banking", icon: "business-outline" },
  { id: "ICICI NetBanking", category: "netbanking" as const, label: "ICICI Bank Net Banking", icon: "business-outline" },
  { id: "SBI NetBanking", category: "netbanking" as const, label: "State Bank of India (SBI)", icon: "business-outline" },
  { id: "Axis NetBanking", category: "netbanking" as const, label: "Axis Bank Net Banking", icon: "business-outline" },
  { id: "Bank Transfer (NEFT/IMPS)", category: "netbanking" as const, label: "Bank Transfer (IMPS/NEFT)", icon: "swap-horizontal-outline" },
  { id: "Amazon Pay Wallet", category: "wallet" as const, label: "Amazon Pay Wallet", icon: "wallet-outline" },
  { id: "Cash / Manual Payment", category: "cash" as const, label: "Cash / Counter Payment", icon: "cash-outline" },
  { id: "Custom Payment Method", category: "other" as const, label: "Other / Custom", icon: "ellipsis-horizontal-outline" },
];

export const MANDATE_STATUS_META: Record<
  MandateStatus,
  { label: string; badgeVariant: "success" | "warning" | "error" | "neutral" | "primary"; description: string }
> = {
  ACTIVE: {
    label: "AutoPay Active",
    badgeVariant: "success",
    description: "NPCI e-Mandate registered. Recurring debits automatically tracked.",
  },
  PENDING: {
    label: "Mandate Pending",
    badgeVariant: "warning",
    description: "Awaiting bank / UPI app authorization or first debit confirmation.",
  },
  PAUSED: {
    label: "AutoPay Paused",
    badgeVariant: "neutral",
    description: "AutoPay temporarily paused. Requires manual renewal payment.",
  },
  FAILED: {
    label: "Mandate Failed",
    badgeVariant: "error",
    description: "Mandate execution failed (insufficient funds or bank rejection).",
  },
  REVOKED: {
    label: "Mandate Revoked",
    badgeVariant: "error",
    description: "AutoPay mandate cancelled and revoked by user.",
  },
  EXPIRED: {
    label: "Mandate Expired",
    badgeVariant: "neutral",
    description: "Mandate tenure has ended. Needs new registration.",
  },
  NOT_CREATED: {
    label: "Manual Payment",
    badgeVariant: "neutral",
    description: "No recurring mandate registered. Manual payment required.",
  },
};

// ==============================================================================
// 3. UTILITY FUNCTIONS
// ==============================================================================

/**
 * Masks a UPI VPA (Virtual Private Address) securely for UI display.
 * E.g., 'alexander.grover@okhdfcbank' -> 'al***@okhdfcbank'
 * NEVER stores or displays banking PINs or CVVs!
 */
export const maskVpa = (vpa?: string): string => {
  if (!vpa || !vpa.includes("@")) return vpa || "";
  const [handle, psp] = vpa.split("@");
  if (handle.length <= 2) {
    return `${handle[0]}*@${psp}`;
  }
  const prefix = handle.slice(0, 2);
  return `${prefix}***@${psp}`;
};

/**
 * Masks an account or card number (e.g. "•••• 7109")
 */
export const maskCardOrAccount = (num?: string): string => {
  if (!num) return "";
  const clean = num.replace(/\D/g, "");
  if (clean.length < 4) return num;
  const last4 = clean.slice(-4);
  return `•••• ${last4}`;
};

/**
 * Generates an NPCI-compliant Unique Mandate Number (UMN) reference for demo tracking
 */
export const generateDemoUMN = (prefix = "UMN"): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${new Date().getFullYear()}-${timestamp}${random}`;
};

/**
 * Generates an idempotent transaction reference or UTR
 */
export const generateDemoUTR = (): string => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(100000 + Math.random() * 900000);
  return `UPI/${dateStr}/${random}`;
};

// Default sample payment methods for Indian demo users
export const DEFAULT_SAVED_PAYMENT_METHODS: SavedPaymentMethod[] = [
  {
    id: "pm-1",
    userId: "demo-user",
    methodType: "upi",
    providerName: "Google Pay",
    vpa: "recurly***@okhdfcbank",
    accountIdentifier: "•••• 7109",
    isDefault: true,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  },
  {
    id: "pm-2",
    userId: "demo-user",
    methodType: "upi",
    providerName: "PhonePe",
    vpa: "user***@ybl",
    accountIdentifier: "•••• 4291",
    isDefault: false,
    createdAt: "2026-10-05T00:00:00.000Z",
    updatedAt: "2026-10-05T00:00:00.000Z",
  },
  {
    id: "pm-3",
    userId: "demo-user",
    methodType: "card",
    providerName: "HDFC RuPay Credit Card",
    accountIdentifier: "•••• 3014",
    isDefault: false,
    createdAt: "2026-10-10T00:00:00.000Z",
    updatedAt: "2026-10-10T00:00:00.000Z",
  },
  {
    id: "pm-4",
    userId: "demo-user",
    methodType: "netbanking",
    providerName: "State Bank of India",
    accountIdentifier: "•••• 8812",
    isDefault: false,
    createdAt: "2026-10-15T00:00:00.000Z",
    updatedAt: "2026-10-15T00:00:00.000Z",
  },
];

// Default sample UPI AutoPay mandates
export const DEFAULT_MANDATES: PaymentMandate[] = [
  {
    id: "mnd-1",
    userId: "demo-user",
    subscriptionId: "sub-1",
    subscriptionName: "Netflix",
    mandateRefId: "UMN-2026-48912",
    status: "ACTIVE",
    frequency: "monthly",
    maxAmount: 1000.0,
    currency: "INR",
    paymentMethodType: "UPI AutoPay (Google Pay)",
    vpa: "recurly***@okhdfcbank",
    startDate: "2026-05-05",
    expiryDate: "2031-05-05",
    nextExpectedDebitDate: "2026-11-05",
    lastDebitDate: "2026-10-05",
    autoPayEnabled: true,
    createdAt: "2026-05-05T00:00:00.000Z",
    updatedAt: "2026-10-05T00:00:00.000Z",
  },
  {
    id: "mnd-2",
    userId: "demo-user",
    subscriptionId: "sub-2",
    subscriptionName: "Spotify",
    mandateRefId: "UMN-2026-12048",
    status: "ACTIVE",
    frequency: "monthly",
    maxAmount: 500.0,
    currency: "INR",
    paymentMethodType: "HDFC RuPay Card",
    startDate: "2026-06-08",
    expiryDate: "2030-06-08",
    nextExpectedDebitDate: "2026-11-08",
    lastDebitDate: "2026-10-08",
    autoPayEnabled: true,
    createdAt: "2026-06-08T00:00:00.000Z",
    updatedAt: "2026-10-08T00:00:00.000Z",
  },
  {
    id: "mnd-3",
    userId: "demo-user",
    subscriptionId: "sub-5",
    subscriptionName: "Disney+ Hotstar",
    mandateRefId: "UMN-2026-88129",
    status: "PAUSED",
    frequency: "quarterly",
    maxAmount: 899.0,
    currency: "INR",
    paymentMethodType: "UPI AutoPay (PhonePe)",
    vpa: "user***@ybl",
    startDate: "2026-02-22",
    expiryDate: "2029-02-22",
    nextExpectedDebitDate: "2026-11-22",
    lastDebitDate: "2026-08-22",
    cancellationReason: "User paused auto-debit for cricket offseason",
    autoPayEnabled: false,
    createdAt: "2026-02-22T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  },
];

// Default sample payment transactions for Indian subscriptions
export const DEFAULT_DETAILED_TRANSACTIONS: DetailedPaymentTransaction[] = [
  {
    id: "tx-1",
    subscriptionId: "sub-1",
    subscriptionName: "Netflix",
    category: "streaming",
    amount: 649.0,
    currency: "₹",
    currencyCode: "INR",
    originalAmount: 649.0,
    originalCurrency: "INR",
    inrEquivalent: 649.0,
    basePrice: 550.0,
    taxRate: 18,
    taxAmount: 99.0,
    taxApplicable: true,
    date: "05/10/2026",
    rawDate: "2026-10-05T10:14:00+05:30",
    paymentMethod: "UPI AutoPay (Google Pay •• 7109)",
    status: "SUCCESS",
    paymentReference: "UPI/20261005/710928341",
    providerReference: "pay_Ntf710928",
    description: "Monthly recurring AutoPay debit for 4K UHD Plan",
    idempotencyKey: "idem_tx_sub1_20261005",
    mandateId: "mnd-1",
  },
  {
    id: "tx-2",
    subscriptionId: "sub-2",
    subscriptionName: "Spotify",
    category: "music",
    amount: 119.0,
    currency: "₹",
    currencyCode: "INR",
    originalAmount: 119.0,
    originalCurrency: "INR",
    inrEquivalent: 119.0,
    basePrice: 100.85,
    taxRate: 18,
    taxAmount: 18.15,
    taxApplicable: true,
    date: "08/10/2026",
    rawDate: "2026-10-08T09:30:00+05:30",
    paymentMethod: "HDFC RuPay Card (•• 3014)",
    status: "SUCCESS",
    paymentReference: "PG/HDFC/20261008/301499",
    providerReference: "pay_Sp301499",
    description: "Monthly recurring individual plan renewal",
    idempotencyKey: "idem_tx_sub2_20261008",
    mandateId: "mnd-2",
  },
  {
    id: "tx-3",
    subscriptionId: "sub-9",
    subscriptionName: "ChatGPT Plus",
    category: "software",
    amount: 1999.0,
    currency: "₹",
    currencyCode: "INR",
    originalAmount: 1999.0,
    originalCurrency: "INR",
    inrEquivalent: 1999.0,
    basePrice: 1694.07,
    taxRate: 18,
    taxAmount: 304.93,
    taxApplicable: true,
    date: "04/10/2026",
    rawDate: "2026-10-04T16:45:00+05:30",
    paymentMethod: "ICICI Credit Card (•• 3014)",
    status: "SUCCESS",
    paymentReference: "TXN/ICICI/20261004/89123",
    providerReference: "pay_OAI89123",
    description: "Monthly subscription - GPT-4o & Canvas",
    idempotencyKey: "idem_tx_sub9_20261004",
  },
  {
    id: "tx-4",
    subscriptionId: "sub-6",
    subscriptionName: "Microsoft 365",
    category: "software",
    amount: 6199.0,
    currency: "₹",
    currencyCode: "INR",
    originalAmount: 6199.0,
    originalCurrency: "INR",
    inrEquivalent: 6199.0,
    basePrice: 5253.39,
    taxRate: 18,
    taxAmount: 945.61,
    taxApplicable: true,
    date: "15/01/2026",
    rawDate: "2026-01-15T11:20:00+05:30",
    paymentMethod: "HDFC Corporate Card (•• 8812)",
    status: "SUCCESS",
    paymentReference: "TXN/HDFC/20260115/4412",
    providerReference: "pay_MSFT4412",
    description: "Annual Family license with 6TB cloud storage",
    gstin: "27AAPFU0939F1ZV",
    idempotencyKey: "idem_tx_sub6_20260115",
  },
  {
    id: "tx-5",
    subscriptionId: "sub-4",
    subscriptionName: "Amazon Prime",
    category: "utilities",
    amount: 299.0,
    currency: "₹",
    currencyCode: "INR",
    originalAmount: 299.0,
    originalCurrency: "INR",
    inrEquivalent: 299.0,
    basePrice: 253.39,
    taxRate: 18,
    taxAmount: 45.61,
    taxApplicable: true,
    date: "18/09/2026",
    rawDate: "2026-09-18T14:10:00+05:30",
    paymentMethod: "Amazon Pay UPI",
    status: "SUCCESS",
    paymentReference: "UPI/20260918/99812",
    providerReference: "pay_AMZN99812",
    description: "Monthly Prime membership",
    idempotencyKey: "idem_tx_sub4_20260918",
  },
  {
    id: "tx-6",
    subscriptionId: "sub-8",
    subscriptionName: "JioCinema Premium",
    category: "streaming",
    amount: 89.0,
    currency: "₹",
    currencyCode: "INR",
    originalAmount: 89.0,
    originalCurrency: "INR",
    inrEquivalent: 89.0,
    basePrice: 75.42,
    taxRate: 18,
    taxAmount: 13.58,
    taxApplicable: true,
    date: "02/10/2026",
    rawDate: "2026-10-02T19:00:00+05:30",
    paymentMethod: "JioPay UPI",
    status: "FAILED",
    paymentReference: "UPI/20261002/00145",
    failureReason: "Auto-debit declined by issuing bank (Card inactive)",
    description: "Monthly subscription failed debit",
    idempotencyKey: "idem_tx_sub8_20261002",
  },
];

// ==============================================================================
// 4. STORAGE HELPERS
// ==============================================================================

const getMethodsKey = async (): Promise<string> => {
  const session = await getSession();
  return session?.id ? `@recurly_payment_methods_${session.id}` : "@recurly_payment_methods_demo";
};

const getMandatesKey = async (): Promise<string> => {
  const session = await getSession();
  return session?.id ? `@recurly_mandates_${session.id}` : "@recurly_mandates_demo";
};

const getTransactionsKey = async (): Promise<string> => {
  const session = await getSession();
  return session?.id ? `@recurly_detailed_txs_${session.id}` : "@recurly_detailed_txs_demo";
};

// ==============================================================================
// 5. PAYMENT METHODS SERVICE (CRUD & RLS)
// ==============================================================================

export const getSavedPaymentMethods = async (): Promise<SavedPaymentMethod[]> => {
  const session = await getSession();

  // 1. SUPABASE
  if (isSupabaseConfigured() && session?.id) {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", session.id)
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          methodType: d.method_type as IndianPaymentCategory,
          providerName: d.provider_name,
          accountIdentifier: d.account_identifier,
          vpa: d.vpa,
          isDefault: d.is_default ?? false,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
      }
    }
  }

  // 2. LOCAL ASYNC STORAGE FALLBACK
  try {
    const key = await getMethodsKey();
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    await AsyncStorage.setItem(key, JSON.stringify(DEFAULT_SAVED_PAYMENT_METHODS));
    return DEFAULT_SAVED_PAYMENT_METHODS;
  } catch {
    return DEFAULT_SAVED_PAYMENT_METHODS;
  }
};

export const savePaymentMethod = async (
  method: Omit<SavedPaymentMethod, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<SavedPaymentMethod> => {
  const session = await getSession();
  const now = new Date().toISOString();
  const userId = session?.id || "demo-user";

  const maskedVpaVal = method.vpa ? maskVpa(method.vpa) : undefined;
  const maskedAccVal = method.accountIdentifier
    ? maskCardOrAccount(method.accountIdentifier)
    : undefined;

  // 1. SUPABASE
  if (isSupabaseConfigured() && session?.id) {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("payment_methods")
        .insert({
          user_id: session.id,
          method_type: method.methodType,
          provider_name: method.providerName.trim(),
          account_identifier: maskedAccVal || null,
          vpa: maskedVpaVal || null,
          is_default: method.isDefault,
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          userId: data.user_id,
          methodType: data.method_type,
          providerName: data.provider_name,
          accountIdentifier: data.account_identifier,
          vpa: data.vpa,
          isDefault: data.is_default,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    }
  }

  // 2. LOCAL ASYNC STORAGE FALLBACK
  const existing = await getSavedPaymentMethods();
  const newMethod: SavedPaymentMethod = {
    id: `pm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId,
    methodType: method.methodType,
    providerName: method.providerName.trim(),
    accountIdentifier: maskedAccVal,
    vpa: maskedVpaVal,
    isDefault: method.isDefault,
    createdAt: now,
    updatedAt: now,
  };

  const updated = [newMethod, ...existing];
  const key = await getMethodsKey();
  await AsyncStorage.setItem(key, JSON.stringify(updated));
  return newMethod;
};

export const deletePaymentMethod = async (methodId: string): Promise<boolean> => {
  const session = await getSession();

  if (isSupabaseConfigured() && session?.id) {
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", methodId)
        .eq("user_id", session.id);

      if (!error) return true;
    }
  }

  const existing = await getSavedPaymentMethods();
  const filtered = existing.filter((m) => m.id !== methodId);
  const key = await getMethodsKey();
  await AsyncStorage.setItem(key, JSON.stringify(filtered));
  return true;
};

// ==============================================================================
// 6. UPI AUTOPAY & MANDATE MANAGEMENT SERVICE
// ==============================================================================

export const getPaymentMandates = async (): Promise<PaymentMandate[]> => {
  const session = await getSession();

  // 1. SUPABASE
  if (isSupabaseConfigured() && session?.id) {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("payment_mandates")
        .select("*, subscriptions(name)")
        .eq("user_id", session.id)
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          subscriptionId: d.subscription_id,
          subscriptionName: d.subscriptions?.name || "Subscription",
          mandateRefId: d.mandate_ref_id,
          status: d.status as MandateStatus,
          frequency: d.frequency as BillingCycle,
          maxAmount: Number(d.max_amount),
          currency: d.currency || "INR",
          paymentMethodType: d.payment_method_type,
          vpa: d.vpa,
          startDate: d.start_date,
          expiryDate: d.expiry_date,
          nextExpectedDebitDate: d.next_expected_debit_date,
          lastDebitDate: d.last_debit_date,
          cancellationReason: d.cancellation_reason,
          autoPayEnabled: d.auto_pay_enabled ?? true,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
      }
    }
  }

  // 2. LOCAL ASYNC STORAGE FALLBACK
  try {
    const key = await getMandatesKey();
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    await AsyncStorage.setItem(key, JSON.stringify(DEFAULT_MANDATES));
    return DEFAULT_MANDATES;
  } catch {
    return DEFAULT_MANDATES;
  }
};

export const getMandateBySubscriptionId = async (
  subscriptionId: string
): Promise<PaymentMandate | null> => {
  const mandates = await getPaymentMandates();
  return (
    mandates.find(
      (m) => m.subscriptionId === subscriptionId && m.status !== "REVOKED"
    ) || null
  );
};

export const createOrUpdateMandate = async (
  mandateInput: Partial<PaymentMandate> & {
    subscriptionId: string;
    maxAmount: number;
    frequency?: BillingCycle;
  }
): Promise<PaymentMandate> => {
  const session = await getSession();
  const now = new Date().toISOString();
  const userId = session?.id || "demo-user";

  const existing = await getPaymentMandates();
  const existingMandate = existing.find(
    (m) => m.subscriptionId === mandateInput.subscriptionId
  );

  const mandateRefId =
    mandateInput.mandateRefId ||
    existingMandate?.mandateRefId ||
    generateDemoUMN();

  const nextDebit =
    mandateInput.nextExpectedDebitDate ||
    existingMandate?.nextExpectedDebitDate ||
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const payload: PaymentMandate = {
    id: existingMandate?.id || `mnd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId,
    subscriptionId: mandateInput.subscriptionId,
    subscriptionName: mandateInput.subscriptionName || existingMandate?.subscriptionName,
    mandateRefId,
    status: (mandateInput.status || existingMandate?.status || "ACTIVE") as MandateStatus,
    frequency: mandateInput.frequency || existingMandate?.frequency || "monthly",
    maxAmount: mandateInput.maxAmount,
    currency: mandateInput.currency || existingMandate?.currency || "INR",
    paymentMethodType:
      mandateInput.paymentMethodType ||
      existingMandate?.paymentMethodType ||
      "UPI AutoPay",
    vpa: mandateInput.vpa || existingMandate?.vpa,
    startDate: mandateInput.startDate || existingMandate?.startDate || now.slice(0, 10),
    expiryDate:
      mandateInput.expiryDate ||
      existingMandate?.expiryDate ||
      new Date(Date.now() + 5 * 365 * 86400000).toISOString().slice(0, 10),
    nextExpectedDebitDate: nextDebit,
    lastDebitDate: mandateInput.lastDebitDate || existingMandate?.lastDebitDate,
    cancellationReason: mandateInput.cancellationReason,
    autoPayEnabled: mandateInput.autoPayEnabled ?? existingMandate?.autoPayEnabled ?? true,
    createdAt: existingMandate?.createdAt || now,
    updatedAt: now,
  };

  // 1. SUPABASE
  if (isSupabaseConfigured() && session?.id) {
    const supabase = getSupabase();
    if (supabase) {
      if (existingMandate?.id) {
        await supabase
          .from("payment_mandates")
          .update({
            status: payload.status,
            max_amount: payload.maxAmount,
            frequency: payload.frequency,
            next_expected_debit_date: payload.nextExpectedDebitDate,
            last_debit_date: payload.lastDebitDate,
            cancellation_reason: payload.cancellationReason || null,
            auto_pay_enabled: payload.autoPayEnabled,
            updated_at: now,
          })
          .eq("id", existingMandate.id)
          .eq("user_id", session.id);
      } else {
        await supabase.from("payment_mandates").insert({
          user_id: session.id,
          subscription_id: payload.subscriptionId,
          mandate_ref_id: payload.mandateRefId,
          status: payload.status,
          frequency: payload.frequency,
          max_amount: payload.maxAmount,
          currency: payload.currency,
          payment_method_type: payload.paymentMethodType,
          vpa: payload.vpa || null,
          start_date: payload.startDate,
          expiry_date: payload.expiryDate || null,
          next_expected_debit_date: payload.nextExpectedDebitDate || null,
          last_debit_date: payload.lastDebitDate || null,
          cancellation_reason: payload.cancellationReason || null,
          auto_pay_enabled: payload.autoPayEnabled,
        });
      }
    }
  }

  // 2. LOCAL ASYNC STORAGE
  const key = await getMandatesKey();
  const list = existing.filter((m) => m.id !== payload.id);
  const updatedList = [payload, ...list];
  await AsyncStorage.setItem(key, JSON.stringify(updatedList));

  return payload;
};

export const updateMandateStatus = async (
  mandateId: string,
  targetStatus: MandateStatus,
  reason?: string
): Promise<boolean> => {
  const session = await getSession();
  const now = new Date().toISOString();

  // 1. SUPABASE
  if (isSupabaseConfigured() && session?.id) {
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase
        .from("payment_mandates")
        .update({
          status: targetStatus,
          auto_pay_enabled: targetStatus === "ACTIVE",
          cancellation_reason: reason || null,
          updated_at: now,
        })
        .eq("id", mandateId)
        .eq("user_id", session.id);

      if (!error) return true;
    }
  }

  // 2. LOCAL STORAGE
  const list = await getPaymentMandates();
  const idx = list.findIndex((m) => m.id === mandateId);
  if (idx === -1) return false;

  list[idx] = {
    ...list[idx],
    status: targetStatus,
    autoPayEnabled: targetStatus === "ACTIVE",
    cancellationReason: reason || list[idx].cancellationReason,
    updatedAt: now,
  };

  const key = await getMandatesKey();
  await AsyncStorage.setItem(key, JSON.stringify(list));
  return true;
};

// ==============================================================================
// 7. COMPREHENSIVE PAYMENT TRANSACTION SERVICE
// ==============================================================================

export const getAllTransactions = async (filters?: {
  status?: string;
  paymentMethod?: string;
  subscriptionId?: string;
}): Promise<DetailedPaymentTransaction[]> => {
  const session = await getSession();

  let results: DetailedPaymentTransaction[] = [];

  // 1. SUPABASE
  if (isSupabaseConfigured() && session?.id) {
    const supabase = getSupabase();
    if (supabase) {
      let query = supabase
        .from("payment_transactions")
        .select("*")
        .eq("user_id", session.id)
        .order("payment_date", { ascending: false });

      if (filters?.subscriptionId) {
        query = query.eq("subscription_id", filters.subscriptionId);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        results = data.map((t: any) => ({
          id: t.id,
          subscriptionId: t.subscription_id || "",
          subscriptionName: t.subscription_name,
          category: (t.category_id || "other") as SubscriptionCategory,
          amount: Number(t.amount),
          currency: t.currency === "INR" || t.currency === "₹" ? "₹" : t.currency,
          currencyCode: (t.currency_code as SupportedCurrency) || "INR",
          originalAmount: t.original_amount ? Number(t.original_amount) : Number(t.amount),
          originalCurrency: t.original_currency || t.currency || "INR",
          inrEquivalent: t.inr_equivalent ? Number(t.inr_equivalent) : Number(t.amount),
          basePrice: t.base_price ? Number(t.base_price) : undefined,
          taxRate: t.tax_rate ? Number(t.tax_rate) : undefined,
          taxAmount: t.tax_amount ? Number(t.tax_amount) : undefined,
          taxApplicable: t.tax_applicable ?? false,
          date: formatIndianDate(t.payment_date),
          rawDate: t.payment_date || t.created_at,
          paymentMethod: t.payment_method,
          status: (t.status === "paid" ? "SUCCESS" : t.status?.toUpperCase()) as PaymentTransactionStatus,
          paymentReference: t.payment_reference || t.invoice_number,
          providerReference: t.provider_reference,
          description: t.description,
          idempotencyKey: t.idempotency_key,
          failureReason: t.failure_reason,
          gstin: t.gstin,
          mandateId: t.mandate_id,
        }));
      }
    }
  }

  // 2. LOCAL ASYNC STORAGE FALLBACK
  if (results.length === 0) {
    try {
      const key = await getTransactionsKey();
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          results = parsed;
        }
      }
      if (results.length === 0) {
        results = DEFAULT_DETAILED_TRANSACTIONS;
        await AsyncStorage.setItem(key, JSON.stringify(DEFAULT_DETAILED_TRANSACTIONS));
      }
    } catch {
      results = DEFAULT_DETAILED_TRANSACTIONS;
    }
  }

  // Apply in-memory filters if needed
  if (filters?.status && filters.status !== "ALL") {
    results = results.filter(
      (t) =>
        t.status === filters.status ||
        (filters.status === "SUCCESS" && t.status === "paid")
    );
  }

  if (filters?.paymentMethod && filters.paymentMethod !== "ALL") {
    results = results.filter((t) =>
      t.paymentMethod.toLowerCase().includes(filters.paymentMethod!.toLowerCase())
    );
  }

  if (filters?.subscriptionId) {
    results = results.filter((t) => t.subscriptionId === filters.subscriptionId);
  }

  return results;
};

/**
 * Record a payment transaction with idempotency protection and GST calculation.
 * Never automatically marks successful without explicit user/provider confirmation.
 */
export const recordPaymentTransaction = async (
  input: {
    subscriptionId: string;
    subscriptionName: string;
    category?: SubscriptionCategory;
    amount: number;
    currency?: string;
    currencyCode?: SupportedCurrency;
    paymentMethod: string;
    status: PaymentTransactionStatus;
    paymentReference?: string;
    description?: string;
    failureReason?: string;
    idempotencyKey?: string;
    taxApplicable?: boolean;
    taxRate?: number;
    gstin?: string;
    mandateId?: string;
  }
): Promise<DetailedPaymentTransaction> => {
  const session = await getSession();
  const now = new Date();
  const rawDate = now.toISOString();
  const dateFormatted = formatIndianDate(rawDate);
  const currencyCode = input.currencyCode || "INR";
  const currencySymbol = currencyCode === "INR" ? "₹" : input.currency || "₹";

  const idempotencyKey =
    input.idempotencyKey ||
    `idem_${input.subscriptionId}_${now.getTime()}_${Math.random().toString(36).substring(2, 6)}`;

  // Idempotency check: prevent duplicate submissions
  const existingTxs = await getAllTransactions();
  const existingDup = existingTxs.find((t) => t.idempotencyKey === idempotencyKey);
  if (existingDup) {
    return existingDup;
  }

  // Calculate GST breakdown
  const gstBreakdown = calculateGST(input.amount, {
    taxApplicable: input.taxApplicable,
    taxRate: input.taxRate,
    taxInclusive: true,
    gstin: input.gstin,
  });

  const txId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const paymentRef = input.paymentReference || generateDemoUTR();

  const newTx: DetailedPaymentTransaction = {
    id: txId,
    subscriptionId: input.subscriptionId,
    subscriptionName: input.subscriptionName,
    category: input.category || "other",
    amount: input.amount,
    currency: currencySymbol,
    currencyCode,
    originalAmount: input.amount,
    originalCurrency: currencyCode,
    inrEquivalent: currencyCode === "INR" ? input.amount : input.amount * 84, // Verified reference
    basePrice: gstBreakdown.basePrice,
    taxRate: gstBreakdown.taxRate,
    taxAmount: gstBreakdown.taxAmount,
    taxApplicable: input.taxApplicable ?? true,
    date: dateFormatted,
    rawDate,
    paymentMethod: input.paymentMethod,
    status: input.status,
    paymentReference: paymentRef,
    description: input.description || `Payment record for ${input.subscriptionName}`,
    idempotencyKey,
    failureReason: input.failureReason,
    gstin: input.gstin,
    mandateId: input.mandateId,
  };

  // 1. SUPABASE
  if (isSupabaseConfigured() && session?.id) {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from("payment_transactions").insert({
        user_id: session.id,
        subscription_id: input.subscriptionId,
        subscription_name: input.subscriptionName,
        category_id: input.category || "other",
        amount: input.amount,
        currency: currencyCode,
        currency_code: currencyCode,
        original_amount: input.amount,
        original_currency: currencyCode,
        inr_equivalent: newTx.inrEquivalent,
        base_price: gstBreakdown.basePrice,
        tax_rate: gstBreakdown.taxRate,
        tax_amount: gstBreakdown.taxAmount,
        tax_applicable: input.taxApplicable ?? true,
        payment_date: rawDate.slice(0, 10),
        payment_method: input.paymentMethod,
        status: input.status === "SUCCESS" ? "paid" : input.status.toLowerCase(),
        payment_reference: paymentRef,
        description: newTx.description,
        idempotency_key: idempotencyKey,
        failure_reason: input.failureReason || null,
        gstin: input.gstin || null,
        mandate_id: input.mandateId || null,
      });
    }
  }

  // 2. LOCAL ASYNC STORAGE
  const key = await getTransactionsKey();
  const updatedList = [newTx, ...existingTxs];
  await AsyncStorage.setItem(key, JSON.stringify(updatedList));

  return newTx;
};

/**
 * Edit / correct manually recorded transaction details
 */
export const updatePaymentTransaction = async (
  txId: string,
  updates: Partial<DetailedPaymentTransaction>
): Promise<DetailedPaymentTransaction | null> => {
  const session = await getSession();

  // 1. SUPABASE
  if (isSupabaseConfigured() && session?.id) {
    const supabase = getSupabase();
    if (supabase) {
      const payload: Record<string, any> = {};
      if (updates.status !== undefined) {
        payload.status = updates.status === "SUCCESS" ? "paid" : updates.status.toLowerCase();
      }
      if (updates.paymentMethod !== undefined) payload.payment_method = updates.paymentMethod;
      if (updates.paymentReference !== undefined) payload.payment_reference = updates.paymentReference;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.failureReason !== undefined) payload.failure_reason = updates.failureReason;

      await supabase
        .from("payment_transactions")
        .update(payload)
        .eq("id", txId)
        .eq("user_id", session.id);
    }
  }

  // 2. LOCAL ASYNC STORAGE
  const all = await getAllTransactions();
  const idx = all.findIndex((t) => t.id === txId);
  if (idx === -1) return null;

  all[idx] = {
    ...all[idx],
    ...updates,
  };

  const key = await getTransactionsKey();
  await AsyncStorage.setItem(key, JSON.stringify(all));
  return all[idx];
};

/**
 * Computes aggregate summary metrics for transaction reporting
 */
export const getTransactionMetrics = (transactions: DetailedPaymentTransaction[]) => {
  const totalCount = transactions.length;
  const successfulList = transactions.filter(
    (t) => t.status === "SUCCESS" || t.status === "paid"
  );
  const failedList = transactions.filter((t) => t.status === "FAILED");
  const pendingList = transactions.filter(
    (t) => t.status === "PENDING" || t.status === "INITIATED"
  );
  const refundedList = transactions.filter(
    (t) => t.status === "REFUNDED" || t.status === "CANCELLED"
  );

  const totalAmountPaidINR = successfulList.reduce(
    (acc, curr) => acc + (curr.inrEquivalent || curr.amount || 0),
    0
  );

  return {
    totalCount,
    successCount: successfulList.length,
    failedCount: failedList.length,
    pendingCount: pendingList.length,
    refundedCount: refundedList.length,
    totalAmountPaidINR: Math.round((totalAmountPaidINR + Number.EPSILON) * 100) / 100,
  };
};

// ==============================================================================
// 8. PAYMENT RECEIPT GENERATOR
// ==============================================================================

/**
 * Builds a structured receipt object with Indian date/time and legal disclaimers.
 * Explicitly states: "This is an electronic payment transaction receipt generated by
 * Recurly Fintech for personal expense tracking. This is NOT a GST Tax Invoice."
 */
export const buildPaymentReceipt = (
  tx: DetailedPaymentTransaction
): PaymentReceipt => {
  const isTaxTracked = tx.taxApplicable ?? true;
  const taxRate = tx.taxRate ?? 18;
  const basePrice =
    tx.basePrice || (isTaxTracked ? tx.amount / (1 + taxRate / 100) : tx.amount);
  const taxAmount = tx.taxAmount || (isTaxTracked ? tx.amount - basePrice : 0);

  // Split equally between CGST and SGST for intra-state Indian supply
  const cgst = Math.round((taxAmount / 2 + Number.EPSILON) * 100) / 100;
  const sgst = Math.round((taxAmount / 2 + Number.EPSILON) * 100) / 100;

  return {
    receiptNumber: `REC-${new Date(tx.rawDate || Date.now()).getFullYear()}-${tx.id.replace(/\D/g, "").slice(-5) || "94821"}`,
    transactionReference: tx.paymentReference || generateDemoUTR(),
    subscriptionName: tx.subscriptionName,
    category: tx.category,
    paymentDateFormatted: tx.date || formatIndianDate(tx.rawDate),
    paymentTimeFormatted: formatIndianTime(tx.rawDate),
    paymentMethod: tx.paymentMethod,
    currency: tx.currency || "₹",
    currencyCode: tx.currencyCode || "INR",
    baseAmount: Math.round((basePrice + Number.EPSILON) * 100) / 100,
    taxApplicable: isTaxTracked,
    taxRate,
    cgstAmount: cgst,
    sgstAmount: sgst,
    taxAmount: Math.round((taxAmount + Number.EPSILON) * 100) / 100,
    totalAmount: tx.amount,
    status: tx.status,
    mandateRefId: tx.mandateId,
    gstin: tx.gstin,
    isCompliantInvoice: false,
    disclaimer:
      "This is an electronic payment transaction receipt generated by Recurly Fintech for personal financial records. This document is NOT a Tax Invoice under Section 31 of the CGST Act, 2017. For tax compliance and Input Tax Credit (ITC) filing, please refer to the official tax invoice provided by the respective merchant/service provider.",
  };
};
