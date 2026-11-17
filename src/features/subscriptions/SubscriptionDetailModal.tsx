import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useSubscriptionStore, usePaymentStore, useUserStore } from '../../store';
import {
  Card,
  Button,
  Badge,
  Icon,
  colors,
  radii,
  typography,
} from '../../ui';
import { formatPaise } from '../../services/currency';
import { getDueStatus, advanceToNextActiveRenewal } from '../../services/renewal';
import { calculateGSTInclusive } from '../../services/gst';
import { Subscription } from '../../domain/subscription';

interface SubscriptionDetailModalProps {
  visible: boolean;
  subscription: Subscription;
  onClose: () => void;
  onEdit: () => void;
}

export default function SubscriptionDetailModal({
  visible,
  subscription,
  onClose,
  onEdit,
}: SubscriptionDetailModalProps) {
  const { pauseSubscription, resumeSubscription, cancelSubscription, deleteSubscription, updateSubscription } =
    useSubscriptionStore();
  const { recordPayment, paymentMethods } = usePaymentStore();
  const { profile, settings } = useUserStore();

  const due = getDueStatus(subscription.nextRenewalDate);
  const gst = calculateGSTInclusive(subscription.amountPaise, subscription.gstRate || 18);
  const privacy = settings.hideAmountsPrivacy;

  const handleTogglePause = async () => {
    if (subscription.status === 'paused') {
      await resumeSubscription(subscription.id);
    } else {
      await pauseSubscription(subscription.id);
    }
    onClose();
  };

  const handleMarkAsPaid = async () => {
    // Record payment in ledger
    const defaultPm = paymentMethods.find((m) => m.isDefault) || paymentMethods[0];
    await recordPayment({
      subscriptionId: subscription.id,
      subscriptionName: subscription.name,
      amountPaise: subscription.amountPaise,
      gstPaise: gst.gstPaise,
      currency: subscription.currency,
      paymentMethodId: defaultPm ? defaultPm.id : 'pm_manual',
      paymentMethodName: defaultPm
        ? `${defaultPm.name} ${defaultPm.identifier}`
        : 'UPI Manual Debit',
      date: new Date().toISOString(),
      status: 'paid',
      receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: `Recorded renewal payment for ${subscription.name}`,
    });

    // Advance renewal date to next cycle
    const nextDate = advanceToNextActiveRenewal(
      new Date(subscription.nextRenewalDate),
      subscription.billingCycle
    );
    await updateSubscription(subscription.id, {
      nextRenewalDate: nextDate.toISOString(),
    });

    onClose();
  };

  const handleDelete = () => {
    const doDelete = async () => {
      await deleteSubscription(subscription.id);
      onClose();
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete ${subscription.name} from your portfolio vault?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Delete Subscription',
        `Are you sure you want to delete ${subscription.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.brandCircle, { backgroundColor: subscription.color || '#E8F5E9' }]}>
              <Icon name={(subscription.icon as any) || 'subscription'} size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.subName}>{subscription.name}</Text>
              <Text style={styles.subCategory}>{subscription.category.toUpperCase()}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Price & Due Status Card */}
            <Card style={styles.priceCard} padding={18}>
              <View style={styles.priceRow}>
                <View>
                  <Text style={styles.priceLabel}>SUBSCRIPTION FEE</Text>
                  <Text style={styles.priceValue}>
                    {formatPaise(subscription.amountPaise, profile.currency, privacy)}
                    <Text style={styles.priceCycle}>
                      /{subscription.billingCycle === 'yearly' ? 'year' : subscription.billingCycle === 'quarterly' ? 'quarter' : 'month'}
                    </Text>
                  </Text>
                </View>
                <Badge
                  label={subscription.status}
                  variant={subscription.status as any}
                  size="md"
                />
              </View>

              <View style={styles.dueRow}>
                <View style={styles.dueItem}>
                  <Text style={styles.dueLabel}>NEXT BILLING</Text>
                  <Text style={styles.dueValue}>
                    {new Date(subscription.nextRenewalDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>

                <Badge
                  label={due.label}
                  variant={due.status === 'overdue' ? 'overdue' : due.status === 'due-today' ? 'due-today' : 'neutral'}
                  size="md"
                />
              </View>
            </Card>

            {/* GST Tax Breakdown */}
            <Card style={styles.detailSection} padding={16}>
              <Text style={styles.sectionHeading}>GST TAX APPORTIONMENT (18%)</Text>
              <View style={styles.gridRow}>
                <Text style={styles.gridKey}>Taxable Base</Text>
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
              <View style={[styles.gridRow, styles.gridTotal]}>
                <Text style={styles.gridKeyTotal}>Total Inclusive Cost</Text>
                <Text style={styles.gridValTotal}>
                  {formatPaise(subscription.amountPaise, profile.currency, privacy)}
                </Text>
              </View>
            </Card>

            {/* AutoPay & Payment Rails */}
            <Card style={styles.detailSection} padding={16}>
              <Text style={styles.sectionHeading}>PAYMENT METHOD & MANDATE</Text>
              <View style={styles.gridRow}>
                <Text style={styles.gridKey}>Payment Mode</Text>
                <Text style={styles.gridVal}>
                  {subscription.hasAutoPay ? 'UPI AutoPay (e-Mandate)' : 'Manual Card / NetBanking'}
                </Text>
              </View>
              {subscription.hasAutoPay && (
                <>
                  <View style={styles.gridRow}>
                    <Text style={styles.gridKey}>Mandate Status</Text>
                    <Badge label="ACTIVE" variant="autopay" size="sm" icon="check" />
                  </View>
                  <View style={styles.gridRow}>
                    <Text style={styles.gridKey}>Debit Ceiling Cap</Text>
                    <Text style={styles.gridVal}>₹15,000.00 / cycle</Text>
                  </View>
                </>
              )}
            </Card>

            {/* Shared Plan & Notes */}
            {(subscription.sharedWith > 1 || subscription.notes) && (
              <Card style={styles.detailSection} padding={16}>
                <Text style={styles.sectionHeading}>PLAN SPLIT & NOTES</Text>
                {subscription.sharedWith > 1 && (
                  <View style={styles.gridRow}>
                    <Text style={styles.gridKey}>Split Among</Text>
                    <Text style={styles.gridVal}>
                      {subscription.sharedWith} people ({subscription.mySharePercentage}% your share)
                    </Text>
                  </View>
                )}
                {subscription.notes && (
                  <Text style={styles.notesText}>{subscription.notes}</Text>
                )}
              </Card>
            )}

            {/* Primary Action Buttons */}
            <View style={styles.actionsContainer}>
              <Button
                label="Record Confirmed Payment"
                variant="primary"
                size="md"
                icon="check-circle"
                onPress={handleMarkAsPaid}
                style={{ marginBottom: 10 }}
              />

              <View style={styles.buttonRow}>
                <Button
                  label={subscription.status === 'paused' ? 'Resume Plan' : 'Pause Plan'}
                  variant="secondary"
                  size="md"
                  icon={subscription.status === 'paused' ? 'play' : 'pause'}
                  onPress={handleTogglePause}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                  label="Edit Plan"
                  variant="secondary"
                  size="md"
                  icon="edit"
                  onPress={onEdit}
                  style={{ flex: 1 }}
                />
              </View>

              <Button
                label="Delete Subscription"
                variant="danger"
                size="md"
                icon="trash"
                onPress={handleDelete}
                style={{ marginTop: 10 }}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    width: '100%',
    maxWidth: 680,
    maxHeight: '90%',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.nearBlack,
  },
  subCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF3F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    maxHeight: 560,
  },
  priceCard: {
    backgroundColor: colors.cardCream,
    marginBottom: 14,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  priceLabel: {
    ...typography.eyebrow,
    color: colors.textMuted,
  },
  priceValue: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.nearBlack,
    marginTop: 4,
  },
  priceCycle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  dueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.cardBorderWarm,
    paddingTop: 12,
  },
  dueItem: {},
  dueLabel: {
    ...typography.eyebrow,
    color: colors.textMuted,
  },
  dueValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.nearBlack,
    marginTop: 2,
  },
  detailSection: {
    backgroundColor: colors.cardCream,
    marginBottom: 14,
  },
  sectionHeading: {
    ...typography.eyebrow,
    color: colors.textMuted,
    marginBottom: 10,
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
  gridTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.cardBorderWarm,
    marginTop: 6,
    paddingTop: 10,
  },
  gridKeyTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.nearBlack,
  },
  gridValTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.nearBlack,
  },
  notesText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 6,
  },
  actionsContainer: {
    marginVertical: 14,
  },
  buttonRow: {
    flexDirection: 'row',
  },
});

