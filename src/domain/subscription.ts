export type BillingCycle =
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'half-yearly'
  | 'yearly'
  | 'custom';

export type SubscriptionCategory =
  | 'streaming'
  | 'music'
  | 'software'
  | 'cloud'
  | 'utilities'
  | 'fitness'
  | 'gaming'
  | 'reading'
  | 'shopping'
  | 'other';

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

export interface PriceHistoryEntry {
  date: string;
  amountPaise: number;
}

export interface Subscription {
  id: string;
  userId: string;
  name: string;
  category: SubscriptionCategory;
  amountPaise: number; // Stored strictly in paise (e.g. 199900 = ₹1,999.00)
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  billingCycle: BillingCycle;
  startDate: string; // ISO date
  nextRenewalDate: string; // ISO date
  paymentMethodId?: string;
  hasAutoPay: boolean;
  mandateId?: string;
  hasGST: boolean;
  gstRate: number; // e.g. 18 for 18%
  status: SubscriptionStatus;
  notes?: string;
  trialEndDate?: string;
  reminderDays: number;
  color?: string;
  icon?: string;
  sharedWith: number; // 1 = personal, >1 = shared plan
  mySharePercentage: number; // e.g. 100 or 50
  priceHistory: PriceHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

