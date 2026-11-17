import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';
import { PaperStyle } from '../constants/papers';
import { Ionicons } from '@expo/vector-icons';
import { TypewriterSoundEngine } from '../services/typewriterSound';

interface RealisticTypewriterProps {
  title: string;
  body: string;
  currentPageIndex: number;
  totalPages: number;
  inkColor: string;
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
  paperStyle: PaperStyle;
  charCount: number;
  wordCount: number;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
  isDarkMode: boolean;
  isSpotlightEnabled: boolean;
  soundEnabled: boolean;
  editable: boolean;
  onTitleChange: (text: string) => void;
  onBodyChange: (text: string) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  onRequireAuth?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Inject global web styles: eliminate focus outlines and disable native scrollbars
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'papertrail-clean-editor';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `
    textarea, input {
      outline: none !important;
      box-shadow: none !important;
      border-color: transparent !important;
      overflow: hidden !important;
      resize: none !important;
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
    }
    textarea:focus, input:focus {
      outline: none !important;
      box-shadow: none !important;
      border-color: transparent !important;
    }
    textarea::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }
  `;
}

interface CaretPosition {
  x: number;
  y: number;
  lineHeight: number;
  lineCount: number;
}

/**
 * Calculates exact horizontal (X) and vertical (Y) caret offset in pixels.
 * Uses exact DOM mirror bounding-box measurement on Web, and word-wrap calculation fallback on Native.
 */
function calculateCaretPosition(
  textBeforeCaret: string,
  availableWidth: number,
  fontSize: number,
  fontFamily: string,
  lineSpacing: number
): CaretPosition {
  const calculatedLineHeight = fontSize * lineSpacing;

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    try {
      let mirror = document.getElementById('papertrail-caret-mirror') as HTMLDivElement;
      if (!mirror) {
        mirror = document.createElement('div');
        mirror.id = 'papertrail-caret-mirror';
        mirror.style.position = 'fixed';
        mirror.style.top = '-99999px';
        mirror.style.left = '-99999px';
        mirror.style.visibility = 'hidden';
        mirror.style.pointerEvents = 'none';
        mirror.style.whiteSpace = 'pre-wrap';
        mirror.style.wordBreak = 'break-word';
        mirror.style.overflowWrap = 'break-word';
        mirror.style.boxSizing = 'border-box';
        document.body.appendChild(mirror);
      }

      const clampedWidth = Math.max(availableWidth, 120);
      mirror.style.width = `${clampedWidth}px`;
      mirror.style.fontFamily = fontFamily;
      mirror.style.fontSize = `${fontSize}px`;
      mirror.style.lineHeight = `${calculatedLineHeight}px`;
      mirror.style.letterSpacing = 'normal';
      mirror.style.padding = '0px';
      mirror.style.margin = '0px';
      mirror.style.border = 'none';

      // Clear previous content
      while (mirror.firstChild) {
        mirror.removeChild(mirror.firstChild);
      }

      // Add text node before caret
      const textNode = document.createTextNode(textBeforeCaret);
      mirror.appendChild(textNode);

      // Add marker element at caret position
      const marker = document.createElement('span');
      marker.textContent = '\u200B'; // Zero-width space
      mirror.appendChild(marker);

      const mirrorRect = mirror.getBoundingClientRect();
      const markerRect = marker.getBoundingClientRect();
      const rawX = markerRect.left - mirrorRect.left;
      const rawY = markerRect.top - mirrorRect.top;

      const x = Math.max(0, Math.min(rawX, clampedWidth));
      const y = Math.max(0, rawY);
      const lineCount = Math.max(1, Math.round(mirrorRect.height / calculatedLineHeight));

      return { x, y, lineHeight: calculatedLineHeight, lineCount };
    } catch (e) {
      // Fallback
    }
  }

  // Cross-platform Word-Wrap Caret Position Fallback
  const charWidth = fontSize * 0.60;
  const clampedWidth = Math.max(availableWidth, 120);
  const maxChars = Math.max(Math.floor(clampedWidth / charWidth), 10);

  const paragraphs = textBeforeCaret.split('\n');
  let totalVisualLines = 0;
  let currentVisualLine = '';

  for (let p = 0; p < paragraphs.length; p++) {
    const paragraph = paragraphs[p];
    if (p > 0) totalVisualLines++;

    if (paragraph.length === 0) {
      currentVisualLine = '';
    } else {
      const words = paragraph.split(' ');
      currentVisualLine = '';
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (word.length >= maxChars) {
          if (currentVisualLine.length > 0) {
            totalVisualLines++;
            currentVisualLine = '';
          }
          let remaining = word;
          while (remaining.length >= maxChars) {
            remaining = remaining.slice(maxChars);
            totalVisualLines++;
          }
          currentVisualLine = remaining;
        } else if (currentVisualLine.length + (currentVisualLine.length > 0 ? 1 : 0) + word.length <= maxChars) {
          currentVisualLine += (currentVisualLine.length > 0 ? ' ' : '') + word;
        } else {
          totalVisualLines++;
          currentVisualLine = word;
        }
      }
    }
  }

  const x = Math.min(currentVisualLine.length * charWidth, clampedWidth);
  const y = totalVisualLines * calculatedLineHeight;
  return { x, y, lineHeight: calculatedLineHeight, lineCount: totalVisualLines + 1 };
}

