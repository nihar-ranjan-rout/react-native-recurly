import React from "react";
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Badge from "@/components/ui/Badge";
import CategoryIcon from "@/components/ui/CategoryIcon";
import { theme } from "@/constants/theme";
import { useCurrency } from "@/context/CurrencyContext";
import {
  formatDateDisplay,
  getDaysUntilDue,
  Subscription,
} from "@/lib/subscriptions";

interface SubscriptionCardProps {
  subscription: Subscription;
  onPress?: () => void;
  onToggleStatus?: (sub: Subscription) => void;
  style?: ViewStyle;
}

export default function SubscriptionCard({
  subscription,
  onPress,
  onToggleStatus,
  style,
}: SubscriptionCardProps) {
  const { formatAmount } = useCurrency();
  const daysDue = getDaysUntilDue(subscription.nextPaymentDate);
  const isUrgent = daysDue >= 0 && daysDue <= 3;
  const isOverdue = daysDue < 0;

  const status =
    subscription.status || (subscription.active ? "active" : "paused");

  const cycleSuffix =
    subscription.billingCycle === "monthly"
      ? "/mo"
      : subscription.billingCycle === "yearly"
      ? "/yr"
      : subscription.billingCycle === "quarterly"
      ? "/qtr"
      : subscription.billingCycle === "half-yearly"
      ? "/6mo"
      : subscription.billingCycle === "weekly"
      ? "/wk"
      : subscription.customCycleDays
      ? `/${subscription.customCycleDays}d`
      : "/custom";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        style,
      ]}
    >
      {/* Icon / Brand Left */}
      <View style={styles.iconContainer}>
        <CategoryIcon category={subscription.category} size={36} />
      </View>

      {/* Main Info */}
      <View style={styles.contentWrap}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {subscription.name}
          </Text>
          <Badge
            label={
              status === "active"
                ? "Active"
                : status === "paused"
                ? "Paused"
                : "Cancelled"
            }
            variant={
              status === "active"
                ? "success"
                : status === "paused"
                ? "warning"
                : "neutral"
            }
            dot
          />
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.category}>{subscription.category}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text
            style={[
              styles.dueDate,
              isUrgent && styles.dueDateUrgent,
              isOverdue && styles.dueDateOverdue,
            ]}
          >
            {isOverdue
              ? "Overdue"
              : daysDue === 0
              ? "Due today"
              : daysDue === 1
              ? "Due tomorrow"
              : `Due in ${daysDue}d`}
          </Text>
          {subscription.taxApplicable && (
            <>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.gstTag}>
                GST {subscription.taxRate || 18}%
              </Text>
            </>
          )}
          {subscription.autoPayEnabled && (
            <>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.autoPayTag}>AutoPay</Text>
            </>
          )}
        </View>
      </View>

      {/* Price & Billing Cycle Right */}
      <View style={styles.priceWrap}>
        <Text style={styles.price}>
          {formatAmount(subscription.price, {
            originalCurrency: subscription.currencyCode || subscription.currency,
          })}
        </Text>
        <Text style={styles.cycle}>{cycleSuffix}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card, // #FFFDF5
    borderRadius: theme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder, // #E9E6DC
    flexDirection: "row",
    alignItems: "center",
    ...theme.shadows.subtle,
    ...(Platform.OS === "web"
      ? ({ cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease" } as any)
      : {}),
  },
  cardPressed: {
    backgroundColor: "#F7F4EB",
    transform: [{ scale: 0.99 }],
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F3EFE4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#E9E6DC",
  },
  contentWrap: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
    letterSpacing: -0.2,
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  category: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  metaDot: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  dueDate: {
    fontSize: 11.5,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  dueDateUrgent: {
    color: theme.colors.accent,
    fontWeight: "700",
  },
  dueDateOverdue: {
    color: theme.colors.error,
    fontWeight: "700",
  },
  priceWrap: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  cycle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: "500",
    marginTop: 1,
  },
  gstTag: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: "700",
    backgroundColor: "#E2F0EA",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  autoPayTag: {
    fontSize: 10,
    color: "#2E7D32",
    fontWeight: "700",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
});
