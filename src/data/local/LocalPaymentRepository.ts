import AsyncStorage from '@react-native-async-storage/async-storage';
import { IPaymentRepository } from '../repositories/IPaymentRepository';
import { PaymentTransaction } from '../../domain/payment';
import { LocalStorageManager, STORAGE_KEYS } from './LocalStorage';

export class LocalPaymentRepository implements IPaymentRepository {
  private async ensureInit(): Promise<void> {
    await LocalStorageManager.initialize();
  }

  async getAll(): Promise<PaymentTransaction[]> {
    await this.ensureInit();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PAYMENTS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async getBySubscriptionId(subscriptionId: string): Promise<PaymentTransaction[]> {
    const all = await this.getAll();
    return all.filter((p) => p.subscriptionId === subscriptionId);
  }

  async create(payment: Omit<PaymentTransaction, 'id'>): Promise<PaymentTransaction> {
    const all = await this.getAll();
    const newPayment: PaymentTransaction = {
      ...payment,
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    all.unshift(newPayment);
    await AsyncStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(all));
    return newPayment;
  }
}

