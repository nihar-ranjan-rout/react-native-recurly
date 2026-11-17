import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { theme } from "@/constants/theme";
import { useCurrency } from "@/context/CurrencyContext";

interface MonthlyPoint {
  month: string;
  amount: number;
}

interface CategoryExpense {
  category: string;
  amount: number;
  color: string;
  percentage: number;
}

interface ExpenseChartProps {
  monthlyData: MonthlyPoint[];
  categories: CategoryExpense[];
  totalMonthly: number;
  currency?: string;
  style?: ViewStyle;
}

export default function ExpenseChart({
  monthlyData,
  categories,
  totalMonthly,
  currency,
  style,
}: ExpenseChartProps) {
  const { formatAmount } = useCurrency();
  const [activeTab, setActiveTab] = useState<"monthly" | "yearly">("monthly");
  const [selectedMonth, setSelectedMonth] = useState<MonthlyPoint>(
    monthlyData[monthlyData.length - 1] || { month: "Nov", amount: totalMonthly }
  );

  const maxAmount = Math.max(...monthlyData.map((d) => d.amount), 1);
  const displayVal =
    activeTab === "monthly"
      ? selectedMonth.amount || totalMonthly
      : totalMonthly * 12;

  return (
    <View style={[styles.container, style]}>
      {/* Header with Switcher */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Spending Trends</Text>
          <Text style={styles.amountDisplay}>
            {formatAmount(displayVal)}
            <Text style={styles.periodText}>
              {activeTab === "monthly" ? ` (${selectedMonth.month})` : " /yr projected"}
            </Text>
          </Text>
        </View>

        <View style={styles.toggleWrap}>
          <Pressable
            onPress={() => setActiveTab("monthly")}
            style={[
              styles.toggleBtn,
              activeTab === "monthly" && styles.toggleBtnActive,
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                activeTab === "monthly" && styles.toggleTextActive,
              ]}
            >
              Monthly
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("yearly")}
            style={[
              styles.toggleBtn,
              activeTab === "yearly" && styles.toggleBtnActive,
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                activeTab === "yearly" && styles.toggleTextActive,
              ]}
            >
              Yearly
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Bar Chart */}
      <View style={styles.chartContainer}>
        {monthlyData.map((d, index) => {
          const heightPercent = Math.max(12, (d.amount / maxAmount) * 100);
          const isSelected = selectedMonth.month === d.month;
          return (
            <Pressable
              key={d.month + index}
              onPress={() => setSelectedMonth(d)}
              style={styles.barColumn}
            >
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: `${heightPercent}%` },
                    isSelected ? styles.barFillSelected : styles.barFillNormal,
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.monthLabel,
                  isSelected && styles.monthLabelSelected,
                ]}
              >
                {d.month}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Category Expense Multi-Progress Bar */}
      {categories.length > 0 && (
        <View style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>Category Allocation</Text>
            <Text style={styles.categorySub}>{categories.length} categories</Text>
          </View>

          <View style={styles.multiBar}>
            {categories.map((c, i) => (
              <View
                key={c.category + i}
                style={[
                  styles.barSegment,
                  {
                    backgroundColor: c.color,
                    flex: Math.max(c.percentage, 4),
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.legendGrid}>
            {categories.slice(0, 4).map((c, i) => (
              <View key={c.category + i} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: c.color }]} />
                <Text style={styles.legendLabel} numberOfLines={1}>
                  {c.category}
                </Text>
                <Text style={styles.legendPercent}>{c.percentage}%</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card, // #FFFDF5
    borderRadius: theme.borderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.subtle,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    letterSpacing: 0.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  amountDisplay: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  periodText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  toggleWrap: {
    flexDirection: "row",
    backgroundColor: "#F2EBE0",
    borderRadius: 9999,
    padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  toggleBtnActive: {
    backgroundColor: "#FFFDF5",
    ...theme.shadows.subtle,
  },
  toggleText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  toggleTextActive: {
    color: theme.colors.text,
    fontWeight: "700",
  },

  // CHART
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 120,
    paddingTop: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#EFE9DC",
    gap: 4,
  },
  barColumn: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  barTrack: {
    width: "60%",
    maxWidth: 24,
    height: 90,
    backgroundColor: "#F4EFE5",
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 6,
  },
  barFillNormal: {
    backgroundColor: theme.colors.successBorder, // #B7D9A8
  },
  barFillSelected: {
    backgroundColor: theme.colors.accent, // #F28C45
  },
  monthLabel: {
    fontSize: 10.5,
    color: theme.colors.textSecondary,
    marginTop: 6,
    fontWeight: "500",
  },
  monthLabelSelected: {
    color: theme.colors.text,
    fontWeight: "700",
  },

  // CATEGORIES
  categorySection: {
    marginTop: 18,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: theme.colors.text,
  },
  categorySub: {
    fontSize: 11.5,
    color: theme.colors.textSecondary,
  },
  multiBar: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#F4EFE5",
    marginBottom: 12,
  },
  barSegment: {
    height: "100%",
  },
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11.5,
    color: theme.colors.textSecondary,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  legendPercent: {
    fontSize: 11.5,
    fontWeight: "700",
    color: theme.colors.text,
  },
});
