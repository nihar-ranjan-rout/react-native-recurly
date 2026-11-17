import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSession } from "@/lib/auth";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  calculateGST,
  formatIndianDate,
  formatIndianDateWithMonth,
  SYMBOL_TO_CURRENCY_CODE,
} from "@/lib/localization";

export type SubscriptionCategory =
  | "streaming"
  | "music"
  | "cloud"
  | "gaming"
  | "fitness"
  | "reading"
  | "software"
  | "utilities"
  | "other";

export type BillingCycle =
  | "monthly"
  | "yearly"
  | "weekly"
  | "quarterly"
  | "half-yearly"
  | "custom";

export type SubscriptionStatus = "active" | "paused" | "cancelled";

export type Subscription = {
  id: string;
  name: string;
  category: SubscriptionCategory;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  customCycleDays?: number;
  firstBillDate?: string;
  nextPaymentDate: string; // ISO date string YYYY-MM-DD
  paymentMethod: string;
  notes?: string;
  website?: string;
  active: boolean;
  status?: SubscriptionStatus;
  remindMe: boolean;
  reminderDays?: number; // 0 (none), 1, 3, 7, 14
  color?: string;
  // GST Tracking (Phase 2)
  taxApplicable?: boolean;
  taxRate?: number; // 0, 5, 12, 18, 28
  taxInclusive?: boolean; // default true
  basePrice?: number;
  taxAmount?: number;
  gstin?: string;
  currencyCode?: string;
  // Indian Payment Rails & Mandates (Phase 3)
  autoPayEnabled?: boolean;
  mandateMaxAmount?: number;
  mandateRefId?: string;
  mandateStatus?:
    | "NOT_CREATED"
    | "PENDING"
    | "ACTIVE"
    | "PAUSED"
    | "FAILED"
    | "REVOKED"
    | "EXPIRED";
  lastPaymentDate?: string;
  lastPaymentStatus?: string;
  createdAt?: string;
  updatedAt?: string;
};

export interface PaymentTransaction {
  id: string;
  subscriptionId: string;
  subscriptionName: string;
  category: SubscriptionCategory;
  amount: number;
  currency: string;
  date: string;
  paymentMethod: string;
  status: "paid" | "pending" | "failed";
  taxApplicable?: boolean;
  taxRate?: number;
  taxAmount?: number;
  basePrice?: number;
  gstin?: string;
  currencyCode?: string;
}

const GLOBAL_SUBSCRIPTIONS_KEY = "@recurly_subscriptions_v2";

const getUserStorageKey = async (): Promise<string> => {
  const session = await getSession();
  return session?.id
    ? `@recurly_subs_user_${session.id}`
    : GLOBAL_SUBSCRIPTIONS_KEY;
};

