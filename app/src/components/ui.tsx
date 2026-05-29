// Small shared building blocks: Card, Pip, Chip.
import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { Body } from './Typography';
import { colors, cardShadow, fonts } from '@/theme/tokens';

interface CardProps extends ViewProps {
  tone?: 'card' | 'card-2';
}

export function Card({ tone = 'card', style, children, ...rest }: CardProps) {
  return (
    <View
      {...rest}
      style={[
        styles.card,
        { backgroundColor: tone === 'card-2' ? colors.card2 : colors.card },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface PipProps {
  color: string;
  children: React.ReactNode;
}

export function Pip({ color, children }: PipProps) {
  return (
    <View style={styles.pipRow}>
      <View style={[styles.pipSquare, { backgroundColor: color }]} />
      <Body style={styles.pipText}>{children}</Body>
    </View>
  );
}

const CHIP_BG: Record<string, string> = {
  sage: 'rgba(151,168,135,0.18)',
  terracotta: 'rgba(208,136,102,0.18)',
  lavender: 'rgba(180,165,201,0.22)',
  coral: 'rgba(226,150,135,0.18)',
  sand: 'rgba(224,204,170,0.30)',
};
const CHIP_FG: Record<string, string> = {
  sage: '#5C6E4F', terracotta: '#8B4F32', lavender: '#6F5C8C',
  coral: '#9C4F40', sand: '#7D6541',
};

export function Chip({ tone = 'sage', children }: { tone?: string; children: React.ReactNode }) {
  return (
    <View style={[styles.chip, { backgroundColor: CHIP_BG[tone] }]}>
      <Body style={[styles.chipText, { color: CHIP_FG[tone] }]}>{children}</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    ...cardShadow,
  },
  pipRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pipSquare: { width: 8, height: 8, borderRadius: 2 },
  pipText: { fontSize: 11, color: colors.muted, letterSpacing: 0.4 },
  chip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { fontSize: 12.5, lineHeight: 13, fontFamily: fonts.bodyMedium },
});
