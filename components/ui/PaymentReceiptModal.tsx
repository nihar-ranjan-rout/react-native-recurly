import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import Badge from "@/components/ui/Badge";
import CategoryIcon from "@/components/ui/CategoryIcon";
import { theme } from "@/constants/theme";
import { useCurrency } from "@/context/CurrencyContext";
import {
  buildPaymentReceipt,
  DetailedPaymentTransaction,
  PaymentReceipt,
} from "@/lib/payments";

interface PaymentReceiptModalProps {
  visible: boolean;
  transaction: DetailedPaymentTransaction | null;
  onClose: () => void;
}

export default function PaymentReceiptModal({
  visible,
  transaction,
  onClose,
}: PaymentReceiptModalProps) {
  const { width } = useWindowDimensions();
  const isWeb = width > 768;
  const { formatAmount } = useCurrency();

  if (!transaction) return null;

  const receipt: PaymentReceipt = buildPaymentReceipt(transaction);

  const handlePrint = () => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.print();
    }
  };

  const statusVariant =
    receipt.status === "SUCCESS" || receipt.status === "paid"
      ? "success"
      : receipt.status === "FAILED"
      ? "error"
      : receipt.status === "PENDING"
      ? "warning"
      : "neutral";

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalOverlay}>
        <View style={[styles.modalBackdrop, isWeb && styles.webBackdrop]}>
          <View style={[styles.receiptContainer, isWeb && styles.webReceiptContainer]}>
            {/* RECEIPT HEADER */}
            <View style={styles.receiptTop}>
              <View style={styles.brandRow}>
                <View style={styles.brandIcon}>
                  <Ionicons name="receipt-outline" size={20} color="#171717" />
                </View>
                <View>
                  <Text style={styles.brandTitle}>RECURLY FINTECH</Text>
                  <Text style={styles.brandSubtitle}>Personal Expense & Subscription Ledger</Text>
                </View>
              </View>
              <Pressable
                onPress={onClose}
                style={styles.closeButton}
                accessibilityLabel="Close receipt"
              >
                <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.receiptBody}
              showsVerticalScrollIndicator={false}
            >
              {/* STATUS & AMOUNT HERO */}
              <View style={styles.heroSection}>
                <Badge
                  label={receipt.status.toUpperCase()}
                  variant={statusVariant}
                />
                <Text style={styles.totalAmountText}>
                  {formatAmount(receipt.totalAmount, {
                    originalCurrency: receipt.currencyCode,
                  })}
                </Text>
                <Text style={styles.heroSubText}>
                  Paid for {receipt.subscriptionName}
                </Text>
              </View>

              {/* PERFORATED DIVIDER */}
              <View style={styles.perforatedLine} />

              {/* TRANSACTION METADATA */}
              <View style={styles.detailsGroup}>
                <Text style={styles.groupHeader}>TRANSACTION PARTICULARS</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Receipt Number</Text>
                  <Text style={styles.detailValueMono}>{receipt.receiptNumber}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Bank / UTR Reference</Text>
                  <Text style={styles.detailValueMono}>{receipt.transactionReference}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction Date</Text>
                  <Text style={styles.detailValue}>
                    {receipt.paymentDateFormatted} • {receipt.paymentTimeFormatted}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Method</Text>
                  <View style={styles.paymentMethodValueRow}>
                    <Ionicons name="card-outline" size={14} color="#171717" />
                    <Text style={styles.detailValue}>{receipt.paymentMethod}</Text>
                  </View>
                </View>

                {receipt.mandateRefId && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>UPI AutoPay Mandate (UMN)</Text>
                    <Text style={styles.detailValueMono}>{receipt.mandateRefId}</Text>
                  </View>
                )}

                {receipt.gstin && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Business GSTIN</Text>
                    <Text style={styles.detailValueMono}>{receipt.gstin}</Text>
                  </View>
                )}
              </View>

              {/* FINANCIAL & TAX BREAKDOWN */}
              <View style={styles.detailsGroup}>
                <Text style={styles.groupHeader}>FINANCIAL & TAX BREAKDOWN</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Base Subscription Price</Text>
                  <Text style={styles.detailValue}>
                    {formatAmount(receipt.baseAmount, {
                      originalCurrency: receipt.currencyCode,
                    })}
                  </Text>
                </View>

                {receipt.taxApplicable && (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>
                        CGST ({receipt.taxRate / 2}%)
                      </Text>
                      <Text style={styles.detailValue}>
                        +{formatAmount(receipt.cgstAmount, {
                          originalCurrency: receipt.currencyCode,
                        })}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>
                        SGST ({receipt.taxRate / 2}%)
                      </Text>
                      <Text style={styles.detailValue}>
                        +{formatAmount(receipt.sgstAmount, {
                          originalCurrency: receipt.currencyCode,
                        })}
                      </Text>
                    </View>
                  </>
                )}

                <View style={[styles.detailRow, styles.totalRow]}>
                  <Text style={styles.totalRowLabel}>Total Amount Paid</Text>
                  <Text style={styles.totalRowValue}>
                    {formatAmount(receipt.totalAmount, {
                      originalCurrency: receipt.currencyCode,
                    })}
                  </Text>
                </View>
              </View>

              {/* MANDATORY LEGAL DISCLAIMER */}
              <View style={styles.disclaimerBox}>
                <View style={styles.disclaimerHeader}>
                  <Ionicons name="information-circle-outline" size={16} color="#777777" />
                  <Text style={styles.disclaimerTitle}>IMPORTANT NOTICE & LEGAL DISCLAIMER</Text>
                </View>
                <Text style={styles.disclaimerText}>{receipt.disclaimer}</Text>
              </View>
            </ScrollView>

            {/* RECEIPT FOOTER ACTIONS */}
            <View style={styles.receiptFooter}>
              {Platform.OS === "web" && (
                <Pressable
                  style={styles.printButton}
                  onPress={handlePrint}
                >
                  <Ionicons name="print-outline" size={16} color="#171717" />
                  <Text style={styles.printButtonText}>Print / Save PDF</Text>
                </Pressable>
              )}
              <Pressable
                style={styles.closeActionButton}
                onPress={onClose}
              >
                <Text style={styles.closeActionButtonText}>Done</Text>
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
  receiptContainer: {
    width: "100%",
    maxWidth: 480,
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
  webReceiptContainer: {
    maxWidth: 520,
  },
  receiptTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
    backgroundColor: "#F7F5EC",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: theme.colors.background, // #DDEBE5 Mint
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#171717",
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
  },
  receiptBody: {
    padding: 20,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 14,
  },
  totalAmountText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#171717",
    letterSpacing: -0.5,
    marginTop: 8,
  },
  heroSubText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: "600",
    marginTop: 4,
  },
  perforatedLine: {
    height: 1,
    borderWidth: 1,
    borderColor: "#E2DBD0",
    borderStyle: "dashed",
    marginVertical: 14,
  },
  detailsGroup: {
    marginBottom: 16,
  },
  groupHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F0ECE1",
  },
  detailLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 13,
    color: "#171717",
    fontWeight: "600",
  },
  detailValueMono: {
    fontSize: 12,
    color: "#171717",
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  paymentMethodValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  totalRow: {
    borderTopWidth: 1,
    borderBottomWidth: 0,
    borderTopColor: "#171717",
    marginTop: 6,
    paddingTop: 10,
  },
  totalRowLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#171717",
  },
  totalRowValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#171717",
  },
  disclaimerBox: {
    backgroundColor: "#F4F1E8",
    padding: 12,
    borderRadius: theme.borderRadius.md,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E5DEC9",
  },
  disclaimerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  disclaimerTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#555555",
    letterSpacing: 0.5,
  },
  disclaimerText: {
    fontSize: 11,
    color: "#666666",
    lineHeight: 15,
  },
  receiptFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    backgroundColor: "#F7F5EC",
  },
  printButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    backgroundColor: "#FFFFFF",
  },
  printButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#171717",
  },
  closeActionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    backgroundColor: "#171717",
  },
  closeActionButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
