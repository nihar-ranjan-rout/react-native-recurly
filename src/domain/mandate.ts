export type MandateStatus =
  | 'ACTIVE'
  | 'PENDING'
  | 'PAUSED'
  | 'REVOKED'
  | 'EXPIRED';

export interface Mandate {
  id: string;
  umn: string; // Unique Mandate Number, e.g. "UMN-2026-98124"
  subscriptionId: string;
  subscriptionName: string;
  paymentMethodId: string;
  maxAmountPaise: number; // e.g. 1500000 = ₹15,000 cap
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'as-presented';
  status: MandateStatus;
  startDate: string;
  expiryDate: string;
  lastDebitDate?: string;
  nextExpectedDebitDate?: string;
}

