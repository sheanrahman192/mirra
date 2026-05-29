// Screen wrapper — paper background, scrollable body, bottom-tab clearance.
// `tabBar` is an optional node rendered above the scroll area (used by routes
// that live outside the Tabs navigator, e.g. the single-conversation screen).
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/tokens';

interface ScreenProps {
  children: React.ReactNode;
  topOffset?: number;
  tabBar?: React.ReactNode;
}

export function Screen({ children, topOffset = 50, tabBar }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + Math.max(0, topOffset - 44),
          paddingBottom: 120 + insets.bottom,
        }}
      >
        {children}
      </ScrollView>
      {tabBar}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  scroll: { flex: 1 },
});
