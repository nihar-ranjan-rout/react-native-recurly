export type PaymentMethodType = 'upi' | 'card' | 'netbanking' | 'wallet';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  name: string; // e.g. "Google Pay", "HDFC Visa"
  identifier: string; // masked: "al***@okhdfcbank" or "•••• 3014"
  provider: 'gpay' | 'phonepe' | 'paytm' | 'hdfc' | 'icici' | 'sbi' | 'axis' | 'other';
  isDefault: boolean;
}

