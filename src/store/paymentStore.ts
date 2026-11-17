import { create } from 'zustand';
import { repositories } from '../data';
import { PaymentTransaction } from '../domain/payment';
import { PaymentMethod } from '../domain/payment-method';
import { Mandate, MandateStatus } from '../domain/mandate';

interface PaymentState {
  payments: PaymentTransaction[];
  paymentMethods: PaymentMethod[];
  mandates: Mandate[];
  isLoading: boolean;
  error: string | null;

  loadAll: () => Promise<void>;
  recordPayment: (payment: Omit<PaymentTransaction, 'id'>) => Promise<PaymentTransaction>;
  addPaymentMethod: (method: Omit<PaymentMethod, 'id'>) => Promise<PaymentMethod>;
  deletePaymentMethod: (id: string) => Promise<boolean>;
  setDefaultPaymentMethod: (id: string) => Promise<boolean>;
  createMandate: (mandate: Omit<Mandate, 'id'>) => Promise<Mandate>;
  updateMandateStatus: (id: string, status: MandateStatus) => Promise<Mandate>;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  payments: [],
  paymentMethods: [],
  mandates: [],
  isLoading: false,
  error: null,

  loadAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const [payments, methods, mandates] = await Promise.all([
        repositories.payments.getAll(),
        repositories.paymentMethods.getAll(),
        repositories.mandates.getAll(),
      ]);
      set({
        payments,
        paymentMethods: methods,
        mandates,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load payments', isLoading: false });
    }
  },

  recordPayment: async (paymentData) => {
    try {
      const created = await repositories.payments.create(paymentData);
      set((state) => ({ payments: [created, ...state.payments] }));
      return created;
    } catch (err: any) {
      set({ error: err.message || 'Failed to record payment' });
      throw err;
    }
  },

  addPaymentMethod: async (methodData) => {
    try {
      const created = await repositories.paymentMethods.create(methodData);
      set((state) => ({
        paymentMethods: created.isDefault
          ? state.paymentMethods.map((m) => ({ ...m, isDefault: false })).concat(created)
          : [...state.paymentMethods, created],
      }));
      return created;
    } catch (err: any) {
      set({ error: err.message || 'Failed to add payment method' });
      throw err;
    }
  },

  deletePaymentMethod: async (id) => {
    try {
      await repositories.paymentMethods.delete(id);
      set((state) => ({
        paymentMethods: state.paymentMethods.filter((m) => m.id !== id),
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete payment method' });
      return false;
    }
  },

  setDefaultPaymentMethod: async (id) => {
    try {
      await repositories.paymentMethods.setDefault(id);
      set((state) => ({
        paymentMethods: state.paymentMethods.map((m) => ({
          ...m,
          isDefault: m.id === id,
        })),
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to set default payment method' });
      return false;
    }
  },

  createMandate: async (mandateData) => {
    try {
      const created = await repositories.mandates.create(mandateData);
      set((state) => ({ mandates: [...state.mandates, created] }));
      return created;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create mandate' });
      throw err;
    }
  },

  updateMandateStatus: async (id, status) => {
    try {
      const updated = await repositories.mandates.updateStatus(id, status);
      set((state) => ({
        mandates: state.mandates.map((m) => (m.id === id ? updated : m)),
      }));
      return updated;
    } catch (err: any) {
      set({ error: err.message || 'Failed to update mandate status' });
      throw err;
    }
  },
}));

