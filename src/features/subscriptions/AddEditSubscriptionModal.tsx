import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
} from 'react-native';
import { z } from 'zod';
import { useSubscriptionStore, usePaymentStore } from '../../store';
import {
  Card,
  Button,
  Toggle,
  Chip,
  Icon,
  colors,
  radii,
  typography,
} from '../../ui';
import { calculateNextRenewal } from '../../services/renewal';
import { Subscription, BillingCycle, SubscriptionCategory } from '../../domain/subscription';

const subscriptionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  amountRupees: z
    .number()
    .positive('Amount must be greater than 0'),
  category: z.string().min(1, 'Please select a category'),
  billingCycle: z.enum(['weekly', 'monthly', 'quarterly', 'half-yearly', 'yearly', 'custom']),
  reminderDays: z.number().int().min(1).max(30),
});

interface AddEditSubscriptionModalProps {
  visible: boolean;
  initialData?: Subscription | null;
  onClose: () => void;
}

const CATEGORIES: { label: string; value: SubscriptionCategory; icon: any }[] = [
  { label: 'Streaming', value: 'streaming', icon: 'streaming' },
  { label: 'Music', value: 'music', icon: 'music' },
  { label: 'Software', value: 'software', icon: 'software' },
  { label: 'Cloud', value: 'cloud', icon: 'cloud' },
  { label: 'Utilities', value: 'utilities', icon: 'utilities' },
  { label: 'Fitness', value: 'fitness', icon: 'fitness' },
  { label: 'Gaming', value: 'gaming', icon: 'gaming' },
  { label: 'Reading', value: 'reading', icon: 'reading' },
  { label: 'Shopping', value: 'shopping', icon: 'shopping' },
  { label: 'Other', value: 'other', icon: 'other' },
];

const BILLING_CYCLES: { label: string; value: BillingCycle }[] = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Yearly', value: 'yearly' },
  { label: 'Weekly', value: 'weekly' },
];

const BRAND_COLORS = [
  '#E50914', // Netflix Red
  '#1DB954', // Spotify Green
  '#10A37F', // OpenAI Green
  '#24292E', // GitHub Dark
  '#00A8E1', // Prime Blue
  '#4285F4', // Google Blue
  '#D83B01', // Microsoft Orange
  '#D82375', // Jio Pink
  '#FF3278', // Cult Pink
  '#8E24AA', // Purple
];

