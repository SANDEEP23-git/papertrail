import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { CuratedInks, CuratedFonts, FontSizes, LineSpacings } from '../constants/typography';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface TypographySettings {
  inkColor: string;
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
}

interface TypographyModalProps {
  visible: boolean;
  initialSettings: TypographySettings;
  defaultSettings: TypographySettings;
  onApply: (settings: TypographySettings) => void;
  onClose: () => void;
}

export const TypographyModal: React.FC<TypographyModalProps> = ({
  visible,
  initialSettings,
  defaultSettings,
  onApply,
  onClose,
}) => {
  const [inkColor, setInkColor] = useState(initialSettings.inkColor || defaultSettings.inkColor);
  const [fontFamily, setFontFamily] = useState(initialSettings.fontFamily || defaultSettings.fontFamily);
  const [fontSize, setFontSize] = useState(initialSettings.fontSize || defaultSettings.fontSize);
  const [lineSpacing, setLineSpacing] = useState(initialSettings.lineSpacing || defaultSettings.lineSpacing);
  const [customHex, setCustomHex] = useState('');

  const handleApply = () => {
    onApply({
      inkColor,
      fontFamily,
      fontSize,
      lineSpacing,
    });
    onClose();
  };

  const handleReset = () => {
    setInkColor(defaultSettings.inkColor);
    setFontFamily(defaultSettings.fontFamily);
    setFontSize(defaultSettings.fontSize);
    setLineSpacing(defaultSettings.lineSpacing);
  };

  const applyCustomHex = () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(customHex.trim())) {
      setInkColor(customHex.trim());
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>INK & TYPOGRAPHY</Text>
              <Text style={styles.modalSub}>Personalize your writing instrument</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollInner}>
            {/* Live Interactive Preview Box */}
            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>LIVE WRITING PREVIEW</Text>
              <Text
                style={[
                  styles.previewText,
                  {
                    color: inkColor,
                    fontFamily: fontFamily as string,
                    fontSize: fontSize,
                    lineHeight: fontSize * lineSpacing,
                  },
                ]}
              >
                The carriage advances smoothly. Every strike of the key presses rich ink into the fibers of the sheet, immortalizing your words.
              </Text>
            </View>

            {/* 1. Curated Inks */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>PERSONAL INK PALETTE</Text>
              <View style={styles.inkGrid}>
                {CuratedInks.map((ink) => {
                  const isSelected = inkColor.toLowerCase() === ink.hex.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={ink.id}
                      style={[
                        styles.inkSwatchTile,
                        isSelected && styles.inkSwatchTileSelected,
                      ]}
                      onPress={() => setInkColor(ink.hex)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.inkDrop, { backgroundColor: ink.hex }]}>
                        {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                      </View>
                      <Text style={styles.inkName} numberOfLines={1}>
                        {ink.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom Hex input */}
              <View style={styles.customHexRow}>
                <Text style={styles.customHexLabel}>Custom Hex:</Text>
                <TextInput
                  style={styles.customHexInput}
                  placeholder="#382D26"
                  placeholderTextColor={Colors.muted}
                  value={customHex}
                  onChangeText={setCustomHex}
                  maxLength={7}
                />
                <TouchableOpacity style={styles.applyHexBtn} onPress={applyCustomHex}>
                  <Text style={styles.applyHexText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. Curated Font Families */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>EDITORIAL FONT STYLES</Text>
              {CuratedFonts.map((font) => {
                const isSelected = fontFamily === font.family;
                return (
                  <TouchableOpacity
                    key={font.id}
                    style={[
                      styles.fontRow,
                      isSelected && styles.fontRowSelected,
                    ]}
                    onPress={() => setFontFamily(font.family)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.fontInfo}>
                      <Text style={[styles.fontTitle, { fontFamily: font.family }]}>
                        {font.name}
                      </Text>
                      <Text
                        style={[styles.fontPreviewSample, { fontFamily: font.family, color: inkColor }]}
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

            {/* 3. Font Size */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>FONT SCALE</Text>
              <View style={styles.pillsRow}>
                {FontSizes.map((sz) => {
                  const isSelected = fontSize === sz.value;
                  return (
                    <TouchableOpacity
                      key={sz.value}
                      style={[styles.pillBtn, isSelected && styles.pillBtnSelected]}
                      onPress={() => setFontSize(sz.value)}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                        {sz.label} ({sz.value}px)
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 4. Line Spacing */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>LINE CADENCE (SPACING)</Text>
              <View style={styles.pillsRow}>
                {LineSpacings.map((sp) => {
                  const isSelected = Math.abs(lineSpacing - sp.value) < 0.05;
                  return (
                    <TouchableOpacity
                      key={sp.value}
                      style={[styles.pillBtn, isSelected && styles.pillBtnSelected]}
                      onPress={() => setLineSpacing(sp.value)}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                        {sp.label} ({sp.value}x)
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Modal Footer Toolbar */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetBtnText}>Reset to Default</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
              <Text style={styles.applyBtnText}>Apply to Sheet</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  modalContent: {
    backgroundColor: Colors.paper,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: Colors.rule,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.rule,
    backgroundColor: Colors.sheet,
  },
  modalTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.ink,
    letterSpacing: 1,
  },
  modalSub: {
    fontSize: Typography.sizes.xs,
    color: Colors.muted,
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  scrollBody: {
    flex: 1,
  },
  scrollInner: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  previewBox: {
    backgroundColor: Colors.sheet,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: Radii.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  previewLabel: {
    fontSize: 9,
    fontFamily: Typography.fontFamilies.mono,
    color: Colors.brass,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  previewText: {
    minHeight: 48,
  },
  section: {
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
  inkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  inkSwatchTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sheet,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inkName: {
    fontSize: 11,
    color: Colors.ink,
    fontWeight: Typography.weights.medium,
  },
  customHexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  customHexLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.muted,
  },
  customHexInput: {
    backgroundColor: Colors.sheet,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    fontSize: Typography.sizes.xs,
    width: 90,
    color: Colors.ink,
  },
  applyHexBtn: {
    backgroundColor: Colors.paperDark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radii.sm,
  },
  applyHexText: {
    fontSize: Typography.sizes.xs,
    color: Colors.ink,
    fontWeight: Typography.weights.medium,
  },
  fontRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.sheet,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: Radii.sm,
    padding: Spacing.sm,
    marginBottom: 6,
  },
  fontRowSelected: {
    borderColor: Colors.walnut,
    borderWidth: 1.5,
  },
  fontInfo: {
    flex: 1,
  },
  fontTitle: {
    fontSize: Typography.sizes.base,
    color: Colors.ink,
    fontWeight: Typography.weights.semibold,
  },
  fontPreviewSample: {
    fontSize: Typography.sizes.xs,
    marginTop: 2,
    opacity: 0.8,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  pillBtn: {
    backgroundColor: Colors.sheet,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
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
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.sheet,
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
  },
  resetBtn: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  resetBtnText: {
    fontSize: Typography.sizes.xs,
    color: Colors.muted,
    fontWeight: Typography.weights.medium,
  },
  applyBtn: {
    backgroundColor: Colors.walnut,
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.sm,
  },
  applyBtnText: {
    fontSize: Typography.sizes.sm,
    color: Colors.sheet,
    fontWeight: Typography.weights.bold,
  },
});
