import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Share,
  AppState,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';
import { CuratedPapers, PaperStyle } from '../constants/papers';
import {
  NotesRepository,
  Note,
  VoiceAttachment,
  AppSettings,
  DEFAULT_SETTINGS,
} from '../database/notes';
import { AuthService, AuthSession } from '../services/auth';
import { TypewriterSoundEngine } from '../services/typewriterSound';
import { Header } from '../components/Header';
import { RealisticTypewriter } from '../components/RealisticTypewriter';
import { TypographyModal } from '../components/TypographyModal';
import { PaperModal } from '../components/PaperModal';
import { FocusModeModal } from '../components/FocusModeModal';
import { SketchPadModal } from '../components/SketchPadModal';
import { VoiceNoteRecorder } from '../components/VoiceNoteRecorder';
import { PdfExportService } from '../services/pdfExport';
import { Ionicons } from '@expo/vector-icons';

function calculateWordCount(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function EditorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const noteId = id && id !== 'new' ? id : undefined;

  // Session & Auth
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Note Core State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // A4 Multi-Sheet Pagination States
  const [pages, setPages] = useState<string[]>(['']);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  // Typography & Ink customization states
  const [inkColor, setInkColor] = useState<string>(DEFAULT_SETTINGS.defaultInkColor);
  const [fontFamily, setFontFamily] = useState<string>(DEFAULT_SETTINGS.defaultFontFamily);
  const [fontSize, setFontSize] = useState<number>(DEFAULT_SETTINGS.defaultFontSize);
  const [lineSpacing, setLineSpacing] = useState<number>(DEFAULT_SETTINGS.defaultLineSpacing);
  const [defaultSettings, setDefaultSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Immersive Typewriter & Lighting Modes
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSpotlightEnabled, setIsSpotlightEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Advanced Feature States
  const [paperStyleId, setPaperStyleId] = useState<string>(DEFAULT_SETTINGS.defaultPaperStyle);
  const [drawingAttachment, setDrawingAttachment] = useState<string | undefined>(undefined);
  const [voiceAttachment, setVoiceAttachment] = useState<VoiceAttachment | undefined>(undefined);
  const [isLocked, setIsLocked] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagBar, setShowTagBar] = useState(false);

  // Modals Visibility
  const [showTypographyModal, setShowTypographyModal] = useState(false);
  const [showPaperModal, setShowPaperModal] = useState(false);
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [showSketchModal, setShowSketchModal] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  // References to keep track of latest values for debounce and unmount flushing
  const titleRef = useRef(title);
  const bodyRef = useRef(body);
  const inkColorRef = useRef(inkColor);
  const fontFamilyRef = useRef(fontFamily);
  const fontSizeRef = useRef(fontSize);
  const lineSpacingRef = useRef(lineSpacing);
  const paperStyleIdRef = useRef(paperStyleId);
  const drawingAttachmentRef = useRef(drawingAttachment);
  const voiceAttachmentRef = useRef(voiceAttachment);
  const isLockedRef = useRef(isLocked);
  const isFavoriteRef = useRef(isFavorite);
  const tagsRef = useRef(tags);

  const activeIdRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDirtyRef = useRef(false);

  // Current Paper Theme
  const currentPaper = CuratedPapers.find((p) => p.id === paperStyleId) || CuratedPapers[0];

  // Active sheet content
  const currentPageBody = pages[currentPageIndex] ?? '';

  // Aggregate word count & char count across all A4 sheets
  const totalCharCount = pages.reduce((sum, p) => sum + p.length, 0);
  const totalWordCount = pages.reduce((sum, p) => sum + calculateWordCount(p), 0);

  // Keep refs in sync
  useEffect(() => {
    titleRef.current = title;
    bodyRef.current = body;
    inkColorRef.current = inkColor;
    fontFamilyRef.current = fontFamily;
    fontSizeRef.current = fontSize;
    lineSpacingRef.current = lineSpacing;
    paperStyleIdRef.current = paperStyleId;
    drawingAttachmentRef.current = drawingAttachment;
    voiceAttachmentRef.current = voiceAttachment;
    isLockedRef.current = isLocked;
    isFavoriteRef.current = isFavorite;
    tagsRef.current = tags;
    setWordCount(totalWordCount);
    setCharCount(totalCharCount);
  }, [
    title,
    body,
    pages,
    inkColor,
    fontFamily,
    fontSize,
    lineSpacing,
    paperStyleId,
    drawingAttachment,
    voiceAttachment,
    isLocked,
    isFavorite,
    tags,
    totalCharCount,
    totalWordCount,
  ]);

  // Auth gate check
  useEffect(() => {
    AuthService.getSession().then((currentSession) => {
      setSession(currentSession);
      setAuthChecked(true);
      if (!currentSession) {
        TypewriterSoundEngine.pause();
      }
    });
  }, []);

  // Load sound and haptic settings and configure sound engine
  useEffect(() => {
    NotesRepository.getSettings().then((s) => {
      setDefaultSettings(s);
      setSoundEnabled(s.typingSounds);
      TypewriterSoundEngine.setEnabled(s.typingSounds);
      TypewriterSoundEngine.setVolume(s.soundVolume ?? 0.7);
      TypewriterSoundEngine.setHapticsEnabled(s.hapticFeedback);
      TypewriterSoundEngine.resume();
    });

    const sub = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        TypewriterSoundEngine.pause();
      } else if (nextAppState === 'active') {
        TypewriterSoundEngine.resume();
      }
    });

    return () => {
      sub.remove();
      TypewriterSoundEngine.pause();
    };
  }, []);

  // Initialize or fetch note
  useEffect(() => {
    let isMounted = true;

    async function initNote() {
      try {
        const currentSession = await AuthService.getSession();
        if (!currentSession) {
          setLoaded(true);
          return;
        }

        const userSettings = await NotesRepository.getSettings();

        if (noteId) {
          const existing = await NotesRepository.getNoteById(noteId);
          if (existing && isMounted) {
            activeIdRef.current = existing.id;
            setTitle(existing.title);
            setBody(existing.body);

            // Load multi-sheet pages
            const splitPages = (existing.body || '').split('\f');
            setPages(splitPages.length > 0 ? splitPages : ['']);
            setCurrentPageIndex(0);

            setInkColor(existing.inkColor || userSettings.defaultInkColor);
            setFontFamily(existing.fontFamily || userSettings.defaultFontFamily);
            setFontSize(existing.fontSize || userSettings.defaultFontSize);
            setLineSpacing(existing.lineSpacing || userSettings.defaultLineSpacing);
            setPaperStyleId(existing.paper_style || userSettings.defaultPaperStyle || 'blank');
            setDrawingAttachment(existing.drawing_attachment);
            setVoiceAttachment(existing.voice_attachment);
            setIsLocked(Boolean(existing.is_locked));
            setIsFavorite(Boolean(existing.is_favorite));
            setTags(existing.tags || []);
            setWordCount(existing.word_count);
            setCharCount(existing.body.length);
            setLoaded(true);
            return;
          }
        }

        // If no ID or note not found, create new note for authenticated user
        const created = await NotesRepository.createNote({
          inkColor: userSettings.defaultInkColor,
          fontFamily: userSettings.defaultFontFamily,
          fontSize: userSettings.defaultFontSize,
          lineSpacing: userSettings.defaultLineSpacing,
          paper_style: userSettings.defaultPaperStyle || 'blank',
        });

        if (isMounted) {
          activeIdRef.current = created.id;
          setTitle(created.title);
          setBody(created.body);
          setPages(['']);
          setCurrentPageIndex(0);
          setInkColor(created.inkColor || userSettings.defaultInkColor);
          setFontFamily(created.fontFamily || userSettings.defaultFontFamily);
          setFontSize(created.fontSize || userSettings.defaultFontSize);
          setLineSpacing(created.lineSpacing || userSettings.defaultLineSpacing);
          setPaperStyleId(created.paper_style || userSettings.defaultPaperStyle || 'blank');
          setDrawingAttachment(created.drawing_attachment);
          setVoiceAttachment(created.voice_attachment);
          setIsLocked(Boolean(created.is_locked));
          setIsFavorite(Boolean(created.is_favorite));
          setTags(created.tags || []);
          setWordCount(created.word_count);
          setCharCount(created.body.length);
          setLoaded(true);
        }
      } catch (err) {
        console.error('Error initializing note:', err);
        if (isMounted) setLoaded(true);
      }
    }

    initNote();

    return () => {
      isMounted = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (isDirtyRef.current && activeIdRef.current) {
        NotesRepository.updateNote(activeIdRef.current, {
          title: titleRef.current,
          body: bodyRef.current,
          inkColor: inkColorRef.current,
          fontFamily: fontFamilyRef.current,
          fontSize: fontSizeRef.current,
          lineSpacing: lineSpacingRef.current,
          paper_style: paperStyleIdRef.current,
          drawing_attachment: drawingAttachmentRef.current,
          voice_attachment: voiceAttachmentRef.current,
          is_locked: isLockedRef.current,
          is_favorite: isFavoriteRef.current,
          tags: tagsRef.current,
        }).catch((err) => console.error('Unmount save failed:', err));
      }
    };
  }, [noteId]);

  // Commit save to local database
  const commitSave = useCallback(async () => {
    if (!activeIdRef.current || !session) return;
    try {
      setSaveStatus('saving');
      await NotesRepository.updateNote(activeIdRef.current, {
        title: titleRef.current,
        body: bodyRef.current,
        inkColor: inkColorRef.current,
        fontFamily: fontFamilyRef.current,
        fontSize: fontSizeRef.current,
        lineSpacing: lineSpacingRef.current,
        paper_style: paperStyleIdRef.current,
        drawing_attachment: drawingAttachmentRef.current,
        voice_attachment: voiceAttachmentRef.current,
        is_locked: isLockedRef.current,
        is_favorite: isFavoriteRef.current,
        tags: tagsRef.current,
      });
      isDirtyRef.current = false;
      setSaveStatus('saved');
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('error');
    }
  }, [session]);

  // Debounced autosave
  const scheduleAutosave = useCallback(() => {
    if (!session) return;
    isDirtyRef.current = true;
    setSaveStatus('unsaved');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      commitSave();
    }, 600);
  }, [commitSave, session]);

  const handleSoundFeedback = (newText: string, prevText: string) => {
    if (!session || !soundEnabled) return;
    const diff = newText.length - prevText.length;
    if (diff === 1) {
      let insertedChar = '';
      for (let i = 0; i < newText.length; i++) {
        if (newText[i] !== prevText[i]) {
          insertedChar = newText[i];
          break;
        }
      }
      if (!insertedChar) insertedChar = newText[newText.length - 1];

      if (insertedChar === '\n') {
        TypewriterSoundEngine.playInputSound('enter');
      } else if (insertedChar === ' ') {
        TypewriterSoundEngine.playInputSound('space');
      } else {
        TypewriterSoundEngine.playInputSound('char');
      }
    } else if (diff === -1) {
      TypewriterSoundEngine.playInputSound('backspace');
    }
  };

  const handleTitleChange = (text: string) => {
    if (!session) {
      router.push('/auth');
      return;
    }
    handleSoundFeedback(text, title);
    setTitle(text);
    scheduleAutosave();
  };

  // Change text on active A4 Sheet
  const handlePageBodyChange = (newText: string) => {
    if (!session) {
      router.push('/auth');
      return;
    }
    handleSoundFeedback(newText, currentPageBody);
    const updatedPages = [...pages];
    updatedPages[currentPageIndex] = newText;
    setPages(updatedPages);
    const combinedBody = updatedPages.join('\f');
    setBody(combinedBody);
    scheduleAutosave();
  };

  // Roll in next A4 sheet (or create a fresh one if on last sheet)
  const handleNextPage = () => {
    TypewriterSoundEngine.playInputSound('enter'); // Mechanical paper feed sound
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    } else {
      const updatedPages = [...pages, ''];
      setPages(updatedPages);
      setCurrentPageIndex(updatedPages.length - 1);
      const combinedBody = updatedPages.join('\f');
      setBody(combinedBody);
      scheduleAutosave();
    }
  };

  // Roll back to previous A4 sheet to review or edit
  const handlePrevPage = () => {
    TypewriterSoundEngine.playInputSound('enter'); // Mechanical platen roll sound
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const handleBack = () => {
    try {
      TypewriterSoundEngine.pause();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (isDirtyRef.current && activeIdRef.current) {
        NotesRepository.updateNote(activeIdRef.current, {
          title: titleRef.current,
          body: bodyRef.current,
          inkColor: inkColorRef.current,
          fontFamily: fontFamilyRef.current,
          fontSize: fontSizeRef.current,
          lineSpacing: lineSpacingRef.current,
          paper_style: paperStyleIdRef.current,
          drawing_attachment: drawingAttachmentRef.current,
          voice_attachment: voiceAttachmentRef.current,
          is_locked: isLockedRef.current,
          is_favorite: isFavoriteRef.current,
          tags: tagsRef.current,
        }).catch(() => {});
      }
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    } catch {
      router.replace('/');
    }
  };

  const handlePrintPdf = () => {
    if (!session) return;
    const currentNote: Note = {
      id: activeIdRef.current || 'temp',
      user_id: session.userId,
      title: titleRef.current,
      body: bodyRef.current,
      paper_style: paperStyleIdRef.current,
      inkColor: inkColorRef.current,
      fontFamily: fontFamilyRef.current,
      fontSize: fontSizeRef.current,
      lineSpacing: lineSpacingRef.current,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      archived_at: null,
      deleted_at: null,
      word_count: totalWordCount,
    };
    PdfExportService.exportNote(currentNote, session.name);
  };

  const handleDelete = async () => {
    if (!activeIdRef.current) return;
    const confirmMessage = 'Move this note to trash?';
    if (Platform.OS === 'web') {
      if (confirm(confirmMessage)) {
        await NotesRepository.softDeleteNote(activeIdRef.current);
        router.back();
      }
    } else {
      Alert.alert('Move to Trash', confirmMessage, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Trash',
          style: 'destructive',
          onPress: async () => {
            await NotesRepository.softDeleteNote(activeIdRef.current!);
            router.back();
          },
        },
      ]);
    }
  };

  const handleToggleFavorite = async () => {
    if (!activeIdRef.current) return;
    const updated = !isFavorite;
    setIsFavorite(updated);
    await NotesRepository.toggleFavorite(activeIdRef.current);
  };

  const handleApplyTypography = (newSettings: {
    inkColor: string;
    fontFamily: string;
    fontSize: number;
    lineSpacing: number;
  }) => {
    setInkColor(newSettings.inkColor);
    setFontFamily(newSettings.fontFamily);
    setFontSize(newSettings.fontSize);
    setLineSpacing(newSettings.lineSpacing);
    scheduleAutosave();
  };

  const handleSelectPaper = (paper: PaperStyle) => {
    setPaperStyleId(paper.id);
    scheduleAutosave();
  };

  const handleSetDefaultPaper = async (paperId: string) => {
    await NotesRepository.updateSettings({ defaultPaperStyle: paperId });
    Alert.alert('Paper Default', 'Set as default paper style for future notes.');
  };

  const handleSaveSketch = (dataUri: string) => {
    setDrawingAttachment(dataUri);
    setShowSketchModal(false);
    scheduleAutosave();
  };

  const handleSaveVoice = (att: VoiceAttachment | undefined) => {
    setVoiceAttachment(att);
    scheduleAutosave();
  };

  const handleToggleSound = () => {
    const updated = !soundEnabled;
    setSoundEnabled(updated);
    TypewriterSoundEngine.setEnabled(updated);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? '#100E0D' : Colors.paper }]}>
      {/* Editorial Header */}
      <Header
        title={title.trim() ? title.trim().toUpperCase() : 'UNTITLED SHEET'}
        subtitle={
          !session
            ? '🔒 ACCOUNT REQUIRED TO TYPE'
            : `${totalCharCount} / 3,000 CHARS · ${totalWordCount} WORDS · SHEET ${currentPageIndex + 1}/${pages.length}`
        }
        isDarkMode={isDarkMode}
        showBack
        onBack={handleBack}
        secondaryAction={
          session
            ? {
                iconName: isDarkMode ? 'sunny-outline' : 'moon-outline',
                label: isDarkMode ? 'Day Paper' : 'Dark Room',
                onPress: () => setIsDarkMode(!isDarkMode),
              }
            : undefined
        }
        rightAction={
          session
            ? {
                iconName: isFavorite ? 'star' : 'star-outline',
                label: isFavorite ? 'Favorited' : 'Favorite',
                onPress: handleToggleFavorite,
              }
            : undefined
        }
      />

      {/* Modals */}
      {session && (
        <>
          {/* Typography Modal */}
          <TypographyModal
            visible={showTypographyModal}
            initialSettings={{
              inkColor,
              fontFamily,
              fontSize,
              lineSpacing,
            }}
            defaultSettings={{
              inkColor: defaultSettings.defaultInkColor,
              fontFamily: defaultSettings.defaultFontFamily,
              fontSize: defaultSettings.defaultFontSize,
              lineSpacing: defaultSettings.defaultLineSpacing,
            }}
            onApply={handleApplyTypography}
            onClose={() => setShowTypographyModal(false)}
          />

          {/* Paper Collection Modal */}
          <PaperModal
            visible={showPaperModal}
            selectedPaperId={paperStyleId}
            onSelectPaper={handleSelectPaper}
            onSetAsDefault={handleSetDefaultPaper}
            onClose={() => setShowPaperModal(false)}
          />

          {/* Focus Mode Modal */}
          <FocusModeModal
            visible={showFocusModal}
            title={title}
            body={currentPageBody}
            inkColor={inkColor}
            fontFamily={fontFamily}
            fontSize={fontSize}
            lineSpacing={lineSpacing}
            wordCount={totalWordCount}
            onTitleChange={handleTitleChange}
            onBodyChange={handlePageBodyChange}
            onClose={() => setShowFocusModal(false)}
          />

          {/* Handwriting & Sketch Pad Modal */}
          <SketchPadModal
            visible={showSketchModal}
            initialDrawing={drawingAttachment}
            defaultInkColor={inkColor}
            onSave={handleSaveSketch}
            onClose={() => setShowSketchModal(false)}
          />
        </>
      )}

      {/* STRICT AUTHENTICATION LOCK OVERLAY: When not signed in */}
      {authChecked && !session && (
        <View style={styles.lockOverlay}>
          <View style={styles.lockIconBox}>
            <Ionicons name="lock-closed" size={28} color={Colors.sheet} />
          </View>
          <Text style={styles.lockTitle}>PLATEN LOCKED — ACCOUNT REQUIRED</Text>
          <Text style={styles.lockDesc}>
            Bina account banaye aap kuch bhi type nahi kar sakte. Har thought ek verified account se juda hona zaroori hai taaki aapka writing 100% private aur safe rahe.
          </Text>
          <TouchableOpacity
            style={styles.unlockBtn}
            onPress={() => router.push('/auth')}
            activeOpacity={0.88}
          >
            <Ionicons name="log-in-outline" size={18} color={Colors.sheet} />
            <Text style={styles.unlockBtnText}>Create Account / Sign In to Type</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Interactive Typewriter Writing Stage with Pinned Bottom Navbar */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Active A4 Typewriter Sheet */}
          <RealisticTypewriter
            title={title}
            body={currentPageBody}
            currentPageIndex={currentPageIndex}
            totalPages={pages.length}
            inkColor={inkColor}
            fontFamily={fontFamily}
            fontSize={fontSize}
            lineSpacing={lineSpacing}
            paperStyle={currentPaper}
            charCount={currentPageBody.length}
            wordCount={calculateWordCount(currentPageBody)}
            saveStatus={!session ? 'error' : saveStatus}
            isDarkMode={isDarkMode}
            isSpotlightEnabled={isSpotlightEnabled}
            soundEnabled={soundEnabled}
            editable={Boolean(session)}
            onTitleChange={handleTitleChange}
            onBodyChange={handlePageBodyChange}
            onNextPage={handleNextPage}
            onPrevPage={handlePrevPage}
            onRequireAuth={() => router.push('/auth')}
          />

          {/* Voice Memo Player (if present) */}
          {session && voiceAttachment && (
            <View style={styles.extraSection}>
              <VoiceNoteRecorder
                attachment={voiceAttachment}
                onSaveAttachment={handleSaveVoice}
              />
            </View>
          )}

          {/* Sketch Attachment (if present) */}
          {session && drawingAttachment && (
            <View style={styles.extraSection}>
              <View style={styles.sketchContainer}>
                <View style={styles.sketchHeader}>
                  <Text style={styles.sketchHeaderTitle}>HANDWRITTEN SKETCH ATTACHMENT</Text>
                  <TouchableOpacity onPress={() => setShowSketchModal(true)}>
                    <Text style={styles.sketchActionText}>Edit</Text>
                  </TouchableOpacity>
                </View>
                <Image
                  source={{ uri: drawingAttachment }}
                  style={styles.sketchImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* 
          PINNED BOTTOM FLOATING DOCK NAVBAR:
          Pinned to the very bottom of the screen (eliminating the bottom dead gap completely)
        */}
        <View style={styles.dockPinnedWrapper} pointerEvents="box-none">
          <View style={[styles.translucentFloatingDock, isDarkMode && styles.floatingDockDark]}>
            <TouchableOpacity
              style={styles.dockBtn}
              onPress={() => setIsDarkMode(!isDarkMode)}
              accessibilityLabel="Toggle Day/Dark Paper Room"
            >
              <Ionicons
                name={isDarkMode ? 'sunny-outline' : 'moon-outline'}
                size={19}
                color={isDarkMode ? '#F5EFE6' : Colors.ink}
              />
            </TouchableOpacity>

            {isDarkMode && (
              <TouchableOpacity
                style={styles.dockBtn}
                onPress={() => setIsSpotlightEnabled(!isSpotlightEnabled)}
                accessibilityLabel="Toggle Carriage Spotlight"
              >
                <Ionicons
                  name={isSpotlightEnabled ? 'bulb' : 'bulb-outline'}
                  size={19}
                  color={isSpotlightEnabled ? '#E5C07B' : '#7D7065'}
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.dockBtn}
              onPress={handleToggleSound}
              accessibilityLabel="Toggle Typewriter Sound"
            >
              <Ionicons
                name={soundEnabled ? 'volume-high' : 'volume-mute-outline'}
                size={19}
                color={soundEnabled ? '#E5C07B' : isDarkMode ? '#7D7065' : Colors.muted}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dockBtn}
              onPress={() => setShowPaperModal(true)}
              accessibilityLabel="Paper Collection & Textures"
            >
              <Ionicons
                name="layers-outline"
                size={19}
                color={isDarkMode ? '#F5EFE6' : Colors.ink}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dockBtn}
              onPress={() => setShowTypographyModal(true)}
              accessibilityLabel="Ink Color & Fonts"
            >
              <Ionicons
                name="color-palette-outline"
                size={19}
                color={isDarkMode ? '#F5EFE6' : Colors.ink}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dockBtn}
              onPress={() => setShowFocusModal(true)}
              accessibilityLabel="Distraction-Free Focus Mode"
            >
              <Ionicons
                name="scan-outline"
                size={19}
                color={isDarkMode ? '#F5EFE6' : Colors.ink}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dockBtn}
              onPress={handlePrintPdf}
              accessibilityLabel="Print Note or PDF Export"
            >
              <Ionicons
                name="share-outline"
                size={19}
                color={isDarkMode ? '#F5EFE6' : Colors.ink}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dockBtn}
              onPress={handleDelete}
              accessibilityLabel="Move to Trash"
            >
              <Ionicons name="trash-outline" size={19} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
    position: 'relative',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    // Generous bottom padding so the paper sheet scrolls freely behind the pinned dock
    paddingBottom: 95,
  },
  /* 
    PINNED BOTTOM FLOATING DOCK:
    Docked cleanly at the bottom edge with no awkward black space
  */
  dockPinnedWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 14 : 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
    pointerEvents: 'box-none',
  },
  translucentFloatingDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(251, 247, 239, 0.94)',
    alignSelf: 'center',
    width: '92%',
    maxWidth: 520,
    paddingVertical: 9,
    paddingHorizontal: Spacing.sm,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: Colors.rule,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  floatingDockDark: {
    backgroundColor: 'rgba(26, 22, 20, 0.92)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dockBtn: {
    padding: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockOverlay: {
    position: 'absolute',
    top: 70,
    left: Spacing.lg,
    right: Spacing.lg,
    bottom: Spacing.lg,
    backgroundColor: 'rgba(251, 247, 239, 0.96)',
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    borderWidth: 1.5,
    borderColor: Colors.brass,
    zIndex: 999,
  },
  lockIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.walnut,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  lockTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.ink,
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  lockDesc: {
    fontSize: Typography.sizes.sm,
    color: Colors.walnut,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
    maxWidth: 440,
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.walnut,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.sm,
    gap: Spacing.xs,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unlockBtnText: {
    color: Colors.sheet,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.6,
  },
  extraSection: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  sketchContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.rule,
    padding: Spacing.sm,
  },
  sketchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.rule,
  },
  sketchHeaderTitle: {
    fontSize: 10,
    fontFamily: Typography.fontFamilies.mono,
    fontWeight: Typography.weights.bold,
    color: Colors.muted,
  },
  sketchActionText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.walnut,
  },
  sketchImage: {
    width: '100%',
    height: 180,
    borderRadius: Radii.sm,
  },
});
