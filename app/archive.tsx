import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Header } from '../components/Header';
import { Notecard } from '../components/Notecard';
import { NotesRepository, Note } from '../database/notes';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ArchiveScreen() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchArchived = useCallback(async () => {
    try {
      const data = await NotesRepository.listArchivedNotes();
      setNotes(data);
    } catch (err) {
      console.error('Failed to load archive:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchArchived();
    }, [fetchArchived])
  );

  const handleOpenNote = (note: Note) => {
    router.push({
      pathname: '/editor',
      params: { id: note.id },
    });
  };

  const handleRestore = async (note: Note) => {
    await NotesRepository.restoreNote(note.id);
    fetchArchived();
  };

  const handleDelete = async (note: Note) => {
    await NotesRepository.softDeleteNote(note.id);
    fetchArchived();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="ARCHIVE"
        subtitle={`${notes.length} STORED ${notes.length === 1 ? 'PIECE' : 'PIECES'}`}
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
              fetchArchived();
            }}
            tintColor={Colors.walnut}
          />
        }
      >
        <View style={styles.introBox}>
          <Text style={styles.introText}>
            Archived writings are kept safe and preserved without cluttering your active library. You can restore them anytime.
          </Text>
        </View>

        {notes.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <Ionicons name="archive-outline" size={40} color={Colors.muted} />
            <Text style={styles.emptyHeading}>Archive is clean</Text>
            <Text style={styles.emptySub}>
              Writings you archive will be stored here safely out of the daily line of sight.
            </Text>
          </View>
        )}

        {notes.map((note) => (
          <Notecard
            key={note.id}
            note={note}
            onPress={handleOpenNote}
            onRestore={handleRestore}
            onDelete={handleDelete}
            mode="archive"
          />
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
  introBox: {
    backgroundColor: Colors.sheet,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: Radii.sm,
    padding: Spacing.sm + 4,
    marginBottom: Spacing.md,
  },
  introText: {
    fontSize: Typography.sizes.xs,
    color: Colors.muted,
    lineHeight: 18,
  },
  emptyContainer: {
    backgroundColor: Colors.sheet,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: Radii.md,
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  emptyHeading: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.ink,
    marginTop: Spacing.sm,
  },
  emptySub: {
    fontSize: Typography.sizes.sm,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
});