export const DEFAULT_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "sub-1",
    name: "Netflix",
    category: "streaming",
    price: 649.0,
    currency: "₹",
    currencyCode: "INR",
    billingCycle: "monthly",
    nextPaymentDate: "2026-11-05",
    paymentMethod: "UPI (Google Pay •• 7109)",
    notes: "4K UHD Family plan with 4 screens",
    active: true,
    status: "active",
    remindMe: true,
    reminderDays: 3,
    taxApplicable: true,
    taxRate: 18,
    taxInclusive: true,
    basePrice: 550.0,
    taxAmount: 99.0,
    autoPayEnabled: true,
    mandateMaxAmount: 1000.0,
    mandateRefId: "UMN-2026-48912",
    mandateStatus: "ACTIVE",
    lastPaymentDate: "2026-10-05",
    lastPaymentStatus: "SUCCESS",
  },
  {
    id: "sub-2",
    name: "Spotify",
    category: "music",
    price: 119.0,
    currency: "₹",
    currencyCode: "INR",
    billingCycle: "monthly",
    nextPaymentDate: "2026-11-08",
    paymentMethod: "HDFC Visa (•• 3014)",
    notes: "Individual Premium with lossless audio",
    active: true,
    status: "active",
    remindMe: true,
    reminderDays: 1,
    taxApplicable: true,
    taxRate: 18,
    taxInclusive: true,
    basePrice: 100.85,
    taxAmount: 18.15,
    autoPayEnabled: true,
    mandateMaxAmount: 500.0,
    mandateRefId: "UMN-2026-12048",
    mandateStatus: "ACTIVE",
    lastPaymentDate: "2026-10-08",
    lastPaymentStatus: "SUCCESS",
  },
  {
    id: "sub-3",
    name: "YouTube Premium",
    category: "streaming",
    price: 149.0,
    currency: "₹",
    currencyCode: "INR",
    billingCycle: "monthly",
    nextPaymentDate: "2026-11-12",
    paymentMethod: "UPI (PhonePe •• 4291)",
    notes: "Ad-free videos, background play, and YouTube Music",
    active: true,
    status: "active",
    remindMe: false,
    reminderDays: 0,
    taxApplicable: true,
    taxRate: 18,
    taxInclusive: true,
    basePrice: 126.27,
    taxAmount: 22.73,
  },
  {
    id: "sub-4",
    name: "Amazon Prime",
    category: "utilities",
    price: 299.0,
    currency: "₹",
    currencyCode: "INR",
    billingCycle: "monthly",
    nextPaymentDate: "2026-11-18",
    paymentMethod: "Amazon Pay UPI",
    notes: "Free 1-day delivery and Prime Video catalog",
    active: true,
    status: "active",
    remindMe: true,
    reminderDays: 3,
    taxApplicable: true,
    taxRate: 18,
    taxInclusive: true,
    basePrice: 253.39,
    taxAmount: 45.61,
  },
  {
    id: "sub-5",
    name: "Disney+ Hotstar",
    category: "streaming",
    price: 299.0,
    currency: "₹",
    currencyCode: "INR",
    billingCycle: "quarterly",
    nextPaymentDate: "2026-11-22",
    paymentMethod: "Paytm UPI (•• 8812)",
    notes: "Super Plan - Live sports, movies, and HBO catalog",
    active: true,
    status: "active",
    remindMe: true,
    reminderDays: 7,
    taxApplicable: true,
    taxRate: 18,
    taxInclusive: true,
    basePrice: 253.39,
    taxAmount: 45.61,
    autoPayEnabled: false,
    mandateMaxAmount: 899.0,
    mandateRefId: "UMN-2026-88129",
    mandateStatus: "PAUSED",
    lastPaymentDate: "2026-08-22",
    lastPaymentStatus: "SUCCESS",
  },
  {
    id: "sub-6",
    name: "Microsoft 365",
    category: "software",
    price: 6199.0,
    currency: "₹",
    currencyCode: "INR",
    billingCycle: "yearly",
    nextPaymentDate: "2027-01-15",
    paymentMethod: "HDFC Corporate Card (•• 8812)",
    notes: "Family edition (6 licenses + 6TB OneDrive) - Input Tax Credit Claimable",
    active: true,
    status: "active",
    remindMe: true,
    reminderDays: 14,
    taxApplicable: true,
    taxRate: 18,
    taxInclusive: true,
    basePrice: 5253.39,
    taxAmount: 945.61,
    gstin: "27AAPFU0939F1ZV",
  },
  {
    id: "sub-7",
    name: "Google One",
    category: "cloud",
    price: 130.0,
    currency: "₹",
    currencyCode: "INR",
    billingCycle: "monthly",
    nextPaymentDate: "2026-11-27",
    paymentMethod: "Google Pay (•• 7109)",
    notes: "100GB Cloud Storage and Magic Editor",
    active: true,
    status: "active",
    remindMe: false,
    reminderDays: 0,
    taxApplicable: true,
    taxRate: 18,
    taxInclusive: true,
    basePrice: 110.17,
    taxAmount: 19.83,
  },
  {
    id: "sub-8",
    name: "JioCinema Premium",
    category: "streaming",
    price: 89.0,
    currency: "₹",
    currencyCode: "INR",
    billingCycle: "monthly",
    nextPaymentDate: "2026-12-02",
    paymentMethod: "JioPay UPI",
    notes: "4K Hollywood movies and peacock series",
    active: false,
    status: "paused",
    remindMe: false,
    reminderDays: 0,
    taxApplicable: true,
    taxRate: 18,
    taxInclusive: true,
    basePrice: 75.42,
    taxAmount: 13.58,
    autoPayEnabled: false,
    mandateStatus: "FAILED",
    lastPaymentDate: "2026-10-02",
    lastPaymentStatus: "FAILED",
  },
  {
    id: "sub-9",
    name: "ChatGPT Plus",
    category: "software",
    price: 1999.0,
    currency: "₹",
    currencyCode: "INR",
    billingCycle: "monthly",
    nextPaymentDate: "2026-11-04",
    paymentMethod: "ICICI Credit Card (•• 3014)",
    notes: "GPT-4o, canvas, reasoning, and multimodal access",
    active: true,
    status: "active",
    remindMe: true,
    reminderDays: 1,
    taxApplicable: true,
    taxRate: 18,
    taxInclusive: true,
    basePrice: 1694.07,
    taxAmount: 304.93,
  },
  {
    id: "sub-10",
    name: "GitHub Copilot",
    category: "software",
    price: 850.0,
    currency: "₹",
    currencyCode: "INR",
    billingCycle: "monthly",
    nextPaymentDate: "2026-11-09",
    paymentMethod: "ICICI Credit Card (•• 3014)",
    notes: "AI pair programming developer seat",
    active: true,
    status: "active",
    remindMe: true,
    reminderDays: 2,
    taxApplicable: true,
    taxRate: 18,
    taxInclusive: true,
    basePrice: 720.34,
    taxAmount: 129.66,
  },
];

