import { PaymentMethod } from '../../domain/payment-method';

export interface IPaymentMethodRepository {
  getAll(): Promise<PaymentMethod[]>;
  getById(id: string): Promise<PaymentMethod | null>;
  create(method: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod>;
  delete(id: string): Promise<boolean>;
  setDefault(id: string): Promise<boolean>;
}

