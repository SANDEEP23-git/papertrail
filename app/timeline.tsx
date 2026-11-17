import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Header } from '../components/Header';
import { Notecard } from '../components/Notecard';
import { NotesRepository, Note } from '../database/notes';
import { AuthService, AuthSession } from '../services/auth';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface TimelineGroup {
  periodKey: string; // "November 2026", "October 2026"
  notes: Note[];
}

export default function TimelineScreen() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [groups, setGroups] = useState<TimelineGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTimeline = useCallback(async () => {
    try {
      const currentSession = await AuthService.getSession();
      setSession(currentSession);
      if (!currentSession) {
        setGroups([]);
        return;
      }

      const active = await NotesRepository.listActiveNotes('updated_at', searchQuery);

      // Group chronologically by Month & Year
      const groupedMap: Record<string, Note[]> = {};
      for (const note of active) {
        const d = new Date(note.updated_at);
        const period = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (!groupedMap[period]) {
          groupedMap[period] = [];
        }
        groupedMap[period].push(note);
      }

      const result: TimelineGroup[] = Object.keys(groupedMap).map((periodKey) => ({
        periodKey,
        notes: groupedMap[periodKey],
      }));

      setGroups(result);
    } catch (err) {
      console.error('Failed to load timeline:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

  useFocusEffect(
    useCallback(() => {
      loadTimeline();
    }, [loadTimeline])
  );

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  const handleOpenNote = (note: Note) => {
    router.push({
      pathname: '/editor',
      params: { id: note.id },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="MEMORY TIMELINE"
        subtitle={session ? 'CHRONOLOGICAL WRITINGS' : 'ACCOUNT REQUIRED'}
        showBack
      />

      {/* Search Filter */}
      {session && (
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={Colors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search memories across time..."
              placeholderTextColor={Colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={Colors.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadTimeline();
            }}
            tintColor={Colors.walnut}
          />
        }
      >
        {!session && !loading && (
          <View style={styles.emptyCard}>
            <Ionicons name="lock-closed" size={32} color={Colors.walnut} />
            <Text style={styles.emptyTitle}>Timeline Is Private</Text>
            <Text style={styles.emptyDesc}>
              Bina account create kare timeline access nahi ki ja sakti.
            </Text>
            <TouchableOpacity style={styles.authBtn} onPress={() => router.push('/auth')}>
              <Text style={styles.authBtnText}>Sign In / Register</Text>
            </TouchableOpacity>
          </View>
        )}

        {session && groups.length === 0 && !loading && (
          <View style={styles.emptyCard}>
            <Ionicons name="time-outline" size={36} color={Colors.muted} />
            <Text style={styles.emptyTitle}>No past memories found</Text>
            <Text style={styles.emptyDesc}>
              As you write and date sheets, your personal historical journey unfolds here.
            </Text>
          </View>
        )}

        {/* Chronological Timeline Groups */}
        {groups.map((grp) => (
          <View key={grp.periodKey} style={styles.periodSection}>
            {/* Timeline Axis Marker */}
            <View style={styles.axisHeader}>
              <View style={styles.axisBadge}>
                <View style={styles.axisDot} />
                <Text style={styles.axisText}>{grp.periodKey.toUpperCase()}</Text>
              </View>
              <View style={styles.axisLine} />
              <Text style={styles.axisCount}>{grp.notes.length} entries</Text>
            </View>

            {/* Notes in this period */}
            <View style={styles.notesList}>
              {grp.notes.map((note) => (
                <Notecard
                  key={note.id}
                  note={note}
                  onPress={handleOpenNote}
                  mode="active"
                />
              ))}
            </View>
          </View>
        ))}
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
  searchSection: {
    backgroundColor: Colors.sheet,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.rule,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm,
    height: 38,
    gap: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.ink,
  },
  periodSection: {
    marginBottom: Spacing.xl,
  },
  axisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  axisBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sheet,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    gap: 6,
  },
  axisDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.brass,
  },
  axisText: {
    fontSize: 10,
    fontFamily: Typography.fontFamilies.mono,
    color: Colors.ink,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1,
  },
  axisLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.rule,
  },
  axisCount: {
    fontSize: 10,
    color: Colors.muted,
    fontFamily: Typography.fontFamilies.mono,
  },
  notesList: {
    paddingLeft: Spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: Colors.rule,
    marginLeft: Spacing.sm,
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
