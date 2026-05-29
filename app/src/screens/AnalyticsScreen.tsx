// Insights · single conversation — "Coffee with Maya" deep-dive.
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card, Pip } from '@/components/ui';
import { Body, Serif, SerifItalic, Eyebrow } from '@/components/Typography';
import { Icon } from '@/components/Icon';
import { FloatingTabBar, TabId } from '@/components/FloatingTabBar';
import { ExpandableMetric } from '@/components/ExpandableMetric';
import { ReflectCTA } from '@/components/ReflectCTA';
import { Donut, RingMeter, RadarChart, TurnOffsetChart, EnergyWave } from '@/components/charts';
import { FillerBars, SyncBars, OffsetZoneLegend } from '@/components/meters';
import { colors, fonts } from '@/theme/tokens';

const TAB_HREF: Record<TabId, '/' | '/insights' | '/progress' | '/profile'> = {
  home: '/', insights: '/insights', progress: '/progress', profile: '/profile',
};

const youEnergy = [4, 5, 6, 6, 7, 8, 7, 6, 5, 6, 7, 8, 7, 6, 7, 7];
const themEnergy = [5, 5, 5, 6, 6, 7, 7, 6, 6, 6, 7, 7, 7, 7, 8, 8];

// Questions card — vertical bar with count baked inside.
function QBar({ label, value, color, sub, max }: { label: string; value: number; color: string; sub: string; max: number }) {
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <View style={styles.qBarTrack}>
        <View style={[styles.qBarFill, { height: `${(value / max) * 100}%`, backgroundColor: color }]}>
          <Serif style={styles.qBarVal}>{value}</Serif>
        </View>
      </View>
      <Body style={styles.qBarLabel}>
        {label}{'\n'}<Body style={styles.qBarSub}>{sub}</Body>
      </Body>
    </View>
  );
}

