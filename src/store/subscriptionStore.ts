import { create } from 'zustand';
import { repositories } from '../data';
import { Subscription, SubscriptionStatus } from '../domain/subscription';
import { computeAnalytics, AnalyticsSummary } from '../services/analytics';
import { NotificationService } from '../services/notifications';

interface UndoState {
  type: 'delete' | 'status_change';
  subscription: Subscription;
  previousStatus?: SubscriptionStatus;
}

interface SubscriptionState {
  subscriptions: Subscription[];
  isLoading: boolean;
  error: string | null;
  undoBuffer: UndoState | null;

  // Actions
  loadSubscriptions: () => Promise<void>;
  addSubscription: (sub: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Subscription>;
  updateSubscription: (id: string, updates: Partial<Subscription>) => Promise<Subscription>;
  deleteSubscription: (id: string) => Promise<boolean>;
  setStatus: (id: string, status: SubscriptionStatus) => Promise<Subscription>;
  pauseSubscription: (id: string) => Promise<Subscription>;
  resumeSubscription: (id: string) => Promise<Subscription>;
  cancelSubscription: (id: string) => Promise<Subscription>;
  undoLastAction: () => Promise<void>;
  clearUndo: () => void;

  // Computed selector
  getAnalytics: (monthlyBudgetPaise?: number) => AnalyticsSummary;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscriptions: [],
  isLoading: false,
  error: null,
  undoBuffer: null,

  loadSubscriptions: async () => {
    set({ isLoading: true, error: null });
    try {
      const subs = await repositories.subscriptions.getAll();
      set({ subscriptions: subs, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load subscriptions', isLoading: false });
    }
  },

  addSubscription: async (subData) => {
    set({ isLoading: true, error: null });
    try {
      const created = await repositories.subscriptions.create(subData);
      set((state) => ({
        subscriptions: [created, ...state.subscriptions],
        isLoading: false,
      }));
      // Schedule notification
      NotificationService.scheduleSubscriptionReminder(created).catch(() => {});
      return created;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create subscription', isLoading: false });
      throw err;
    }
  },

  updateSubscription: async (id, updates) => {
    try {
      const updated = await repositories.subscriptions.update(id, updates);
      set((state) => ({
        subscriptions: state.subscriptions.map((s) => (s.id === id ? updated : s)),
      }));
      return updated;
    } catch (err: any) {
      set({ error: err.message || 'Failed to update subscription' });
      throw err;
    }
  },

  deleteSubscription: async (id) => {
    const existing = get().subscriptions.find((s) => s.id === id);
    if (!existing) return false;

    try {
      await repositories.subscriptions.delete(id);
      set((state) => ({
        subscriptions: state.subscriptions.filter((s) => s.id !== id),
        undoBuffer: {
          type: 'delete',
          subscription: existing,
        },
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete subscription' });
      return false;
    }
  },

  setStatus: async (id, status) => {
    const existing = get().subscriptions.find((s) => s.id === id);
    const previousStatus = existing?.status;

    try {
      const updated = await repositories.subscriptions.setStatus(id, status);
      set((state) => ({
        subscriptions: state.subscriptions.map((s) => (s.id === id ? updated : s)),
        undoBuffer: existing
          ? {
              type: 'status_change',
              subscription: updated,
              previousStatus,
            }
          : null,
      }));
      return updated;
    } catch (err: any) {
      set({ error: err.message || 'Failed to change subscription status' });
      throw err;
    }
  },

  pauseSubscription: async (id) => {
    return get().setStatus(id, 'paused');
  },

  resumeSubscription: async (id) => {
    return get().setStatus(id, 'active');
  },

  cancelSubscription: async (id) => {
    return get().setStatus(id, 'cancelled');
  },

  undoLastAction: async () => {
    const undo = get().undoBuffer;
    if (!undo) return;

    if (undo.type === 'delete') {
      const { id, createdAt, updatedAt, ...rest } = undo.subscription;
      await get().addSubscription(rest);
    } else if (undo.type === 'status_change' && undo.previousStatus) {
      await get().setStatus(undo.subscription.id, undo.previousStatus);
    }
    set({ undoBuffer: null });
  },

  clearUndo: () => {
    set({ undoBuffer: null });
  },

  getAnalytics: (monthlyBudgetPaise = 600000) => {
    return computeAnalytics(get().subscriptions, monthlyBudgetPaise);
  },
}));

