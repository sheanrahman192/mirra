// You · profile — identity, stats, subscription, settings.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/ui';
import { Body, Serif, SerifItalic, Eyebrow } from '@/components/Typography';
import { Icon } from '@/components/Icon';
import { colors, fonts } from '@/theme/tokens';

function Avatar({ initials = 'MC', size = 84 }: { initials?: string; size?: number }) {
  return (
    <LinearGradient
      colors={['#E8B79E', '#D08866', '#BA7253'] as const}
      locations={[0, 0.7, 1] as const}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Serif style={{ fontSize: size * 0.46, color: '#FBF6EA' }}>{initials}</Serif>
    </LinearGradient>
  );
}

function StatPill({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <View style={styles.statPill}>
      <Serif style={{ fontSize: 24, lineHeight: 24, color: accent }}>{value}</Serif>
      <Body style={styles.statLabel}>{label}</Body>
    </View>
  );
}

function SettingRow({ label, hint, isLast }: { label: string; hint?: string; isLast?: boolean }) {
  return (
    <View style={[styles.settingRow, !isLast && styles.settingBorder]}>
      <View style={{ flex: 1 }}>
        <Body style={styles.settingLabel}>{label}</Body>
        {hint ? <Body style={styles.settingHint}>{hint}</Body> : null}
      </View>
      <Icon.chevron color="rgba(42,37,32,0.35)" />
    </View>
  );
}

