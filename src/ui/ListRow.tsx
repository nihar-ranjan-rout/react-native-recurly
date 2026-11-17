import React from 'react';
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
import { colors, radii, typography } from './tokens';
import Badge, { BadgeVariant } from './Badge';
import Icon, { IconName } from './Icon';

interface ListRowProps {
  title: string;
  category: string;
  dueLabel?: string;
  dueVariant?: 'overdue' | 'due-today' | 'neutral';
  price: string;
  cycleSuffix?: string;
  status?: 'active' | 'paused' | 'cancelled';
  hasAutoPay?: boolean;
  hasGST?: boolean;
  iconName?: IconName;
  iconBg?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function ListRow({
  title,
  category,
  dueLabel,
  dueVariant = 'neutral',
  price,
  cycleSuffix = '/mo',
  status,
  hasAutoPay = false,
  hasGST = true,
  iconName = 'subscription',
  iconBg = '#EEF5F1',
  onPress,
  style,
}: ListRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${price} per ${cycleSuffix}`}
    >
      {/* Brand / Category Icon */}
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <Icon name={iconName} size={20} color={colors.nearBlack} />
      </View>

      {/* Middle details */}
      <View style={styles.details}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {status && status !== 'active' && (
            <Badge
              label={status}
              variant={status as BadgeVariant}
              size="sm"
              style={{ marginLeft: 6 }}
            />
          )}
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.categoryText}>{category}</Text>
          {dueLabel && (
            <>
              <Text style={styles.dot}>•</Text>
              <Text
                style={[
                  styles.dueText,
                  dueVariant === 'overdue' && styles.dueOverdue,
                  dueVariant === 'due-today' && styles.dueToday,
                ]}
              >
                {dueLabel}
              </Text>
            </>
          )}
        </View>

        {/* Small Tags: AutoPay, GST 18% */}
        <View style={styles.tagsRow}>
          {hasAutoPay && (
            <Badge label="AutoPay" variant="autopay" size="sm" icon="check" style={{ marginRight: 6 }} />
          )}
          {hasGST && (
            <Badge label="GST 18%" variant="gst" size="sm" />
          )}
        </View>
      </View>

      {/* Right side: Price */}
      <View style={styles.priceContainer}>
        <Text style={styles.priceText}>
          {price}
          <Text style={styles.cycleSuffix}>{cycleSuffix}</Text>
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radii.lg,
    backgroundColor: colors.cardCream,
    borderWidth: 1,
    borderColor: colors.cardBorderWarm,
    marginBottom: 8,
  },
  pressed: {
    backgroundColor: colors.cardCreamHover,
    transform: [{ scale: 0.99 }],
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.nearBlack,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  categoryText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  dot: {
    marginHorizontal: 4,
    color: colors.textMuted,
    fontSize: 12,
  },
  dueText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dueOverdue: {
    color: colors.dangerRed,
  },
  dueToday: {
    color: colors.accentOrange,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 10,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.nearBlack,
    letterSpacing: -0.3,
    ...typography.tabularNums,
  },
  cycleSuffix: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});

