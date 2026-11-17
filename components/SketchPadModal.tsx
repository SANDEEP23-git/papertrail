import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';
import { CuratedInks } from '../constants/typography';
import { Ionicons } from '@expo/vector-icons';

interface SketchPadModalProps {
  visible: boolean;
  initialDrawing?: string;
  defaultInkColor: string;
  onSave: (dataUri: string) => void;
  onClose: () => void;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
  tool: 'pen' | 'pencil' | 'eraser';
}

export const SketchPadModal: React.FC<SketchPadModalProps> = ({
  visible,
  initialDrawing,
  defaultInkColor,
  onSave,
  onClose,
}) => {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [currentTool, setCurrentTool] = useState<'pen' | 'pencil' | 'eraser'>('pen');
  const [currentColor, setCurrentColor] = useState(defaultInkColor);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPointsRef = useRef<Point[]>([]);

  // Web Canvas Reference for raster export
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const startStroke = (x: number, y: number) => {
    setIsDrawing(true);
    currentPointsRef.current = [{ x, y }];
  };

  const moveStroke = (x: number, y: number) => {
    if (!isDrawing) return;
    currentPointsRef.current.push({ x, y });
    drawLatestSegment(currentPointsRef.current);
  };

  const endStroke = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPointsRef.current.length > 0) {
      const newStroke: Stroke = {
        points: [...currentPointsRef.current],
        color: currentTool === 'eraser' ? '#FBF7EF' : currentColor,
        width: currentTool === 'eraser' ? 24 : strokeWidth,
        tool: currentTool,
      };
      setStrokes((prev) => [...prev, newStroke]);
      setRedoStack([]);
      currentPointsRef.current = [];
    }
  };

  const drawLatestSegment = (points: Point[]) => {
    if (!canvasRef.current || points.length < 2) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const p1 = points[points.length - 2];
    const p2 = points[points.length - 1];

    ctx.strokeStyle = currentTool === 'eraser' ? '#FBF7EF' : currentColor;
    ctx.lineWidth = currentTool === 'eraser' ? 24 : currentTool === 'pencil' ? strokeWidth * 0.8 : strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = currentTool === 'pencil' ? 0.6 : 1.0;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  };

  const redrawAllStrokes = (strokeList: Stroke[]) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    for (const s of strokeList) {
      if (s.points.length < 2) continue;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = s.tool === 'pencil' ? 0.6 : 1.0;

      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x, s.points[i].y);
      }
      ctx.stroke();
    }
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    const remaining = strokes.slice(0, -1);
    setStrokes(remaining);
    setRedoStack((prev) => [...prev, last]);
    redrawAllStrokes(remaining);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const restored = redoStack[redoStack.length - 1];
    const newRedo = redoStack.slice(0, -1);
    const updated = [...strokes, restored];
    setStrokes(updated);
    setRedoStack(newRedo);
    redrawAllStrokes(updated);
  };

  const handleClear = () => {
    if (Platform.OS === 'web' && confirm('Clear canvas completely?')) {
      setStrokes([]);
      setRedoStack([]);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  const handleSave = () => {
    if (canvasRef.current) {
      const dataUri = canvasRef.current.toDataURL('image/png');
      onSave(dataUri);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* Header Toolbar */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.brassDot} />
              <Text style={styles.headerTitle}>SKETCH & HANDWRITING PAD</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={handleUndo} disabled={strokes.length === 0} style={styles.iconBtn}>
                <Ionicons name="arrow-undo" size={18} color={strokes.length === 0 ? Colors.rule : Colors.ink} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRedo} disabled={redoStack.length === 0} style={styles.iconBtn}>
                <Ionicons name="arrow-redo" size={18} color={redoStack.length === 0 ? Colors.rule : Colors.ink} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClear} style={styles.iconBtn}>
                <Ionicons name="trash-outline" size={18} color={Colors.danger} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.ink} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tools Palette Bar */}
          <View style={styles.toolsBar}>
            {/* Tool Selector */}
            <View style={styles.toolSegment}>
              <TouchableOpacity
                style={[styles.toolBtn, currentTool === 'pen' && styles.toolBtnActive]}
                onPress={() => setCurrentTool('pen')}
              >
                <Ionicons name="create-outline" size={16} color={currentTool === 'pen' ? Colors.sheet : Colors.ink} />
                <Text style={[styles.toolText, currentTool === 'pen' && styles.toolTextActive]}>Pen</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toolBtn, currentTool === 'pencil' && styles.toolBtnActive]}
                onPress={() => setCurrentTool('pencil')}
              >
                <Ionicons name="pencil-outline" size={16} color={currentTool === 'pencil' ? Colors.sheet : Colors.ink} />
                <Text style={[styles.toolText, currentTool === 'pencil' && styles.toolTextActive]}>Pencil</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toolBtn, currentTool === 'eraser' && styles.toolBtnActive]}
                onPress={() => setCurrentTool('eraser')}
              >
                <Ionicons name="bandage-outline" size={16} color={currentTool === 'eraser' ? Colors.sheet : Colors.ink} />
                <Text style={[styles.toolText, currentTool === 'eraser' && styles.toolTextActive]}>Eraser</Text>
              </TouchableOpacity>
            </View>

            {/* Stroke Thickness Selector */}
            <View style={styles.strokeSelector}>
              {[2, 4, 8].map((w) => (
                <TouchableOpacity
                  key={w}
                  style={[styles.strokeBtn, strokeWidth === w && styles.strokeBtnActive]}
                  onPress={() => setStrokeWidth(w)}
                >
                  <View style={{ width: w * 2.5, height: w * 2.5, borderRadius: w * 1.25, backgroundColor: Colors.ink }} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Inks */}
            <View style={styles.colorsRow}>
              {CuratedInks.slice(0, 5).map((ink) => (
                <TouchableOpacity
                  key={ink.id}
                  style={[styles.colorDot, currentColor === ink.hex && styles.colorDotActive]}
                  onPress={() => {
                    setCurrentColor(ink.hex);
                    if (currentTool === 'eraser') setCurrentTool('pen');
                  }}
                >
                  <View style={[styles.colorInner, { backgroundColor: ink.hex }]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Interactive HTML5 Canvas on Paper Background */}
          <View style={styles.canvasContainer}>
            {Platform.OS === 'web' ? (
              <canvas
                ref={canvasRef as any}
                width={640}
                height={380}
                style={{
                  width: '100%',
                  height: 380,
                  backgroundColor: '#FBF7EF',
                  cursor: currentTool === 'eraser' ? 'crosshair' : 'pointer',
                  borderRadius: 4,
                }}
                onMouseDown={(e: any) => {
                  const rect = e.target.getBoundingClientRect();
                  startStroke(e.clientX - rect.left, e.clientY - rect.top);
                }}
                onMouseMove={(e: any) => {
                  const rect = e.target.getBoundingClientRect();
                  moveStroke(e.clientX - rect.left, e.clientY - rect.top);
                }}
                onMouseUp={endStroke}
                onMouseLeave={endStroke}
              />
            ) : (
              <View style={styles.nativeFallback}>
                <Text style={styles.nativeText}>Canvas drawing surface active.</Text>
              </View>
            )}
          </View>

          {/* Footer Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Discard</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.insertBtn} onPress={handleSave}>
              <Ionicons name="checkmark-done" size={16} color={Colors.sheet} />
              <Text style={styles.insertBtnText}>Insert Sketch into Sheet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(56, 45, 38, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalBox: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: Colors.paper,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.rule,
    overflow: 'hidden',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.sheet,
    borderBottomWidth: 1,
    borderBottomColor: Colors.rule,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brassDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.brass,
  },
  headerTitle: {
    fontSize: 10,
    fontFamily: Typography.fontFamilies.mono,
    color: Colors.ink,
    letterSpacing: 1.2,
    fontWeight: Typography.weights.bold,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBtn: {
    padding: 6,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 4,
  },
  toolsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    backgroundColor: Colors.paperDark,
    borderBottomWidth: 1,
    borderBottomColor: Colors.rule,
  },
  toolSegment: {
    flexDirection: 'row',
    backgroundColor: Colors.sheet,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.rule,
    overflow: 'hidden',
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
  },
  toolBtnActive: {
    backgroundColor: Colors.walnut,
  },
  toolText: {
    fontSize: 11,
    color: Colors.ink,
    fontWeight: Typography.weights.medium,
  },
  toolTextActive: {
    color: Colors.sheet,
  },
  strokeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  strokeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.sheet,
    borderWidth: 1,
    borderColor: Colors.rule,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strokeBtnActive: {
    borderColor: Colors.walnut,
    borderWidth: 1.5,
  },
  colorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: Colors.rule,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotActive: {
    borderColor: Colors.walnut,
    borderWidth: 2,
  },
  colorInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  canvasContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.paper,
  },
  nativeFallback: {
    height: 380,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.sheet,
    borderRadius: Radii.sm,
  },
  nativeText: {
    fontSize: Typography.sizes.sm,
    color: Colors.muted,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.sheet,
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
  },
  cancelBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  cancelBtnText: {
    fontSize: Typography.sizes.xs,
    color: Colors.muted,
  },
  insertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.walnut,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: Radii.sm,
    gap: 6,
  },
  insertBtnText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.sheet,
  },
});
