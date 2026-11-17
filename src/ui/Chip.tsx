import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radii } from './tokens';
import Icon, { IconName } from './Icon';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: IconName;
  count?: number;
  style?: StyleProp<ViewStyle>;
}

export default function Chip({
  label,
  selected = false,
  onPress,
  icon,
  count,
  style,
}: ChipProps) {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.selected : styles.unselected,
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {icon && (
        <Icon
          name={icon}
          size={14}
          color={selected ? '#FFFFFF' : colors.textSecondary}
          style={{ marginRight: 6 }}
        />
      )}
      <Text style={[styles.label, selected ? styles.selectedLabel : styles.unselectedLabel]}>
        {label}
      </Text>
      {typeof count === 'number' && (
        <Text style={[styles.count, selected ? styles.selectedCount : styles.unselectedCount]}>
          {count}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    marginRight: 8,
  },
  selected: {
    backgroundColor: colors.nearBlack,
  },
  unselected: {
    backgroundColor: colors.cardCream,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  selectedLabel: {
    color: '#FFFFFF',
  },
  unselectedLabel: {
    color: colors.nearBlack,
  },
  count: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.full,
  },
  selectedCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: '#FFFFFF',
  },
  unselectedCount: {
    backgroundColor: '#E6ECE9',
    color: colors.textSecondary,
  },
});

