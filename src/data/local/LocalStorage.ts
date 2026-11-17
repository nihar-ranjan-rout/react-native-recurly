import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSeedSubscriptions,
  getSeedPayments,
  getSeedMandates,
  SEED_PAYMENT_METHODS,
  SEED_USER_PROFILE,
  SEED_USER_SETTINGS,
} from '../seed/seedData';

const CURRENT_SCHEMA_VERSION = 1;

export const STORAGE_KEYS = {
  SCHEMA_VERSION: '@recurly_schema_version',
  SUBSCRIPTIONS: '@recurly_subscriptions',
  PAYMENTS: '@recurly_payments',
  PAYMENT_METHODS: '@recurly_payment_methods',
  MANDATES: '@recurly_mandates',
  USER_PROFILE: '@recurly_user_profile',
  USER_SETTINGS: '@recurly_user_settings',
};

export class LocalStorageManager {
  private static isInitialized = false;

  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const versionStr = await AsyncStorage.getItem(STORAGE_KEYS.SCHEMA_VERSION);
      const currentVersion = versionStr ? parseInt(versionStr, 10) : 0;

      if (currentVersion < CURRENT_SCHEMA_VERSION) {
        await this.runMigrations(currentVersion);
      }
      this.isInitialized = true;
    } catch (e) {
      console.warn('Failed to initialize local storage:', e);
    }
  }

  static async runMigrations(fromVersion: number): Promise<void> {
    if (fromVersion === 0) {
      // Fresh install or v0: populate with realistic seed data
      const existingSubs = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
      if (!existingSubs) {
        await this.resetToSeedData();
      }
    }
    await AsyncStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, CURRENT_SCHEMA_VERSION.toString());
  }

  static async resetToSeedData(): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.SUBSCRIPTIONS,
      JSON.stringify(getSeedSubscriptions())
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.PAYMENTS,
      JSON.stringify(getSeedPayments())
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.PAYMENT_METHODS,
      JSON.stringify(SEED_PAYMENT_METHODS)
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.MANDATES,
      JSON.stringify(getSeedMandates())
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.USER_PROFILE,
      JSON.stringify(SEED_USER_PROFILE)
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.USER_SETTINGS,
      JSON.stringify(SEED_USER_SETTINGS)
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.SCHEMA_VERSION,
      CURRENT_SCHEMA_VERSION.toString()
    );
  }

  static async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    this.isInitialized = false;
  }
}

