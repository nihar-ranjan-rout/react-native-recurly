import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Pressable } from 'react-native';
import { colors, radii, shadows } from './tokens';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'cream' | 'elevated' | 'bordered';
  padding?: number;
}

export default function Card({
  children,
  style,
  onPress,
  variant = 'cream',
  padding = 18,
}: CardProps) {
  const content = (
    <View
      style={[
        styles.base,
        variant === 'cream' && styles.cream,
        variant === 'elevated' && styles.elevated,
        variant === 'bordered' && styles.bordered,
        { padding },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.pressable,
          pressed && styles.pressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.card,
    backgroundColor: colors.cardCream,
    borderWidth: 1,
    borderColor: colors.cardBorderWarm,
    ...shadows.softCard,
  },
  cream: {
    backgroundColor: colors.cardCream,
  },
  elevated: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.cardBorder,
  },
  bordered: {
    backgroundColor: colors.cardCream,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
  },
  pressable: {
    borderRadius: radii.card,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
});

