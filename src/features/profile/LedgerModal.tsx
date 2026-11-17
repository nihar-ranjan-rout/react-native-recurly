import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { usePaymentStore, useUserStore } from '../../store';
import { Card, Badge, Button, Icon, colors, radii, typography } from '../../ui';
import { formatPaise } from '../../services/currency';
import { ExportService } from '../../services/export';
import { PaymentTransaction } from '../../domain/payment';

interface LedgerModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function LedgerModal({ visible, onClose }: LedgerModalProps) {
  const { payments } = usePaymentStore();
  const { profile, settings } = useUserStore();
  const [filter, setFilter] = useState<'all' | 'paid' | 'failed'>('all');
  const [selectedPayment, setSelectedPayment] = useState<PaymentTransaction | null>(null);

  const privacy = settings.hideAmountsPrivacy;

  const filtered = payments.filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const handleExportCSV = async () => {
    const csv = ExportService.exportLedgerToCSV(payments);
    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recurly-ledger-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } else {
      Alert.alert('Ledger CSV Exported', 'CSV data ready for export.');
    }
  };

  const handlePrintReceipt = async (payment: PaymentTransaction) => {
    const html = ExportService.generateReceiptHTML(payment);
    try {
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        }
      } else {
        const Print = require('expo-print');
        const Sharing = require('expo-sharing');
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri);
      }
    } catch (e: any) {
      console.warn('Could not print receipt:', e);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>FINANCIAL LEDGER</Text>
              <Text style={styles.title}>Payment History & Receipts</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <View style={styles.filterGroup}>
              {(['all', 'paid'] as const).map((f) => (
                <Pressable
                  key={f}
                  onPress={() => setFilter(f)}
                  style={[styles.filterChip, filter === f && styles.filterChipActive]}
                >
                  <Text
                    style={[styles.filterText, filter === f && styles.filterTextActive]}
                  >
                    {f.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Button
              label="Export CSV"
              variant="secondary"
              size="sm"
              icon="download"
              onPress={handleExportCSV}
            />
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {filtered.length === 0 ? (
              <Text style={styles.emptyText}>No recorded payment transactions found.</Text>
            ) : (
              filtered.map((p) => (
                <Card key={p.id} style={styles.paymentCard} padding={14}>
                  <View style={styles.paymentRow}>
                    <View style={styles.receiptIcon}>
                      <Icon name="receipt" size={18} color={colors.teal} />
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.subName}>{p.subscriptionName}</Text>
                      <Text style={styles.methodInfo}>{p.paymentMethodName}</Text>
                      <Text style={styles.dateInfo}>
                        {new Date(p.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}{' '}
                        • {p.receiptNumber}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.amountText}>
                        {formatPaise(p.amountPaise, profile.currency, privacy)}
                      </Text>
                      <Pressable
                        onPress={() => handlePrintReceipt(p)}
                        style={styles.receiptButton}
                      >
                        <Icon name="download" size={12} color={colors.teal} style={{ marginRight: 4 }} />
                        <Text style={styles.receiptBtnText}>Receipt PDF</Text>
                      </Pressable>
                    </View>
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    backgroundColor: '#EEF3F0',
  },
  filterChipActive: {
    backgroundColor: colors.nearBlack,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  scrollArea: {
    maxHeight: 520,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: 30,
  },
  paymentCard: {
    backgroundColor: colors.cardCream,
    marginBottom: 10,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.nearBlack,
  },
  methodInfo: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dateInfo: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.nearBlack,
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tealLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    marginTop: 6,
  },
  receiptBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.teal,
  },
});

