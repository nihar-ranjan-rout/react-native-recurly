import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { theme } from "@/constants/theme";

interface FilterOption<T> {
  id: T;
  label: string;
  count?: number;
}

interface FilterDropdownProps<T extends string> {
  options: FilterOption<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
  style?: ViewStyle;
}

export default function FilterDropdown<T extends string>({
  options,
  selectedId,
  onSelect,
  style,
}: FilterDropdownProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, style]}
    >
      {options.map((opt) => {
        const isSelected = selectedId === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onSelect(opt.id)}
            style={[
              styles.chip,
              isSelected && styles.chipSelected,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                isSelected && styles.chipTextSelected,
              ]}
            >
              {opt.label}
            </Text>
            {opt.count !== undefined && (
              <View
                style={[
                  styles.countBadge,
                  isSelected && styles.countBadgeSelected,
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    isSelected && styles.countTextSelected,
                  ]}
                >
                  {opt.count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card, // #FFFDF5
    borderWidth: 1,
    borderColor: theme.colors.cardBorder, // #E9E6DC
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    gap: 6,
    ...theme.shadows.subtle,
    ...(Platform.OS === "web" ? ({ cursor: "pointer", transition: "all 0.15s ease" } as any) : {}),
  },
  chipSelected: {
    backgroundColor: theme.colors.primary, // #171717
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  chipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  countBadge: {
    backgroundColor: "#F2ECE0",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 9999,
  },
  countBadgeSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  countText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  countTextSelected: {
    color: "#FFFFFF",
  },
});
