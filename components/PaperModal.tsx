import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { CuratedPapers, PaperStyle } from '../constants/papers';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface PaperModalProps {
  visible: boolean;
  selectedPaperId: string;
  onSelectPaper: (paper: PaperStyle) => void;
  onSetAsDefault?: (paperId: string) => void;
  onClose: () => void;
}

export const PaperModal: React.FC<PaperModalProps> = ({
  visible,
  selectedPaperId,
  onSelectPaper,
  onSetAsDefault,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>PAPER COLLECTION</Text>
              <Text style={styles.headerSubtitle}>ARCHIVAL TEXTURES & PATTERNS</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close Paper Modal">
              <Ionicons name="close" size={20} color={Colors.ink} />
            </TouchableOpacity>
          </View>

          {/* Paper Grid */}
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionNotice}>
              Select an authentic paper style for this sheet. Each style faithfully sets realistic backgrounds, margins, and line rules.
            </Text>

            <View style={styles.grid}>
              {CuratedPapers.map((paper) => {
                const isSelected = paper.id === selectedPaperId;
                return (
                  <TouchableOpacity
                    key={paper.id}
                    style={[
                      styles.card,
                      { backgroundColor: paper.backgroundColor, borderColor: paper.borderColor },
                      isSelected && styles.cardSelected,
                    ]}
                    onPress={() => {
                      onSelectPaper(paper);
                    }}
                    activeOpacity={0.85}
                  >
                    {/* Paper Pattern Preview */}
                    <View style={[styles.previewArea, { backgroundColor: paper.previewBg }]}>
                      {paper.patternType === 'ruled' && (
                        <View style={styles.ruledContainer}>
                          <View style={[styles.ruledMargin, { backgroundColor: paper.marginColor || '#C86D51' }]} />
                          <View style={styles.ruledLinesContainer}>
                            <View style={[styles.ruledLine, { backgroundColor: paper.ruleColor || '#E6DCB8' }]} />
                            <View style={[styles.ruledLine, { backgroundColor: paper.ruleColor || '#E6DCB8' }]} />
                            <View style={[styles.ruledLine, { backgroundColor: paper.ruleColor || '#E6DCB8' }]} />
                          </View>
                        </View>
                      )}

                      {paper.patternType === 'dotted' && (
                        <View style={styles.dottedContainer}>
                          {[0, 1, 2, 3].map((row) => (
                            <View key={row} style={styles.dotRow}>
                              {[0, 1, 2, 3, 4].map((col) => (
                                <View
                                  key={col}
                                  style={[styles.dot, { backgroundColor: paper.ruleColor || '#D8CCA8' }]}
                                />
                              ))}
                            </View>
                          ))}
                        </View>
                      )}

                      {paper.patternType === 'grid' && (
                        <View style={styles.gridContainer}>
                          <View style={[styles.gridBorderBox, { borderColor: paper.ruleColor || '#E8DEC5' }]}>
                            <View style={[styles.gridInnerLine, { backgroundColor: paper.ruleColor || '#E8DEC5' }]} />
                          </View>
                        </View>
                      )}

                      {paper.patternType === 'none' && (
                        <View style={styles.blankTexture}>
                          <Text style={[styles.textureWatermark, { color: paper.textColor }]}>¶</Text>
                        </View>
                      )}

                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Ionicons name="checkmark" size={12} color="#FFF" />
                        </View>
                      )}
                    </View>

                    {/* Meta info */}
                    <View style={styles.cardInfo}>
                      <Text style={[styles.paperName, { color: paper.textColor }]}>{paper.name}</Text>
                      <Text style={[styles.paperDesc, { color: paper.textColor, opacity: 0.75 }]} numberOfLines={2}>
                        {paper.description}
                      </Text>
                    </View>

                    {isSelected && onSetAsDefault && (
                      <TouchableOpacity
                        style={styles.defaultTag}
                        onPress={(e) => {
                          e.stopPropagation();
                          onSetAsDefault(paper.id);
                        }}
                      >
                        <Text style={styles.defaultTagText}>Set as Default</Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.doneBtnText}>Confirm Selection</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(56, 45, 38, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.sheet,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.rule,
  },
  headerTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.ink,
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.muted,
    marginTop: 2,
    letterSpacing: 0.8,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  sectionNotice: {
    fontSize: Typography.sizes.xs,
    color: Colors.walnut,
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  card: {
    width: '47%',
    borderRadius: Radii.md,
    borderWidth: 1.5,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    position: 'relative',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSelected: {
    borderColor: Colors.brass,
    borderWidth: 2,
  },
  previewArea: {
    height: 70,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: Spacing.xs,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  ruledContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  ruledMargin: {
    width: 2,
    height: '100%',
    marginRight: 6,
  },
  ruledLinesContainer: {
    flex: 1,
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  ruledLine: {
    height: 1,
    width: '100%',
  },
  dottedContainer: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
  },
  dot: {
    width: 2,
    height: 2,
    borderRadius: 1,
  },
  gridContainer: {
    flex: 1,
    padding: 4,
  },
  gridBorderBox: {
    flex: 1,
    borderWidth: 1,
    justifyContent: 'center',
  },
  gridInnerLine: {
    height: 1,
    width: '100%',
  },
  blankTexture: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textureWatermark: {
    fontSize: 22,
    opacity: 0.2,
  },
  selectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.brass,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    marginTop: Spacing.xs,
  },
  paperName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  paperDesc: {
    fontSize: 10,
    marginTop: 2,
    lineHeight: 13,
  },
  defaultTag: {
    marginTop: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(168, 139, 90, 0.15)',
    borderRadius: Radii.sm,
    alignSelf: 'flex-start',
  },
  defaultTagText: {
    fontSize: 9,
    color: Colors.walnut,
    fontWeight: Typography.weights.bold,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
    backgroundColor: Colors.sheet,
  },
  doneBtn: {
    backgroundColor: Colors.walnut,
    borderRadius: Radii.sm,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
  },
  doneBtnText: {
    color: Colors.sheet,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1,
  },
});
