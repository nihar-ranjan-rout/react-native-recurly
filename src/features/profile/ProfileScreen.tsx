import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore, useSubscriptionStore, usePaymentStore } from '../../store';
import {
  AppBackground,
  Card,
  Button,
  Badge,
  Toggle,
  Chip,
  Icon,
  colors,
  radii,
  typography,
} from '../../ui';
import { formatPaise, SupportedCurrency } from '../../services/currency';
import { computeAnalytics } from '../../services/analytics';
import PaymentMethodsModal from './PaymentMethodsModal';
import MandatesModal from './MandatesModal';
import LedgerModal from './LedgerModal';
import BackupModal from './BackupModal';
import CatalogModal from '../subscriptions/CatalogModal';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, settings, updateProfile, updateSettings, togglePrivacy, resetVaultToSeed, clearAllVaultData } =
    useUserStore();
  const { subscriptions, loadSubscriptions } = useSubscriptionStore();
  const { loadAll } = usePaymentStore();

  const [isMethodsOpen, setIsMethodsOpen] = useState(false);
  const [isMandatesOpen, setIsMandatesOpen] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  const analytics = useMemo(() => {
    return computeAnalytics(subscriptions, settings.monthlyBudgetPaise);
  }, [subscriptions, settings.monthlyBudgetPaise]);
  const privacy = settings.hideAmountsPrivacy;

  const handleCurrencyChange = async (curr: SupportedCurrency) => {
    await updateProfile({ currency: curr });
  };

  const handleBiometricToggle = async (val: boolean) => {
    if (Platform.OS !== 'web' && val) {
      try {
        const LocalAuth = require('expo-local-authentication');
        const hasHardware = await LocalAuth.hasHardwareAsync();
        const isEnrolled = await LocalAuth.isEnrolledAsync();
        if (!hasHardware || !isEnrolled) {
          Alert.alert('Biometrics Unavailable', 'Please enable fingerprint or Face ID in your device settings.');
          return;
        }
      } catch {
        // Fallback gracefully
      }
    }
    await updateSettings({ biometricLockEnabled: val });
  };

  const handleRestoreSampleVault = () => {
    const doRestore = async () => {
      await resetVaultToSeed();
      await Promise.all([loadSubscriptions(), loadAll()]);
      if (Platform.OS === 'web') {
        alert('Vault has been reset to the 10 official Indian sample subscriptions.');
      } else {
        Alert.alert('Vault Reset', 'Sample subscriptions have been restored.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Reset vault to the 10 official sample subscriptions?')) {
        doRestore();
      }
    } else {
      Alert.alert(
        'Restore Sample Vault',
        'This will reset your data to the 10 sample subscriptions (Netflix, Spotify, ChatGPT, Copilot, etc.).',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Restore', style: 'destructive', onPress: doRestore },
        ]
      );
    }
  };

  const handleClearAll = () => {
    const doClear = async () => {
      await clearAllVaultData();
      await Promise.all([loadSubscriptions(), loadAll()]);
      if (Platform.OS === 'web') {
        alert('All local vault records have been wiped.');
      } else {
        Alert.alert('Vault Cleared', 'All records wiped.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('WARNING: Irreversibly delete all local subscriptions, payments, and settings?')) {
        doClear();
      }
    } else {
      Alert.alert(
        'Clear All Data',
        'Are you sure you want to delete all subscriptions and payment records? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete All', style: 'destructive', onPress: doClear },
        ]
      );
    }
  };

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Card style={styles.profileCard} padding={20}>
          <View style={styles.profileTopRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{profile.avatarInitial || 'R'}</Text>
            </View>

            <View style={{ flex: 1, marginLeft: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.profileName}>{profile.name}</Text>
                <Badge
                  label={profile.plan.toUpperCase()}
                  variant="autopay"
                  size="sm"
                  style={{ marginLeft: 8 }}
                />
              </View>
              <Text style={styles.profileEmail}>{profile.email}</Text>
            </View>
          </View>

          {/* Live Computed Summary Stats */}
          <View style={styles.summaryStatsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statVal}>{analytics.activeCount}</Text>
              <Text style={styles.statKey}>Active Plans</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statVal}>
                {formatPaise(analytics.monthlyTotalPaise, profile.currency, privacy)}
              </Text>
              <Text style={styles.statKey}>Monthly Spend</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statVal}>
                {formatPaise(analytics.yearlyTotalPaise, profile.currency, privacy)}
              </Text>
              <Text style={styles.statKey}>Annual Outflow</Text>
            </View>
          </View>
        </Card>

        {/* Global Currency Selector */}
        <Card style={styles.sectionCard} padding={18}>
          <Text style={styles.eyebrow}>CURRENCY & CONVERSION</Text>
          <Text style={styles.sectionHeading}>Global Display Currency</Text>
          <Text style={styles.sectionDesc}>
            Amounts convert in real-time using fixed multi-currency foreign exchange rates.
          </Text>
          <View style={styles.currencyChips}>
            {(['INR', 'USD', 'EUR', 'GBP'] as const).map((curr) => (
              <Chip
                key={curr}
                label={curr === 'INR' ? '₹ INR (Indian Rupee)' : curr === 'USD' ? '$ USD' : curr === 'EUR' ? '€ EUR' : '£ GBP'}
                selected={profile.currency === curr}
                onPress={() => handleCurrencyChange(curr)}
              />
            ))}
          </View>
        </Card>

        {/* Indian Payment Ecosystem Hub */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Indian Payment Rails</Text>
        </View>

        <Card style={styles.sectionCard} padding={14}>
          <Pressable
            style={styles.menuRow}
            onPress={() => setIsMethodsOpen(true)}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#E3F2FD' }]}>
              <Icon name="card" size={18} color="#1976D2" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.menuTitle}>Payment Methods & UPI VPAs</Text>
              <Text style={styles.menuDesc}>Google Pay, PhonePe, HDFC Visa, ICICI RuPay</Text>
            </View>
            <Icon name="chevron-right" size={18} color={colors.textMuted} />
          </Pressable>

          <View style={styles.rowDivider} />

          <Pressable
            style={styles.menuRow}
            onPress={() => setIsMandatesOpen(true)}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: colors.tealLight }]}>
              <Icon name="shield-check" size={18} color={colors.teal} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.menuTitle}>UPI AutoPay & e-Mandates</Text>
              <Text style={styles.menuDesc}>UMN tracking, frequency caps, pause/revoke</Text>
            </View>
            <Icon name="chevron-right" size={18} color={colors.textMuted} />
          </Pressable>

          <View style={styles.rowDivider} />

          <Pressable
            style={styles.menuRow}
            onPress={() => setIsLedgerOpen(true)}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: colors.accentOrangeLight }]}>
              <Icon name="receipt" size={18} color={colors.accentOrange} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.menuTitle}>Payment History & Receipts</Text>
              <Text style={styles.menuDesc}>Electronic ledger, PDF receipts, statutory notes</Text>
            </View>
            <Icon name="chevron-right" size={18} color={colors.textMuted} />
          </Pressable>

          <View style={styles.rowDivider} />

          <Pressable
            style={styles.menuRow}
            onPress={() => setIsCatalogOpen(true)}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#F3E5F5' }]}>
              <Icon name="sparkles" size={18} color="#8E24AA" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.menuTitle}>Browse Indian Service Catalog</Text>
              <Text style={styles.menuDesc}>22+ Presets (Netflix, Hotstar, Prime, Copilot...)</Text>
            </View>
            <Icon name="chevron-right" size={18} color={colors.textMuted} />
          </Pressable>
        </Card>

        {/* Preferences & Privacy */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Preferences & Privacy</Text>
        </View>

        <Card style={styles.sectionCard} padding={16}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.menuTitle}>Privacy Mode (Hide Amounts)</Text>
              <Text style={styles.menuDesc}>Masks balances as ₹•••••• across screens</Text>
            </View>
            <Toggle value={settings.hideAmountsPrivacy} onValueChange={togglePrivacy} />
          </View>

          <View style={styles.rowDivider} />

          <View style={styles.toggleRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.menuTitle}>Biometric App Lock</Text>
              <Text style={styles.menuDesc}>Require Fingerprint or Face ID to open app</Text>
            </View>
            <Toggle
              value={settings.biometricLockEnabled}
              onValueChange={handleBiometricToggle}
            />
          </View>

          <View style={styles.rowDivider} />

          <View style={styles.toggleRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.menuTitle}>Renewal Push Alerts</Text>
              <Text style={styles.menuDesc}>Notify 1, 3, and 7 days prior to billing debits</Text>
            </View>
            <Toggle
              value={settings.notifyRenewal3Days}
              onValueChange={(val) => updateSettings({ notifyRenewal3Days: val })}
            />
          </View>

          <View style={styles.rowDivider} />

          <View style={styles.toggleRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.menuTitle}>Monthly Spend Summary</Text>
              <Text style={styles.menuDesc}>Deliver a digest of expenses on the 1st of each month</Text>
            </View>
            <Toggle
              value={settings.notifyMonthlySummary}
              onValueChange={(val) => updateSettings({ notifyMonthlySummary: val })}
            />
          </View>
        </Card>

        {/* Vault Data Management & Security */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Vault Data & Security</Text>
        </View>

        <Card style={styles.sectionCard} padding={14}>
          <Pressable
            style={styles.menuRow}
            onPress={() => setIsBackupOpen(true)}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#EEF5F1' }]}>
              <Icon name="download" size={18} color={colors.teal} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.menuTitle}>Export / Restore Backup</Text>
              <Text style={styles.menuDesc}>JSON backup and data migration</Text>
            </View>
            <Icon name="chevron-right" size={18} color={colors.textMuted} />
          </Pressable>

          <View style={styles.rowDivider} />

          <Pressable
            style={styles.menuRow}
            onPress={handleRestoreSampleVault}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: colors.warningOrangeLight }]}>
              <Icon name="refresh" size={18} color={colors.warningOrange} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.menuTitle}>Restore Sample Vault</Text>
              <Text style={styles.menuDesc}>Reload the 10 official Indian sample plans</Text>
            </View>
            <Icon name="chevron-right" size={18} color={colors.textMuted} />
          </Pressable>

          <View style={styles.rowDivider} />

          <Pressable
            style={styles.menuRow}
            onPress={handleClearAll}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: colors.dangerRedLight }]}>
              <Icon name="trash" size={18} color={colors.dangerRed} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.menuTitle, { color: colors.dangerRed }]}>
                Clear All Vault Data
              </Text>
              <Text style={styles.menuDesc}>Permanently wipe all local financial records</Text>
            </View>
            <Icon name="chevron-right" size={18} color={colors.dangerRed} />
          </Pressable>
        </Card>

        {/* Sign Out Button */}
        <Button
          label="Sign Out"
          variant="secondary"
          size="md"
          icon="close"
          onPress={() => router.push('/onboarding')}
          style={{ marginTop: 10, marginBottom: 30 }}
        />
      </ScrollView>

      {/* Sub-modals */}
      {isMethodsOpen && (
        <PaymentMethodsModal
          visible={isMethodsOpen}
          onClose={() => setIsMethodsOpen(false)}
        />
      )}

      {isMandatesOpen && (
        <MandatesModal
          visible={isMandatesOpen}
          onClose={() => setIsMandatesOpen(false)}
        />
      )}

      {isLedgerOpen && (
        <LedgerModal
          visible={isLedgerOpen}
          onClose={() => setIsLedgerOpen(false)}
        />
      )}

      {isBackupOpen && (
        <BackupModal
          visible={isBackupOpen}
          onClose={() => setIsBackupOpen(false)}
        />
      )}

      {isCatalogOpen && (
        <CatalogModal
          visible={isCatalogOpen}
          onClose={() => setIsCatalogOpen(false)}
          onSelectPreset={() => {
            setIsCatalogOpen(false);
            router.push('/(auth)/(tabs)/subscription');
          }}
        />
      )}
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 24 : 50,
    paddingBottom: 120,
  },
  profileCard: {
    backgroundColor: colors.cardCream,
    marginBottom: 20,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.nearBlack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.nearBlack,
  },
  profileEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.cardBorderWarm,
    paddingTop: 16,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.nearBlack,
  },
  statKey: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.cardBorderWarm,
  },
  sectionCard: {
    backgroundColor: colors.cardCream,
    marginBottom: 20,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.textMuted,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.nearBlack,
    marginTop: 2,
  },
  sectionDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 12,
  },
  currencyChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionTitleRow: {
    marginBottom: 10,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.nearBlack,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  menuIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.nearBlack,
  },
  menuDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.cardBorderWarm,
    marginVertical: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
});