export const DEFAULT_TRANSACTIONS: PaymentTransaction[] = [
  {
    id: "tx-1",
    subscriptionId: "sub-1",
    subscriptionName: "Netflix",
    category: "streaming",
    amount: 649.0,
    currency: "₹",
    currencyCode: "INR",
    date: "05/10/2026",
    paymentMethod: "UPI (Google Pay •• 7109)",
    status: "paid",
    taxApplicable: true,
    taxRate: 18,
    taxAmount: 99.0,
    basePrice: 550.0,
  },
  {
    id: "tx-2",
    subscriptionId: "sub-2",
    subscriptionName: "Spotify",
    category: "music",
    amount: 119.0,
    currency: "₹",
    currencyCode: "INR",
    date: "08/10/2026",
    paymentMethod: "HDFC Visa (•• 3014)",
    status: "paid",
    taxApplicable: true,
    taxRate: 18,
    taxAmount: 18.15,
    basePrice: 100.85,
  },
  {
    id: "tx-3",
    subscriptionId: "sub-9",
    subscriptionName: "ChatGPT Plus",
    category: "software",
    amount: 1999.0,
    currency: "₹",
    currencyCode: "INR",
    date: "04/10/2026",
    paymentMethod: "ICICI Credit Card (•• 3014)",
    status: "paid",
    taxApplicable: true,
    taxRate: 18,
    taxAmount: 304.93,
    basePrice: 1694.07,
  },
  {
    id: "tx-4",
    subscriptionId: "sub-5",
    subscriptionName: "Disney+ Hotstar",
    category: "streaming",
    amount: 299.0,
    currency: "₹",
    currencyCode: "INR",
    date: "22/08/2026",
    paymentMethod: "Paytm UPI (•• 8812)",
    status: "paid",
    taxApplicable: true,
    taxRate: 18,
    taxAmount: 45.61,
    basePrice: 253.39,
  },
  {
    id: "tx-5",
    subscriptionId: "sub-4",
    subscriptionName: "Amazon Prime",
    category: "utilities",
    amount: 299.0,
    currency: "₹",
    currencyCode: "INR",
    date: "18/10/2026",
    paymentMethod: "Amazon Pay UPI",
    status: "paid",
    taxApplicable: true,
    taxRate: 18,
    taxAmount: 45.61,
    basePrice: 253.39,
  },
  {
    id: "tx-6",
    subscriptionId: "sub-7",
    subscriptionName: "Google One",
    category: "cloud",
    amount: 130.0,
    currency: "₹",
    currencyCode: "INR",
    date: "27/10/2026",
    paymentMethod: "Google Pay (•• 7109)",
    status: "paid",
    taxApplicable: true,
    taxRate: 18,
    taxAmount: 19.83,
    basePrice: 110.17,
  },
  {
    id: "tx-7",
    subscriptionId: "sub-10",
    subscriptionName: "GitHub Copilot",
    category: "software",
    amount: 850.0,
    currency: "₹",
    currencyCode: "INR",
    date: "02/11/2026",
    paymentMethod: "ICICI Credit Card (•• 3014)",
    status: "pending",
    taxApplicable: true,
    taxRate: 18,
    taxAmount: 129.66,
    basePrice: 720.34,
  },
];

