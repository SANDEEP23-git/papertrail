import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Header } from '../components/Header';
import { Notecard } from '../components/Notecard';
import { NotesRepository, Note, NoteStats } from '../database/notes';
import { AuthService, AuthSession } from '../services/auth';
import { AnalyticsService, AnalyticsSummary } from '../services/analytics';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function HomeScreen() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [stats, setStats] = useState<NoteStats>({
    activeCount: 0,
    archivedCount: 0,
    trashCount: 0,
    totalWords: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const currentSession = await AuthService.getSession();
      setSession(currentSession);
      const active = await NotesRepository.listActiveNotes('updated_at');
      const realStats = await NotesRepository.getStats();
      const analyticsData = await AnalyticsService.getSummary();

      setRecentNotes(active.slice(0, 5));
      setStats(realStats);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to load notes on home screen:', err);
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

  const handleStartWriting = async () => {
    // STRICT AUTHENTICATION GATE:
    // Bina account banaye user kuch bhi type nahi kar sakta
    if (!session) {
      router.push('/auth');
      return;
    }

    try {
      const newNote = await NotesRepository.createNote();
      router.push({
        pathname: '/editor',
        params: { id: newNote.id },
      });
    } catch (err) {
      console.error('Could not create new note:', err);
    }
  };

  const handleOpenNote = (note: Note) => {
    router.push({
      pathname: '/editor',
      params: { id: note.id },
    });
  };

  const handleArchiveNote = async (note: Note) => {
    await NotesRepository.archiveNote(note.id);
    await loadData();
  };

  const handleDeleteNote = async (note: Note) => {
    await NotesRepository.softDeleteNote(note.id);
    await loadData();
  };

  // Formatted date string for editorial header (e.g. "MONDAY, NOVEMBER 17")
  const todayFormatted = new Date()
    .toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Brand Header */}
      <Header
        title="PAPERTRAIL"
        subtitle="THE ART OF SLOW WRITING"
        showBack={false}
        rightAction={{
          iconName: 'create-outline',
          label: 'New Sheet',
          onPress: handleStartWriting,
        }}
        secondaryAction={{
          iconName: 'settings-outline',
          label: 'Settings',
          onPress: () => router.push('/settings'),
        }}
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
        {/* User Account Status Banner — Only shown to unauthenticated guests */}
        {!session && (
          <TouchableOpacity
            style={styles.accountBanner}
            onPress={() => router.push('/auth')}
            activeOpacity={0.8}
          >
            <View style={styles.bannerLeft}>
              <View style={[styles.statusDot, styles.statusGuest]} />
              <Text style={styles.bannerText}>
                Account Required to Write · Tap here to Register or Sign In
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={Colors.muted} />
          </TouchableOpacity>
        )}

        {/* Editorial Greeting Header */}
        <View style={styles.editorialHeader}>
          <Text style={styles.dateLabel}>{todayFormatted}</Text>
          <Text style={styles.mainHeadline}>Your thoughts,{'\n'}beautifully kept.</Text>
          <Text style={styles.subHeadline}>
            A quiet place for everything on your mind.
          </Text>
        </View>

        {/* Hero Card — "YOUR WRITING DESK" */}
        <View style={styles.heroCard}>
          <View style={styles.heroCardTopRow}>
            <View style={styles.deskBadge}>
              <Text style={styles.deskBadgeText}>YOUR WRITING DESK</Text>
            </View>
            <Ionicons name="ellipsis-horizontal" size={16} color={Colors.muted} />
          </View>

          {/* Realistic Vintage Mechanical Typewriter Image */}
          <View style={styles.heroImageWrapper}>
            <Image
              source={require('../assets/images/hero_typewriter_desk.jpg')}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>

          {/* Hero Card Text & Primary Action Button */}
          <View style={styles.heroCardContent}>
            <Text style={styles.heroTitle}>Start with a blank page.</Text>
            <Text style={styles.heroSubtitle}>
              No distractions. Just you and your words.
            </Text>

            <TouchableOpacity
              style={[styles.createNoteBtn, !session && styles.createNoteBtnGuest]}
              onPress={handleStartWriting}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel={session ? 'Create new note' : 'Sign in to create note'}
            >
              <Ionicons
                name={session ? 'create-outline' : 'lock-closed-outline'}
                size={18}
                color={Colors.sheet}
              />
              <Text style={styles.createNoteBtnText}>
                {session ? 'Create new note' : 'Sign In to Create Note'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Writing Streak & Momentum Card */}
        {session && analytics && (
          <TouchableOpacity
            style={styles.streakCard}
            onPress={() => router.push('/analytics')}
            activeOpacity={0.85}
          >
            <View style={styles.streakHeaderRow}>
              <View style={styles.streakLeft}>
                <Ionicons name="flame" size={20} color="#D97706" />
                <Text style={styles.streakCountText}>
                  {analytics.currentStreak > 0
                    ? `${analytics.currentStreak} Day Writing Streak`
                    : 'Begin Your Writing Streak Today'}
                </Text>
              </View>
              <Text style={styles.streakTargetText}>
                {analytics.todayWords} / {analytics.dailyWordTarget} words
              </Text>
            </View>

            {/* Target Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(analytics.todayProgress * 100, 100)}%` },
                ]}
              />
            </View>
          </TouchableOpacity>
        )}

        {/* Quick Nav Tiles */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={styles.navTile}
            onPress={() => router.push('/library')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Library"
          >
            <Ionicons name="library" size={18} color={Colors.walnut} />
            <Text style={styles.navTileTitle}>Library</Text>
            <Text style={styles.navTileCount}>{stats.activeCount} notes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTile}
            onPress={() => router.push('/archive')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Archive"
          >
            <Ionicons name="archive" size={18} color={Colors.muted} />
            <Text style={styles.navTileTitle}>Archive</Text>
            <Text style={styles.navTileCount}>{stats.archivedCount} stored</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTile}
            onPress={() => router.push('/trash')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Trash"
          >
            <Ionicons name="trash" size={18} color={Colors.muted} />
            <Text style={styles.navTileTitle}>Trash</Text>
            <Text style={styles.navTileCount}>{stats.trashCount}</Text>
          </TouchableOpacity>
        </View>

        {/* Advanced Features Navigation Row */}
        <View style={[styles.navRow, { marginTop: Spacing.xs }]}>
          <TouchableOpacity
            style={styles.navTile}
            onPress={() => router.push(session ? '/timeline' : '/auth')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Memory Timeline"
          >
            <Ionicons name="time-outline" size={18} color={Colors.brass} />
            <Text style={styles.navTileTitle}>Timeline</Text>
            <Text style={styles.navTileCount}>Chronological journal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTile}
            onPress={() => router.push(session ? '/analytics' : '/auth')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Writing Analytics"
          >
            <Ionicons name="flame-outline" size={18} color={Colors.brass} />
            <Text style={styles.navTileTitle}>Analytics</Text>
            <Text style={styles.navTileCount}>Streaks & Word target</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Writings Section */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent writings</Text>
            {recentNotes.length > 0 && session && (
              <TouchableOpacity onPress={() => router.push('/library')}>
                <Text style={styles.viewAllLink}>VIEW ALL →</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Actual Notes List */}
          {recentNotes.length > 0 && session ? (
            recentNotes.map((note) => (
              <Notecard
                key={note.id}
                note={note}
                onPress={() => handleOpenNote(note)}
                onArchive={() => handleArchiveNote(note)}
                onDelete={() => handleDeleteNote(note)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={36} color={Colors.rule} />
              <Text style={styles.emptyTitle}>Your platen is quiet</Text>
              <Text style={styles.emptySubtitle}>
                {session
                  ? "Touch 'Create new note' above to insert your first paper sheet."
                  : 'Please create an account to write and preserve your private thoughts.'}
              </Text>
            </View>
          )}
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
    backgroundColor: Colors.paper,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl + 20,
  },
  accountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(112, 88, 68, 0.08)',
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(112, 88, 68, 0.15)',
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusGuest: {
    backgroundColor: Colors.brass,
  },
  bannerText: {
    fontSize: Typography.sizes.xs,
    color: Colors.walnut,
    fontWeight: Typography.weights.medium,
  },
  editorialHeader: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  dateLabel: {
    fontSize: 11,
    fontFamily: Typography.fontFamilies.mono,
    fontWeight: Typography.weights.bold,
    color: Colors.muted,
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  mainHeadline: {
    fontSize: 32,
    fontWeight: Typography.weights.bold,
    color: Colors.ink,
    letterSpacing: -0.5,
    lineHeight: 38,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamilies.serif,
  },
  subHeadline: {
    fontSize: Typography.sizes.sm,
    color: Colors.muted,
    letterSpacing: 0.2,
  },
  heroCard: {
    backgroundColor: Colors.sheet,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.rule,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  heroCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  deskBadge: {
    backgroundColor: 'rgba(112, 88, 68, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
  },
  deskBadgeText: {
    fontSize: 9,
    fontFamily: Typography.fontFamilies.mono,
    fontWeight: Typography.weights.bold,
    color: Colors.walnut,
    letterSpacing: 1.2,
  },
  heroImageWrapper: {
    width: '100%',
    height: 190,
    borderRadius: Radii.md,
    overflow: 'hidden',
    backgroundColor: '#2D231C',
    marginBottom: Spacing.md,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroCardContent: {
    paddingTop: Spacing.xs,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: Typography.weights.bold,
    color: Colors.ink,
    fontFamily: Typography.fontFamilies.serif,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.muted,
    marginBottom: Spacing.md,
  },
  createNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3E3127',
    paddingVertical: 12,
    borderRadius: Radii.md,
    gap: 8,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  createNoteBtnGuest: {
    backgroundColor: Colors.walnut,
  },
  createNoteBtnText: {
    color: Colors.sheet,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.5,
  },
  streakCard: {
    backgroundColor: Colors.sheet,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.rule,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  streakHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakCountText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.ink,
  },
  streakTargetText: {
    fontSize: 11,
    fontFamily: Typography.fontFamilies.mono,
    color: Colors.muted,
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: 'rgba(112, 88, 68, 0.12)',
    borderRadius: 2.5,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.brass,
    borderRadius: 2.5,
  },
  navRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  navTile: {
    flex: 1,
    backgroundColor: Colors.sheet,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: Radii.md,
    padding: Spacing.sm + 2,
    alignItems: 'center',
  },
  navTileTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.ink,
    marginTop: 4,
  },
  navTileCount: {
    fontSize: 10,
    color: Colors.muted,
    marginTop: 2,
  },
  recentSection: {
    marginTop: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: Typography.weights.bold,
    color: Colors.ink,
    fontFamily: Typography.fontFamilies.serif,
  },
  viewAllLink: {
    fontSize: 11,
    color: Colors.walnut,
    fontFamily: Typography.fontFamilies.mono,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.sheet,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.ink,
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
    lineHeight: 18,
  },
});