export const RealisticTypewriter: React.FC<RealisticTypewriterProps> = ({
  title,
  body,
  currentPageIndex,
  totalPages,
  inkColor,
  fontFamily,
  fontSize,
  lineSpacing,
  paperStyle,
  charCount,
  wordCount,
  saveStatus,
  isDarkMode,
  isSpotlightEnabled,
  soundEnabled,
  editable,
  onTitleChange,
  onBodyChange,
  onNextPage,
  onPrevPage,
  onRequireAuth,
}) => {
  // Carriage horizontal (X) movement animation (tracks active letter position)
  const carriageXAnim = useRef(new Animated.Value(0)).current;
  // Lighting stand vertical (Y) movement animation (tracks 1 line below active text)
  const carriageYAnim = useRef(new Animated.Value(100)).current;
  // Mechanical keystroke micro-recoil animation (gives tactile strike feel)
  const platenStrikeAnim = useRef(new Animated.Value(0)).current;
  // Spotlight beam intensity opacity
  const spotlightOpacity = useRef(new Animated.Value(1)).current;

  // Track active input and selection
  const [activeInput, setActiveInput] = useState<'body' | 'title'>('body');
  const [selection, setSelection] = useState<{ start: number; end: number }>({
    start: body.length,
    end: body.length,
  });
  const [availableContentWidth, setAvailableContentWidth] = useState(
    Math.min(SCREEN_WIDTH - 64, 580)
  );
  const [bodyStartY, setBodyStartY] = useState(68);

  const typewriterFont = fontFamily || 'Courier New, "Courier Prime", monospace';

  // Compute active cursor position and smoothly glide carriage (X) and lighting stand (Y)
  useEffect(() => {
    let textBefore = '';
    let targetFontSize = fontSize;
    let targetLineSpacing = lineSpacing;

    let targetX = 0;
    let targetY = bodyStartY + fontSize * lineSpacing + 16;

    if (activeInput === 'title') {
      textBefore = title;
      targetFontSize = Typography.sizes.xl;
      targetLineSpacing = 1.3;
      const pos = calculateCaretPosition(
        textBefore,
        availableContentWidth,
        targetFontSize,
        typewriterFont,
        targetLineSpacing
      );
      targetX = pos.x;
      // When typing title, lighting stand sits cleanly below the title
      targetY = 24 + pos.y + 28 + 14;
    } else {
      // Determine real live caret index:
      // On web, check live DOM activeElement.selectionStart so virtual keyboards on mobile don't get stuck!
      let cursorIdx = body.length;
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const activeEl = document.activeElement;
        if (activeEl instanceof HTMLTextAreaElement || activeEl instanceof HTMLInputElement) {
          if (typeof activeEl.selectionStart === 'number') {
            cursorIdx = activeEl.selectionStart;
          }
        } else if (selection && typeof selection.start === 'number') {
          cursorIdx = selection.start;
        }
      } else if (selection && typeof selection.start === 'number') {
        cursorIdx = selection.start;
      }

      textBefore = body.slice(0, Math.min(cursorIdx, body.length));
      const pos = calculateCaretPosition(
        textBefore,
        availableContentWidth,
        targetFontSize,
        typewriterFont,
        targetLineSpacing
      );
      targetX = pos.x;
      // Lighting stand sits CLEANLY BELOW the active text line with 14px clearance
      targetY = bodyStartY + pos.y + pos.lineHeight + 14;
    }

    // Smooth mechanical carriage glide horizontally (X)
    Animated.spring(carriageXAnim, {
      toValue: targetX,
      friction: 9,
      tension: 90,
      useNativeDriver: true,
    }).start();

    // Smooth mechanical glide vertically (Y) — moving down automatically as lines increase
    Animated.spring(carriageYAnim, {
      toValue: targetY,
      friction: 10,
      tension: 80,
      useNativeDriver: true,
    }).start();

    // Authentic physical mechanical slug strike recoil on platen
    Animated.sequence([
      Animated.timing(platenStrikeAnim, {
        toValue: -1.5,
        duration: 20,
        useNativeDriver: true,
      }),
      Animated.spring(platenStrikeAnim, {
        toValue: 0,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [body, title, activeInput, selection, availableContentWidth, bodyStartY, fontSize, lineSpacing, typewriterFont]);

  // Spotlight pulse on typing
  useEffect(() => {
    if (isSpotlightEnabled && isDarkMode) {
      Animated.sequence([
        Animated.timing(spotlightOpacity, {
          toValue: 0.94,
          duration: 30,
          useNativeDriver: true,
        }),
        Animated.timing(spotlightOpacity, {
          toValue: 1,
          duration: 90,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [body, isSpotlightEnabled, isDarkMode]);

  // Theme colors
  const envBg = isDarkMode ? '#0F0D0C' : Colors.paper;

  // Dynamic colors
  const paperBgColor = isDarkMode ? '#201C19' : (paperStyle.backgroundColor || Colors.sheet);
  const activeTextColor = isDarkMode ? '#F5EFE6' : (inkColor || Colors.ink);
  const paperBorderColor = isDarkMode ? '#332B25' : (paperStyle.borderColor || Colors.rule);
  const dividerColor = isDarkMode ? 'rgba(255, 255, 255, 0.07)' : (paperStyle.ruleColor || Colors.rule);
  const placeholderColor = isDarkMode ? '#6A5F56' : Colors.muted;

  // Detect if current A4 Sheet is full (around 12+ lines or 320+ characters)
  const isSheetNearFull = body.length > 300 || body.split('\n').length >= 12;

  return (
    <View style={[styles.environment, { backgroundColor: envBg }]}>
      {/* Platen Stage: Authentic A4 Paper emerging from physical mechanical carriage */}
      <View style={styles.platenStage}>
        {/* Physical A4 Paper Sheet */}
        <Animated.View
          style={[
            styles.paperSheet,
            {
              backgroundColor: paperBgColor,
              borderColor: paperBorderColor,
              transform: [{ translateY: platenStrikeAnim }],
            },
          ]}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            setAvailableContentWidth(Math.max(w - 40, 120));
          }}
        >
          {/* Top Sheet Header: Archival Sheet Indicator */}
          <View style={styles.sheetTopMeta}>
            <View style={styles.sheetPageBadge}>
              <View style={styles.brassPin} />
              <Text style={[styles.sheetPageBadgeText, isDarkMode && { color: '#B3A18F' }]}>
                A4 SHEET {currentPageIndex + 1} OF {totalPages}
              </Text>
            </View>
            <Text style={[styles.sheetCharCountText, isDarkMode && { color: '#7D7065' }]}>
              {body.length} CHARS ON THIS SHEET
            </Text>
          </View>

          {/* Paper Texture Ruled Lines (if ruled style) */}
          {paperStyle.patternType === 'ruled' && (
            <View style={styles.ruledBackgroundLines} pointerEvents="none">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.ruledLine,
                    { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : (paperStyle.ruleColor || Colors.rule) },
                  ]}
                />
              ))}
            </View>
          )}

          {/* Note Title Input (Rendered on Page 1 or with title) */}
          <TextInput
            style={[
              styles.sheetTitleInput,
              {
                color: activeTextColor,
                fontFamily: typewriterFont,
              },
              Platform.OS === 'web' && ({ outlineStyle: 'none', outlineWidth: 0, borderWidth: 0 } as any),
            ]}
            placeholder={editable ? 'Title of this piece...' : 'Account required to type...'}
            placeholderTextColor={placeholderColor}
            value={title}
            onChangeText={(text) => {
              onTitleChange(text);
              setSelection({ start: text.length, end: text.length });
            }}
            editable={editable}
            onFocus={() => {
              setActiveInput('title');
              if (!editable && onRequireAuth) onRequireAuth();
              else TypewriterSoundEngine.resume();
            }}
            maxLength={100}
            returnKeyType="next"
          />

          <View
            style={[styles.sheetDivider, { backgroundColor: dividerColor }]}
            onLayout={(e) => {
              const y = e.nativeEvent.layout.y + e.nativeEvent.layout.height + 4;
              if (y > 20) setBodyStartY(y);
            }}
          />

          {/* Long-form Typewriter Text Input */}
          <TextInput
            style={[
              styles.sheetBodyInput,
              {
                color: activeTextColor,
                fontFamily: typewriterFont,
                fontSize: fontSize,
                lineHeight: fontSize * lineSpacing,
              },
              Platform.OS === 'web' && ({ outlineStyle: 'none', outlineWidth: 0, borderWidth: 0 } as any),
            ]}
            placeholder={
              editable
                ? `Strike your first key on Sheet ${currentPageIndex + 1}...`
                : 'Please create an account or sign in to begin writing on this typewriter.'
            }
            placeholderTextColor={placeholderColor}
            value={body}
            onChangeText={(text) => {
              onBodyChange(text);
              if (Platform.OS === 'web' && typeof document !== 'undefined') {
                const activeEl = document.activeElement;
                if (activeEl instanceof HTMLTextAreaElement) {
                  const idx = activeEl.selectionStart ?? text.length;
                  setSelection({ start: idx, end: idx });
                  return;
                }
              }
              setSelection({ start: text.length, end: text.length });
            }}
            onSelectionChange={(e) => {
              setSelection(e.nativeEvent.selection);
            }}
            editable={editable}
            onFocus={() => {
              setActiveInput('body');
              if (!editable && onRequireAuth) onRequireAuth();
              else TypewriterSoundEngine.resume();
            }}
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
          />

          {/* 
            DYNAMIC LIGHTING STAND & UPWARD SPOTLIGHT BEAM:
            Positioned cleanly below the active text line with safe clearance.
            As text grows/wraps to new lines, carriageYAnim smoothly glides down automatically!
          */}
          <Animated.View
            style={[
              styles.dynamicLightingStand,
              {
                transform: [{ translateY: carriageYAnim }],
              },
            ]}
            pointerEvents="none"
          >
            {/* 
              Focused Upward Carriage Spotlight Beam:
              Rides directly on the lighting stand and shines UPWARD onto the active typed text line.
            */}
            {isDarkMode && isSpotlightEnabled && (
              <Animated.View
                style={[
                  styles.spotlightCone,
                  {
                    opacity: spotlightOpacity,
                    transform: [{ translateX: carriageXAnim }],
                  },
                ]}
                pointerEvents="none"
              >
                <View
                  style={[
                    styles.spotlightBeam,
                    Platform.OS === 'web'
                      ? ({
                          backgroundImage:
                            'radial-gradient(ellipse 130px 170px at 50% 100%, rgba(255, 235, 185, 0.48) 0%, rgba(255, 222, 155, 0.28) 36%, rgba(255, 210, 130, 0.08) 64%, transparent 80%)',
                        } as any)
                      : styles.nativeSpotlightFallback,
                  ]}
                />
              </Animated.View>
            )}

            {/* Precision Chrome/Steel Rail Rod */}
            <View style={styles.standRailContainer}>
              {/* Knurled Knob Left */}
              <View style={styles.standKnobLeft}>
                <View style={styles.knobGroove} />
                <View style={styles.knobCore} />
              </View>

              {/* Steel Track Bar with Specular Sheen */}
              <View style={styles.standTrackBar}>
                <View style={styles.standTrackGlint} />

                {/* Carriage Follower Slider Head with Upward Lamp and Red Alignment Needle */}
                <Animated.View
                  style={[
                    styles.carriageFollowerHead,
                    {
                      transform: [{ translateX: carriageXAnim }],
                    },
                  ]}
                >
                  {/* 3 Authentic Warm LED Micro-Rivets */}
                  <View style={styles.rivetRow}>
                    <View style={styles.rivetDot} />
                    <View style={[styles.rivetDot, styles.rivetDotActive]} />
                    <View style={styles.rivetDot} />
                  </View>

                  {/* Upward Spotlight Lamp Nozzle */}
                  <View style={styles.lampNozzle}>
                    <View
                      style={[
                        styles.lampCore,
                        { backgroundColor: isSpotlightEnabled && isDarkMode ? '#FFEBB5' : '#3D342D' },
                      ]}
                    />
                  </View>

                  {/* Red Precision Alignment Needle */}
                  <View style={styles.alignmentNeedle} />
                </Animated.View>
              </View>

              {/* Knurled Knob Right */}
              <View style={styles.standKnobRight}>
                <View style={styles.knobGroove} />
                <View style={styles.knobCore} />
              </View>
            </View>
          </Animated.View>

          {/* Prompt when Sheet is near full: One-tap button to roll in Next Sheet */}
          {isSheetNearFull && (
            <TouchableOpacity
              style={[styles.sheetFullCallout, isDarkMode && styles.sheetFullCalloutDark]}
              onPress={onNextPage}
              activeOpacity={0.82}
            >
              <Ionicons name="document-text-outline" size={15} color="#D4AF37" />
              <Text style={[styles.sheetFullCalloutText, isDarkMode && { color: '#E8DCB8' }]}>
                {currentPageIndex < totalPages - 1
                  ? `Sheet ${currentPageIndex + 1} full · Tab here to view Sheet ${currentPageIndex + 2} →`
                  : `Sheet ${currentPageIndex + 1} full · Tab here to roll in Sheet ${currentPageIndex + 2} →`}
              </Text>
            </TouchableOpacity>
          )}

          {/* 
            TYPEWRITER A4 SHEET NAVIGATOR (Perforation Bar):
            Allows seamless flipping between Sheet 1, Sheet 2, etc.
          */}
          <View style={[styles.sheetNavigatorBar, isDarkMode && { borderTopColor: 'rgba(255, 255, 255, 0.08)' }]}>
            {/* Previous Sheet Button */}
            <TouchableOpacity
              style={[styles.pageNavBtn, currentPageIndex === 0 && styles.pageNavBtnDisabled]}
              onPress={onPrevPage}
              disabled={currentPageIndex === 0}
              activeOpacity={0.7}
              accessibilityLabel="Go to Previous A4 Sheet"
            >
              <Ionicons
                name="chevron-back"
                size={14}
                color={currentPageIndex === 0 ? (isDarkMode ? '#4A4037' : '#C4B8A9') : (isDarkMode ? '#F5EFE6' : Colors.ink)}
              />
              <Text
                style={[
                  styles.pageNavBtnText,
                  { color: currentPageIndex === 0 ? (isDarkMode ? '#4A4037' : '#C4B8A9') : (isDarkMode ? '#F5EFE6' : Colors.ink) },
                ]}
              >
                Prev Sheet
              </Text>
            </TouchableOpacity>

            {/* Current Sheet Status Badge */}
            <View style={styles.pageIndicatorPill}>
              <Text style={[styles.pageIndicatorText, isDarkMode && { color: '#B3A18F' }]}>
                SHEET {currentPageIndex + 1} / {totalPages}
              </Text>
            </View>

            {/* Next Sheet Button */}
            <TouchableOpacity
              style={styles.pageNavBtn}
              onPress={onNextPage}
              activeOpacity={0.7}
              accessibilityLabel="Go to Next A4 Sheet"
            >
              <Text style={[styles.pageNavBtnText, { color: isDarkMode ? '#F5EFE6' : Colors.ink }]}>
                {currentPageIndex < totalPages - 1 ? 'Next Sheet' : '+ New Sheet'}
              </Text>
              <Ionicons
                name={currentPageIndex < totalPages - 1 ? 'chevron-forward' : 'add'}
                size={14}
                color={isDarkMode ? '#F5EFE6' : Colors.ink}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  environment: {
    flex: 1,
  },
  platenStage: {
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  paperSheet: {
    width: '100%',
    maxWidth: 580,
    minHeight: 540,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  sheetTopMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  sheetPageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  brassPin: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D4AF37',
  },
  sheetPageBadgeText: {
    fontSize: 9,
    fontFamily: Typography.fontFamilies.mono,
    fontWeight: Typography.weights.bold,
    color: '#8C7D70',
    letterSpacing: 1.2,
  },
  sheetCharCountText: {
    fontSize: 9,
    fontFamily: Typography.fontFamilies.mono,
    color: Colors.muted,
    letterSpacing: 0.8,
  },
  ruledBackgroundLines: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.md,
    zIndex: 0,
  },
  ruledLine: {
    height: 1,
    width: '100%',
  },
  sheetTitleInput: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    paddingVertical: Spacing.xs,
    paddingHorizontal: 0,
    margin: 0,
    borderWidth: 0,
    zIndex: 2,
    letterSpacing: 0.5,
  },
  sheetDivider: {
    height: 1,
    marginVertical: Spacing.xs,
    zIndex: 2,
  },
  sheetBodyInput: {
    minHeight: 380,
    paddingVertical: Spacing.xs,
    paddingHorizontal: 0,
    margin: 0,
    borderWidth: 0,
    textAlignVertical: 'top',
    overflow: 'hidden',
    zIndex: 2,
  },
  /* 
    DYNAMIC LIGHTING STAND:
    Slides vertically right underneath the active typing line with safe clearance
  */
  dynamicLightingStand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    zIndex: 4,
    justifyContent: 'center',
  },
  standRailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 26,
    marginHorizontal: 8,
    backgroundColor: 'rgba(22, 19, 17, 0.92)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38302A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.55,
    shadowRadius: 6,
    elevation: 6,
  },
  standKnobLeft: {
    width: 14,
    height: 20,
    backgroundColor: '#5C5046',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#38302A',
    justifyContent: 'space-between',
    paddingVertical: 2,
    alignItems: 'center',
    marginLeft: 3,
  },
  standKnobRight: {
    width: 14,
    height: 20,
    backgroundColor: '#5C5046',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#38302A',
    justifyContent: 'space-between',
    paddingVertical: 2,
    alignItems: 'center',
    marginRight: 3,
  },
  knobGroove: {
    width: 10,
    height: 2,
    backgroundColor: '#26201B',
    borderRadius: 1,
  },
  knobCore: {
    width: 6,
    height: 7,
    backgroundColor: '#443A32',
    borderRadius: 1,
  },
  standTrackBar: {
    flex: 1,
    height: 9,
    backgroundColor: '#6E6258',
    borderRadius: 3,
    borderTopWidth: 1,
    borderTopColor: '#9C8C7E',
    borderBottomWidth: 1,
    borderBottomColor: '#2B231D',
    position: 'relative',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  standTrackGlint: {
    position: 'absolute',
    top: 1,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  carriageFollowerHead: {
    position: 'absolute',
    left: 2,
    width: 36,
    height: 20,
    backgroundColor: '#2F2621',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#5C4E43',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 4,
  },
  rivetRow: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 1,
  },
  rivetDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#8C7D70',
  },
  rivetDotActive: {
    backgroundColor: '#D4AF37',
  },
  lampNozzle: {
    position: 'absolute',
    top: -5,
    width: 10,
    height: 5,
    backgroundColor: '#4A3D34',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#736152',
  },
  lampCore: {
    width: 4,
    height: 2.5,
    backgroundColor: '#FFEBB5',
    borderRadius: 1,
  },
  alignmentNeedle: {
    position: 'absolute',
    top: -9,
    width: 1.5,
    height: 5,
    backgroundColor: '#C86D51',
  },
  spotlightCone: {
    position: 'absolute',
    bottom: 20,
    left: -100,
    width: 240,
    height: 190,
    zIndex: 3,
  },
  spotlightBeam: {
    width: '100%',
    height: '100%',
    borderRadius: 120,
  },
  nativeSpotlightFallback: {
    backgroundColor: 'rgba(255, 235, 185, 0.22)',
    borderRadius: 90,
  },
  /* Callout when sheet is full */
  sheetFullCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: Radii.sm,
    paddingVertical: 7,
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    zIndex: 3,
  },
  sheetFullCalloutDark: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  sheetFullCalloutText: {
    fontSize: 11,
    fontFamily: Typography.fontFamilies.mono,
    fontWeight: Typography.weights.bold,
    color: Colors.walnut,
  },
  /* A4 Sheet Navigator Bar */
  sheetNavigatorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
    borderStyle: 'dashed',
    marginTop: Spacing.md,
    paddingTop: Spacing.xs,
    zIndex: 2,
  },
  pageNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: Radii.sm,
    gap: 4,
  },
  pageNavBtnDisabled: {
    opacity: 0.35,
  },
  pageNavBtnText: {
    fontSize: 11,
    fontFamily: Typography.fontFamilies.mono,
    fontWeight: Typography.weights.bold,
  },
  pageIndicatorPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  pageIndicatorText: {
    fontSize: 9,
    fontFamily: Typography.fontFamilies.mono,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1,
    color: Colors.muted,
  },
});
