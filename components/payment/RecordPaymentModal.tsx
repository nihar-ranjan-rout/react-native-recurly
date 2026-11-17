import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import Badge from "@/components/ui/Badge";
import { theme } from "@/constants/theme";
import { useCurrency } from "@/context/CurrencyContext";
import {
  calculateGST,
  formatCurrency,
  SupportedCurrency,
} from "@/lib/localization";
import {
  generateDemoUTR,
  INDIAN_PAYMENT_METHOD_OPTIONS,
  PaymentTransactionStatus,
  recordPaymentTransaction,
} from "@/lib/payments";
import { getSubscriptions, Subscription } from "@/lib/subscriptions";

export interface RecordPaymentModalProps {
  visible: boolean;
  subscriptions?: Subscription[];
  defaultSubscription?: Subscription | null;
  preselectedSubId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RecordPaymentModal({
  visible,
  subscriptions: propSubscriptions,
  defaultSubscription,
  preselectedSubId,
  onClose,
  onSuccess,
}: RecordPaymentModalProps) {
  const { width } = useWindowDimensions();
  const isWeb = width > 768;
  const { currency: globalCurrency, symbol: globalSymbol, formatAmount } = useCurrency();

  const [loadedSubs, setLoadedSubs] = useState<Subscription[]>([]);
  const subscriptions = propSubscriptions || loadedSubs;

  const [selectedSubId, setSelectedSubId] = useState<string>(
    preselectedSubId || defaultSubscription?.id || (subscriptions[0]?.id ?? "")
  );

  const activeSub =
    subscriptions.find((s) => s.id === selectedSubId) ||
    defaultSubscription ||
    subscriptions[0];

  const [amountStr, setAmountStr] = useState<string>(
    activeSub ? activeSub.price.toString() : "649"
  );
  const [paymentMethod, setPaymentMethod] = useState<string>(
    activeSub?.paymentMethod || "UPI (Google Pay)"
  );
  const [status, setStatus] = useState<PaymentTransactionStatus>("SUCCESS");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [failureReason, setFailureReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (visible && !propSubscriptions) {
      getSubscriptions().then((list) => {
        setLoadedSubs(list);
        if (preselectedSubId) {
          setSelectedSubId(preselectedSubId);
          const s = list.find((item) => item.id === preselectedSubId);
          if (s) {
            setAmountStr(s.price.toString());
            setPaymentMethod(s.paymentMethod || "UPI (Google Pay)");
          }
        }
      });
    }
  }, [visible, propSubscriptions, preselectedSubId]);

  // Sync when defaultSubscription or preselectedSubId changes
  React.useEffect(() => {
    if (preselectedSubId) {
      setSelectedSubId(preselectedSubId);
      const found = subscriptions.find((s) => s.id === preselectedSubId);
      if (found) {
        setAmountStr(found.price.toString());
        setPaymentMethod(found.paymentMethod || "UPI (Google Pay)");
      }
    } else if (defaultSubscription) {
      setSelectedSubId(defaultSubscription.id);
      setAmountStr(defaultSubscription.price.toString());
      setPaymentMethod(defaultSubscription.paymentMethod || "UPI (Google Pay)");
    } else if (subscriptions.length > 0 && !selectedSubId) {
      setSelectedSubId(subscriptions[0].id);
      setAmountStr(subscriptions[0].price.toString());
    }
  }, [defaultSubscription, subscriptions, preselectedSubId]);

  const handleSubSelect = (subId: string) => {
    setSelectedSubId(subId);
    const found = subscriptions.find((s) => s.id === subId);
    if (found) {
      setAmountStr(found.price.toString());
      setPaymentMethod(found.paymentMethod || "UPI (Google Pay)");
    }
  };

  const amountNum = parseFloat(amountStr) || 0;
  const gstBreakdown = calculateGST(amountNum, {
    taxApplicable: activeSub?.taxApplicable ?? true,
    taxRate: activeSub?.taxRate ?? 18,
    taxInclusive: true,
  });

