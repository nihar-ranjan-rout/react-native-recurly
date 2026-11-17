import React from "react";
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import CategoryIcon from "@/components/ui/CategoryIcon";
import { theme } from "@/constants/theme";
import { useCurrency } from "@/context/CurrencyContext";
import {
  formatDateDisplay,
  getDaysUntilDue,
  Subscription,
} from "@/lib/subscriptions";

interface UpcomingPaymentCardProps {
  subscription: Subscription;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function UpcomingPaymentCard({
  subscription,
  onPress,
  style,
}: UpcomingPaymentCardProps) {
  const { formatAmount } = useCurrency();
  const daysDue = getDaysUntilDue(subscription.nextPaymentDate);
  const isUrgent = daysDue <= 3 && daysDue >= 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isUrgent && styles.cardUrgent,
        pressed && styles.cardPressed,
        style,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <CategoryIcon category={subscription.category} size={28} />
        </View>

        <View
          style={[
            styles.dueBadge,
            isUrgent ? styles.dueBadgeUrgent : styles.dueBadgeNormal,
          ]}
        >
          <Ionicons
            name="time-outline"
            size={12}
            color={isUrgent ? theme.colors.accentText : theme.colors.textSecondary}
          />
          <Text
            style={[
              styles.dueBadgeText,
              isUrgent ? styles.dueBadgeTextUrgent : styles.dueBadgeTextNormal,
            ]}
          >
            {daysDue === 0
              ? "Today"
              : daysDue === 1
              ? "Tomorrow"
              : daysDue < 0
              ? "Overdue"
              : `${daysDue} days left`}
          </Text>
        </View>
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {subscription.name}
      </Text>

      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.dateLabel}>Next Bill</Text>
          <Text style={styles.dateText}>
            {formatDateDisplay(subscription.nextPaymentDate)}
          </Text>
        </View>

        <View style={styles.amountWrap}>
          <Text style={styles.amount}>
            {formatAmount(subscription.price, {
              originalCurrency: subscription.currencyCode || subscription.currency,
            })}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card, // #FFFDF5
    borderRadius: theme.borderRadius.xl,
    padding: 16,
    width: 220,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.subtle,
    ...(Platform.OS === "web"
      ? ({ cursor: "pointer", transition: "all 0.15s ease" } as any)
      : {}),
  },
  cardUrgent: {
    borderColor: theme.colors.accentBorder,
    backgroundColor: "#FFFDF8",
  },
  cardPressed: {
    backgroundColor: "#F7F3E6",
    transform: [{ scale: 0.98 }],
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F4EFE4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E9E6DC",
  },
  dueBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 9999,
  },
  dueBadgeNormal: {
    backgroundColor: "#F3EDE1",
  },
  dueBadgeUrgent: {
    backgroundColor: theme.colors.accentLight,
    borderWidth: 1,
    borderColor: theme.colors.accentBorder,
  },
  dueBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  dueBadgeTextNormal: {
    color: theme.colors.textSecondary,
  },
  dueBadgeTextUrgent: {
    color: theme.colors.accentText,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(233, 230, 220, 0.6)",
  },
  dateLabel: {
    fontSize: 10.5,
    color: theme.colors.textSecondary,
    fontWeight: "500",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: "600",
  },
  amountWrap: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
});