const mapRowToSubscription = (row: any): Subscription => {
  const currencySymbol =
    row.currency === "INR" || row.currency === "₹"
      ? "₹"
      : row.currency === "USD" || row.currency === "$"
      ? "$"
      : row.currency === "EUR" || row.currency === "€"
      ? "€"
      : row.currency === "GBP" || row.currency === "£"
      ? "£"
      : "₹";

  return {
    id: row.id,
    name: row.name,
    category: (row.category_id || "other") as SubscriptionCategory,
    price: Number(row.price),
    currency: currencySymbol,
    currencyCode: row.currency_code || (row.currency === "₹" ? "INR" : "INR"),
    billingCycle: row.billing_cycle as BillingCycle,
    customCycleDays: row.custom_cycle_days ? Number(row.custom_cycle_days) : undefined,
    firstBillDate: row.first_bill_date || undefined,
    nextPaymentDate: row.next_payment_date,
    paymentMethod: row.payment_method,
    status: (row.status || "active") as SubscriptionStatus,
    active: row.active ?? true,
    remindMe: row.remind_me ?? true,
    reminderDays: row.reminder_days ?? 3,
    notes: row.notes || undefined,
    website: row.website || undefined,
    taxApplicable: row.tax_applicable ?? false,
    taxRate: row.tax_rate !== null && row.tax_rate !== undefined ? Number(row.tax_rate) : 18,
    taxInclusive: row.tax_inclusive ?? true,
    basePrice: row.base_price !== null && row.base_price !== undefined ? Number(row.base_price) : undefined,
    taxAmount: row.tax_amount !== null && row.tax_amount !== undefined ? Number(row.tax_amount) : undefined,
    gstin: row.gstin || undefined,
    autoPayEnabled: row.auto_pay_enabled ?? false,
    mandateMaxAmount: row.mandate_max_amount ? Number(row.mandate_max_amount) : undefined,
    mandateRefId: row.mandate_ref_id || undefined,
    mandateStatus: row.mandate_status || "NOT_CREATED",
    lastPaymentDate: row.last_payment_date || undefined,
    lastPaymentStatus: row.last_payment_status || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * FETCH USER-ISOLATED SUBSCRIPTIONS
 * Queries Supabase PostgreSQL with RLS when connected;
 * otherwise uses user-isolated local AsyncStorage.
 */
export const getSubscriptions = async (): Promise<Subscription[]> => {
  const session = await getSession();

  // 1. SUPABASE REAL BACKEND
  if (isSupabaseConfigured() && session?.id) {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", session.id)
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map(mapRowToSubscription);
      }
    }
  }

  // 2. ISOLATED LOCAL STORAGE FALLBACK
  try {
    const key = await getUserStorageKey();
    let raw = await AsyncStorage.getItem(key);

    // If user key empty, check global key for first-time migration
    if (!raw && key !== GLOBAL_SUBSCRIPTIONS_KEY) {
      raw = await AsyncStorage.getItem(GLOBAL_SUBSCRIPTIONS_KEY);
      if (raw) {
        await AsyncStorage.setItem(key, raw);
      }
    }

    if (!raw) {
      await AsyncStorage.setItem(key, JSON.stringify(DEFAULT_SUBSCRIPTIONS));
      return DEFAULT_SUBSCRIPTIONS;
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_SUBSCRIPTIONS;
  } catch (error) {
    console.error("Failed to load subscriptions:", error);
    return DEFAULT_SUBSCRIPTIONS;
  }
};

export const saveSubscriptions = async (
  subs: Subscription[]
): Promise<void> => {
  try {
    const key = await getUserStorageKey();
    await AsyncStorage.setItem(key, JSON.stringify(subs));
  } catch (error) {
    console.error("Failed to save subscriptions:", error);
  }
};

/**
 * FETCH PAYMENT HISTORY
 */
export const getPaymentHistory = async (): Promise<PaymentTransaction[]> => {
  const session = await getSession();

  if (isSupabaseConfigured() && session?.id) {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("user_id", session.id)
        .order("payment_date", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((t: any) => ({
          id: t.id,
          subscriptionId: t.subscription_id || "",
          subscriptionName: t.subscription_name,
          category: (t.category_id || "other") as SubscriptionCategory,
          amount: Number(t.amount),
          currency: t.currency === "INR" || t.currency === "₹" ? "₹" : t.currency,
          currencyCode: t.currency_code || (t.currency === "₹" ? "INR" : "INR"),
          date: formatIndianDate(t.payment_date),
          paymentMethod: t.payment_method,
          status: t.status as "paid" | "pending" | "failed",
          taxApplicable: t.tax_applicable ?? false,
          taxRate: t.tax_rate ? Number(t.tax_rate) : undefined,
          taxAmount: t.tax_amount ? Number(t.tax_amount) : undefined,
          basePrice: t.base_price ? Number(t.base_price) : undefined,
          gstin: t.gstin || undefined,
        }));
      }
    }
  }

  return DEFAULT_TRANSACTIONS;
};

