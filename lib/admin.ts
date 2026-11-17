import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStoredUsers, saveStoredUsers, StoredUser } from "@/lib/auth";
import { getAppPlans } from "@/lib/plans";
import { getSubscriptions } from "@/lib/subscriptions";

export type AdminSubscriber = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  joinedAt: string;
  status: "active" | "suspended";
  activeSubscriptionsCount: number;
  lifetimeSpend: number;
};

export type PaymentStatus = "paid" | "pending" | "failed" | "refunded";

export type PlatformPayment = {
  id: string;
  invoiceNumber: string;
  subscriberName: string;
  subscriberEmail: string;
  planName: string;
  amount: number;
  currency: string;
  date: string;
  paymentMethod: string;
  status: PaymentStatus;
};

export type PlatformRenewal = {
  id: string;
  subscriberName: string;
  subscriberEmail: string;
  planName: string;
  amount: number;
  renewalDate: string;
  billingCycle: string;
  autoRenew: boolean;
  dunningRetries: number;
  status: "scheduled" | "processing" | "overdue" | "retrying";
};

export type PlatformSettings = {
  platformName: string;
  defaultCurrency: string;
  gracePeriodDays: number;
  maxRetryAttempts: number;
  maintenanceMode: boolean;
  autoDunningEnabled: boolean;
  notificationWebhookUrl: string;
};

export type PlatformReport = {
  id: string;
  title: string;
  category: "revenue" | "churn" | "plans" | "tax";
  period: string;
  generatedAt: string;
  metricsSummary: string;
  downloadFormat: "csv" | "json";
};

const PAYMENTS_KEY = "@recurly_admin_payments_v1";
const SETTINGS_KEY = "@recurly_admin_settings_v1";

const DEFAULT_SETTINGS: PlatformSettings = {
  platformName: "Recurly OS Platform",
  defaultCurrency: "USD ($)",
  gracePeriodDays: 3,
  maxRetryAttempts: 4,
  maintenanceMode: false,
  autoDunningEnabled: true,
  notificationWebhookUrl: "https://api.recurly.internal/webhooks/billing",
};

const INITIAL_PAYMENTS: PlatformPayment[] = [
  {
    id: "pay-101",
    invoiceNumber: "INV-2026-0891",
    subscriberName: "Nihar",
    subscriberEmail: "nihar@example.com",
    planName: "Netflix 4K HDR",
    amount: 22.99,
    currency: "$",
    date: "2026-09-25",
    paymentMethod: "Mastercard •• 8812",
    status: "paid",
  },
  {
    id: "pay-102",
    invoiceNumber: "INV-2026-0892",
    subscriberName: "Nihar",
    subscriberEmail: "nihar@example.com",
    planName: "Spotify Premium",
    amount: 10.99,
    currency: "$",
    date: "2026-09-22",
    paymentMethod: "Apple Pay •• 4291",
    status: "paid",
  },
  {
    id: "pay-103",
    invoiceNumber: "INV-2026-0893",
    subscriberName: "Sarah Jenkins",
    subscriberEmail: "sarah.j@enterprise.io",
    planName: "ChatGPT Plus",
    amount: 20.0,
    currency: "$",
    date: "2026-10-02",
    paymentMethod: "Visa •• 3014",
    status: "paid",
  },
  {
    id: "pay-104",
    invoiceNumber: "INV-2026-0894",
    subscriberName: "Marcus Vance",
    subscriberEmail: "marcus.v@cloudscale.net",
    planName: "AWS Cloud Scale",
    amount: 145.0,
    currency: "$",
    date: "2026-10-03",
    paymentMethod: "Corporate Amex •• 9011",
    status: "paid",
  },
  {
    id: "pay-105",
    invoiceNumber: "INV-2026-0895",
    subscriberName: "Elena Rostova",
    subscriberEmail: "elena@designlab.co",
    planName: "Figma Professional",
    amount: 15.0,
    currency: "$",
    date: "2026-10-04",
    paymentMethod: "Visa •• 4421",
    status: "pending",
  },
  {
    id: "pay-106",
    invoiceNumber: "INV-2026-0896",
    subscriberName: "David Chen",
    subscriberEmail: "d.chen@fintech.io",
    planName: "Equinox Gym Club",
    amount: 65.0,
    currency: "$",
    date: "2026-10-05",
    paymentMethod: "Mastercard •• 1109",
    status: "failed",
  },
  {
    id: "pay-107",
    invoiceNumber: "INV-2026-0897",
    subscriberName: "Nihar",
    subscriberEmail: "nihar@example.com",
    planName: "iCloud+ 2TB",
    amount: 9.99,
    currency: "$",
    date: "2026-10-05",
    paymentMethod: "Apple Pay •• 4291",
    status: "paid",
  },
];

