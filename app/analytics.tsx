import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Header } from '../components/Header';
import { AnalyticsService, AnalyticsSummary } from '../services/analytics';
import { AuthService, AuthSession } from '../services/auth';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function AnalyticsScreen() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const currentSession = await AuthService.getSession();
      setSession(currentSession);
      if (!currentSession) {
        setSummary(null);
        return;
      }
      const data = await AnalyticsService.getSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="WRITING ANALYTICS"
        subtitle={session ? `WRITER: ${session.name.toUpperCase()}` : 'ACCOUNT REQUIRED'}
        showBack
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor={Colors.walnut}
          />
        }
      >
        {!session && !loading && (
          <View style={styles.emptyCard}>
            <Ionicons name="lock-closed" size={32} color={Colors.walnut} />
            <Text style={styles.emptyTitle}>Writing Analytics Are Private</Text>
            <Text style={styles.emptyDesc}>
              Bina account create kare writing analytics access nahi ki ja sakti.
            </Text>
            <TouchableOpacity style={styles.authBtn} onPress={() => router.push('/auth')}>
              <Text style={styles.authBtnText}>Sign In / Register</Text>
            </TouchableOpacity>
          </View>
        )}

        {session && summary && (
          <>
            {/* Feature 1: Streak & Goal Showcase Card */}
            <View style={styles.streakHeroCard}>
              <View style={styles.streakRow}>
                <View style={styles.streakCircle}>
                  <Ionicons name="flame" size={26} color="#C86D51" />
                  <Text style={styles.streakCount}>{summary.currentStreak}</Text>
                  <Text style={styles.streakLabel}>DAYS STREAK</Text>
                </View>

                <View style={styles.streakStats}>
                  <View style={styles.streakStatTile}>
                    <Text style={styles.streakStatNum}>{summary.longestStreak}</Text>
                    <Text style={styles.streakStatLabel}>Longest Streak</Text>
                  </View>
                  <View style={styles.streakStatTile}>
                    <Text style={styles.streakStatNum}>{summary.totalActiveDays}</Text>
                    <Text style={styles.streakStatLabel}>Active Days</Text>
                  </View>
                </View>
              </View>

              {/* Daily Target Meter */}
              <View style={styles.targetSection}>
                <View style={styles.targetHeader}>
                  <Text style={styles.targetTitle}>DAILY TARGET (250 WORDS)</Text>
                  <Text style={styles.targetValue}>
                    {summary.todayWords} / {summary.dailyWordTarget} ({Math.round(summary.todayProgress * 100)}%)
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(100, Math.round(summary.todayProgress * 100))}%` },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Overall Volumes */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statBoxNum}>{summary.totalWords}</Text>
                <Text style={styles.statBoxLabel}>Total Words Inked</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxNum}>{summary.totalNotes}</Text>
                <Text style={styles.statBoxLabel}>Active Sheets</Text>
              </View>
            </View>

            {/* Weekly Activity Chart (Last 7 Days) */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>LAST 7 DAYS ACTIVITY (WORDS)</Text>
              <View style={styles.chartContainer}>
                {summary.weeklyBreakdown.map((item, index) => {
                  const maxWordsInWeek = Math.max(
                    1,
                    ...summary.weeklyBreakdown.map((b) => b.words)
                  );
                  const barHeight = Math.max(8, Math.round((item.words / maxWordsInWeek) * 110));
                  const isToday = index === summary.weeklyBreakdown.length - 1;

                  return (
                    <View key={item.date} style={styles.chartColumn}>
                      <Text style={styles.barWords}>{item.words > 0 ? item.words : ''}</Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { height: barHeight },
                            isToday && styles.barFillToday,
                          ]}
                        />
                      </View>
                      <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                        {item.dayName}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Productive Cadence */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>WRITING CADENCE & INSIGHTS</Text>
              <View style={styles.insightRow}>
                <Ionicons name="sparkles" size={16} color={Colors.brass} />
                <Text style={styles.insightText}>
                  Peak cadence: <Text style={styles.insightBold}>{summary.mostProductiveDay}</Text>
                </Text>
              </View>
              <View style={styles.insightRow}>
                <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
                <Text style={styles.insightText}>
                  Storage integrity: All stats computed exclusively from your private offline-first database.
                </Text>
              </View>
            </View>
          </>
        )}
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
  streakHeroCard: {
    backgroundColor: Colors.sheet,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.rule,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  streakCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F7EDE6',
    borderWidth: 1.5,
    borderColor: '#C86D51',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCount: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: '#8B3A1C',
    fontFamily: Typography.fontFamilies.mono,
  },
  streakLabel: {
    fontSize: 8,
    fontFamily: Typography.fontFamilies.mono,
    color: '#8B3A1C',
    letterSpacing: 1,
    fontWeight: Typography.weights.bold,
  },
  streakStats: {
    flex: 1,
    gap: Spacing.sm,
  },
  streakStatTile: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  streakStatNum: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.ink,
    fontFamily: Typography.fontFamilies.mono,
  },
  streakStatLabel: {
    fontSize: 10,
    color: Colors.muted,
  },
  targetSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
    paddingTop: Spacing.sm,
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  targetTitle: {
    fontSize: 9,
    fontFamily: Typography.fontFamilies.mono,
    color: Colors.muted,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1,
  },
  targetValue: {
    fontSize: 10,
    fontFamily: Typography.fontFamilies.mono,
    color: Colors.ink,
    fontWeight: Typography.weights.bold,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.paperDark,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.walnut,
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.sheet,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: Radii.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statBoxNum: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.ink,
    fontFamily: Typography.fontFamilies.mono,
  },
  statBoxLabel: {
    fontSize: 10,
    color: Colors.muted,
    marginTop: 2,
  },
  sectionCard: {
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
    marginBottom: Spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingHorizontal: Spacing.xs,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barWords: {
    fontSize: 9,
    fontFamily: Typography.fontFamilies.mono,
    color: Colors.muted,
    marginBottom: 4,
    height: 12,
  },
  barTrack: {
    height: 110,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: 22,
    backgroundColor: Colors.paperDark,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: Radii.xs,
  },
  barFillToday: {
    backgroundColor: Colors.walnut,
    borderColor: Colors.walnut,
  },
  dayLabel: {
    fontSize: 10,
    color: Colors.muted,
    marginTop: 6,
  },
  dayLabelToday: {
    fontWeight: Typography.weights.bold,
    color: Colors.ink,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  insightText: {
    fontSize: Typography.sizes.xs,
    color: Colors.ink,
    lineHeight: 18,
    flex: 1,
  },
  insightBold: {
    fontWeight: Typography.weights.bold,
    color: Colors.walnut,
  },
  emptyCard: {
    backgroundColor: Colors.sheet,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: Radii.md,
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.xl,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.ink,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: Typography.sizes.sm,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
    marginBottom: Spacing.md,
  },
  authBtn: {
    backgroundColor: Colors.walnut,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: Radii.sm,
  },
  authBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.sheet,
  },
});
