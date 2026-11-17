export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';

export interface PaymentTransaction {
  id: string;
  subscriptionId: string;
  subscriptionName: string;
  amountPaise: number; // strictly integer paise
  gstPaise: number;
  currency: string;
  paymentMethodId: string;
  paymentMethodName: string; // e.g. "UPI Google Pay ••7109"
  date: string; // ISO date
  status: PaymentStatus;
  receiptNumber: string; // e.g. "REC-2026-8812"
  notes?: string;
}

