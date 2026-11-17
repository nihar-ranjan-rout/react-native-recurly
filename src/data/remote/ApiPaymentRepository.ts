import { IPaymentRepository } from '../repositories/IPaymentRepository';
import { PaymentTransaction } from '../../domain/payment';

export class ApiPaymentRepository implements IPaymentRepository {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.EXPO_PUBLIC_API_URL || 'https://api.recurly.app/v1') {
    this.baseUrl = baseUrl;
  }

  async getAll(): Promise<PaymentTransaction[]> {
    throw new Error('ApiPaymentRepository not configured. Connect remote backend API endpoint.');
  }

  async getBySubscriptionId(subscriptionId: string): Promise<PaymentTransaction[]> {
    throw new Error(`ApiPaymentRepository.getBySubscriptionId(${subscriptionId}) not implemented.`);
  }

  async create(payment: Omit<PaymentTransaction, 'id'>): Promise<PaymentTransaction> {
    throw new Error('ApiPaymentRepository.create not implemented.');
  }
}