export const getPlatformSubscribers = async (): Promise<AdminSubscriber[]> => {
  const users = await getStoredUsers();
  const subs = await getSubscriptions();

  // Supplementary demo subscribers if needed for rich admin views
  const additionalDemoSubscribers: StoredUser[] = [
    {
      id: "sub-user-sarah",
      name: "Sarah Jenkins",
      email: "sarah.j@enterprise.io",
      password: "password123",
      role: "user",
      createdAt: "2026-04-12T09:30:00.000Z",
    },
    {
      id: "sub-user-marcus",
      name: "Marcus Vance",
      email: "marcus.v@cloudscale.net",
      password: "password123",
      role: "user",
      createdAt: "2026-05-18T14:15:00.000Z",
    },
    {
      id: "sub-user-elena",
      name: "Elena Rostova",
      email: "elena@designlab.co",
      password: "password123",
      role: "user",
      createdAt: "2026-06-01T11:00:00.000Z",
    },
    {
      id: "sub-user-david",
      name: "David Chen",
      email: "d.chen@fintech.io",
      password: "password123",
      role: "user",
      createdAt: "2026-07-22T16:45:00.000Z",
    },
  ];

  const allUsersMap = new Map<string, StoredUser>();
  users.forEach((u) => allUsersMap.set(u.email.toLowerCase(), u));
  additionalDemoSubscribers.forEach((u) => {
    if (!allUsersMap.has(u.email.toLowerCase())) {
      allUsersMap.set(u.email.toLowerCase(), u);
    }
  });

  const combinedUsers = Array.from(allUsersMap.values());

  return combinedUsers.map((user) => {
    const isPrimaryUser = user.email.toLowerCase() === "nihar@example.com";
    const subCount = isPrimaryUser
      ? subs.filter((s) => s.active).length
      : user.email.includes("enterprise")
      ? 5
      : user.email.includes("cloudscale")
      ? 8
      : 2;

    const lifetimeSpend = isPrimaryUser
      ? subs.reduce((acc, s) => acc + (s.price || 0) * 8, 0)
      : subCount * 140;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: (user.role as "user" | "admin") || "user",
      joinedAt: user.createdAt || "2026-03-01T00:00:00.000Z",
      status: "active",
      activeSubscriptionsCount: subCount,
      lifetimeSpend: Math.round(lifetimeSpend),
    };
  });
};

export const deletePlatformSubscriber = async (userId: string): Promise<void> => {
  const users = await getStoredUsers();
  const nextUsers = users.filter((u) => u.id !== userId);
  await saveStoredUsers(nextUsers);
};

