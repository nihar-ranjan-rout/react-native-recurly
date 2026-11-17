import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { usePaymentStore } from '../../store';
import { Card, Badge, Button, Icon, colors, radii, typography } from '../../ui';
import { formatPaise } from '../../services/currency';

interface MandatesModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function MandatesModal({ visible, onClose }: MandatesModalProps) {
  const { mandates, updateMandateStatus } = usePaymentStore();

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    await updateMandateStatus(id, nextStatus as any);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>NPCI / RBI COMPLIANT</Text>
              <Text style={styles.title}>UPI AutoPay & Mandates</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            <View style={styles.infoBanner}>
              <Icon name="shield-check" size={18} color={colors.teal} style={{ marginRight: 8 }} />
              <Text style={styles.infoText}>
                e-Mandates allow automated debits up to the authorized ceiling limit. Scheduled renewal dates are distinguished from verified debits.
              </Text>
            </View>

            {mandates.length === 0 ? (
              <Text style={styles.emptyText}>No active UPI AutoPay mandates found.</Text>
            ) : (
              mandates.map((m) => (
                <Card key={m.id} style={styles.mandateCard} padding={16}>
                  <View style={styles.mandateHeader}>
                    <View>
                      <Text style={styles.subName}>{m.subscriptionName}</Text>
                      <Text style={styles.umnText}>{m.umn}</Text>
                    </View>
                    <Badge
                      label={m.status}
                      variant={m.status === 'ACTIVE' ? 'autopay' : 'paused'}
                      size="sm"
                    />
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.gridRow}>
                    <Text style={styles.gridKey}>Debit Ceiling Limit</Text>
                    <Text style={styles.gridVal}>{formatPaise(m.maxAmountPaise, 'INR')}</Text>
                  </View>

                  <View style={styles.gridRow}>
                    <Text style={styles.gridKey}>Frequency</Text>
                    <Text style={styles.gridVal}>{m.frequency.toUpperCase()}</Text>
                  </View>

                  <View style={styles.gridRow}>
                    <Text style={styles.gridKey}>Next Expected Debit</Text>
                    <Text style={styles.gridVal}>
                      {m.nextExpectedDebitDate
                        ? new Date(m.nextExpectedDebitDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Scheduled renewal'}
                    </Text>
                  </View>

                  <View style={styles.actionRow}>
                    <Button
                      label={m.status === 'ACTIVE' ? 'Pause AutoPay' : 'Resume AutoPay'}
                      variant="secondary"
                      size="sm"
                      icon={m.status === 'ACTIVE' ? 'pause' : 'play'}
                      onPress={() => handleToggleStatus(m.id, m.status)}
                      style={{ flex: 1 }}
                    />
                  </View>
                </Card>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  container: {
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.textMuted,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.nearBlack,
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
    maxHeight: 520,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tealLight,
    padding: 12,
    borderRadius: radii.md,
    marginBottom: 14,
  },
  infoText: {
    fontSize: 12,
    color: colors.teal,
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: 30,
  },
  mandateCard: {
    backgroundColor: colors.cardCream,
    marginBottom: 12,
  },
  mandateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.nearBlack,
  },
  umnText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorderWarm,
    marginVertical: 10,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  gridKey: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  gridVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.nearBlack,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
});