export const getSubscriptionById = async (
  id: string
): Promise<Subscription | null> => {
  const session = await getSession();

  if (isSupabaseConfigured() && session?.id) {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("id", id)
        .eq("user_id", session.id)
        .single();

      if (!error && data) {
        return mapRowToSubscription(data);
      }
    }
  }

  const subs = await getSubscriptions();
  return subs.find((s) => s.id === id) || null;
};

export const checkDuplicateName = async (
  name: string,
  excludeId?: string
): Promise<boolean> => {
  const subs = await getSubscriptions();
  const trimmed = name.trim().toLowerCase();
  return subs.some(
    (s) => s.id !== excludeId && s.name.trim().toLowerCase() === trimmed
  );
};

export const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return "";
  return formatIndianDateWithMonth(dateStr);
};

/**
 * ADD NEW SUBSCRIPTION
 */
export const addSubscription = async (
  sub: Omit<Subscription, "id">
): Promise<Subscription> => {
  const session = await getSession();
  const now = new Date().toISOString();
  const status: SubscriptionStatus =
    sub.status || (sub.active ? "active" : "paused");

  // Compute GST breakdown
  const gstBreakdown = calculateGST(sub.price, {
    taxApplicable: sub.taxApplicable,
    taxRate: sub.taxRate,
    taxInclusive: sub.taxInclusive,
    gstin: sub.gstin,
  });

  const currencyCode =
    sub.currencyCode || SYMBOL_TO_CURRENCY_CODE[sub.currency] || "INR";

  // 1. SUPABASE REAL BACKEND
  if (isSupabaseConfigured() && session?.id) {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("subscriptions")
        .insert({
          user_id: session.id,
          name: sub.name.trim(),
          category_id: sub.category,
          price: sub.price,
          currency: currencyCode,
          currency_code: currencyCode,
          billing_cycle: sub.billingCycle,
          custom_cycle_days: sub.customCycleDays || null,
          first_bill_date: sub.firstBillDate || null,
          next_payment_date: sub.nextPaymentDate,
          payment_method: sub.paymentMethod,
          status,
          active: status === "active",
          remind_me: sub.remindMe,
          reminder_days: sub.reminderDays ?? 3,
          notes: sub.notes || null,
          website: sub.website || null,
          tax_applicable: sub.taxApplicable ?? false,
          tax_rate: gstBreakdown.taxRate,
          tax_inclusive: sub.taxInclusive ?? true,
          base_price: gstBreakdown.basePrice,
          tax_amount: gstBreakdown.taxAmount,
          gstin: sub.gstin || null,
        })
        .select()
        .single();

      if (!error && data) {
        return mapRowToSubscription(data);
      } else if (error) {
        console.error("Supabase insert error:", error);
      }
    }
  }

  // 2. ISOLATED LOCAL STORAGE FALLBACK
  const subs = await getSubscriptions();
  const newSub: Subscription = {
    ...sub,
    currencyCode,
    taxApplicable: sub.taxApplicable ?? false,
    taxRate: gstBreakdown.taxRate,
    taxInclusive: sub.taxInclusive ?? true,
    basePrice: gstBreakdown.basePrice,
    taxAmount: gstBreakdown.taxAmount,
    status,
    active: status === "active",
    createdAt: now,
    updatedAt: now,
    id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  };
  const updated = [newSub, ...subs];
  await saveSubscriptions(updated);
  return newSub;
};

