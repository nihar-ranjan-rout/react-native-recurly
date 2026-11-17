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
import {
  deletePaymentMethod,
  getSavedPaymentMethods,
  IndianPaymentCategory,
  INDIAN_PAYMENT_METHOD_OPTIONS,
  maskVpa,
  SavedPaymentMethod,
  savePaymentMethod,
} from "@/lib/payments";

export interface PaymentMethodsModalProps {
  visible: boolean;
  paymentMethods?: SavedPaymentMethod[];
  onClose: () => void;
  onMethodsUpdated?: () => void;
}

export default function PaymentMethodsModal({
  visible,
  paymentMethods: propMethods,
  onClose,
  onMethodsUpdated,
}: PaymentMethodsModalProps) {
  const { width } = useWindowDimensions();
  const isWeb = width > 768;

  const [localMethods, setLocalMethods] = useState<SavedPaymentMethod[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedType, setSelectedType] = useState<IndianPaymentCategory>("upi");
  const [providerName, setProviderName] = useState("Google Pay");
  const [vpaInput, setVpaInput] = useState("");
  const [accIdentifierInput, setAccIdentifierInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchMethods = async () => {
    const list = await getSavedPaymentMethods();
    setLocalMethods(list);
  };

  React.useEffect(() => {
    if (visible) {
      if (propMethods) {
        setLocalMethods(propMethods);
      } else {
        fetchMethods();
      }
    }
  }, [visible, propMethods]);

  const paymentMethods = propMethods || localMethods;

  const handleSave = async () => {
    if (selectedType === "upi" && !vpaInput.includes("@")) {
      setErrorMsg("Please enter a valid UPI ID (e.g. yourname@okhdfcbank)");
      return;
    }
    if (selectedType === "card" && accIdentifierInput.replace(/\D/g, "").length < 4) {
      setErrorMsg("Please enter the last 4 digits of your card.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await savePaymentMethod({
        methodType: selectedType,
        providerName,
        vpa: selectedType === "upi" ? vpaInput.trim() : undefined,
        accountIdentifier:
          selectedType === "card"
            ? `•••• ${accIdentifierInput.slice(-4)}`
            : accIdentifierInput.trim() || undefined,
        isDefault: paymentMethods.length === 0,
      });

      setIsSubmitting(false);
      setIsAdding(false);
      setVpaInput("");
      setAccIdentifierInput("");
      await fetchMethods();
      onMethodsUpdated?.();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || "Failed to save payment method.");
    }
  };

  const handleDelete = async (id: string) => {
    await deletePaymentMethod(id);
    await fetchMethods();
    onMethodsUpdated?.();
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
            {/* HEADER */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <View style={styles.headerIcon}>
                  <Ionicons name="card" size={20} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Saved Payment Methods</Text>
                  <Text style={styles.headerSubtitle}>
                    UPI VPAs, RuPay Cards & Bank Accounts
                  </Text>
                </View>
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
              {/* SECURITY NOTICE */}
              <View style={styles.securityBanner}>
                <Ionicons name="shield-checkmark" size={16} color="#2E7D32" />
                <Text style={styles.securityText}>
                  Bank-Grade Protection: Recurly strictly stores masked payment references for
                  expense tracking. UPI PINs, ATM PINs, CVVs, or Net Banking passwords are
                  never requested or stored.
                </Text>
              </View>

              {/* LIST SAVED METHODS */}
              {paymentMethods.length === 0 && !isAdding ? (
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="wallet-outline"
                    size={44}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={styles.emptyTitle}>No Payment Methods Saved</Text>
                  <Text style={styles.emptySub}>
                    Save your preferred UPI apps or RuPay cards for quicker subscription tracking.
                  </Text>
                </View>
              ) : (
                paymentMethods.map((pm) => (
                  <View key={pm.id} style={styles.methodCard}>
                    <View style={styles.methodCardLeft}>
                      <View style={styles.methodIconBox}>
                        <Ionicons
                          name={
                            pm.methodType === "upi"
                              ? "send-outline"
                              : pm.methodType === "card"
                              ? "card-outline"
                              : "business-outline"
                          }
                          size={18}
                          color="#171717"
                        />
                      </View>
                      <View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={styles.methodName}>{pm.providerName}</Text>
                          {pm.isDefault && <Badge label="Default" variant="primary" />}
                        </View>
                        <Text style={styles.methodIdentifier}>
                          {pm.vpa || pm.accountIdentifier || "Reference Linked"}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => handleDelete(pm.id)}
                      style={styles.deleteMethodBtn}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color={theme.colors.error}
                      />
                    </Pressable>
                  </View>
                ))
              )}

              {/* ADD NEW PAYMENT METHOD SECTION */}
              {isAdding ? (
                <View style={styles.addFormCard}>
                  <Text style={styles.addFormTitle}>Add Payment Instrument</Text>

                  {errorMsg && (
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  )}

                  {/* Instrument Type */}
                  <View style={styles.typePillsRow}>
                    {(
                      [
                        { id: "upi", label: "UPI VPA" },
                        { id: "card", label: "RuPay / Card" },
                        { id: "netbanking", label: "Net Banking" },
                      ] as const
                    ).map((t) => {
                      const isSel = selectedType === t.id;
                      return (
                        <Pressable
                          key={t.id}
                          style={[styles.typePill, isSel && styles.typePillActive]}
                          onPress={() => {
                            setSelectedType(t.id);
                            if (t.id === "upi") setProviderName("Google Pay");
                            else if (t.id === "card") setProviderName("RuPay Debit Card");
                            else setProviderName("HDFC Net Banking");
                          }}
                        >
                          <Text
                            style={[
                              styles.typePillText,
                              isSel && styles.typePillTextActive,
                            ]}
                          >
                            {t.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Provider Name */}
                  <Text style={styles.fieldLabel}>Provider / App Name</Text>
                  <TextInput
                    style={styles.formInput}
                    value={providerName}
                    onChangeText={setProviderName}
                    placeholder="e.g. Google Pay / PhonePe / RuPay"
                    placeholderTextColor="#999"
                  />

                  {/* UPI VPA Field */}
                  {selectedType === "upi" && (
                    <>
                      <Text style={styles.fieldLabel}>UPI ID (VPA)</Text>
                      <TextInput
                        style={styles.formInput}
                        value={vpaInput}
                        onChangeText={setVpaInput}
                        placeholder="e.g. alex@okhdfcbank"
                        placeholderTextColor="#999"
                        autoCapitalize="none"
                      />
                      <Text style={styles.helperText}>
                        Will be stored securely masked as {maskVpa(vpaInput || "user@bank")}
                      </Text>
                    </>
                  )}

                  {/* Card Identifier Field */}
                  {selectedType === "card" && (
                    <>
                      <Text style={styles.fieldLabel}>Last 4 Digits of Card</Text>
                      <TextInput
                        style={styles.formInput}
                        value={accIdentifierInput}
                        onChangeText={setAccIdentifierInput}
                        placeholder="e.g. 7109"
                        placeholderTextColor="#999"
                        maxLength={4}
                        keyboardType="numeric"
                      />
                    </>
                  )}

                  <View style={styles.addFormActions}>
                    <Pressable
                      style={styles.cancelAddBtn}
                      onPress={() => setIsAdding(false)}
                    >
                      <Text style={styles.cancelAddText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={styles.saveAddBtn}
                      onPress={handleSave}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.saveAddText}>Save Method</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  style={styles.openAddBtn}
                  onPress={() => setIsAdding(true)}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#171717" />
                  <Text style={styles.openAddBtnText}>Add Payment Method</Text>
                </Pressable>
              )}
            </ScrollView>

            {/* FOOTER */}
            <View style={styles.footer}>
              <Pressable style={styles.doneBtn} onPress={onClose}>
                <Text style={styles.doneBtnText}>Done</Text>
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
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: theme.colors.background, // #DDEBE5
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#171717",
  },
  headerSubtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    padding: 20,
  },
  securityBanner: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#EBF3F0",
    borderWidth: 1,
    borderColor: "#CCE2D8",
    padding: 12,
    borderRadius: theme.borderRadius.md,
    marginBottom: 16,
  },
  securityText: {
    fontSize: 11,
    color: "#2E5C46",
    lineHeight: 16,
    flex: 1,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#171717",
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    maxWidth: 280,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: 14,
    marginBottom: 10,
  },
  methodCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  methodIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: "#F7F5EC",
    alignItems: "center",
    justifyContent: "center",
  },
  methodName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#171717",
  },
  methodIdentifier: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  deleteMethodBtn: {
    padding: 8,
  },
  openAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    backgroundColor: "#FFFFFF",
    marginTop: 6,
  },
  openAddBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#171717",
  },
  addFormCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    padding: 16,
    marginTop: 10,
  },
  addFormTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#171717",
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    fontWeight: "600",
    marginBottom: 8,
  },
  typePillsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  typePill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    backgroundColor: "#F7F5EC",
  },
  typePillActive: {
    backgroundColor: "#171717",
    borderColor: "#171717",
  },
  typePillText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  typePillTextActive: {
    color: "#FFFFFF",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#171717",
    marginBottom: 4,
  },
  formInput: {
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#171717",
    marginBottom: 10,
  },
  helperText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginBottom: 10,
    fontStyle: "italic",
  },
  addFormActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 6,
  },
  cancelAddBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cancelAddText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  saveAddBtn: {
    backgroundColor: "#171717",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveAddText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    backgroundColor: "#F7F5EC",
  },
  doneBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    backgroundColor: "#171717",
  },
  doneBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
