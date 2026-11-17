import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import { usePaymentStore } from '../../store';
import { Card, Button, Badge, Chip, Icon, colors, radii, typography } from '../../ui';
import { PaymentMethodType } from '../../domain/payment-method';

interface PaymentMethodsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PaymentMethodsModal({ visible, onClose }: PaymentMethodsModalProps) {
  const { paymentMethods, addPaymentMethod, deletePaymentMethod, setDefaultPaymentMethod } =
    usePaymentStore();

  const [isAdding, setIsAdding] = useState(false);
  const [methodType, setMethodType] = useState<PaymentMethodType>('upi');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');

  const handleAdd = async () => {
    if (!name.trim() || !identifier.trim()) return;

    await addPaymentMethod({
      type: methodType,
      name: name.trim(),
      identifier: identifier.trim(),
      provider: methodType === 'upi' ? 'gpay' : 'hdfc',
      isDefault: paymentMethods.length === 0,
    });

    setName('');
    setIdentifier('');
    setIsAdding(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>INDIAN PAYMENT ECOSYSTEM</Text>
              <Text style={styles.title}>Payment Methods & VPAs</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Payment Methods List */}
            {paymentMethods.map((pm) => (
              <Card key={pm.id} style={styles.methodCard} padding={16}>
                <View style={styles.methodRow}>
                  <View style={styles.methodIconCircle}>
                    <Icon
                      name={pm.type === 'upi' ? 'phone' : pm.type === 'card' ? 'card' : 'bank'}
                      size={20}
                      color={colors.nearBlack}
                    />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.methodName}>{pm.name}</Text>
                      {pm.isDefault && (
                        <Badge label="DEFAULT" variant="autopay" size="sm" style={{ marginLeft: 6 }} />
                      )}
                    </View>
                    <Text style={styles.methodId}>{pm.identifier}</Text>
                  </View>

                  <View style={styles.methodActions}>
                    {!pm.isDefault && (
                      <Pressable
                        onPress={() => setDefaultPaymentMethod(pm.id)}
                        style={styles.setDefaultBtn}
                      >
                        <Text style={styles.setDefaultText}>Set Default</Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => deletePaymentMethod(pm.id)}
                      style={styles.deleteBtn}
                    >
                      <Icon name="trash" size={16} color={colors.dangerRed} />
                    </Pressable>
                  </View>
                </View>
              </Card>
            ))}

            {/* Add New Method Form */}
            {isAdding ? (
              <Card style={styles.addFormCard} padding={16}>
                <Text style={styles.addFormTitle}>Add Payment Instrument</Text>

                <View style={styles.typeChips}>
                  {(['upi', 'card', 'netbanking'] as const).map((t) => (
                    <Chip
                      key={t}
                      label={t.toUpperCase()}
                      selected={methodType === t}
                      onPress={() => setMethodType(t)}
                    />
                  ))}
                </View>

                <TextInput
                  style={styles.input}
                  placeholder={methodType === 'upi' ? 'Provider Name (e.g. Google Pay, PhonePe)' : 'Bank / Card Name (e.g. HDFC Regalia)'}
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                />

                <TextInput
                  style={styles.input}
                  placeholder={methodType === 'upi' ? 'UPI VPA (e.g. rohan@okhdfcbank)' : 'Card Number (e.g. •••• 3014)'}
                  placeholderTextColor={colors.textMuted}
                  value={identifier}
                  onChangeText={setIdentifier}
                />

                <View style={styles.formBtnRow}>
                  <Button
                    label="Cancel"
                    variant="ghost"
                    size="sm"
                    onPress={() => setIsAdding(false)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    label="Save Instrument"
                    variant="primary"
                    size="sm"
                    onPress={handleAdd}
                    style={{ flex: 1 }}
                  />
                </View>
              </Card>
            ) : (
              <Button
                label="Add New Payment Method / VPA"
                variant="secondary"
                size="md"
                icon="plus"
                onPress={() => setIsAdding(true)}
                style={{ marginTop: 10 }}
              />
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
  methodCard: {
    backgroundColor: colors.cardCream,
    marginBottom: 10,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF5F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.nearBlack,
  },
  methodId: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  methodActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setDefaultBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
    backgroundColor: '#EBEFEA',
  },
  setDefaultText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  deleteBtn: {
    padding: 6,
  },
  addFormCard: {
    backgroundColor: colors.cardCream,
    marginTop: 10,
  },
  addFormTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.nearBlack,
    marginBottom: 10,
  },
  typeChips: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: colors.nearBlack,
    marginBottom: 10,
    outlineStyle: 'none' as any,
  },
  formBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
});

