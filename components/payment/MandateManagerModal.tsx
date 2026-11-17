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
import { formatIndianDate } from "@/lib/localization";
import {
  MANDATE_STATUS_META,
  MandateStatus,
  PaymentMandate,
  updateMandateStatus,
} from "@/lib/payments";

export interface MandateManagerModalProps {
  visible: boolean;
  mandates: PaymentMandate[];
  subscriptionFilterId?: string;
  onClose: () => void;
  onMandateUpdated?: () => void;
  onUpdate?: () => void;
}

export default function MandateManagerModal({
  visible,
  mandates,
  subscriptionFilterId,
  onClose,
  onMandateUpdated,
  onUpdate,
}: MandateManagerModalProps) {
  const { width } = useWindowDimensions();
  const isWeb = width > 768;
  const { formatAmount } = useCurrency();
  const notifyUpdated = onUpdate || onMandateUpdated;

  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [revokePromptId, setRevokePromptId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState("");

  const filteredMandates = subscriptionFilterId
    ? mandates.filter((m) => m.subscriptionId === subscriptionFilterId)
    : mandates;

  const handleStatusChange = async (
    mandateId: string,
    newStatus: MandateStatus,
    reason?: string
  ) => {
    setActionInProgressId(mandateId);
    try {
      await updateMandateStatus(mandateId, newStatus, reason);
      setActionInProgressId(null);
      setRevokePromptId(null);
      setRevokeReason("");
      notifyUpdated?.();
    } catch {
      setActionInProgressId(null);
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
            {/* HEADER */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <View style={styles.headerIcon}>
                  <Ionicons name="repeat" size={20} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.headerTitle}>UPI AutoPay & Mandates</Text>
                  <Text style={styles.headerSubtitle}>
                    NPCI e-Mandate standing instructions & debit management
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

            {/* MANDATE LIST OR EMPTY */}
            <ScrollView
              contentContainerStyle={styles.body}
              showsVerticalScrollIndicator={false}
            >
              {/* NPCI REGULATORY DISCLAIMER */}
              <View style={styles.regulatoryCard}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#2E7D32" />
                <Text style={styles.regulatoryText}>
                  Mandate Tracking Mode: Records NPCI e-Mandates for recurring subscription
                  tracking. To modify active debit execution at the bank level, use your
                  UPI app (GPay / PhonePe / Paytm / BHIM) AutoPay settings.
                </Text>
              </View>

              {filteredMandates.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="calendar-clear-outline"
                    size={48}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={styles.emptyTitle}>No AutoPay Mandates Registered</Text>
                  <Text style={styles.emptySub}>
                    Subscriptions without active mandates require manual payment on every
                    renewal date.
                  </Text>
                </View>
              ) : (
                filteredMandates.map((m) => {
                  const meta = MANDATE_STATUS_META[m.status] || MANDATE_STATUS_META.ACTIVE;
                  const isActioning = actionInProgressId === m.id;
                  const isRevokingThis = revokePromptId === m.id;

                  return (
                    <View key={m.id} style={styles.mandateCard}>
                      {/* CARD TOP */}
                      <View style={styles.cardTop}>
                        <View>
                          <Text style={styles.subName}>
                            {m.subscriptionName || "Subscription"}
                          </Text>
                          <Text style={styles.umnCode}>UMN: {m.mandateRefId}</Text>
                        </View>
                        <Badge label={meta.label} variant={meta.badgeVariant} />
                      </View>

                      {/* CARD STATS */}
                      <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                          <Text style={styles.statLabel}>MAX CAP</Text>
                          <Text style={styles.statValue}>
                            {formatAmount(m.maxAmount, { originalCurrency: m.currency })}
                          </Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statLabel}>FREQUENCY</Text>
                          <Text style={[styles.statValue, { textTransform: "capitalize" }]}>
                            {m.frequency}
                          </Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statLabel}>NEXT DEBIT</Text>
                          <Text style={styles.statValue}>
                            {m.nextExpectedDebitDate
                              ? formatIndianDate(m.nextExpectedDebitDate)
                              : "N/A"}
                          </Text>
                        </View>
                      </View>

                      {/* MANDATE DETAILS */}
                      <View style={styles.detailsBox}>
                        <View style={styles.detailLine}>
                          <Text style={styles.detailKey}>Payment Method:</Text>
                          <Text style={styles.detailVal}>
                            {m.paymentMethodType} {m.vpa ? `(${m.vpa})` : ""}
                          </Text>
                        </View>
                        <View style={styles.detailLine}>
                          <Text style={styles.detailKey}>Valid From:</Text>
                          <Text style={styles.detailVal}>
                            {formatIndianDate(m.startDate)}
                            {m.expiryDate ? ` to ${formatIndianDate(m.expiryDate)}` : " (Ongoing)"}
                          </Text>
                        </View>
                        {m.lastDebitDate && (
                          <View style={styles.detailLine}>
                            <Text style={styles.detailKey}>Last Debit Confirmed:</Text>
                            <Text style={styles.detailVal}>
                              {formatIndianDate(m.lastDebitDate)}
                            </Text>
                          </View>
                        )}
                        {m.cancellationReason && (
                          <View style={styles.detailLine}>
                            <Text style={[styles.detailKey, { color: theme.colors.error }]}>
                              Cancellation Note:
                            </Text>
                            <Text style={[styles.detailVal, { color: theme.colors.error }]}>
                              {m.cancellationReason}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* REVOCATION REASON PROMPT */}
                      {isRevokingThis && (
                        <View style={styles.revokeBox}>
                          <Text style={styles.revokeLabel}>
                            Reason for revoking AutoPay mandate:
                          </Text>
                          <TextInput
                            style={styles.revokeInput}
                            value={revokeReason}
                            onChangeText={setRevokeReason}
                            placeholder="e.g. Switched to annual plan / Service discontinued"
                            placeholderTextColor="#999"
                          />
                          <View style={styles.revokeActions}>
                            <Pressable
                              style={styles.revokeCancelBtn}
                              onPress={() => setRevokePromptId(null)}
                            >
                              <Text style={styles.revokeCancelText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                              style={styles.revokeConfirmBtn}
                              onPress={() =>
                                handleStatusChange(
                                  m.id,
                                  "REVOKED",
                                  revokeReason || "Revoked by user"
                                )
                              }
                            >
                              <Text style={styles.revokeConfirmText}>Confirm Revoke</Text>
                            </Pressable>
                          </View>
                        </View>
                      )}

                      {/* ACTION BUTTONS */}
                      {!isRevokingThis && (
                        <View style={styles.actionRow}>
                          {m.status === "ACTIVE" && (
                            <Pressable
                              style={styles.pauseBtn}
                              onPress={() =>
                                handleStatusChange(m.id, "PAUSED", "Paused by user")
                              }
                              disabled={isActioning}
                            >
                              {isActioning ? (
                                <ActivityIndicator size="small" color="#171717" />
                              ) : (
                                <>
                                  <Ionicons name="pause" size={13} color="#171717" />
                                  <Text style={styles.pauseBtnText}>Pause AutoPay</Text>
                                </>
                              )}
                            </Pressable>
                          )}

                          {m.status === "PAUSED" && (
                            <Pressable
                              style={styles.resumeBtn}
                              onPress={() => handleStatusChange(m.id, "ACTIVE")}
                              disabled={isActioning}
                            >
                              {isActioning ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                              ) : (
                                <>
                                  <Ionicons name="play" size={13} color="#FFFFFF" />
                                  <Text style={styles.resumeBtnText}>Resume AutoPay</Text>
                                </>
                              )}
                            </Pressable>
                          )}

                          {m.status !== "REVOKED" && (
                            <Pressable
                              style={styles.revokeBtn}
                              onPress={() => setRevokePromptId(m.id)}
                              disabled={isActioning}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={13}
                                color={theme.colors.error}
                              />
                              <Text style={styles.revokeBtnText}>Revoke Mandate</Text>
                            </Pressable>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* FOOTER */}
            <View style={styles.footer}>
              <Pressable style={styles.doneBtn} onPress={onClose}>
                <Text style={styles.doneBtnText}>Close</Text>
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
    maxWidth: 540,
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
    maxWidth: 580,
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
  regulatoryCard: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#EBF3F0",
    borderWidth: 1,
    borderColor: "#CCE2D8",
    padding: 12,
    borderRadius: theme.borderRadius.md,
    marginBottom: 16,
  },
  regulatoryText: {
    fontSize: 11,
    color: "#2E5C46",
    lineHeight: 16,
    flex: 1,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 36,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#171717",
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    maxWidth: 320,
  },
  mandateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: 16,
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  subName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#171717",
  },
  umnCode: {
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: theme.colors.textSecondary,
    marginTop: 2,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    backgroundColor: "#FAF8F2",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#171717",
    marginTop: 2,
  },
  detailsBox: {
    borderTopWidth: 1,
    borderTopColor: "#F0ECE1",
    paddingTop: 10,
    marginBottom: 12,
  },
  detailLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  detailKey: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  detailVal: {
    fontSize: 12,
    color: "#171717",
    fontWeight: "600",
  },
  revokeBox: {
    backgroundColor: "#FFF1F2",
    borderWidth: 1,
    borderColor: "#FECDD3",
    padding: 12,
    borderRadius: theme.borderRadius.md,
    marginTop: 4,
  },
  revokeLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.error,
    marginBottom: 6,
  },
  revokeInput: {
    borderWidth: 1,
    borderColor: "#FDA4AF",
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: "#171717",
  },
  revokeActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  revokeCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  revokeCancelText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  revokeConfirmBtn: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  revokeConfirmText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  pauseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    backgroundColor: "#FFFFFF",
  },
  pauseBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#171717",
  },
  resumeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#171717",
  },
  resumeBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  revokeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FECDD3",
    backgroundColor: "#FFF1F2",
  },
  revokeBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.error,
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
