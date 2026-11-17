import React from 'react';
import { View, StyleSheet, Platform, DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from './tokens';

interface AppBackgroundProps {
  children: React.ReactNode;
  maxWidth?: DimensionValue;
}

export default function AppBackground({ children, maxWidth = 720 }: AppBackgroundProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Decorative blurred glow blobs */}
      <View style={styles.glowTopRight} pointerEvents="none" />
      <View style={styles.glowBottomLeft} pointerEvents="none" />
      
      {/* Centered responsive container for web & mobile */}
      <View style={[styles.contentContainer, { maxWidth }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgGradientStart,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    position: 'relative',
  },
  glowTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(242, 140, 69, 0.08)', // subtle orange warmth
    ...Platform.select({
      web: {
        filter: 'blur(70px)',
      } as any,
      default: {},
    }),
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(15, 157, 138, 0.10)', // teal mint glow
    ...Platform.select({
      web: {
        filter: 'blur(60px)',
      } as any,
      default: {},
    }),
  },
});