/**
 * UPDATE SUBSCRIPTION
 */
export const updateSubscription = async (
  id: string,
  updates: Partial<Subscription>
): Promise<Subscription | null> => {
  const session = await getSession();
  const now = new Date().toISOString();

  let active = updates.active;
  let status = updates.status;

  if (status !== undefined && active === undefined) {
    active = status === "active";
  } else if (active !== undefined && status === undefined) {
    status = active ? "active" : "paused";
  }

  // 1. SUPABASE REAL BACKEND
  if (isSupabaseConfigured() && session?.id) {
    const supabase = getSupabase();
    if (supabase) {
      const payload: Record<string, any> = {};
      if (updates.name !== undefined) payload.name = updates.name.trim();
      if (updates.category !== undefined) payload.category_id = updates.category;
      if (updates.price !== undefined) payload.price = updates.price;
      if (updates.currency !== undefined) {
        const code = SYMBOL_TO_CURRENCY_CODE[updates.currency] || "INR";
        payload.currency = code;
        payload.currency_code = code;
      }
      if (updates.currencyCode !== undefined) {
        payload.currency_code = updates.currencyCode;
      }
      if (updates.billingCycle !== undefined)
        payload.billing_cycle = updates.billingCycle;
      if (updates.customCycleDays !== undefined)
        payload.custom_cycle_days = updates.customCycleDays;
      if (updates.nextPaymentDate !== undefined)
        payload.next_payment_date = updates.nextPaymentDate;
      if (updates.paymentMethod !== undefined)
        payload.payment_method = updates.paymentMethod;
      if (status !== undefined) payload.status = status;
      if (active !== undefined) payload.active = active;
      if (updates.remindMe !== undefined) payload.remind_me = updates.remindMe;
      if (updates.reminderDays !== undefined)
        payload.reminder_days = updates.reminderDays;
      if (updates.notes !== undefined) payload.notes = updates.notes;
      if (updates.website !== undefined) payload.website = updates.website;

      // GST tracking updates
      if (updates.taxApplicable !== undefined) payload.tax_applicable = updates.taxApplicable;
      if (updates.taxRate !== undefined) payload.tax_rate = updates.taxRate;
      if (updates.taxInclusive !== undefined) payload.tax_inclusive = updates.taxInclusive;
      if (updates.basePrice !== undefined) payload.base_price = updates.basePrice;
      if (updates.taxAmount !== undefined) payload.tax_amount = updates.taxAmount;
      if (updates.gstin !== undefined) payload.gstin = updates.gstin;

      const { data, error } = await supabase
        .from("subscriptions")
        .update(payload)
        .eq("id", id)
        .eq("user_id", session.id)
        .select()
        .single();

      if (!error && data) {
        return mapRowToSubscription(data);
      }
    }
  }

  // 2. ISOLATED LOCAL STORAGE FALLBACK
  const subs = await getSubscriptions();
  const index = subs.findIndex((s) => s.id === id);
  if (index === -1) return null;

  const current = subs[index];
  const mergedPrice = updates.price !== undefined ? updates.price : current.price;
  const mergedTaxApplicable =
    updates.taxApplicable !== undefined ? updates.taxApplicable : current.taxApplicable;
  const mergedTaxRate =
    updates.taxRate !== undefined ? updates.taxRate : current.taxRate;
  const mergedTaxInclusive =
    updates.taxInclusive !== undefined ? updates.taxInclusive : current.taxInclusive;
  const mergedGstin =
    updates.gstin !== undefined ? updates.gstin : current.gstin;

  const gstBreakdown = calculateGST(mergedPrice, {
    taxApplicable: mergedTaxApplicable,
    taxRate: mergedTaxRate,
    taxInclusive: mergedTaxInclusive,
    gstin: mergedGstin,
  });

  const updatedItem: Subscription = {
    ...current,
    ...updates,
    taxApplicable: mergedTaxApplicable,
    taxRate: gstBreakdown.taxRate,
    taxInclusive: mergedTaxInclusive,
    basePrice: gstBreakdown.basePrice,
    taxAmount: gstBreakdown.taxAmount,
    gstin: mergedGstin,
    ...(active !== undefined ? { active } : {}),
    ...(status !== undefined ? { status } : {}),
    updatedAt: now,
  };

  subs[index] = updatedItem;
  await saveSubscriptions(subs);
  return updatedItem;
};

