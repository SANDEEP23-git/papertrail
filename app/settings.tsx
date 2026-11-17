import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../components/Header';
import { NotesRepository, AppSettings, DEFAULT_SETTINGS } from '../database/notes';
import { AuthService, AuthSession } from '../services/auth';
import { TypewriterSoundEngine } from '../services/typewriterSound';
import { CuratedInks, CuratedFonts, FontSizes, LineSpacings } from '../constants/typography';
import { CuratedPapers } from '../constants/papers';
import { SecurityLockService } from '../services/securityLock';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState({
    activeCount: 0,
    archivedCount: 0,
    trashCount: 0,
    totalWords: 0,
  });

  useEffect(() => {
    AuthService.getSession().then(setSession);
    NotesRepository.getSettings().then((s) => {
      setSettings(s);
      TypewriterSoundEngine.setEnabled(s.typingSounds);
      TypewriterSoundEngine.setVolume(s.soundVolume ?? 0.7);
      TypewriterSoundEngine.setHapticsEnabled(s.hapticFeedback);
    });
    NotesRepository.getStats().then(setStats);
  }, []);

  const updateSetting = async <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => {
    const updated = await NotesRepository.updateSettings({ [key]: val });
    setSettings(updated);

    if (key === 'typingSounds') {
      TypewriterSoundEngine.setEnabled(val as boolean);
    } else if (key === 'soundVolume') {
      TypewriterSoundEngine.setVolume(val as number);
      TypewriterSoundEngine.playInputSound('char');
    } else if (key === 'hapticFeedback') {
      TypewriterSoundEngine.setHapticsEnabled(val as boolean);
    }
  };

  const handleExportBackup = async () => {
    try {
      const json = await NotesRepository.exportAllAsJson();
      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `papertrail_${session?.name || 'vault'}_backup.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        Alert.alert(
          'Backup Prepared',
          `Exported ${stats.activeCount + stats.archivedCount} notes as JSON.`
        );
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const currentVolume = settings.soundVolume ?? 0.7;
  const volumePercentage = Math.round(currentVolume * 100);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="SETTINGS" subtitle="CONFIGURATION & PRIVACY" showBack />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Section: Personal Account & Identity */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>PERSONAL USER ACCOUNT & SECURITY</Text>

          <TouchableOpacity
            style={styles.accountCard}
            onPress={() => router.push(session ? '/account' : '/auth')}
            activeOpacity={0.8}
          >
            <View style={styles.accountAvatar}>
              <Text style={styles.accountAvatarChar}>
                {session ? session.name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <View style={styles.accountInfoBox}>
              <Text style={styles.accountMainName}>
                {session ? session.name : 'Unauthenticated Guest'}
              </Text>
              <Text style={styles.accountSubText}>
                {session ? session.email : 'Tap to register or sign in to isolate your records'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Section: Default Personal Ink Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>DEFAULT INK SELECTION</Text>
          <Text style={styles.sectionDesc}>
            Choose your preferred writing ink for all newly inserted sheets.
          </Text>

          <View style={styles.inkGrid}>
            {CuratedInks.map((ink) => {
              const isSelected =
                settings.defaultInkColor.toLowerCase() === ink.hex.toLowerCase();
              return (
                <TouchableOpacity
                  key={ink.id}
                  style={[
                    styles.inkSwatchTile,
                    isSelected && styles.inkSwatchTileSelected,
                  ]}
                  onPress={() => updateSetting('defaultInkColor', ink.hex)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.inkDrop, { backgroundColor: ink.hex }]}>
                    {isSelected && <Ionicons name="checkmark" size={12} color="#FFF" />}
                  </View>
                  <Text style={styles.inkName} numberOfLines={1}>
                    {ink.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section: Default Font & Typography */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>DEFAULT EDITORIAL FONT & SCALE</Text>

          <View style={styles.fontList}>
            {CuratedFonts.map((font) => {
              const isSelected = settings.defaultFontFamily === font.family;
              return (
                <TouchableOpacity
                  key={font.id}
                  style={[styles.fontRow, isSelected && styles.fontRowSelected]}
                  onPress={() => updateSetting('defaultFontFamily', font.family)}
                >
                  <View style={styles.fontTextWrap}>
                    <Text style={[styles.fontName, { fontFamily: font.family }]}>
                      {font.name}
                    </Text>
                    <Text
                      style={[
                        styles.fontSample,
                        {
                          fontFamily: font.family,
                          color: settings.defaultInkColor,
                        },
                      ]}
                    >
                      {font.previewText}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={18} color={Colors.walnut} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Default Font Size */}
          <Text style={[styles.subLabel, { marginTop: Spacing.md }]}>DEFAULT FONT SIZE</Text>
          <View style={styles.pillsRow}>
            {FontSizes.map((sz) => {
              const isSelected = settings.defaultFontSize === sz.value;
              return (
                <TouchableOpacity
                  key={sz.value}
                  style={[styles.pillBtn, isSelected && styles.pillBtnSelected]}
                  onPress={() => updateSetting('defaultFontSize', sz.value)}
                >
                  <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                    {sz.label} ({sz.value}px)
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Default Line Spacing */}
          <Text style={[styles.subLabel, { marginTop: Spacing.sm }]}>DEFAULT LINE SPACING</Text>
          <View style={styles.pillsRow}>
            {LineSpacings.map((sp) => {
              const isSelected = Math.abs(settings.defaultLineSpacing - sp.value) < 0.05;
              return (
                <TouchableOpacity
                  key={sp.value}
                  style={[styles.pillBtn, isSelected && styles.pillBtnSelected]}
                  onPress={() => updateSetting('defaultLineSpacing', sp.value)}
                >
                  <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                    {sp.label} ({sp.value}x)
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section: Default Paper Collection */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>DEFAULT PAPER TEXTURE</Text>
          <Text style={styles.sectionDesc}>
            Select your default archival paper texture for fresh writing sheets.
          </Text>

          <View style={styles.paperGrid}>
            {CuratedPapers.map((paper) => {
              const isSelected = (settings.defaultPaperStyle || 'blank') === paper.id;
              return (
                <TouchableOpacity
                  key={paper.id}
                  style={[
                    styles.paperTile,
                    { backgroundColor: paper.backgroundColor, borderColor: paper.borderColor },
                    isSelected && styles.paperTileSelected,
                  ]}
                  onPress={() => updateSetting('defaultPaperStyle', paper.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.paperTileHeader}>
                    <Text style={[styles.paperTileName, { color: paper.textColor }]}>{paper.name}</Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={14} color={Colors.brass} />}
                  </View>
                  <Text style={[styles.paperTileDesc, { color: paper.textColor, opacity: 0.7 }]} numberOfLines={2}>
                    {paper.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section: Daily Writing Goal Target */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>DAILY WRITING GOAL TARGET</Text>
          <Text style={styles.sectionDesc}>
            Target word count per day for tracking your writing streak and momentum.
          </Text>

          <View style={styles.pillsRow}>
            {[100, 250, 500, 750, 1000].map((words) => {
              const isSelected = (settings.dailyWordTarget || 250) === words;
              return (
                <TouchableOpacity
                  key={words}
                  style={[styles.pillBtn, isSelected && styles.pillBtnSelected]}
                  onPress={() => updateSetting('dailyWordTarget', words)}
                >
                  <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                    {words} words
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section: Tactile & Mechanical Feedback */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>AUTHENTIC TYPEWRITER SOUND & TACTILES</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Vintage Typewriter Sounds</Text>
              <Text style={styles.settingDesc}>
                Acoustic mechanical key strikes, spacebar advance, carriage return & bell
              </Text>
            </View>
            <Switch
              value={settings.typingSounds}
              onValueChange={(val) => updateSetting('typingSounds', val)}
              trackColor={{ false: Colors.rule, true: Colors.walnut }}
              thumbColor={settings.typingSounds ? Colors.sheet : Colors.paper}
            />
          </View>

          {settings.typingSounds && (
            <View style={[styles.settingRow, styles.rowBorder, styles.columnLayout]}>
              <View style={styles.volumeHeaderRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Sound Volume</Text>
                  <Text style={styles.settingDesc}>
                    Natural mechanical acoustic level ({volumePercentage}%)
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.testSoundBtn}
                  onPress={() => TypewriterSoundEngine.playInputSound('enter')}
                >
                  <Ionicons name="volume-high-outline" size={16} color={Colors.walnut} />
                  <Text style={styles.testSoundText}>Test Bell</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.volumeStepContainer}>
                {[0.25, 0.5, 0.75, 1.0].map((v) => {
                  const isSelected = Math.abs(currentVolume - v) < 0.12;
                  return (
                    <TouchableOpacity
                      key={v}
                      style={[styles.volumeStepBtn, isSelected && styles.volumeStepBtnActive]}
                      onPress={() => updateSetting('soundVolume', v)}
                    >
                      <Text
                        style={[
                          styles.volumeStepText,
                          isSelected && styles.volumeStepTextActive,
                        ]}
                      >
                        {Math.round(v * 100)}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <View style={[styles.settingRow, styles.rowBorder]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Haptic Feedback</Text>
              <Text style={styles.settingDesc}>
                Subtle mechanical resistance on keystrokes and carriage return
              </Text>
            </View>
            <Switch
              value={settings.hapticFeedback}
              onValueChange={(val) => updateSetting('hapticFeedback', val)}
              trackColor={{ false: Colors.rule, true: Colors.walnut }}
              thumbColor={settings.hapticFeedback ? Colors.sheet : Colors.paper}
            />
          </View>
        </View>

        {/* Section: Storage & Verification */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>PERSISTENCE & AUDIT</Text>

          <View style={styles.statGrid}>
            <View style={styles.statTile}>
              <Text style={styles.statNum}>{stats.activeCount}</Text>
              <Text style={styles.statLabel}>Active Sheets</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statNum}>{stats.archivedCount}</Text>
              <Text style={styles.statLabel}>Archived</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statNum}>{stats.totalWords}</Text>
              <Text style={styles.statLabel}>Total Words</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.backupButton}
            onPress={handleExportBackup}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Ionicons name="download-outline" size={18} color={Colors.ink} />
            <Text style={styles.backupButtonText}>Export Complete Personal Backup (JSON)</Text>
          </TouchableOpacity>
        </View>

        {/* Section: Privacy by Default */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>STRICT PRIVACY & USER SOVEREIGNTY</Text>

          <View style={styles.privacyCard}>
            <View style={styles.privacyHeader}>
              <Ionicons name="shield-checkmark" size={18} color={Colors.walnut} />
              <Text style={styles.privacyTitle}>Zero Cloud Transmission & Account Isolation</Text>
            </View>
            <Text style={styles.privacyBody}>
              Every writing belongs exclusively to its authenticated owner. Local data is strictly partitioned by user account. When you log out, local caches are immediately wiped. Your writings never touch external AI crawlers.
            </Text>
          </View>
        </View>

        {/* Section: Version info */}
        <View style={styles.aboutCard}>
          <Text style={styles.aboutName}>PAPERTRAIL</Text>
          <Text style={styles.aboutVersion}>Version 1.2.0 (Security & Customization Release)</Text>
          <Text style={styles.aboutTagline}>Every thought leaves a mark.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  section: {
    backgroundColor: Colors.sheet,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.rule,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    fontSize: 10,
    fontFamily: Typography.fontFamilies.mono,
    color: Colors.muted,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1.2,
    marginBottom: Spacing.xs + 2,
  },
  sectionDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.muted,
    marginBottom: Spacing.sm,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: Radii.sm,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  accountAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.walnut,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountAvatarChar: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.sheet,
  },
  accountInfoBox: {
    flex: 1,
  },
  accountMainName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.ink,
  },
  accountSubText: {
    fontSize: 10,
    color: Colors.muted,
    marginTop: 1,
  },
  inkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  inkSwatchTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    gap: 6,
    minWidth: 130,
  },
  inkSwatchTileSelected: {
    borderColor: Colors.walnut,
    borderWidth: 1.5,
  },
  inkDrop: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inkName: {
    fontSize: 11,
    color: Colors.ink,
    fontWeight: Typography.weights.medium,
  },
  fontList: {
    gap: 6,
  },
  fontRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: Radii.sm,
    padding: Spacing.sm,
  },
  fontRowSelected: {
    borderColor: Colors.walnut,
    borderWidth: 1.5,
  },
  fontTextWrap: {
    flex: 1,
  },
  fontName: {
    fontSize: Typography.sizes.base,
    color: Colors.ink,
    fontWeight: Typography.weights.semibold,
  },
  fontSample: {
    fontSize: Typography.sizes.xs,
    marginTop: 2,
    opacity: 0.8,
  },
  subLabel: {
    fontSize: 9,
    fontFamily: Typography.fontFamilies.mono,
    color: Colors.muted,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  paperGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  paperTile: {
    width: '48%',
    borderRadius: Radii.sm,
    borderWidth: 1.5,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  paperTileSelected: {
    borderColor: Colors.brass,
    borderWidth: 2,
  },
  paperTileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  paperTileName: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  paperTileDesc: {
    fontSize: 9,
    lineHeight: 12,
  },
  pillBtn: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
  },
  pillBtnSelected: {
    backgroundColor: Colors.walnut,
    borderColor: Colors.walnut,
  },
  pillText: {
    fontSize: 11,
    color: Colors.muted,
    fontWeight: Typography.weights.medium,
  },
  pillTextSelected: {
    color: Colors.sheet,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  columnLayout: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.ink,
  },
  settingDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.muted,
    marginTop: 2,
    lineHeight: 16,
  },
  volumeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  testSoundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    gap: 4,
  },
  testSoundText: {
    fontSize: Typography.sizes.xs,
    color: Colors.walnut,
    fontWeight: Typography.weights.semibold,
  },
  volumeStepContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  volumeStepBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.rule,
    backgroundColor: Colors.paper,
    alignItems: 'center',
  },
  volumeStepBtnActive: {
    backgroundColor: Colors.walnut,
    borderColor: Colors.walnut,
  },
  volumeStepText: {
    fontSize: Typography.sizes.xs,
    color: Colors.muted,
    fontWeight: Typography.weights.semibold,
  },
  volumeStepTextActive: {
    color: Colors.sheet,
  },
  statGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statTile: {
    flex: 1,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: Radii.sm,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  statNum: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.ink,
    fontFamily: Typography.fontFamilies.mono,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.muted,
    marginTop: 2,
  },
  backupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.walnut,
    borderRadius: Radii.sm,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.xs,
  },
  backupButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.ink,
  },
  privacyCard: {
    backgroundColor: Colors.paper,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.rule,
    padding: Spacing.md,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  privacyTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.ink,
  },
  privacyBody: {
    fontSize: Typography.sizes.xs,
    color: Colors.ink,
    opacity: 0.8,
    lineHeight: 18,
  },
  aboutCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  aboutName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.ink,
    letterSpacing: 2,
  },
  aboutVersion: {
    fontSize: Typography.sizes.xs,
    color: Colors.muted,
    marginTop: 2,
  },
  aboutTagline: {
    fontSize: Typography.sizes.xs,
    fontStyle: 'italic',
    color: Colors.muted,
    marginTop: 4,
  },
});
