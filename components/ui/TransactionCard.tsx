import React from "react";
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Badge from "@/components/ui/Badge";
import { theme } from "@/constants/theme";
import { useCurrency } from "@/context/CurrencyContext";

export interface TransactionItem {
  id: string;
  subscriptionName: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  paymentMethod: string;
  status: "paid" | "pending" | "failed";
}

interface TransactionCardProps {
  transaction: TransactionItem;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function TransactionCard({
  transaction,
  onPress,
  style,
}: TransactionCardProps) {
  const { formatAmount } = useCurrency();
  const isPaid = transaction.status === "paid";
  const isPending = transaction.status === "pending";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        style,
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={
            isPaid
              ? "checkmark-circle"
              : isPending
              ? "time"
              : "alert-circle"
          }
          size={20}
          color={
            isPaid
              ? theme.colors.success
              : isPending
              ? theme.colors.accent
              : theme.colors.error
          }
        />
      </View>

      <View style={styles.infoWrap}>
        <Text style={styles.title} numberOfLines={1}>
          {transaction.subscriptionName}
        </Text>
        <Text style={styles.subtext}>
          {transaction.date} • {transaction.paymentMethod}
        </Text>
      </View>

      <View style={styles.rightWrap}>
        <Text style={styles.amount}>
          -{formatAmount(transaction.amount, { originalCurrency: transaction.currency })}
        </Text>
        <Badge
          label={
            isPaid ? "Paid" : isPending ? "Pending" : "Failed"
          }
          variant={
            isPaid ? "success" : isPending ? "warning" : "error"
          }
          dot
          style={styles.statusBadge}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card, // #FFFDF5
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder, // #E9E6DC
    flexDirection: "row",
    alignItems: "center",
    ...theme.shadows.subtle,
    ...(Platform.OS === "web"
      ? ({ cursor: "pointer", transition: "all 0.15s ease" } as any)
      : {}),
  },
  cardPressed: {
    backgroundColor: "#F7F3E7",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3EDE1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoWrap: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14.5,
    fontWeight: "700",
    color: theme.colors.text,
    letterSpacing: -0.2,
  },
  subtext: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  rightWrap: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.2,
  },
  statusBadge: {
    marginTop: 3,
  },
});