  const handleSubmit = async () => {
    if (!activeSub) {
      setErrorMsg("Please select a subscription.");
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg("Please enter a valid payment amount.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const utr = paymentReference.trim() || generateDemoUTR();
      await recordPaymentTransaction({
        subscriptionId: activeSub.id,
        subscriptionName: activeSub.name,
        category: activeSub.category,
        amount: amountNum,
        currencyCode: (activeSub.currencyCode as SupportedCurrency) || "INR",
        paymentMethod,
        status,
        paymentReference: utr,
        description: notes.trim() || `Recorded payment for ${activeSub.name}`,
        failureReason: status === "FAILED" ? failureReason.trim() || "Payment failed or declined" : undefined,
        taxApplicable: activeSub.taxApplicable,
        taxRate: activeSub.taxRate,
        gstin: activeSub.gstin,
      });

      setIsSubmitting(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || "Failed to record payment transaction.");
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalOverlay}>
        <View style={[styles.modalBackdrop, isWeb && styles.webBackdrop]}>
          <View style={[styles.modalContainer, isWeb && styles.webModalContainer]}>
            {/* MODAL HEADER */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Record Payment Transaction</Text>
                <Text style={styles.headerSubtitle}>
                  Log a successful or failed renewal payment with GST tracking
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                style={styles.closeBtn}
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.body}
              showsVerticalScrollIndicator={false}
            >
              {errorMsg && (
                <View style={styles.errorAlert}>
                  <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
                  <Text style={styles.errorAlertText}>{errorMsg}</Text>
                </View>
              )}

              {/* 1. SUBSCRIPTION SELECTION */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Select Subscription</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.subPillsRow}
                >
                  {subscriptions.map((s) => {
                    const isSelected = s.id === selectedSubId;
                    return (
                      <Pressable
                        key={s.id}
                        style={[
                          styles.subPill,
                          isSelected && styles.subPillActive,
                        ]}
                        onPress={() => handleSubSelect(s.id)}
                      >
                        <Text
                          style={[
                            styles.subPillText,
                            isSelected && styles.subPillTextActive,
                          ]}
                        >
                          {s.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* 2. AMOUNT INPUT & LIVE GST SPLIT */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Total Amount Paid (INR)</Text>
                <View style={styles.inputRow}>
                  <Text style={styles.currencyPrefix}>₹</Text>
                  <TextInput
                    style={styles.textInput}
                    value={amountStr}
                    onChangeText={setAmountStr}
                    keyboardType="numeric"
                    placeholder="e.g. 649"
                    placeholderTextColor="#A0988A"
                  />
                </View>

                {activeSub?.taxApplicable && (
                  <View style={styles.gstSplitBox}>
                    <View style={styles.gstSplitRow}>
                      <Text style={styles.gstSplitLabel}>Base Price:</Text>
                      <Text style={styles.gstSplitValue}>
                        ₹{gstBreakdown.basePrice.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.gstSplitRow}>
                      <Text style={styles.gstSplitLabel}>
                        GST ({gstBreakdown.taxRate}%):
                      </Text>
                      <Text style={styles.gstSplitValue}>
                        +₹{gstBreakdown.taxAmount.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* 3. TRANSACTION STATUS */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Payment Status</Text>
                <View style={styles.statusPillsRow}>
                  {(
                    [
                      { id: "SUCCESS", label: "Success / Paid", icon: "checkmark-circle", color: theme.colors.success },
                      { id: "FAILED", label: "Failed / Declined", icon: "close-circle", color: theme.colors.error },
                      { id: "PENDING", label: "Pending", icon: "time", color: theme.colors.warning },
                    ] as const
                  ).map((st) => {
                    const isSel = status === st.id;
                    return (
                      <Pressable
                        key={st.id}
                        style={[
                          styles.statusPill,
                          isSel && { borderColor: st.color, backgroundColor: "#FFFFFF" },
                        ]}
                        onPress={() => setStatus(st.id)}
                      >
                        <Ionicons
                          name={st.icon as any}
                          size={14}
                          color={isSel ? st.color : theme.colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.statusPillText,
                            isSel && { color: st.color, fontWeight: "700" },
                          ]}
                        >
                          {st.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* 4. PAYMENT METHOD */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Payment Method</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.methodsRow}
                >
                  {INDIAN_PAYMENT_METHOD_OPTIONS.slice(0, 8).map((m) => {
                    const isSel = paymentMethod === m.id;
                    return (
                      <Pressable
                        key={m.id}
                        style={[
                          styles.methodPill,
                          isSel && styles.methodPillActive,
                        ]}
                        onPress={() => setPaymentMethod(m.id)}
                      >
                        <Ionicons
                          name={m.icon as any}
                          size={13}
                          color={isSel ? "#171717" : theme.colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.methodPillText,
                            isSel && styles.methodPillTextActive,
                          ]}
                        >
                          {m.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* 5. BANK UTR / REFERENCE NUMBER */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Bank UTR / Transaction Reference (Optional)</Text>
                <TextInput
                  style={styles.textInputFull}
                  value={paymentReference}
                  onChangeText={setPaymentReference}
                  placeholder="e.g. UPI/20261102/9841293"
                  placeholderTextColor="#A0988A"
                />
              </View>

              {/* 6. FAILURE REASON (IF FAILED) */}
              {status === "FAILED" && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.error }]}>
                    Reason for Failure
                  </Text>
                  <TextInput
                    style={[styles.textInputFull, { borderColor: theme.colors.error }]}
                    value={failureReason}
                    onChangeText={setFailureReason}
                    placeholder="e.g. Insufficient balance / Expired debit card"
                    placeholderTextColor="#A0988A"
                  />
                </View>
              )}

              {/* 7. NOTES */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Notes / Description</Text>
                <TextInput
                  style={[styles.textInputFull, { height: 60 }]}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  placeholder="Personal reminder notes..."
                  placeholderTextColor="#A0988A"
                />
              </View>
            </ScrollView>

            {/* FOOTER ACTIONS */}
            <View style={styles.footer}>
              <Pressable
                style={styles.cancelBtn}
                onPress={onClose}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Record Payment</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  webBackdrop: {
    padding: 24,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 500,
    maxHeight: "90%",
    backgroundColor: theme.colors.card, // #FFFDF5
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  webModalContainer: {
    maxWidth: 540,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
    backgroundColor: "#F7F5EC",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#171717",
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    padding: 20,
  },
  errorAlert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: theme.borderRadius.md,
    marginBottom: 16,
  },
  errorAlertText: {
    fontSize: 13,
    color: theme.colors.error,
    fontWeight: "600",
    flex: 1,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#171717",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  subPillsRow: {
    gap: 8,
    paddingBottom: 4,
  },
  subPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    backgroundColor: "#FFFFFF",
  },
  subPillActive: {
    backgroundColor: "#171717",
    borderColor: "#171717",
  },
  subPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  subPillTextActive: {
    color: "#FFFFFF",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.borderRadius.md,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: "800",
    color: "#171717",
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    fontWeight: "700",
    color: "#171717",
  },
  textInputFull: {
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.borderRadius.md,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#171717",
  },
  gstSplitBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#EBF3F0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  gstSplitRow: {
    flexDirection: "row",
    gap: 6,
  },
  gstSplitLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  gstSplitValue: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  statusPillsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statusPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    backgroundColor: "#FFFFFF",
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  methodsRow: {
    gap: 8,
    paddingBottom: 4,
  },
  methodPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    backgroundColor: "#FFFFFF",
  },
  methodPillActive: {
    backgroundColor: "#DDEBE5", // Mint Green
    borderColor: theme.colors.primary,
  },
  methodPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  methodPillTextActive: {
    color: "#171717",
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    backgroundColor: "#F7F5EC",
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: theme.borderRadius.md,
    backgroundColor: "#171717",
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
