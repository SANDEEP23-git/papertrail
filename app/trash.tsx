import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Header } from '../components/Header';
import { Notecard } from '../components/Notecard';
import { NotesRepository, Note } from '../database/notes';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function TrashScreen() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrash = useCallback(async () => {
    try {
      const data = await NotesRepository.listTrashNotes();
      setNotes(data);
    } catch (err) {
      console.error('Failed to load trash:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTrash();
    }, [fetchTrash])
  );

  const handleOpenNote = (note: Note) => {
    router.push({
      pathname: '/editor',
      params: { id: note.id },
    });
  };

  const handleRestore = async (note: Note) => {
    await NotesRepository.restoreNote(note.id);
    fetchTrash();
  };

  const handlePermanentDelete = async (note: Note) => {
    const confirmMsg = `Permanently delete "${note.title.trim() || 'Untitled Note'}"? This cannot be undone.`;
    if (Platform.OS === 'web') {
      if (confirm(confirmMsg)) {
        await NotesRepository.permanentlyDeleteNote(note.id);
        fetchTrash();
      }
    } else {
      Alert.alert('Permanently Delete', confirmMsg, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            await NotesRepository.permanentlyDeleteNote(note.id);
            fetchTrash();
          },
        },
      ]);
    }
  };

  const handleEmptyTrash = async () => {
    if (notes.length === 0) return;
    const confirmMsg = 'Empty all notes in trash permanently?';
    if (Platform.OS === 'web') {
      if (confirm(confirmMsg)) {
        await NotesRepository.emptyTrash();
        fetchTrash();
      }
    } else {
      Alert.alert('Empty Trash', confirmMsg, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Empty All',
          style: 'destructive',
          onPress: async () => {
            await NotesRepository.emptyTrash();
            fetchTrash();
          },
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="TRASH"
        subtitle={`${notes.length} DELETED`}
        showBack
        rightAction={
          notes.length > 0
            ? {
                iconName: 'trash-bin-outline',
                label: 'Empty Trash',
                onPress: handleEmptyTrash,
              }
            : undefined
        }
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchTrash();
            }}
            tintColor={Colors.walnut}
          />
        }
      >
        <View style={styles.warningBox}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.danger} />
          <Text style={styles.warningText}>
            Items in the wastebasket can be restored or destroyed permanently.
          </Text>
        </View>

        {notes.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <Ionicons name="trash-outline" size={40} color={Colors.muted} />
            <Text style={styles.emptyHeading}>Wastebasket is empty</Text>
            <Text style={styles.emptySub}>
              Deleted sheets will remain here until you choose to restore them or discard them for good.
            </Text>
          </View>
        )}

        {notes.map((note) => (
          <Notecard
            key={note.id}
            note={note}
            onPress={handleOpenNote}
            onRestore={handleRestore}
            onPermanentDelete={handlePermanentDelete}
            mode="trash"
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
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: '#F0D5D5',
    borderRadius: Radii.sm,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  warningText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.danger,
    lineHeight: 16,
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