export function AnalyticsScreen() {
  const router = useRouter();
  const goTab = (id: TabId) => router.navigate(TAB_HREF[id]);

  return (
    <Screen topOffset={50} tabBar={<FloatingTabBar active="insights" onPress={goTab} />}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}><Icon.back color={colors.muted} /></Pressable>
        <Eyebrow>Conversation</Eyebrow>
        <Icon.dots color={colors.muted} />
      </View>

      <View style={styles.titleBlock}>
        <Serif style={styles.bigTitle}>
          Coffee with <SerifItalic style={styles.bigTitle}>Maya</SerifItalic>
        </Serif>
        <Body style={styles.meta}>Tue · 4:12 PM · 28 min · in person</Body>
      </View>

      {/* Warm reflection */}
      <View style={styles.reflectWrap}>
        <Card tone="card-2" style={{ padding: 18 }}>
          <Eyebrow style={{ marginBottom: 8 }}>A few things I noticed</Eyebrow>
          <Serif style={styles.reflectText}>
            You created lots of space for Maya — 38% of the time was hers. There were{' '}
            <SerifItalic style={[styles.reflectText, { color: colors.terracotta }]}>three small interruptions</SerifItalic>
            {' '}in the first ten minutes, then none for eighteen. Your energy met hers gently.
          </Serif>
          <ReflectCTA subject="what happened with Maya" onPress={() => router.push('/reflect')} />
        </Card>
      </View>

      {/* Patterns */}
      <View style={styles.patterns}>
        <View style={styles.patternsHead}>
          <Eyebrow>Patterns</Eyebrow>
          <Body style={styles.tapHint}>Tap to expand</Body>
        </View>

        {/* 1. Talk / Listen */}
        <ExpandableMetric
          eyebrow="Talk / Listen" value="62 / 38" unit="you / Maya"
          summary="A little above your usual 55." accent={colors.terracotta} chartKind="donut" defaultOpen
          blurb="Maya had a lot to share today and you mostly let her lead the second half."
        >
          <View style={styles.rowCenter}>
            <Donut size={130} stroke={20} segments={[{ value: 62, color: colors.terracotta }, { value: 38, color: colors.sage }]} centerLabel="62%" centerSub="you" />
            <View style={{ gap: 10, flex: 1 }}>
              <View>
                <Pip color={colors.terracotta}>You · 17:22</Pip>
                <Body style={styles.pipNote}>Talked 22% more than your average</Body>
              </View>
              <View>
                <Pip color={colors.sage}>Maya · 10:38</Pip>
                <Body style={styles.pipNote}>Healthy range: 40–60% you</Body>
              </View>
            </View>
          </View>
        </ExpandableMetric>

        {/* 2. Questions */}
        <ExpandableMetric
          eyebrow="Questions" value="8 / 7" unit="asked / received"
          summary="Nearly even — both of you stayed curious." accent={colors.sage} chartKind="bar"
          blurb={'Open-ended ones too: "what was that like?", "tell me more". The kind that invite, not interrogate.'}
        >
          <View style={styles.qRow}>
            <View style={styles.qBars}>
              <QBar label="You" value={8} color={colors.sage} sub="asked" max={8 * 1.15} />
              <QBar label="Maya" value={7} color={colors.lavender} sub="asked" max={8 * 1.15} />
            </View>
            <View style={styles.qAnalysis}>
              <View style={[styles.miniCard, { backgroundColor: 'rgba(151,168,135,0.10)' }]}>
                <Body style={styles.miniLabel}>Open / closed</Body>
                <View style={styles.miniRow}>
                  <Serif style={[styles.miniNum, { color: colors.sage }]}>5</Serif>
                  <Body style={styles.miniUnit}>open</Body>
                  <Body style={styles.miniDotSep}>·</Body>
                  <Serif style={[styles.miniNum, { color: colors.ink2 }]}>3</Serif>
                  <Body style={styles.miniUnit}>closed</Body>
                </View>
                <View style={styles.miniBar}>
                  <View style={{ width: '62.5%', backgroundColor: colors.sage }} />
                  <View style={{ flex: 1, backgroundColor: 'rgba(151,168,135,0.25)' }} />
                </View>
              </View>
              <View style={[styles.miniCard, { backgroundColor: 'rgba(208,136,102,0.08)' }]}>
                <Body style={styles.miniLabel}>Vs your average</Body>
                <View style={styles.miniRow}>
                  <Serif style={[styles.miniNum, { color: colors.sage }]}>↑ 2.8</Serif>
                  <Body style={styles.miniUnit}>vs 5.2 / conv</Body>
                </View>
                <SerifItalic style={styles.miniItalic}>Your most curious chat in two weeks.</SerifItalic>
              </View>
            </View>
          </View>
        </ExpandableMetric>

        {/* 3. Turn-floor offset */}
        <ExpandableMetric
          eyebrow="Turn-floor offset" value="+210" unit="ms avg"
          summary="Mostly in the ideal pocket. One slow patch around minute 14." accent={colors.terracotta} chartKind="line"
          blurb="Time elapsed between your turn and Maya's. Negative means you overlapped; ~+200 ms is the smoothest. Three early dips show light interruptions; a +520 ms stretch at 14:00 is Maya formulating a hard answer."
        >
          <TurnOffsetChart
            data={[
              { t: '0:00', ms: -80 }, { t: '3:30', ms: 90 }, { t: '7:00', ms: 220 }, { t: '10:30', ms: 180 },
              { t: '14:00', ms: 520 }, { t: '18:00', ms: 280 }, { t: '22:00', ms: 200 }, { t: '28:00', ms: 240 },
            ]}
            width={300} height={170}
          />
          <OffsetZoneLegend />
        </ExpandableMetric>

        {/* 4. Energy mirroring */}
        <ExpandableMetric
          eyebrow="Energy mirroring" value="78%" unit="in tune"
          summary="Tight on pace and tone. Volume drifted apart." accent={colors.lavender} chartKind="line"
          blurb="Mostly in tune. Strongest alignment in minutes 15–22, when neither of you was leading. Volume drifted apart when you got animated about the cat story."
        >
          <View style={styles.energyRow}>
            <RingMeter value={78} size={56} stroke={5} color={colors.lavender} label="78" />
            <View style={{ flex: 1 }}>
              <View style={styles.energyChartRow}>
                <View style={styles.energyYAxis}>
                  <Body style={styles.energyAxisLabel}>hi</Body>
                  <Body style={styles.energyAxisLabel}>lo</Body>
                </View>
                <View style={styles.energyChart}>
                  <EnergyWave you={youEnergy} them={themEnergy} width={180} height={62} />
                  <View style={styles.energyXAxis}>
                    <Body style={styles.energyXLabel}>0:00</Body>
                    <Body style={[styles.energyXLabel, { letterSpacing: 1, textTransform: 'uppercase' }]}>energy · time</Body>
                    <Body style={styles.energyXLabel}>28:00</Body>
                  </View>
                </View>
              </View>
              <View style={styles.energyPips}>
                <Pip color={colors.terracotta}>You</Pip>
                <Pip color={colors.lavender}>Maya</Pip>
              </View>
            </View>
          </View>
          <View style={styles.syncSection}>
            <Body style={styles.syncHead}>Match by dimension</Body>
            <SyncBars dims={[
              { label: 'Volume convergence', you: 0.78, them: 0.45 },
              { label: 'Pitch', you: 0.72, them: 0.68 },
              { label: 'Speech rate', you: 0.58, them: 0.55 },
            ]} />
          </View>
        </ExpandableMetric>

        {/* 5. Linguistic style match */}
        <ExpandableMetric
          eyebrow="Linguistic style match" value="0.83" unit="LSM score"
          summary="Strong word-level alignment with Maya." accent={colors.lavender} chartKind="radar"
          blurb="LSM measures how closely your function-word usage (pronouns, articles, prepositions, conjunctions, quantifiers, auxiliary verbs) tracks the person you're with. 1.0 = perfect mirror. Yours sits at 0.83 — above the high-LSM threshold of 0.70. The two shapes overlap most where it counts: pronouns and conjunctions."
        >
          <View style={{ alignItems: 'center', marginBottom: 4 }}>
            <RadarChart
              size={240} rings={4}
              axes={[{ label: 'Pronouns' }, { label: 'Articles' }, { label: 'Prepositions' }, { label: 'Conjunctions' }, { label: 'Quantifiers' }, { label: 'Aux. verbs' }]}
              series={[
                { values: [0.82, 0.40, 0.72, 0.78, 0.30, 0.66], color: colors.terracotta, fill: 0.32, strokeWidth: 1.8 },
                { values: [0.62, 0.60, 0.55, 0.70, 0.48, 0.80], color: colors.lavender, fill: 0.32, strokeWidth: 1.8 },
              ]}
            />
          </View>
          <View style={styles.lsmLegend}>
            <View style={styles.lsmLegendItem}>
              <View style={[styles.lsmSwatch, { backgroundColor: colors.terracotta, borderColor: colors.terracotta }]} />
              <Body style={styles.lsmLegendText}>you</Body>
            </View>
            <View style={styles.lsmLegendItem}>
              <View style={[styles.lsmSwatch, { backgroundColor: colors.lavender, borderColor: colors.lavender }]} />
              <Body style={styles.lsmLegendText}>Maya</Body>
            </View>
            <Body style={styles.lsmLegendText}>overlap = match</Body>
          </View>
          <View style={styles.lsmScore}>
            <View style={styles.lsmScoreHead}>
              <Body style={{ fontSize: 11, color: colors.ink }}>Overall LSM</Body>
              <Serif style={{ fontSize: 16, color: colors.lavender }}>0.83</Serif>
            </View>
            <View style={styles.lsmTrack}>
              <View style={styles.lsmBand} />
              <View style={styles.lsmDot} />
            </View>
            <View style={styles.lsmScaleRow}>
              <Body style={styles.lsmScaleText}>0.0 · no match</Body>
              <Body style={[styles.lsmScaleText, { color: colors.sage, fontFamily: fonts.bodySemibold }]}>0.70+ high LSM</Body>
              <Body style={styles.lsmScaleText}>1.0 · perfect</Body>
            </View>
          </View>
        </ExpandableMetric>

        {/* 6. Vocabulary */}
        <ExpandableMetric
          eyebrow="Vocabulary" value="57%" unit="unique / spoken"
          summary="236 unique words across 412 spoken — dynamic, not loopy." accent={colors.sand} chartKind="bar"
          blurb="Vocabulary richness — how many distinct words you used vs how many you spoke. Below, the five most-used lexical paddings: fillers, hedges, and empty qualifiers that buy time without adding meaning."
        >
          <SerifItalic style={styles.vocabLine}>236 unique words across 412 spoken — dynamic, not loopy.</SerifItalic>
          <View>
            <View style={styles.vocabHead}>
              <Eyebrow>Top lexical paddings</Eyebrow>
              <Body style={styles.vocabHeadMeta}>26 total · 6.3% of words</Body>
            </View>
            <FillerBars items={[
              { phrase: 'honestly', count: 8 }, { phrase: 'kind of', count: 6 }, { phrase: 'you know', count: 5 },
              { phrase: 'like', count: 4 }, { phrase: 'I mean', count: 3 },
            ]} />
          </View>
        </ExpandableMetric>

        <View style={{ height: 8 }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 4 },
  titleBlock: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 6 },
  bigTitle: { fontSize: 30, lineHeight: 32, color: colors.ink },
  meta: { fontSize: 12, color: colors.muted, marginTop: 6, letterSpacing: 0.4 },
  reflectWrap: { paddingHorizontal: 18, paddingTop: 14 },
  reflectText: { fontSize: 17, lineHeight: 23, color: colors.ink },
  patterns: { paddingHorizontal: 18, paddingTop: 18 },
  patternsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  tapHint: { fontSize: 10.5, color: colors.muted, letterSpacing: 0.6 },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  pipNote: { fontSize: 11.5, color: colors.muted, marginTop: 2 },

  // Questions
  qRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  qBars: { flexDirection: 'row', gap: 8, width: 128 },
  qBarTrack: { height: 130, backgroundColor: 'rgba(42,37,32,0.04)', borderRadius: 10, overflow: 'hidden', justifyContent: 'flex-end' },
  qBarFill: { width: '100%', borderRadius: 10, alignItems: 'center', paddingTop: 8 },
  qBarVal: { fontSize: 22, color: '#FBF6EA', lineHeight: 24 },
  qBarLabel: { fontSize: 10, color: colors.muted, letterSpacing: 0.8, textTransform: 'uppercase', textAlign: 'center', lineHeight: 14 },
  qBarSub: { fontSize: 9, color: colors.muted, opacity: 0.7 },
  qAnalysis: { flex: 1, gap: 8, height: 130 },
  miniCard: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, flex: 1, justifyContent: 'center' },
  miniLabel: { fontSize: 9.5, color: colors.muted, letterSpacing: 1, textTransform: 'uppercase' },
  miniRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 3 },
  miniNum: { fontSize: 17, lineHeight: 18 },
  miniUnit: { fontSize: 10, color: colors.muted },
  miniDotSep: { color: colors.hairline, marginHorizontal: 1 },
  miniBar: { height: 4, marginTop: 6, borderRadius: 999, backgroundColor: 'rgba(42,37,32,0.08)', overflow: 'hidden', flexDirection: 'row' },
  miniItalic: { fontSize: 11, color: colors.ink2, marginTop: 4, lineHeight: 14 },

  // Energy
  energyRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  energyChartRow: { flexDirection: 'row', alignItems: 'stretch', gap: 6 },
  energyYAxis: { justifyContent: 'space-between', paddingVertical: 2 },
  energyAxisLabel: { fontSize: 8.5, color: colors.muted, letterSpacing: 1, textTransform: 'uppercase' },
  energyChart: { flex: 1, borderLeftWidth: 1, borderLeftColor: 'rgba(42,37,32,0.12)', paddingLeft: 6 },
  energyXAxis: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  energyXLabel: { fontSize: 9, color: colors.muted, letterSpacing: 0.4 },
  energyPips: { flexDirection: 'row', gap: 12, marginTop: 8 },
  syncSection: { paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.hairline, borderStyle: 'dashed' },
  syncHead: { fontSize: 10.5, color: colors.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },

  // LSM
  lsmLegend: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 4, alignItems: 'center' },
  lsmLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lsmSwatch: { width: 14, height: 10, borderRadius: 2, opacity: 0.55, borderWidth: 1.5 },
  lsmLegendText: { fontSize: 10.5, color: colors.muted, letterSpacing: 0.4 },
  lsmScore: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.hairline, borderStyle: 'dashed' },
  lsmScoreHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  lsmTrack: { height: 10, backgroundColor: 'rgba(42,37,32,0.06)', borderRadius: 999, justifyContent: 'center' },
  lsmBand: { position: 'absolute', left: '70%', right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(151,168,135,0.2)', borderTopRightRadius: 999, borderBottomRightRadius: 999, borderWidth: 1, borderColor: 'rgba(151,168,135,0.33)' },
  lsmDot: { position: 'absolute', left: '83%', width: 14, height: 14, borderRadius: 7, marginLeft: -7, backgroundColor: colors.lavender },
  lsmScaleRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  lsmScaleText: { fontSize: 10, color: colors.muted, letterSpacing: 0.3 },

  // Vocabulary
  vocabLine: { fontSize: 13.5, color: colors.ink2, lineHeight: 20, marginBottom: 16 },
  vocabHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  vocabHeadMeta: { fontSize: 10.5, color: colors.muted, letterSpacing: 0.6 },
});
