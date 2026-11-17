import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';

interface TypewriterPlatenProps {
  sheetTitle?: string;
  charCount?: number;
  wordCount?: number;
  saveStatus?: 'saved' | 'saving' | 'unsaved' | 'error';
}

export const TypewriterPlaten: React.FC<TypewriterPlatenProps> = ({
  sheetTitle,
  charCount = 0,
  wordCount = 0,
  saveStatus = 'saved',
}) => {
  return (
    <View style={styles.platenAssembly}>
      {/* Heavy Platen Roller Cylinder */}
      <View style={styles.rollerCylinder}>
        {/* Left Carriage Knob */}
        <View style={styles.platenKnobLeft}>
          <View style={styles.knobGroove} />
          <View style={styles.knobGroove} />
        </View>

        {/* Paper Guide Bar with Calibration Scale */}
        <View style={styles.scaleContainer}>
          <View style={styles.scaleTrack}>
            {/* Calibration marks */}
            {[10, 20, 30, 40, 50, 60, 70, 80].map((mark) => (
              <View key={mark} style={styles.scaleMarkWrapper}>
                <View style={styles.scaleTick} />
                <Text style={styles.scaleNumber}>{mark}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Right Carriage Knob */}
        <View style={styles.platenKnobRight}>
          <View style={styles.knobGroove} />
          <View style={styles.knobGroove} />
        </View>
      </View>

      {/* Mechanical Paper Bail Bar holding paper down */}
      <View style={styles.paperBailBar}>
        <View style={styles.paperClampLeft} />
        <View style={styles.statusDisplay}>
          <View
            style={[
              styles.statusLed,
              saveStatus === 'saved' && styles.statusSaved,
              saveStatus === 'saving' && styles.statusSaving,
              saveStatus === 'error' && styles.statusError,
            ]}
          />
          <Text style={styles.statusLabel}>
            {saveStatus === 'saving'
              ? 'COMMITTING TO INK...'
              : saveStatus === 'error'
              ? 'ERROR SAVING'
              : 'DURABLE PERSISTENCE: ON'}
          </Text>
        </View>
        <View style={styles.countDisplay}>
          <Text style={styles.countText}>
            {wordCount} WORDS · {charCount} CHARS
          </Text>
        </View>
        <View style={styles.paperClampRight} />
      </View>
    </View>
  );
};

import { TypewriterSoundEngine, StrikeType } from '../services/typewriterSound';

// Managed authentic vintage typewriter sound invocation
export function playTypewriterSound(type: StrikeType = 'char') {
  TypewriterSoundEngine.playInputSound(type);
}

const styles = StyleSheet.create({
  platenAssembly: {
    backgroundColor: Colors.paperDark,
    borderBottomWidth: 1,
    borderBottomColor: Colors.rule,
    paddingTop: Spacing.xs,
  },
  rollerCylinder: {
    height: 24,
    backgroundColor: '#3F352E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
  },
  platenKnobLeft: {
    width: 14,
    height: 18,
    backgroundColor: '#261F1B',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#54463C',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  platenKnobRight: {
    width: 14,
    height: 18,
    backgroundColor: '#261F1B',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#54463C',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  knobGroove: {
    width: 1,
    height: 12,
    backgroundColor: '#54463C',
  },
  scaleContainer: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  scaleTrack: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  scaleMarkWrapper: {
    alignItems: 'center',
  },
  scaleTick: {
    width: 1,
    height: 4,
    backgroundColor: '#8C7767',
  },
  scaleNumber: {
    fontSize: 8,
    color: '#B5A290',
    fontFamily: Typography.fontFamilies.mono,
    marginTop: 1,
  },
  paperBailBar: {
    height: 22,
    backgroundColor: Colors.sheet,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.rule,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  paperClampLeft: {
    width: 12,
    height: 8,
    backgroundColor: Colors.brass,
    borderRadius: 1,
  },
  paperClampRight: {
    width: 12,
    height: 8,
    backgroundColor: Colors.brass,
    borderRadius: 1,
  },
  statusDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusLed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.muted,
  },
  statusSaved: {
    backgroundColor: Colors.success,
  },
  statusSaving: {
    backgroundColor: Colors.brass,
  },
  statusError: {
    backgroundColor: Colors.danger,
  },
  statusLabel: {
    fontSize: 9,
    fontFamily: Typography.fontFamilies.mono,
    color: Colors.muted,
    letterSpacing: 0.8,
    fontWeight: Typography.weights.semibold,
  },
  countDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countText: {
    fontSize: 10,
    fontFamily: Typography.fontFamilies.mono,
    color: Colors.ink,
    opacity: 0.7,
  },
});
