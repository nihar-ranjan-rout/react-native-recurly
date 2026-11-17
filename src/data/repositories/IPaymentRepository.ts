import { PaymentTransaction } from '../../domain/payment';

export interface IPaymentRepository {
  getAll(): Promise<PaymentTransaction[]>;
  getBySubscriptionId(subscriptionId: string): Promise<PaymentTransaction[]>;
  create(payment: Omit<PaymentTransaction, 'id'>): Promise<PaymentTransaction>;
}

