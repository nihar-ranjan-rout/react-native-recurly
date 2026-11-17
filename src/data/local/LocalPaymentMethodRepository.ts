import AsyncStorage from '@react-native-async-storage/async-storage';
import { IPaymentMethodRepository } from '../repositories/IPaymentMethodRepository';
import { PaymentMethod } from '../../domain/payment-method';
import { LocalStorageManager, STORAGE_KEYS } from './LocalStorage';

export class LocalPaymentMethodRepository implements IPaymentMethodRepository {
  private async ensureInit(): Promise<void> {
    await LocalStorageManager.initialize();
  }

  async getAll(): Promise<PaymentMethod[]> {
    await this.ensureInit();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PAYMENT_METHODS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async getById(id: string): Promise<PaymentMethod | null> {
    const all = await this.getAll();
    return all.find((m) => m.id === id) || null;
  }

  async create(method: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod> {
    const all = await this.getAll();
    const newMethod: PaymentMethod = {
      ...method,
      id: `pm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    if (newMethod.isDefault) {
      all.forEach((m) => (m.isDefault = false));
    }
    all.push(newMethod);
    await AsyncStorage.setItem(STORAGE_KEYS.PAYMENT_METHODS, JSON.stringify(all));
    return newMethod;
  }

  async delete(id: string): Promise<boolean> {
    const all = await this.getAll();
    const filtered = all.filter((m) => m.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.PAYMENT_METHODS, JSON.stringify(filtered));
    return true;
  }

  async setDefault(id: string): Promise<boolean> {
    const all = await this.getAll();
    all.forEach((m) => {
      m.isDefault = m.id === id;
    });
    await AsyncStorage.setItem(STORAGE_KEYS.PAYMENT_METHODS, JSON.stringify(all));
    return true;
  }
}