export default function AddEditSubscriptionModal({
  visible,
  initialData,
  onClose,
}: AddEditSubscriptionModalProps) {
  const { addSubscription, updateSubscription } = useSubscriptionStore();
  const { paymentMethods } = usePaymentStore();

  const [name, setName] = useState(initialData?.name || '');
  const [amountRupees, setAmountRupees] = useState(
    initialData?.amountPaise ? (initialData.amountPaise / 100).toString() : ''
  );
  const [category, setCategory] = useState<SubscriptionCategory>(
    initialData?.category || 'streaming'
  );
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    initialData?.billingCycle || 'monthly'
  );
  const [hasGST, setHasGST] = useState(initialData ? initialData.hasGST : true);
  const [hasAutoPay, setHasAutoPay] = useState(initialData ? initialData.hasAutoPay : true);
  const [reminderDays, setReminderDays] = useState(initialData?.reminderDays || 3);
  const [selectedColor, setSelectedColor] = useState(initialData?.color || BRAND_COLORS[0]);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [sharedWith, setSharedWith] = useState(initialData?.sharedWith ? initialData.sharedWith.toString() : '1');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    initialData?.paymentMethodId || (paymentMethods[0]?.id || '')
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setAmountRupees((initialData.amountPaise / 100).toString());
      setCategory(initialData.category);
      setBillingCycle(initialData.billingCycle);
      setHasGST(initialData.hasGST);
      setHasAutoPay(initialData.hasAutoPay);
      setReminderDays(initialData.reminderDays || 3);
      setSelectedColor(initialData.color || BRAND_COLORS[0]);
      setNotes(initialData.notes || '');
      setSharedWith(initialData.sharedWith ? initialData.sharedWith.toString() : '1');
      setSelectedPaymentMethod(initialData.paymentMethodId || (paymentMethods[0]?.id || ''));
    }
  }, [initialData]);

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amountRupees);
    const validationResult = subscriptionSchema.safeParse({
      name,
      amountRupees: parsedAmount,
      category,
      billingCycle,
      reminderDays,
    });

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((err: any) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const amountPaise = Math.round(parsedAmount * 100); // Strictly integer paise
      const now = new Date();
      const nextRenewalDate = calculateNextRenewal(now, billingCycle).toISOString();
      const parsedSharedWith = parseInt(sharedWith, 10) || 1;
      const myShare = parsedSharedWith > 1 ? Math.round(100 / parsedSharedWith) : 100;

      if (initialData && initialData.id) {
        await updateSubscription(initialData.id, {
          name,
          category,
          amountPaise,
          billingCycle,
          hasGST,
          hasAutoPay,
          reminderDays,
          color: selectedColor,
          icon: category,
          notes,
          sharedWith: parsedSharedWith,
          mySharePercentage: myShare,
          paymentMethodId: selectedPaymentMethod,
        });
      } else {
        await addSubscription({
          userId: 'user_default',
          name,
          category,
          amountPaise,
          currency: 'INR',
          billingCycle,
          startDate: now.toISOString(),
          nextRenewalDate,
          paymentMethodId: selectedPaymentMethod,
          hasAutoPay,
          hasGST,
          gstRate: 18,
          status: 'active',
          notes,
          reminderDays,
          color: selectedColor,
          icon: category,
          sharedWith: parsedSharedWith,
          mySharePercentage: myShare,
          priceHistory: [{ date: now.toISOString(), amountPaise }],
        });
      }

      onClose();
    } catch (e: any) {
      setErrors({ form: e.message || 'Failed to save subscription' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>
                {initialData ? 'EDIT SUBSCRIPTION' : 'ADD NEW RECURRING PLAN'}
              </Text>
              <Text style={styles.title}>
                {initialData ? initialData.name : 'Subscription Details'}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Service Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>SERVICE / APP NAME *</Text>
              <TextInput
                style={[styles.textInput, errors.name && styles.inputError]}
                placeholder="e.g. Netflix, Spotify, ChatGPT"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Amount in Rupees */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>AMOUNT (₹ INR) *</Text>
              <View style={styles.amountInputRow}>
                <Text style={styles.rupeePrefix}>₹</Text>
                <TextInput
                  style={[styles.amountInput, errors.amountRupees && styles.inputError]}
                  placeholder="649"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={amountRupees}
                  onChangeText={setAmountRupees}
                />
              </View>
              {errors.amountRupees && (
                <Text style={styles.errorText}>{errors.amountRupees}</Text>
              )}
            </View>

            {/* Category Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CATEGORY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                {CATEGORIES.map((cat) => (
                  <Chip
                    key={cat.value}
                    label={cat.label}
                    selected={category === cat.value}
                    onPress={() => setCategory(cat.value)}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Billing Cycle Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>BILLING FREQUENCY</Text>
              <View style={styles.chipRow}>
                {BILLING_CYCLES.map((cycle) => (
                  <Chip
                    key={cycle.value}
                    label={cycle.label}
                    selected={billingCycle === cycle.value}
                    onPress={() => setBillingCycle(cycle.value)}
                  />
                ))}
              </View>
            </View>

            {/* GST 18% & AutoPay Toggles */}
            <Card style={styles.togglesCard} padding={14}>
              <View style={styles.toggleRow}>
                <View>
                  <Text style={styles.toggleTitle}>Include 18% GST in price</Text>
                  <Text style={styles.toggleSubtitle}>CGST 9% + SGST 9% statutory breakdown</Text>
                </View>
                <Toggle value={hasGST} onValueChange={setHasGST} />
              </View>

              <View style={[styles.toggleRow, { borderTopWidth: 1, borderTopColor: colors.cardBorderWarm, marginTop: 12, paddingTop: 12 }]}>
                <View>
                  <Text style={styles.toggleTitle}>UPI AutoPay (e-Mandate)</Text>
                  <Text style={styles.toggleSubtitle}>Automatic debit mandate via GPay/PhonePe</Text>
                </View>
                <Toggle value={hasAutoPay} onValueChange={setHasAutoPay} />
              </View>
            </Card>

            {/* Payment Method Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>LINKED PAYMENT METHOD</Text>
              <View style={styles.chipRow}>
                {paymentMethods.map((pm) => (
                  <Chip
                    key={pm.id}
                    label={`${pm.name} (${pm.identifier})`}
                    selected={selectedPaymentMethod === pm.id}
                    onPress={() => setSelectedPaymentMethod(pm.id)}
                  />
                ))}
              </View>
            </View>

            {/* Brand Color Palette */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>BRAND THEME COLOR</Text>
              <View style={styles.colorPalette}>
                {BRAND_COLORS.map((col) => (
                  <Pressable
                    key={col}
                    onPress={() => setSelectedColor(col)}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: col },
                      selectedColor === col && styles.colorCircleSelected,
                    ]}
                  >
                    {selectedColor === col && (
                      <Icon name="check" size={14} color="#FFFFFF" />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Family Plan Split */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>SHARED / SPLIT PLAN (PEOPLE)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="1 (personal) or 2, 4, 6"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={sharedWith}
                onChangeText={setSharedWith}
              />
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>OPTIONAL NOTES</Text>
              <TextInput
                style={[styles.textInput, { height: 60 }]}
                placeholder="Account email, profile slot, cancellation policy..."
                placeholderTextColor={colors.textMuted}
                multiline
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* Form Error */}
            {errors.form && <Text style={styles.formErrorText}>{errors.form}</Text>}

            {/* Submit Button */}
            <Button
              label={initialData ? 'Update Plan' : 'Save to Vault'}
              variant="primary"
              size="lg"
              loading={submitting}
              onPress={handleSubmit}
              style={{ marginTop: 14, marginBottom: 30 }}
            />
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
    maxHeight: '92%',
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
    maxHeight: 600,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    ...typography.eyebrow,
    color: colors.textMuted,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: colors.cardCream,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    color: colors.nearBlack,
    outlineStyle: 'none' as any,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardCream,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 14,
    height: 48,
  },
  rupeePrefix: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.nearBlack,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.nearBlack,
    outlineStyle: 'none' as any,
  },
  inputError: {
    borderColor: colors.dangerRed,
  },
  errorText: {
    fontSize: 11,
    color: colors.dangerRed,
    marginTop: 4,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  togglesCard: {
    backgroundColor: colors.cardCream,
    marginBottom: 18,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.nearBlack,
  },
  toggleSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: colors.nearBlack,
  },
  formErrorText: {
    color: colors.dangerRed,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
});
