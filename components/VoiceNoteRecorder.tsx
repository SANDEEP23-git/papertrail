import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';
import { VoiceAttachment } from '../database/notes';
import { Ionicons } from '@expo/vector-icons';

interface VoiceNoteRecorderProps {
  attachment?: VoiceAttachment;
  onSaveAttachment: (att: VoiceAttachment | undefined) => void;
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  attachment,
  onSaveAttachment,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Timer while recording
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRecording && !isPaused) {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording, isPaused]);

  const startRecording = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          onSaveAttachment({
            id: 'voice_' + Date.now().toString(36),
            name: `Voice Thought (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
            durationMs: seconds * 1000,
            uri: audioUrl,
          });
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        setIsPaused(false);
        setSeconds(0);
      }
    } catch (err) {
      console.error('Microphone error:', err);
      alert('Microphone access required to record voice notes.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const togglePlayback = () => {
    if (!attachment?.uri) return;
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(attachment.uri);
      audioElementRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleDelete = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    setIsPlaying(false);
    onSaveAttachment(undefined);
  };

  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // If attachment exists, render the playback card
  if (attachment) {
    return (
      <View style={styles.playerCard}>
        <View style={styles.playerLeft}>
          <TouchableOpacity onPress={togglePlayback} style={styles.playBtn}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color={Colors.sheet} />
          </TouchableOpacity>
          <View>
            <Text style={styles.attachmentTitle}>{attachment.name}</Text>
            <Text style={styles.attachmentMeta}>
              Audio memo · {formatTime(Math.round(attachment.durationMs / 1000))}
            </Text>
          </View>
        </View>

        {/* Audio Waveform visualization bars */}
        <View style={styles.waveform}>
          {[8, 16, 24, 12, 28, 14, 20, 10, 22, 16, 12, 26, 18, 10].map((h, i) => (
            <View
              key={i}
              style={[
                styles.waveBar,
                { height: isPlaying ? h * (0.8 + Math.random() * 0.4) : h * 0.7 },
                isPlaying && styles.waveBarActive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={16} color={Colors.danger} />
        </TouchableOpacity>
      </View>
    );
  }

  // Active recording bar
  if (isRecording) {
    return (
      <View style={styles.recordingCard}>
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>RECORDING IN PROGRESS</Text>
        </View>

        <Text style={styles.timerDisplay}>{formatTime(seconds)}</Text>

        <View style={styles.recordingControls}>
          <TouchableOpacity onPress={pauseRecording} style={styles.controlBtn}>
            <Ionicons name={isPaused ? 'play' : 'pause'} size={16} color={Colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity onPress={stopRecording} style={styles.stopBtn}>
            <Ionicons name="stop" size={16} color={Colors.sheet} />
            <Text style={styles.stopBtnText}>Finish & Attach</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Initial trigger button
  return (
    <TouchableOpacity style={styles.recordTriggerBtn} onPress={startRecording}>
      <Ionicons name="mic-outline" size={16} color={Colors.ink} />
      <Text style={styles.recordTriggerText}>Record Voice Note</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  recordTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sheet,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: Radii.sm,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    gap: 6,
  },
  recordTriggerText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.ink,
  },
  recordingCard: {
    backgroundColor: '#FAF2EC',
    borderWidth: 1.5,
    borderColor: '#C86D51',
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 720,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C86D51',
  },
  recordingText: {
    fontSize: 9,
    fontFamily: Typography.fontFamilies.mono,
    color: '#C86D51',
    fontWeight: Typography.weights.bold,
    letterSpacing: 1,
  },
  timerDisplay: {
    fontSize: Typography.sizes.md,
    fontFamily: Typography.fontFamilies.mono,
    fontWeight: Typography.weights.bold,
    color: Colors.ink,
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  controlBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.sheet,
    borderWidth: 1,
    borderColor: Colors.rule,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C86D51',
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    gap: 4,
  },
  stopBtnText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.sheet,
  },
  playerCard: {
    backgroundColor: Colors.sheet,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 720,
  },
  playerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.walnut,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.ink,
  },
  attachmentMeta: {
    fontSize: 10,
    color: Colors.muted,
    marginTop: 1,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 28,
  },
  waveBar: {
    width: 3,
    backgroundColor: Colors.rule,
    borderRadius: 1.5,
  },
  waveBarActive: {
    backgroundColor: Colors.walnut,
  },
  deleteBtn: {
    padding: 6,
  },
});