/**
 * DELETE SUBSCRIPTION
 */
export const deleteSubscription = async (id: string): Promise<boolean> => {
  const session = await getSession();

  // 1. SUPABASE REAL BACKEND
  if (isSupabaseConfigured() && session?.id) {
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase
        .from("subscriptions")
        .delete()
        .eq("id", id)
        .eq("user_id", session.id);

      if (!error) return true;
    }
  }

  // 2. ISOLATED LOCAL STORAGE FALLBACK
  const subs = await getSubscriptions();
  const filtered = subs.filter((s) => s.id !== id);
  await saveSubscriptions(filtered);
  return true;
};

export const resetSubscriptionsToDefault = async (): Promise<
  Subscription[]
> => {
  await saveSubscriptions(DEFAULT_SUBSCRIPTIONS);
  return DEFAULT_SUBSCRIPTIONS;
};

// ============================================================================
// CALCULATION ENGINE (PRESERVED & EXPANDED FOR INDIAN BILLING CYCLES)
// Supports: weekly, monthly, quarterly, half-yearly, yearly, custom
// Avoids floating-point precision errors
// ============================================================================

export const calculateMonthlyEquivalent = (sub: Subscription): number => {
  const isInactive =
    !sub.active || sub.status === "paused" || sub.status === "cancelled";
  if (isInactive || !sub.price || sub.price <= 0) return 0;

  let monthly = 0;
  switch (sub.billingCycle) {
    case "weekly":
      // Standard accurate financial conversion (52 weeks / 12 months)
      monthly = sub.price * (52 / 12);
      break;
    case "monthly":
      monthly = sub.price;
      break;
    case "quarterly":
      monthly = sub.price / 3;
      break;
    case "half-yearly":
      monthly = sub.price / 6;
      break;
    case "yearly":
      monthly = sub.price / 12;
      break;
    case "custom": {
      const days = sub.customCycleDays && sub.customCycleDays > 0 ? sub.customCycleDays : 30;
      monthly = (sub.price / days) * (365 / 12);
      break;
    }
    default:
      monthly = sub.price;
  }

  return Math.round((monthly + Number.EPSILON) * 100) / 100;
};