function Check({ color }: { color: string }) {
  return (
    <Svg viewBox="0 0 16 16" width={14} height={14}>
      <Path d="M3 8.5L6.5 12 13 4.5" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ProfileScreen() {
  return (
    <Screen topOffset={50}>
      {/* Header */}
      <View style={styles.header}>
        <Eyebrow>You</Eyebrow>
        <Icon.dots color={colors.muted} />
      </View>

      {/* Identity */}
      <View style={styles.identity}>
        <Avatar initials="MC" size={84} />
        <View style={{ alignItems: 'center' }}>
          <Serif style={styles.name}>
            Maya <SerifItalic style={styles.name}>Chen</SerifItalic>
          </Serif>
          <Body style={styles.email}>maya.chen@hey.com</Body>
        </View>
        <SerifItalic style={styles.tagline}>"Listening more, talking with care."</SerifItalic>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <StatPill value="47" label="Conversations" accent={colors.terracotta} />
        <StatPill value="28" label="Day streak" accent={colors.sage} />
        <StatPill value="Mar '25" label="Member since" accent={colors.lavender} />
      </View>

      {/* Subscription */}
      <View style={styles.subWrap}>
        <LinearGradient colors={['#2E2A26', '#3D332B'] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.subCard}>
          <Svg viewBox="0 0 200 200" width={180} height={180} style={styles.blob}>
            <Path d="M100,20 C140,20 180,60 180,100 C180,150 130,180 90,170 C50,160 20,130 25,90 C30,50 60,20 100,20Z" fill="#D08866" opacity={0.18} />
          </Svg>

          <Body style={styles.subEyebrow}>Current plan</Body>
          <Serif style={styles.subPlan}>Mirra <SerifItalic style={styles.subPlan}>Free</SerifItalic></Serif>
          <Body style={styles.subDesc}>5 conversations per month · 7-day history · core metrics</Body>

          <View style={styles.subDivider} />

          <View style={styles.subUpgradeRow}>
            <View style={{ flex: 1 }}>
              <Body style={styles.subEyebrow}>Upgrade to</Body>
              <Serif style={styles.subPlan}>Mirra <SerifItalic style={[styles.subPlan, { color: colors.terracottaSoft }]}>Pro</SerifItalic></Serif>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Serif style={{ fontSize: 24, lineHeight: 24, color: '#F6EFE0' }}>$8</Serif>
              <Body style={styles.subPerMonth}>per month</Body>
            </View>
          </View>

          <View style={{ gap: 8, marginTop: 14 }}>
            {['Unlimited conversations', 'Full history & weekly themes', 'Energy & vocabulary deep-dives', 'Custom goals + gentle nudges'].map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Check color={colors.terracottaSoft} />
                <Body style={styles.featureText}>{f}</Body>
              </View>
            ))}
          </View>

          <View style={styles.tryBtn}>
            <Body style={styles.tryBtnText}>Try Pro free for 14 days</Body>
          </View>
          <Body style={styles.tryNote}>Cancel anytime · No charge until day 15</Body>
        </LinearGradient>
      </View>

      {/* Settings */}
      <View style={styles.settingsWrap}>
        <Eyebrow style={{ marginBottom: 6 }}>Settings</Eyebrow>
        <Card style={styles.settingsCard}>
          <SettingRow label="Notifications" hint="Weekly summary on Sunday evenings" />
          <SettingRow label="Voice & privacy" hint="On-device transcription · audio never leaves your phone" />
          <SettingRow label="Coaching tone" hint="Warm reflective" />
          <SettingRow label="Help & feedback" isLast />
        </Card>
      </View>

      <View style={styles.footer}>
        <Body style={styles.signOut}>Sign out</Body>
        <Body style={styles.version}>Mirra v1.4.2 · made with care</Body>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 22, paddingTop: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  identity: { paddingHorizontal: 22, paddingTop: 14, alignItems: 'center', gap: 12 },
  avatar: {
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#BA7253', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 22, elevation: 8,
  },
  name: { fontSize: 28, lineHeight: 31, color: colors.ink },
  email: { fontSize: 12.5, color: colors.muted, marginTop: 4 },
  tagline: { fontSize: 13.5, color: colors.ink2, lineHeight: 20, maxWidth: 280, marginTop: 2, textAlign: 'center' },
  stats: { paddingHorizontal: 22, paddingTop: 18, flexDirection: 'row', gap: 10 },
  statPill: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, backgroundColor: colors.card, borderRadius: 16, alignItems: 'center' },
  statLabel: { fontSize: 10.5, color: colors.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 6 },

  subWrap: { paddingHorizontal: 22, paddingTop: 18 },
  subCard: { borderRadius: 22, padding: 20, overflow: 'hidden' },
  blob: { position: 'absolute', right: -40, top: -30 },
  subEyebrow: { fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', color: 'rgba(246,239,224,0.55)', fontFamily: fonts.bodyMedium },
  subPlan: { fontSize: 26, lineHeight: 28, marginTop: 6, color: '#F6EFE0' },
  subDesc: { fontSize: 12.5, color: 'rgba(246,239,224,0.7)', marginTop: 6, lineHeight: 19, maxWidth: 240 },
  subDivider: { height: 1, backgroundColor: 'rgba(246,239,224,0.15)', marginVertical: 18 },
  subUpgradeRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  subPerMonth: { fontSize: 10.5, color: 'rgba(246,239,224,0.55)', letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 4 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 13, color: 'rgba(246,239,224,0.92)' },
  tryBtn: { marginTop: 18, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F6EFE0', alignItems: 'center' },
  tryBtnText: { color: '#2A2520', fontFamily: fonts.bodySemibold, fontSize: 14, letterSpacing: 0.3 },
  tryNote: { fontSize: 10.5, color: 'rgba(246,239,224,0.5)', marginTop: 10, textAlign: 'center', letterSpacing: 0.4 },

  settingsWrap: { paddingHorizontal: 22, paddingTop: 20 },
  settingsCard: { paddingVertical: 4, paddingHorizontal: 16 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  settingBorder: { borderBottomWidth: 1, borderBottomColor: colors.hairline2 },
  settingLabel: { fontSize: 14.5, color: colors.ink },
  settingHint: { fontSize: 11.5, color: colors.muted, marginTop: 2 },
  footer: { paddingHorizontal: 22, paddingTop: 14, alignItems: 'center' },
  signOut: { fontSize: 12.5, color: colors.muted },
  version: { fontSize: 10.5, color: colors.muted, marginTop: 14, letterSpacing: 0.3, opacity: 0.7 },
});
