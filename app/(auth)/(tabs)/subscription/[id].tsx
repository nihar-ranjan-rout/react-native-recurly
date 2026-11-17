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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSubscriptionStore, usePaymentStore, useUserStore } from '@/src/store';
import {
  AppBackground,
  Card,
  Button,
  Badge,
  Icon,
  colors,
  radii,
  typography,
} from '@/src/ui';
import { formatPaise } from '@/src/services/currency';
import { getDueStatus, advanceToNextActiveRenewal } from '@/src/services/renewal';
import { calculateGSTInclusive } from '@/src/services/gst';
import AddEditSubscriptionModal from '@/src/features/subscriptions/AddEditSubscriptionModal';

export default function SubscriptionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { subscriptions, updateSubscription, pauseSubscription, resumeSubscription, deleteSubscription } =
    useSubscriptionStore();
  const { payments, recordPayment, paymentMethods, mandates } = usePaymentStore();
  const { profile, settings } = useUserStore();

  const [isEditOpen, setIsEditOpen] = useState(false);

  const sub = useMemo(() => {
    return subscriptions.find((s) => s.id === id) || null;
  }, [subscriptions, id]);

  const relatedPayments = useMemo(() => {
    if (!sub) return [];
    return payments.filter(
      (p) => p.subscriptionId === sub.id || p.subscriptionName.toLowerCase() === sub.name.toLowerCase()
    );
  }, [payments, sub]);

  const linkedMandate = useMemo(() => {
    if (!sub) return null;
    return mandates.find(
      (m) => m.subscriptionId === sub.id || m.subscriptionName.toLowerCase() === sub.name.toLowerCase()
    );
  }, [mandates, sub]);

  if (!sub) {
    return (
      <AppBackground>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Subscription not found</Text>
          <Button
            label="Back to Subscriptions"
            variant="primary"
            size="md"
            onPress={() => router.back()}
            style={{ marginTop: 14 }}
          />
        </View>
      </AppBackground>
    );
  }

  const due = getDueStatus(sub.nextRenewalDate);
  const gst = calculateGSTInclusive(sub.amountPaise, sub.gstRate || 18);
  const privacy = settings.hideAmountsPrivacy;

  const handleTogglePause = async () => {
    if (sub.status === 'paused') {
      await resumeSubscription(sub.id);
    } else {
      await pauseSubscription(sub.id);
    }
  };

  const handleRecordPayment = async () => {
    const defaultPm = paymentMethods.find((m) => m.isDefault) || paymentMethods[0];
    await recordPayment({
      subscriptionId: sub.id,
      subscriptionName: sub.name,
      amountPaise: sub.amountPaise,
      gstPaise: gst.gstPaise,
      currency: sub.currency,
      paymentMethodId: defaultPm ? defaultPm.id : 'pm_manual',
      paymentMethodName: defaultPm
        ? `${defaultPm.name} ${defaultPm.identifier}`
        : 'UPI Manual Debit',
      date: new Date().toISOString(),
      status: 'paid',
      receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: `Recorded debit renewal for ${sub.name}`,
    });

    // Advance renewal date
    const nextDate = advanceToNextActiveRenewal(
      new Date(sub.nextRenewalDate),
      sub.billingCycle
    );
    await updateSubscription(sub.id, {
      nextRenewalDate: nextDate.toISOString(),
    });
  };

  const handleDelete = () => {
    const doDelete = async () => {
      await deleteSubscription(sub.id);
      router.back();
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete ${sub.name} from vault?`)) {
        doDelete();
      }
    } else {
      Alert.alert('Delete Plan', `Are you sure you want to delete ${sub.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Back Nav */}
        <View style={styles.topNav}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Icon name="chevron-down" size={20} color={colors.nearBlack} style={{ transform: [{ rotate: '90deg' }] }} />
            <Text style={styles.backText}>Vault</Text>
          </Pressable>

          <View style={styles.topActions}>
            <Pressable onPress={() => setIsEditOpen(true)} style={styles.iconBtn}>
              <Icon name="edit" size={18} color={colors.nearBlack} />
            </Pressable>
            <Pressable onPress={handleDelete} style={[styles.iconBtn, { marginLeft: 8 }]}>
              <Icon name="trash" size={18} color={colors.dangerRed} />
            </Pressable>
          </View>
        </View>

        {/* Hero Card */}
        <Card style={styles.heroCard} padding={20}>
          <View style={styles.heroTop}>
            <View style={[styles.brandCircle, { backgroundColor: sub.color || '#E8F5E9' }]}>
              <Icon name={(sub.icon as any) || 'subscription'} size={28} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.heroName}>{sub.name}</Text>
              <Text style={styles.heroCategory}>{sub.category.toUpperCase()}</Text>
            </View>
            <Badge label={sub.status} variant={sub.status as any} size="md" />
          </View>

          <View style={styles.heroPriceRow}>
            <View>
              <Text style={styles.heroPriceLabel}>RECURRING FEE</Text>
              <Text style={styles.heroPrice}>
                {formatPaise(sub.amountPaise, profile.currency, privacy)}
                <Text style={styles.heroCycle}>/{sub.billingCycle}</Text>
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.heroPriceLabel}>NEXT BILLING</Text>
              <Text style={styles.heroDate}>
                {new Date(sub.nextRenewalDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
              <Badge
                label={due.label}
                variant={due.status === 'overdue' ? 'overdue' : due.status === 'due-today' ? 'due-today' : 'neutral'}
                size="sm"
                style={{ marginTop: 4 }}
              />
            </View>
          </View>
        </Card>

        {/* GST Tax Breakdown Card */}
        <Card style={styles.sectionCard} padding={18}>
          <Text style={styles.eyebrow}>TAX COMPLIANCE</Text>
          <Text style={styles.sectionTitle}>18% GST Apportionment</Text>

          <View style={styles.gridRow}>
            <Text style={styles.gridKey}>Base Service Price</Text>
            <Text style={styles.gridVal}>
              {formatPaise(gst.basePaise, profile.currency, privacy)}
            </Text>
          </View>
          <View style={styles.gridRow}>
            <Text style={styles.gridKey}>Central GST (CGST 9%)</Text>
            <Text style={styles.gridVal}>
              {formatPaise(gst.cgstPaise, profile.currency, privacy)}
            </Text>
          </View>
          <View style={styles.gridRow}>
            <Text style={styles.gridKey}>State GST (SGST 9%)</Text>
            <Text style={styles.gridVal}>
              {formatPaise(gst.sgstPaise, profile.currency, privacy)}
            </Text>
          </View>
          <View style={[styles.gridRow, styles.totalRow]}>
            <Text style={styles.totalKey}>Total Invoice Price (INR)</Text>
            <Text style={styles.totalVal}>
              {formatPaise(sub.amountPaise, profile.currency, privacy)}
            </Text>
          </View>
        </Card>

        {/* UPI AutoPay & Mandate Info */}
        <Card style={styles.sectionCard} padding={18}>
          <Text style={styles.eyebrow}>PAYMENT RAILS & MANDATE</Text>
          <Text style={styles.sectionTitle}>UPI AutoPay Schedule</Text>

          <View style={styles.gridRow}>
            <Text style={styles.gridKey}>AutoPay Enabled</Text>
            <Badge
              label={sub.hasAutoPay ? 'ACTIVE MANDATE' : 'MANUAL'}
              variant={sub.hasAutoPay ? 'autopay' : 'neutral'}
              size="sm"
            />
          </View>

          {linkedMandate && (
            <>
              <View style={styles.gridRow}>
                <Text style={styles.gridKey}>Unique Mandate Number (UMN)</Text>
                <Text style={styles.gridValMono}>{linkedMandate.umn}</Text>
              </View>
              <View style={styles.gridRow}>
                <Text style={styles.gridKey}>Max Authorized Cap</Text>
                <Text style={styles.gridVal}>
                  {formatPaise(linkedMandate.maxAmountPaise, 'INR')}
                </Text>
              </View>
            </>
          )}

          <View style={styles.actionButtons}>
            <Button
              label="Record Confirmed Payment"
              variant="primary"
              size="md"
              icon="check-circle"
              onPress={handleRecordPayment}
              style={{ marginBottom: 10 }}
            />
            <Button
              label={sub.status === 'paused' ? 'Resume Plan' : 'Pause Plan'}
              variant="secondary"
              size="md"
              icon={sub.status === 'paused' ? 'play' : 'pause'}
              onPress={handleTogglePause}
            />
          </View>
        </Card>

        {/* Past Transactions for this Subscription */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Payment Ledger</Text>
        </View>

        {relatedPayments.length === 0 ? (
          <Card style={styles.sectionCard} padding={16}>
            <Text style={styles.noPaymentsText}>
              No confirmed debits recorded yet for this plan.
            </Text>
          </Card>
        ) : (
          relatedPayments.map((p) => (
            <Card key={p.id} style={styles.paymentCard} padding={14}>
              <View style={styles.paymentRow}>
                <View style={styles.receiptIcon}>
                  <Icon name="receipt" size={16} color={colors.teal} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.paymentTitle}>{p.receiptNumber}</Text>
                  <Text style={styles.paymentDate}>
                    {new Date(p.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    • {p.paymentMethodName}
                  </Text>
                </View>
                <Text style={styles.paymentAmount}>
                  {formatPaise(p.amountPaise, profile.currency, privacy)}
                </Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Edit Modal */}
      {isEditOpen && (
        <AddEditSubscriptionModal
          visible={isEditOpen}
          initialData={sub}
          onClose={() => setIsEditOpen(false)}
        />
      )}
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 24 : 50,
    paddingBottom: 110,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  backText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.nearBlack,
    marginLeft: 6,
  },
  topActions: {
    flexDirection: 'row',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardCream,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: colors.cardCream,
    marginBottom: 16,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  brandCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.nearBlack,
  },
  heroCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginTop: 2,
  },
  heroPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.cardBorderWarm,
    paddingTop: 14,
  },
  heroPriceLabel: {
    ...typography.eyebrow,
    color: colors.textMuted,
    marginBottom: 2,
  },
  heroPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.nearBlack,
  },
  heroCycle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  heroDate: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.nearBlack,
  },
  sectionCard: {
    backgroundColor: colors.cardCream,
    marginBottom: 16,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.textMuted,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.nearBlack,
    marginTop: 2,
    marginBottom: 12,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  gridKey: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  gridVal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.nearBlack,
  },
  gridValMono: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.nearBlack,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.cardBorderWarm,
    marginTop: 6,
    paddingTop: 10,
  },
  totalKey: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.nearBlack,
  },
  totalVal: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.nearBlack,
  },
  actionButtons: {
    marginTop: 16,
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    ...typography.sectionTitle,
    color: colors.nearBlack,
  },
  noPaymentsText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  paymentCard: {
    backgroundColor: colors.cardCream,
    marginBottom: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.nearBlack,
  },
  paymentDate: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.nearBlack,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.nearBlack,
  },
});
