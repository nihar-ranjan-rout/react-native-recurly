import React, { useCallback, useState } from "react";
import {
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
import { useFocusEffect, useRouter } from "expo-router";

import AppBackground from "@/components/ui/AppBackground";
import Badge from "@/components/ui/Badge";
import PaymentReceiptModal from "@/components/ui/PaymentReceiptModal";
import RecordPaymentModal from "@/components/payment/RecordPaymentModal";
import { theme } from "@/constants/theme";
import { useCurrency } from "@/context/CurrencyContext";
import { formatIndianDate } from "@/lib/localization";
import {
  DetailedPaymentTransaction,
  getAllTransactions,
  getTransactionMetrics,
  PaymentTransactionStatus,
} from "@/lib/payments";
import { getSubscriptions, Subscription } from "@/lib/subscriptions";

export default function PaymentHistoryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = width > 768;
  const { formatAmount } = useCurrency();

  const [transactions, setTransactions] = useState<DetailedPaymentTransaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [selectedMethodFilter, setSelectedMethodFilter] = useState<string>("ALL");

  // Modal states
  const [activeReceiptTx, setActiveReceiptTx] = useState<DetailedPaymentTransaction | null>(null);
  const [recordModalVisible, setRecordModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [txs, subs] = await Promise.all([
      getAllTransactions(),
      getSubscriptions(),
    ]);
    setTransactions(txs);
    setSubscriptions(subs);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const metrics = getTransactionMetrics(transactions);

  // Apply filters
  const filteredTxs = transactions.filter((t) => {
    const matchesStatus =
      selectedStatusFilter === "ALL" ||
      t.status === selectedStatusFilter ||
      (selectedStatusFilter === "SUCCESS" && t.status === "paid");

    const matchesMethod =
      selectedMethodFilter === "ALL" ||
      t.paymentMethod.toLowerCase().includes(selectedMethodFilter.toLowerCase());

    return matchesStatus && matchesMethod;
  });

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isWeb && styles.webScrollContent,
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.container, isWeb && styles.webContainer]}>
            {/* TOP HEADER */}
            <View style={styles.topNav}>
              <View style={styles.breadcrumbRow}>
                <Pressable
                  style={styles.backBtn}
                  onPress={() => router.back()}
                  accessibilityLabel="Back"
                >
                  <Ionicons name="arrow-back" size={18} color={theme.colors.text} />
                </Pressable>
                <View>
                  <Text style={styles.pageTitle}>Payment History & Receipts</Text>
                  <Text style={styles.pageSubtitle}>
                    All subscription renewals, UPI AutoPay debits & receipts
                  </Text>
                </View>
              </View>

              <Pressable
                style={styles.recordPaymentHeaderBtn}
                onPress={() => setRecordModalVisible(true)}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.recordPaymentHeaderBtnText}>Record Payment</Text>
              </Pressable>
            </View>

            {/* METRIC SUMMARY CARDS */}
            <View style={styles.metricsRow}>
              {/* Total Paid Card */}
              <View style={[styles.metricCard, { backgroundColor: "#171717" }]}>
                <Text style={styles.metricLabelLight}>TOTAL OUTFLOW PAID</Text>
                <Text style={styles.metricValueLight}>
                  {formatAmount(metrics.totalAmountPaidINR, { originalCurrency: "INR" })}
                </Text>
                <Text style={styles.metricSubLight}>
                  Across {metrics.successCount} successful debits
                </Text>
              </View>

              {/* Status Breakdown Grid */}
              <View style={styles.statusMetricsGrid}>
                <View style={styles.statusBox}>
                  <Text style={styles.statusBoxCount}>{metrics.successCount}</Text>
                  <Text style={styles.statusBoxLabel}>Successful</Text>
                </View>
                <View style={styles.statusBox}>
                  <Text style={[styles.statusBoxCount, { color: theme.colors.error }]}>
                    {metrics.failedCount}
                  </Text>
                  <Text style={styles.statusBoxLabel}>Failed</Text>
                </View>
                <View style={styles.statusBox}>
                  <Text style={[styles.statusBoxCount, { color: theme.colors.warning }]}>
                    {metrics.pendingCount}
                  </Text>
                  <Text style={styles.statusBoxLabel}>Pending</Text>
                </View>
              </View>
            </View>

            {/* FILTER CONTROLS */}
            <View style={styles.filterSection}>
              {/* Status Filter Tabs */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterPillsRow}
              >
                {(
                  [
                    { id: "ALL", label: "All Transactions" },
                    { id: "SUCCESS", label: "Successful" },
                    { id: "FAILED", label: "Failed" },
                    { id: "PENDING", label: "Pending" },
                    { id: "REFUNDED", label: "Refunded" },
                  ] as const
                ).map((tab) => {
                  const isSel = selectedStatusFilter === tab.id;
                  return (
                    <Pressable
                      key={tab.id}
                      style={[
                        styles.filterPill,
                        isSel && styles.filterPillActive,
                      ]}
                      onPress={() => setSelectedStatusFilter(tab.id)}
                    >
                      <Text
                        style={[
                          styles.filterPillText,
                          isSel && styles.filterPillTextActive,
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Payment Rail Filter */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.filterPillsRow, { marginTop: 8 }]}
              >
                {(
                  [
                    { id: "ALL", label: "All Rails" },
                    { id: "UPI", label: "UPI & AutoPay" },
                    { id: "RuPay", label: "RuPay Cards" },
                    { id: "Card", label: "All Cards" },
                    { id: "NetBanking", label: "Net Banking" },
                  ] as const
                ).map((m) => {
                  const isSel = selectedMethodFilter === m.id;
                  return (
                    <Pressable
                      key={m.id}
                      style={[
                        styles.railPill,
                        isSel && styles.railPillActive,
                      ]}
                      onPress={() => setSelectedMethodFilter(m.id)}
                    >
                      <Text
                        style={[
                          styles.railPillText,
                          isSel && styles.railPillTextActive,
                        ]}
                      >
                        {m.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* TRANSACTION RECORD LIST */}
            <View style={styles.listSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>
                  Transactions ({filteredTxs.length})
                </Text>
                <Text style={styles.sectionHint}>
                  Tap any record to inspect receipt & GST breakdown
                </Text>
              </View>

              {filteredTxs.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons
                    name="receipt-outline"
                    size={44}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={styles.emptyCardTitle}>No Matching Payments</Text>
                  <Text style={styles.emptyCardSub}>
                    No transaction entries match the selected status or payment method.
                  </Text>
                </View>
              ) : (
                filteredTxs.map((tx) => {
                  const isSuccess = tx.status === "SUCCESS" || tx.status === "paid";
                  const isFailed = tx.status === "FAILED";
                  const isPending = tx.status === "PENDING" || tx.status === "INITIATED";

                  return (
                    <Pressable
                      key={tx.id}
                      style={styles.txCard}
                      onPress={() => setActiveReceiptTx(tx)}
                    >
                      <View style={styles.txCardLeft}>
                        <View
                          style={[
                            styles.txStatusIconBox,
                            {
                              backgroundColor: isSuccess
                                ? "#EBF5ED"
                                : isFailed
                                ? "#FEE2E2"
                                : "#FEF3C7",
                            },
                          ]}
                        >
                          <Ionicons
                            name={
                              isSuccess
                                ? "checkmark-circle"
                                : isFailed
                                ? "close-circle"
                                : "time"
                            }
                            size={20}
                            color={
                              isSuccess
                                ? theme.colors.success
                                : isFailed
                                ? theme.colors.error
                                : theme.colors.warning
                            }
                          />
                        </View>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={styles.txSubName}>{tx.subscriptionName}</Text>
                          <View style={styles.txSubInfoRow}>
                            <Text style={styles.txDate}>{tx.date}</Text>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.txMethod} numberOfLines={1}>
                              {tx.paymentMethod}
                            </Text>
                          </View>
                          {tx.failureReason && (
                            <Text style={styles.failureReasonText} numberOfLines={1}>
                              Declined: {tx.failureReason}
                            </Text>
                          )}
                        </View>
                      </View>

                      <View style={styles.txCardRight}>
                        <Text
                          style={[
                            styles.txAmount,
                            isFailed && { textDecorationLine: "line-through", color: "#999" },
                          ]}
                        >
                          {formatAmount(tx.amount, { originalCurrency: tx.currencyCode })}
                        </Text>
                        <View style={styles.receiptActionHint}>
                          <Text style={styles.receiptActionHintText}>Receipt</Text>
                          <Ionicons
                            name="chevron-forward"
                            size={12}
                            color={theme.colors.textSecondary}
                          />
                        </View>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          </View>
        </ScrollView>

        {/* PAYMENT RECEIPT MODAL */}
        <PaymentReceiptModal
          visible={!!activeReceiptTx}
          transaction={activeReceiptTx}
          onClose={() => setActiveReceiptTx(null)}
        />

        {/* RECORD PAYMENT MODAL */}
        <RecordPaymentModal
          visible={recordModalVisible}
          subscriptions={subscriptions}
          onClose={() => setRecordModalVisible(false)}
          onSuccess={loadData}
        />
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 60 },
  webScrollContent: { alignItems: "center" },
  container: { width: "100%", paddingHorizontal: 20, paddingTop: 16 },
  webContainer: { maxWidth: 760, paddingTop: 24, paddingHorizontal: 24 },

  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  breadcrumbRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#171717",
  },
  pageSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  recordPaymentHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#171717",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.borderRadius.md,
  },
  recordPaymentHeaderBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  metricsRow: {
    marginBottom: 16,
  },
  metricCard: {
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    marginBottom: 10,
  },
  metricLabelLight: {
    fontSize: 11,
    fontWeight: "800",
    color: "#DDEBE5", // Mint
    letterSpacing: 0.8,
  },
  metricValueLight: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginTop: 4,
  },
  metricSubLight: {
    fontSize: 12,
    color: "#B0B0B0",
    marginTop: 4,
  },
  statusMetricsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  statusBox: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: 12,
    alignItems: "center",
  },
  statusBoxCount: {
    fontSize: 18,
    fontWeight: "900",
    color: "#171717",
  },
  statusBoxLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  filterSection: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: 12,
    marginBottom: 16,
  },
  filterPillsRow: {
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    backgroundColor: "#FFFFFF",
  },
  filterPillActive: {
    backgroundColor: "#171717",
    borderColor: "#171717",
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  filterPillTextActive: {
    color: "#FFFFFF",
  },
  railPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    backgroundColor: "#F7F5EC",
  },
  railPillActive: {
    backgroundColor: "#DDEBE5",
    borderColor: theme.colors.primary,
  },
  railPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  railPillTextActive: {
    color: "#171717",
    fontWeight: "700",
  },

  listSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#171717",
  },
  sectionHint: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  emptyCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: 32,
    alignItems: "center",
  },
  emptyCardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#171717",
    marginTop: 10,
  },
  emptyCardSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: 14,
    marginBottom: 10,
  },
  txCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  txStatusIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  txSubName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#171717",
  },
  txSubInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  txDate: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  bullet: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  txMethod: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  failureReasonText: {
    fontSize: 11,
    color: theme.colors.error,
    fontWeight: "600",
    marginTop: 2,
  },
  txCardRight: {
    alignItems: "flex-end",
  },
  txAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#171717",
  },
  receiptActionHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 3,
  },
  receiptActionHintText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
});
