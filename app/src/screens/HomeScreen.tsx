// Home / Record screen.
import React, { useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet, Animated, Easing, ActivityIndicator } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle, Rect, Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Body, Serif, SerifItalic, Eyebrow } from '@/components/Typography';
import { Icon } from '@/components/Icon';
import { colors, fonts } from '@/theme/tokens';
import { RECENTS, Recent } from '@/data/recents';
import { ConversationListItem } from '@/models/conversation';
import { useConversations } from '@/hooks/useConversations';
import { useImportAudio } from '@/hooks/useImportAudio';

const HOME_GREET = "Twelve questions yesterday — your highest this week. Something's clicking.";

function BreathingRing({ inset, delay }: { inset: number; delay: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(v, { toValue: 1, duration: 4000, delay, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [v, delay]);
  const scale = v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.08, 1] });
  const opacity = v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.7, 0.2, 0.7] });
  return (
    <Animated.View
      style={{
        position: 'absolute', top: inset, left: inset, right: inset, bottom: inset,
        borderRadius: 999, borderWidth: 1,
        borderColor: inset < -20 ? 'rgba(208,136,102,0.22)' : 'rgba(208,136,102,0.35)',
        transform: [{ scale }], opacity,
      }}
    />
  );
}

function RecordButton({ size = 172 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <BreathingRing inset={-28} delay={0} />
      <BreathingRing inset={-14} delay={600} />
      <View style={[styles.recordBtn, { width: size, height: size, borderRadius: size / 2 }]}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <Defs>
            <RadialGradient id="rec" cx="35%" cy="30%" r="75%">
              <Stop offset="0" stopColor="#E5A082" />
              <Stop offset="0.55" stopColor="#D08866" />
              <Stop offset="1" stopColor="#BA7253" />
            </RadialGradient>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#rec)" />
        </Svg>
        <Svg viewBox="0 0 24 24" width={48} height={48}>
          <Rect x={9} y={3} width={6} height={12} rx={3} fill="#fff" />
          <Path d="M5 11a7 7 0 0 0 14 0" fill="none" stroke="#fff" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M12 18v3" fill="none" stroke="#fff" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
    </View>
  );
}

function RecentRow({ item, isLast, onPress }: { item: ConversationListItem | Recent; isLast: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.recentRow, !isLast && styles.rowBorder]}>
      <View style={[styles.dot, { backgroundColor: colors[item.tone as keyof typeof colors] ?? colors.sage }]} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Serif style={styles.recentTitle}>{item.title}</Serif>
        <Body style={styles.recentMeta}>
          {item.when} · {item.duration} · <SerifItalic style={styles.recentNote}>{item.note}</SerifItalic>
        </Body>
      </View>
      <Icon.chevron color="rgba(42,37,32,0.35)" />
    </Pressable>
  );
}

function ImportButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  return (
    <Pressable
      style={[styles.importBtn, loading && styles.importBtnDisabled]}
      hitSlop={8}
      onPress={onPress}
      disabled={loading}
      accessibilityLabel="Import audio recording"
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.terracotta} />
      ) : (
        <Svg viewBox="0 0 18 18" width={17} height={17}>
          <Path d="M9 11.5V2.5" fill="none" stroke={colors.terracotta} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M5.5 6L9 2.5L12.5 6" fill="none" stroke={colors.terracotta} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M3 11v3a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5v-3" fill="none" stroke={colors.terracotta} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      )}
    </Pressable>
  );
}

export function HomeScreen() {
  const router = useRouter();
  const { listItems, save } = useConversations();
  const { importAudio, importing } = useImportAudio();

  const recents: (ConversationListItem | Recent)[] =
    listItems.length > 0 ? listItems : RECENTS;

  async function handleImport() {
    const conversation = await importAudio();
    if (conversation) await save(conversation);
  }
  return (
    <Screen topOffset={56}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Eyebrow>Tuesday · May 23</Eyebrow>
          <Serif style={styles.greetingTitle}>
            Good evening,{'\n'}
            <SerifItalic style={styles.greetingTitle}>Maya.</SerifItalic>
          </Serif>
        </View>
        <ImportButton onPress={handleImport} loading={importing} />
      </View>
      <Body style={styles.greet}>{HOME_GREET}</Body>

      {/* Record hero */}
      <View style={styles.hero}>
        <RecordButton size={172} />
        <Body style={styles.heroHint}>Tap to start · tap again to end</Body>
      </View>

      {/* Recent */}
      <View style={styles.recentSection}>
        <View style={styles.recentHead}>
          <Eyebrow>Recent conversations</Eyebrow>
          <Body style={styles.recentCount}>
            {listItems.length > 0 ? `${listItems.length} imported` : '5 this week'}
          </Body>
        </View>
        <View style={{ marginTop: 6 }}>
          {recents.map((r, i) => (
            <RecentRow key={String(r.id)} item={r} isLast={i === recents.length - 1} onPress={() => router.push('/conversation')} />
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 24, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  greetingTitle: { fontSize: 34, lineHeight: 36, marginTop: 8, color: colors.ink },
  greet: { fontSize: 13.5, color: colors.muted, marginTop: 10, lineHeight: 20, maxWidth: 300, paddingHorizontal: 24 },
  importBtn: {
    marginTop: 2, width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.hairline,
  },
  importBtnDisabled: { opacity: 0.6 },
  hero: { marginTop: 28, marginBottom: 18, alignItems: 'center', gap: 16 },
  recordBtn: {
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    shadowColor: '#BA7253', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.3, shadowRadius: 32, elevation: 12,
  },
  heroHint: { fontSize: 12.5, color: colors.muted, letterSpacing: 0.7, textTransform: 'uppercase', fontFamily: fonts.bodyMedium },
  recentSection: { paddingHorizontal: 24, paddingTop: 20 },
  recentHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 },
  recentCount: { fontSize: 11.5, color: colors.muted },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.hairline2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  recentTitle: { fontSize: 19, lineHeight: 21, color: colors.ink },
  recentMeta: { fontSize: 11.5, color: colors.muted, marginTop: 4, letterSpacing: 0.2 },
  recentNote: { fontSize: 13, color: colors.muted },
});