export const calculateAnnualEquivalent = (sub: Subscription): number => {
  const isInactive =
    !sub.active || sub.status === "paused" || sub.status === "cancelled";
  if (isInactive || !sub.price || sub.price <= 0) return 0;

  let annual = 0;
  switch (sub.billingCycle) {
    case "weekly":
      annual = sub.price * 52;
      break;
    case "monthly":
      annual = sub.price * 12;
      break;
    case "quarterly":
      annual = sub.price * 4;
      break;
    case "half-yearly":
      annual = sub.price * 2;
      break;
    case "yearly":
      annual = sub.price;
      break;
    case "custom": {
      const days = sub.customCycleDays && sub.customCycleDays > 0 ? sub.customCycleDays : 30;
      annual = (sub.price / days) * 365;
      break;
    }
    default:
      annual = sub.price * 12;
  }

  return Math.round((annual + Number.EPSILON) * 100) / 100;
};

export const getDaysUntilDue = (dateStr: string): number => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateStr);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
};

export const getMetrics = (subs: Subscription[]) => {
  const activeSubs = subs.filter(
    (s) => s.active && s.status !== "paused" && s.status !== "cancelled"
  );
  const totalMonthly = activeSubs.reduce(
    (acc, curr) => acc + calculateMonthlyEquivalent(curr),
    0
  );
  const totalAnnual = totalMonthly * 12;

  // Total tax tracked
  const totalMonthlyTax = activeSubs.reduce((acc, curr) => {
    if (!curr.taxApplicable || !curr.taxAmount) return acc;
    const factor = calculateMonthlyEquivalent(curr) / (curr.price || 1);
    return acc + curr.taxAmount * factor;
  }, 0);

  // Upcoming in 14 days
  const upcomingIn7Days = activeSubs.filter((s) => {
    const days = getDaysUntilDue(s.nextPaymentDate);
    return days >= 0 && days <= 14;
  });

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  activeSubs.forEach((s) => {
    const monthlyCost = calculateMonthlyEquivalent(s);
    categoryMap[s.category] = (categoryMap[s.category] || 0) + monthlyCost;
  });

  const categoryBreakdown = Object.entries(categoryMap).map(
    ([category, amount]) => ({
      category: category as SubscriptionCategory,
      amount: Math.round((amount + Number.EPSILON) * 100) / 100,
      percentage:
        totalMonthly > 0 ? Math.round((amount / totalMonthly) * 100) : 0,
    })
  );

  categoryBreakdown.sort((a, b) => b.amount - a.amount);

  return {
    totalMonthly: Math.round((totalMonthly + Number.EPSILON) * 100) / 100,
    totalAnnual: Math.round((totalAnnual + Number.EPSILON) * 100) / 100,
    totalMonthlyTax: Math.round((totalMonthlyTax + Number.EPSILON) * 100) / 100,
    activeCount: activeSubs.length,
    totalCount: subs.length,
    upcomingCount: upcomingIn7Days.length,
    upcomingIn7Days,
    categoryBreakdown,
  };
};
