import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Note } from '../database/notes';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface NotecardProps {
  note: Note;
  onPress: (note: Note) => void;
  onArchive?: (note: Note) => void;
  onDelete?: (note: Note) => void;
  onRestore?: (note: Note) => void;
  onPermanentDelete?: (note: Note) => void;
  mode?: 'active' | 'archive' | 'trash';
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Recent';
  }
}

export const Notecard: React.FC<NotecardProps> = ({
  note,
  onPress,
  onArchive,
  onDelete,
  onRestore,
  onPermanentDelete,
  mode = 'active',
}) => {
  const displayTitle = note.title.trim() ? note.title.trim() : 'Untitled Note';
  const hasCustomTitle = Boolean(note.title.trim());
  const previewBody = note.body.trim()
    ? note.body.trim().replace(/\n+/g, ' ')
    : 'No text written yet.';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(note)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Open note: ${displayTitle}`}
    >
      {/* Paper perforation / margin strip on the left */}
      <View style={styles.marginStrip} />

      <View style={styles.contentContainer}>
        {/* Top row: Date & Word count */}
        <View style={styles.metaRow}>
          <Text style={styles.dateText}>{formatDate(note.updated_at)}</Text>
          <View style={styles.wordBadge}>
            <Text style={styles.wordText}>
              {note.word_count} {note.word_count === 1 ? 'word' : 'words'}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text
          style={[styles.title, !hasCustomTitle && styles.untitledStyle]}
          numberOfLines={1}
        >
          {displayTitle}
        </Text>

        {/* Snippet */}
        <Text style={styles.snippet} numberOfLines={2}>
          {previewBody}
        </Text>

        {/* Bottom divider and action toolbar */}
        <View style={styles.cardFooter}>
          <View style={styles.cardStamp}>
            <View style={styles.stampCircle} />
            <Text style={styles.stampText}>PL-01</Text>
          </View>

          <View style={styles.actionGroup}>
            {mode === 'active' && (
              <>
                {onArchive && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => onArchive(note)}
                    accessibilityLabel="Archive note"
                    accessibilityRole="button"
                  >
                    <Ionicons name="archive-outline" size={17} color={Colors.muted} />
                  </TouchableOpacity>
                )}
                {onDelete && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => onDelete(note)}
                    accessibilityLabel="Move to trash"
                    accessibilityRole="button"
                  >
                    <Ionicons name="trash-outline" size={17} color={Colors.muted} />
                  </TouchableOpacity>
                )}
              </>
            )}

            {mode === 'archive' && (
              <>
                {onRestore && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.restoreBtn]}
                    onPress={() => onRestore(note)}
                    accessibilityLabel="Restore note to active library"
                    accessibilityRole="button"
                  >
                    <Ionicons name="arrow-undo-outline" size={16} color={Colors.walnut} />
                    <Text style={styles.restoreBtnText}>Restore</Text>
                  </TouchableOpacity>
                )}
                {onDelete && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => onDelete(note)}
                    accessibilityLabel="Move note to trash"
                    accessibilityRole="button"
                  >
                    <Ionicons name="trash-outline" size={17} color={Colors.danger} />
                  </TouchableOpacity>
                )}
              </>
            )}

            {mode === 'trash' && (
              <>
                {onRestore && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.restoreBtn]}
                    onPress={() => onRestore(note)}
                    accessibilityLabel="Restore note"
                    accessibilityRole="button"
                  >
                    <Ionicons name="arrow-undo-outline" size={16} color={Colors.walnut} />
                    <Text style={styles.restoreBtnText}>Restore</Text>
                  </TouchableOpacity>
                )}
                {onPermanentDelete && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.dangerBtn]}
                    onPress={() => onPermanentDelete(note)}
                    accessibilityLabel="Permanently delete note"
                    accessibilityRole="button"
                  >
                    <Ionicons name="close-circle-outline" size={16} color={Colors.danger} />
                    <Text style={styles.dangerBtnText}>Delete</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.sheet,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.rule,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  marginStrip: {
    width: 6,
    backgroundColor: Colors.paperDark,
    borderRightWidth: 1,
    borderRightColor: Colors.rule,
  },
  contentContainer: {
    flex: 1,
    padding: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  dateText: {
    fontSize: Typography.sizes.xs,
    color: Colors.muted,
    fontWeight: Typography.weights.medium,
  },
  wordBadge: {
    backgroundColor: Colors.paper,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: Radii.xs,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  wordText: {
    fontSize: 10,
    color: Colors.muted,
    fontWeight: Typography.weights.medium,
  },
  title: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.ink,
    marginBottom: Spacing.xs,
    letterSpacing: 0.2,
  },
  untitledStyle: {
    fontStyle: 'italic',
    color: Colors.muted,
    fontWeight: Typography.weights.regular,
  },
  snippet: {
    fontSize: Typography.sizes.sm,
    color: Colors.ink,
    opacity: 0.8,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
    paddingTop: Spacing.xs + 4,
    marginTop: Spacing.xs,
  },
  cardStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stampCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.brass,
  },
  stampText: {
    fontSize: 9,
    color: Colors.muted,
    fontWeight: Typography.weights.semibold,
    letterSpacing: 1,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionBtn: {
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.rule,
    gap: 4,
  },
  restoreBtnText: {
    fontSize: 11,
    color: Colors.walnut,
    fontWeight: Typography.weights.semibold,
  },
  dangerBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: '#E8C5C5',
    gap: 4,
  },
  dangerBtnText: {
    fontSize: 11,
    color: Colors.danger,
    fontWeight: Typography.weights.semibold,
  },
});
