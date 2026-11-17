import { IPaymentMethodRepository } from '../repositories/IPaymentMethodRepository';
import { PaymentMethod } from '../../domain/payment-method';

export class ApiPaymentMethodRepository implements IPaymentMethodRepository {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.EXPO_PUBLIC_API_URL || 'https://api.recurly.app/v1') {
    this.baseUrl = baseUrl;
  }

  async getAll(): Promise<PaymentMethod[]> {
    throw new Error('ApiPaymentMethodRepository not configured.');
  }

  async getById(id: string): Promise<PaymentMethod | null> {
    throw new Error(`ApiPaymentMethodRepository.getById(${id}) not implemented.`);
  }

  async create(method: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod> {
    throw new Error('ApiPaymentMethodRepository.create not implemented.');
  }

  async delete(id: string): Promise<boolean> {
    throw new Error(`ApiPaymentMethodRepository.delete(${id}) not implemented.`);
  }

  async setDefault(id: string): Promise<boolean> {
    throw new Error(`ApiPaymentMethodRepository.setDefault(${id}) not implemented.`);
  }
}

