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

export default function LibraryScreen() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated_at' | 'title'>('updated_at');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotes = useCallback(async () => {
    try {
      const currentSession = await AuthService.getSession();
      setSession(currentSession);
      if (!currentSession) {
        setNotes([]);
        return;
      }
      const results = await NotesRepository.listActiveNotes(sortBy, searchQuery);
      setNotes(results);
    } catch (err) {
      console.error('Failed to load library notes:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sortBy, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      fetchNotes();
    }, [fetchNotes])
  );

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleOpenNote = (note: Note) => {
    router.push({
      pathname: '/editor',
      params: { id: note.id },
    });
  };

  const handleArchive = async (note: Note) => {
    await NotesRepository.archiveNote(note.id);
    fetchNotes();
  };

  const handleDelete = async (note: Note) => {
    await NotesRepository.softDeleteNote(note.id);
    fetchNotes();
  };

  const handleNewNote = async () => {
    if (!session) {
      router.push('/auth');
      return;
    }
    const created = await NotesRepository.createNote();
    router.push({
      pathname: '/editor',
      params: { id: created.id },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="LIBRARY"
        subtitle={session ? `${notes.length} ACTIVE ${notes.length === 1 ? 'NOTE' : 'NOTES'}` : 'AUTH REQUIRED'}
        showBack
        rightAction={{
          iconName: session ? 'add-outline' : 'log-in-outline',
          label: session ? 'New Note' : 'Sign In',
          onPress: handleNewNote,
        }}
      />

      {/* Search & Sort Controls (Only active for logged in user) */}
      {session && (
        <View style={styles.filterSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={17} color={Colors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search titles or text..."
              placeholderTextColor={Colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
              accessibilityLabel="Search notes"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={Colors.muted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Sort Pill Buttons */}
          <View style={styles.sortBar}>
            <Text style={styles.sortLabel}>SORT:</Text>
            <TouchableOpacity
              style={[styles.sortPill, sortBy === 'updated_at' && styles.sortPillActive]}
              onPress={() => setSortBy('updated_at')}
            >
              <Text
                style={[
                  styles.sortPillText,
                  sortBy === 'updated_at' && styles.sortPillTextActive,
                ]}
              >
                Recent
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortPill, sortBy === 'title' && styles.sortPillActive]}
              onPress={() => setSortBy('title')}
            >
              <Text
                style={[
                  styles.sortPillText,
                  sortBy === 'title' && styles.sortPillTextActive,
                ]}
              >
                Alphabetical
              </Text>
            </TouchableOpacity>
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
              fetchNotes();
            }}
            tintColor={Colors.walnut}
          />
        }
      >
        {/* Not Signed In State */}
        {!session && !loading && (
          <View style={styles.emptyContainer}>
            <Ionicons name="lock-closed-outline" size={40} color={Colors.walnut} />
            <Text style={styles.emptyHeading}>Personal Library Is Protected</Text>
            <Text style={styles.emptySub}>
              Bina account create kare user koi bhi note nahi likh sakta aur na hi library access kar sakta hai.
            </Text>
            <TouchableOpacity style={styles.newBtn} onPress={() => router.push('/auth')}>
              <Text style={styles.newBtnText}>Sign In / Create Account</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty States for logged in user */}
        {session && notes.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <Ionicons
              name={searchQuery ? 'search-outline' : 'folder-open-outline'}
              size={40}
              color={Colors.muted}
            />
            <Text style={styles.emptyHeading}>
              {searchQuery ? 'No matching marks found' : 'Your Library is Empty'}
            </Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? `No writings match "${searchQuery}". Check your spelling or clear search.`
                : 'Any active sheet you write is preserved here in chronological order.'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity style={styles.newBtn} onPress={handleNewNote}>
                <Text style={styles.newBtnText}>Write a new note</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Note Cards */}
        {notes.map((note) => (
          <Notecard
            key={note.id}
            note={note}
            onPress={handleOpenNote}
            onArchive={handleArchive}
            onDelete={handleDelete}
            mode="active"
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
  filterSection: {
    backgroundColor: Colors.sheet,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.rule,
    gap: Spacing.xs,
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
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingTop: 2,
  },
  sortLabel: {
    fontSize: 9,
    fontFamily: Typography.fontFamilies.mono,
    color: Colors.muted,
    fontWeight: Typography.weights.bold,
  },
  sortPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.rule,
    backgroundColor: Colors.sheet,
  },
  sortPillActive: {
    backgroundColor: Colors.walnut,
    borderColor: Colors.walnut,
  },
  sortPillText: {
    fontSize: 11,
    color: Colors.muted,
    fontWeight: Typography.weights.medium,
  },
  sortPillTextActive: {
    color: Colors.sheet,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  emptyContainer: {
    backgroundColor: Colors.sheet,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: Radii.md,
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.lg,
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
    marginBottom: Spacing.md,
  },
  newBtn: {
    backgroundColor: Colors.walnut,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.sm,
  },
  newBtnText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.sheet,
  },
});
