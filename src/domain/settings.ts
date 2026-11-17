export interface UserSettings {
  monthlyBudgetPaise: number; // e.g. 600000 = ₹6,000.00
  biometricLockEnabled: boolean;
  pinCode?: string;
  hideAmountsPrivacy: boolean;
  notifyRenewal1Day: boolean;
  notifyRenewal3Days: boolean;
  notifyRenewal7Days: boolean;
  notifyTrialEnding: boolean;
  notifyMonthlySummary: boolean;
  autoAdvanceRenewals: boolean;
  dataSource: 'local' | 'api';
  schemaVersion: number;
}