export const getPlatformPayments = async (): Promise<PlatformPayment[]> => {
  try {
    const raw = await AsyncStorage.getItem(PAYMENTS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    await AsyncStorage.setItem(PAYMENTS_KEY, JSON.stringify(INITIAL_PAYMENTS));
    return INITIAL_PAYMENTS;
  } catch {
    return INITIAL_PAYMENTS;
  }
};

export const getPlatformRenewals = async (): Promise<PlatformRenewal[]> => {
  const subs = await getSubscriptions();

  const userRenewals: PlatformRenewal[] = subs.map((sub) => ({
    id: `ren-${sub.id}`,
    subscriberName: "Nihar",
    subscriberEmail: "nihar@example.com",
    planName: sub.name,
    amount: sub.price,
    renewalDate: sub.nextPaymentDate || "2026-10-15",
    billingCycle: sub.billingCycle || "monthly",
    autoRenew: sub.active,
    dunningRetries: 0,
    status: sub.active ? "scheduled" : "overdue",
  }));

  const simulatedOtherRenewals: PlatformRenewal[] = [
    {
      id: "ren-sarah-1",
      subscriberName: "Sarah Jenkins",
      subscriberEmail: "sarah.j@enterprise.io",
      planName: "ChatGPT Plus",
      amount: 20.0,
      renewalDate: "2026-10-06",
      billingCycle: "monthly",
      autoRenew: true,
      dunningRetries: 0,
      status: "scheduled",
    },
    {
      id: "ren-marcus-1",
      subscriberName: "Marcus Vance",
      subscriberEmail: "marcus.v@cloudscale.net",
      planName: "AWS Cloud Scale",
      amount: 145.0,
      renewalDate: "2026-10-07",
      billingCycle: "monthly",
      autoRenew: true,
      dunningRetries: 0,
      status: "processing",
    },
    {
      id: "ren-chen-1",
      subscriberName: "David Chen",
      subscriberEmail: "d.chen@fintech.io",
      planName: "Equinox Gym Club",
      amount: 65.0,
      renewalDate: "2026-10-08",
      billingCycle: "monthly",
      autoRenew: true,
      dunningRetries: 2,
      status: "retrying",
    },
  ];

  return [...userRenewals, ...simulatedOtherRenewals].sort(
    (a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime()
  );
};

export const getPlatformSettings = async (): Promise<PlatformSettings> => {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const updatePlatformSettings = async (
  updates: Partial<PlatformSettings>
): Promise<PlatformSettings> => {
  const current = await getPlatformSettings();
  const next = { ...current, ...updates };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
};

export const getPlatformReports = (): PlatformReport[] => {
  return [
    {
      id: "rep-01",
      title: "Platform Monthly Revenue & MRR Statement",
      category: "revenue",
      period: "September 2026",
      generatedAt: "2026-10-01",
      metricsSummary: "$4,892.40 Gross Volume • $428 MRR Growth • 98.4% Collection",
      downloadFormat: "csv",
    },
    {
      id: "rep-02",
      title: "Subscriber Churn & Retention Audit",
      category: "churn",
      period: "Q3 2026",
      generatedAt: "2026-10-02",
      metricsSummary: "1.4% Monthly Churn • 92.1% 90-Day Retention • 4 Dunning Recoveries",
      downloadFormat: "json",
    },
    {
      id: "rep-03",
      title: "Plan Catalog Popularity & Tier Adoption",
      category: "plans",
      period: "Year-to-Date 2026",
      generatedAt: "2026-10-03",
      metricsSummary: "Top Plan: Netflix 4K (412 subs) • Highest ARPU: Cloud Scale ($145)",
      downloadFormat: "csv",
    },
    {
      id: "rep-04",
      title: "Multi-Currency & VAT Compliance Audit",
      category: "tax",
      period: "Q3 2026",
      generatedAt: "2026-10-04",
      metricsSummary: "$342.10 Remitted Tax • 0 Disputed Chargebacks • 100% Validated Invoices",
      downloadFormat: "json",
    },
  ];
};

export const calculatePlatformMetrics = async () => {
  const plans = await getAppPlans();
  const payments = await getPlatformPayments();
  const subscribers = await getPlatformSubscribers();
  const renewals = await getPlatformRenewals();

  const totalRevenue = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const estimatedMRR = plans
    .filter((p) => p.status === "active")
    .reduce((sum, p) => sum + (p.price || 0) * (p.subscriberCount || 12), 0);

  const activeSubscribersCount = subscribers.filter(
    (s) => s.status === "active"
  ).length;

  const upcomingRenewalsCount = renewals.filter(
    (r) => r.status === "scheduled" || r.status === "processing"
  ).length;

  return {
    totalRevenue,
    estimatedMRR,
    estimatedARR: estimatedMRR * 12,
    activeSubscribersCount,
    totalPlansCount: plans.length,
    activePlansCount: plans.filter((p) => p.status === "active").length,
    upcomingRenewalsCount,
    arpu: activeSubscribersCount > 0 ? estimatedMRR / activeSubscribersCount : 0,
    churnRate: "1.4%",
    platformHealth: "100% Operational",
  };
};
