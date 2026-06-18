import React from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/core/theme';

export type ServiceIconSet = 'ionicons' | 'material';

type Props = {
  icon: string;
  iconSet?: ServiceIconSet;
  size?: number;
  color?: string;
};

/** Renders service category/subcategory icons (Material for appliance/home devices). */
export function ServiceCategoryIcon({
  icon,
  iconSet = 'ionicons',
  size = 28,
  color = Colors.primary,
}: Props) {
  if (iconSet === 'material') {
    return (
      <MaterialCommunityIcons
        name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
        size={size}
        color={color}
      />
    );
  }
  return <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={size} color={color} />;
}
