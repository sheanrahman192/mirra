// Insights · week index — list of conversations for the selected week.
import React, { useMemo, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Body, Serif, SerifItalic, Eyebrow } from '@/components/Typography';
import { Icon } from '@/components/Icon';
import { WeekPaginator } from '@/components/WeekPaginator';
import { colors, toneColor } from '@/theme/tokens';
import { WEEKS, ConvListItem, fullDay } from '@/data/weeks';

function ConvRow({ item, isLast, onPress }: { item: ConvListItem; isLast: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={[styles.dot, { backgroundColor: toneColor[item.tone] || colors.sage }]} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Serif style={styles.title}>{item.title}</Serif>
        <Body style={styles.meta}>
          {item.when} · {item.duration} · <SerifItalic style={styles.note}>{item.note}</SerifItalic>
        </Body>
      </View>
      <Icon.chevron color="rgba(42,37,32,0.35)" />
    </Pressable>
  );
}

export function InsightsIndexScreen() {
  const router = useRouter();
  const [weekIdx, setWeekIdx] = useState(1);
  const w = WEEKS[weekIdx];
  const convs = w.convsList || [];

  const grouped = useMemo(() => {
    const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const map: Record<string, ConvListItem[]> = {};
    convs.forEach((c) => {
      const day = (c.when.split(' · ')[0] || '').trim();
      (map[day] = map[day] || []).push(c);
    });
    return order.filter((d) => map[d]).map((d) => ({ day: d, items: map[d] }));
  }, [convs]);

  const totalDuration = convs.reduce((acc, c) => acc + parseInt(c.duration, 10), 0);
  const hours = Math.floor(totalDuration / 60);
  const mins = totalDuration % 60;

  return (
    <Screen topOffset={50}>
      <View style={{ paddingTop: 4 }}>
        <WeekPaginator idx={weekIdx} onChange={setWeekIdx} />
      </View>

      <View style={styles.titleBlock}>
        <Eyebrow>Conversations</Eyebrow>
        <Serif style={styles.bigTitle}>
          {convs.length} {convs.length === 1 ? 'conversation' : 'conversations'},{'\n'}
          <SerifItalic style={styles.bigTitle}>
            {hours > 0 ? `${hours}h ` : ''}{mins} min total.
          </SerifItalic>
        </Serif>
        <Body style={styles.intro}>
          {w.upcoming
            ? 'A new week beginning — your patterns are still forming.'
            : 'Tap any conversation to see the patterns that shaped it.'}
        </Body>
      </View>

      <View style={styles.list}>
        {grouped.map((group, gi) => (
          <View key={group.day} style={{ marginBottom: gi === grouped.length - 1 ? 0 : 14 }}>
            <View style={styles.groupHead}>
              <Eyebrow style={{ fontSize: 10, letterSpacing: 1.4 }}>{fullDay(group.day)}</Eyebrow>
              <Body style={styles.groupCount}>
                {group.items.length} {group.items.length === 1 ? 'chat' : 'chats'}
              </Body>
            </View>
            {group.items.map((it, i) => (
              <ConvRow key={it.id} item={it} isLast={i === group.items.length - 1} onPress={() => router.push('/conversation')} />
            ))}
          </View>
        ))}

        {convs.length === 0 && (
          <SerifItalic style={styles.empty}>No conversations yet this week.</SerifItalic>
        )}
      </View>
      <View style={{ height: 12 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleBlock: { paddingHorizontal: 22, paddingTop: 20 },
  bigTitle: { fontSize: 30, lineHeight: 32, color: colors.ink, marginTop: 8 },
  intro: { fontSize: 13, color: colors.ink2, marginTop: 12, lineHeight: 20, maxWidth: 320 },
  list: { paddingHorizontal: 24, paddingTop: 18 },
  groupHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.hairline2, paddingBottom: 4, marginBottom: 2 },
  groupCount: { fontSize: 10.5, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.hairline2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  title: { fontSize: 18, lineHeight: 21, color: colors.ink },
  meta: { fontSize: 11.5, color: colors.muted, marginTop: 4, letterSpacing: 0.2 },
  note: { fontSize: 13, color: colors.muted },
  empty: { textAlign: 'center', paddingVertical: 40, color: colors.muted, fontSize: 13 },
});
