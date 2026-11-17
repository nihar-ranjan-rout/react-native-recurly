import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import Icon, { IconName } from '@/src/ui/Icon';

type CategoryName =
  | 'cloud'
  | 'fitness'
  | 'gaming'
  | 'music'
  | 'reading'
  | 'software'
  | 'streaming'
  | 'utilities'
  | 'shopping'
  | 'other';

interface CategoryIconProps {
  category: CategoryName;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export default function CategoryIcon({
  category,
  size = 32,
  style,
}: CategoryIconProps) {
  const iconName: IconName = (category as IconName) || 'subscription';
  return (
    <View style={style}>
      <Icon name={iconName} size={size} />
    </View>
  );
}
