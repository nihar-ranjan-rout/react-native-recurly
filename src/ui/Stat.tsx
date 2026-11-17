import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, typography, radii } from './tokens';
import Card from './Card';
import Icon, { IconName } from './Icon';

interface StatProps {
  eyebrow: string;
  value: string;
  subtitle?: string;
  trendText?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  highlightValue?: boolean;
}

export default function Stat({
  eyebrow,
  value,
  subtitle,
  trendText,
  trendDirection = 'neutral',
  icon,
  style,
  highlightValue = false,
}: StatProps) {
  return (
    <Card style={[styles.card, style]}>
      <View style={styles.headerRow}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        {icon && (
          <View style={styles.iconCircle}>
            <Icon name={icon} size={14} color={colors.textSecondary} />
          </View>
        )}
      </View>

      <Text
        style={[
          styles.value,
          highlightValue && { color: colors.accentOrange },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>

      <View style={styles.footerRow}>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
        {trendText && (
          <View
            style={[
              styles.trendPill,
              trendDirection === 'up' && styles.trendUp,
              trendDirection === 'down' && styles.trendDown,
              trendDirection === 'neutral' && styles.trendNeutral,
            ]}
          >
            <Text
              style={[
                styles.trendText,
                trendDirection === 'up' && { color: colors.dangerRed },
                trendDirection === 'down' && { color: colors.successGreen },
                trendDirection === 'neutral' && { color: colors.textSecondary },
              ]}
            >
              {trendText}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    flex: 1,
    minWidth: 150,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.textMuted,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EEF3F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.nearBlack,
    letterSpacing: -0.5,
    ...typography.tabularNums,
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  trendPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  trendUp: {
    backgroundColor: colors.dangerRedLight,
  },
  trendDown: {
    backgroundColor: colors.successGreenLight,
  },
  trendNeutral: {
    backgroundColor: '#EBEFEA',
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

