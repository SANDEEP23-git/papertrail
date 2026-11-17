import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';
import { TypewriterSoundEngine } from '../services/typewriterSound';
import { Ionicons } from '@expo/vector-icons';

interface FocusModeModalProps {
  visible: boolean;
  title: string;
  body: string;
  inkColor: string;
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
  wordCount: number;
  onTitleChange: (text: string) => void;
  onBodyChange: (text: string) => void;
  onClose: () => void;
}

export const FocusModeModal: React.FC<FocusModeModalProps> = ({
  visible,
  title,
  body,
  inkColor,
  fontFamily,
  fontSize,
  lineSpacing,
  wordCount,
  onTitleChange,
  onBodyChange,
  onClose,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 600;

  // Pomodoro timer states (in seconds)
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [wordTarget, setWordTarget] = useState(250);
  const [sessionStartWords, setSessionStartWords] = useState(wordCount);

  // Sync starting words
  useEffect(() => {
    if (visible) {
      setSessionStartWords(wordCount);
    }
  }, [visible]);

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            TypewriterSoundEngine.playInputSound('enter'); // Chime bell!
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, secondsRemaining]);

  const toggleTimer = () => {
    setTimerRunning(!timerRunning);
  };

  const resetTimer = (mins: number) => {
    setDurationMinutes(mins);
    setSecondsRemaining(mins * 60);
    setTimerRunning(false);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const sessionWordsWritten = Math.max(0, wordCount - sessionStartWords);
  const progressPercent = Math.min(100, Math.round((sessionWordsWritten / wordTarget) * 100));

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.fullscreen}>
        {/* Responsive Floating HUD Bar (Always fits on mobile & desktop) */}
        <View style={styles.hudBar}>
          {/* Left: Indicator & Title */}
          <View style={styles.hudLeft}>
            <View style={styles.brassIndicator} />
            <Text style={styles.hudTitle}>
              {isMobile ? 'FOCUS' : 'FOCUS WRITING RETREAT'}
            </Text>
          </View>

          {/* Center: Timer & Target */}
          <View style={styles.hudCenter}>
            {/* Pomodoro Timer */}
            <View style={styles.timerBox}>
              <TouchableOpacity onPress={toggleTimer} style={styles.timerBtn} accessibilityLabel="Toggle Timer">
                <Ionicons
                  name={timerRunning ? 'pause' : 'play'}
                  size={12}
                  color={Colors.sheet}
                />
                <Text style={styles.timerText}>{formatTimer(secondsRemaining)}</Text>
              </TouchableOpacity>

              {!isMobile && (
                <TouchableOpacity
                  onPress={() => resetTimer(durationMinutes === 25 ? 45 : 25)}
                  style={styles.durationPill}
                  accessibilityLabel="Switch Timer Duration"
                >
                  <Text style={styles.durationText}>{durationMinutes}m</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Word Target Progress */}
            <View style={styles.targetBox}>
              <Text style={styles.targetText}>
                {sessionWordsWritten}/{wordTarget}w {isMobile ? '' : `(${progressPercent}%)`}
              </Text>
            </View>
          </View>

          {/* Right: Exit Button — ALWAYS VISIBLE, NEVER CUT OFF */}
          <TouchableOpacity
            onPress={onClose}
            style={styles.exitBtn}
            accessibilityLabel="Exit Focus Mode"
            accessibilityRole="button"
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Ionicons name="close-circle" size={16} color={Colors.sheet} />
            <Text style={styles.exitText}>Exit</Text>
          </TouchableOpacity>
        </View>

        {/* Minimal Fullscreen Writing Surface */}
        <View style={styles.writingArea}>
          <TextInput
            style={[
              styles.minimalTitle,
              {
                color: inkColor,
                fontFamily: fontFamily as string,
              },
              Platform.OS === 'web' && ({ outlineStyle: 'none', outlineWidth: 0, borderWidth: 0 } as any),
            ]}
            placeholder="Piece title..."
            placeholderTextColor={Colors.muted}
            value={title}
            onChangeText={onTitleChange}
          />

          <TextInput
            style={[
              styles.minimalBody,
              {
                color: inkColor,
                fontFamily: fontFamily as string,
                fontSize: fontSize + 1,
                lineHeight: (fontSize + 1) * lineSpacing,
              },
              Platform.OS === 'web' && ({ outlineStyle: 'none', outlineWidth: 0, borderWidth: 0 } as any),
            ]}
            placeholder="Focus solely on your words..."
            placeholderTextColor={Colors.muted}
            value={body}
            onChangeText={onBodyChange}
            multiline
            textAlignVertical="top"
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    backgroundColor: '#FAF5ED',
  },
  hudBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#382D26',
    borderBottomWidth: 1,
    borderBottomColor: Colors.rule,
    zIndex: 100,
  },
  hudLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  brassIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.brass,
  },
  hudTitle: {
    fontSize: 10,
    fontFamily: Typography.fontFamilies.mono,
    color: Colors.paper,
    letterSpacing: 1.2,
    fontWeight: Typography.weights.bold,
  },
  hudCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    justifyContent: 'center',
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#524339',
    borderRadius: Radii.sm,
    paddingHorizontal: 7,
    paddingVertical: 4,
    gap: 4,
  },
  timerText: {
    fontSize: 11,
    fontFamily: Typography.fontFamilies.mono,
    color: Colors.sheet,
    fontWeight: Typography.weights.bold,
  },
  durationPill: {
    paddingHorizontal: 5,
    paddingVertical: 4,
    backgroundColor: '#524339',
    borderRadius: Radii.sm,
  },
  durationText: {
    fontSize: 10,
    color: Colors.paper,
    fontFamily: Typography.fontFamilies.mono,
  },
  targetBox: {
    backgroundColor: '#524339',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  targetText: {
    fontSize: 10,
    color: Colors.paper,
    fontFamily: Typography.fontFamilies.mono,
  },
  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.walnut,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: Radii.sm,
    gap: 4,
    flexShrink: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  exitText: {
    fontSize: 11,
    color: Colors.sheet,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.5,
  },
  writingArea: {
    flex: 1,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },
  minimalTitle: {
    fontSize: 22,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.sm,
    borderBottomWidth: 0,
  },
  minimalBody: {
    flex: 1,
    borderBottomWidth: 0,
  },
});
