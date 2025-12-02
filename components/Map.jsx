// filepath: c:\Users\USER\Desktop\sampleReactApp\components\Map.jsx
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { lightenColor } from '../utils/colorUtils';
import Svg, { Circle, Path, Text as SvgText, Image as SvgImage, Rect, Defs, ClipPath, Line } from 'react-native-svg';
import * as FileSystem from 'expo-file-system';

function CandyMap({ stops = 20, cols = 5, progress = 0, accentColor = '#48cae4', style, lessons = null, groupedLessons = null, currentAvatar = null, currentUserName = null, activeLessonId = null }) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;

  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [avatarUri, setAvatarUri] = useState(null);
  const [avatarExists, setAvatarExists] = useState(false);

  const getInitials = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  const scrollRef = useRef(null);

  // Build a sequence of nodes: Quarter nodes, lesson nodes, then a final Goal node
  const nodesSequence = useMemo(() => {
    // If pre-grouped sections are provided (preferred), use them directly
    if (Array.isArray(groupedLessons) && groupedLessons.length > 0) {
      const seq = [];
      for (const section of groupedLessons) {
        const q = section.quarter ?? section.Quarter ?? null;
        seq.push({ type: 'quarter', quarter: q });
        // ensure section.data is an array of lessons sorted by lesson_number
        const lessonsInSection = Array.isArray(section.data) ? [...section.data].sort((a, b) => (a.lesson_number || 0) - (b.lesson_number || 0)) : [];
        for (const lesson of lessonsInSection) seq.push({ type: 'lesson', lesson });
      }
      // final goal
      seq.push({ type: 'goal' });
      return seq;
    }

    // fallback when groupedLessons not passed — use flat lessons array
    if (!Array.isArray(lessons) || lessons.length === 0) {
      const total = Math.max(1, stops);
      return new Array(total).fill(null).map((_, idx) => ({ type: 'lesson', index: idx, label: idx + 1 }));
    }

    // Ensure lessons are sorted by lesson_number
    const sorted = [...lessons].sort((a, b) => (a.lesson_number || 0) - (b.lesson_number || 0));

    const seq = [];
    let lastQ = null;
    for (let i = 0; i < sorted.length; i++) {
      const lesson = sorted[i];
      const q = lesson.Quarter ?? 1;
      if (q !== lastQ) {
        seq.push({ type: 'quarter', quarter: q });
        lastQ = q;
      }
      seq.push({ type: 'lesson', lesson });
    }

    seq.push({ type: 'goal' });
    return seq;
  }, [groupedLessons, lessons, stops]);

  const totalStops = nodesSequence.length;

  // Determine which node should be considered "current".
  // We want progress to map to lessons (and final Goal) only so quarter nodes don't move the highlight.
  const currentIndex = useMemo(() => {
    // If explicit activeLessonId is provided prefer that
    if (activeLessonId) {
      const idx = nodesSequence.findIndex(n => n.type === 'lesson' && n.lesson?.lesson_id === activeLessonId);
      if (idx !== -1) return idx;
    }

    // Build a list of indices used for progress mapping: all lesson nodes, then goal node index (if exists)
    const lessonIndices = nodesSequence
      .map((n, i) => n.type === 'lesson' ? i : -1)
      .filter(i => i >= 0);

    const goalIndex = nodesSequence.findIndex(n => n.type === 'goal');
    const progressIndexList = [...lessonIndices];
    if (goalIndex >= 0) progressIndexList.push(goalIndex);

    if (progressIndexList.length === 0) {
      // fallback to basic mapping across all nodes
      const total = Math.max(1, totalStops);
      const clamped = Math.max(0, Math.min(100, Number(progress)));
      return Math.round((clamped / 100) * (total - 1));
    }

    const clamped = Math.max(0, Math.min(100, Number(progress)));
    const pos = Math.round((clamped / 100) * (progressIndexList.length - 1));
    return Math.max(0, Math.min(totalStops - 1, progressIndexList[pos]));
  }, [nodesSequence, totalStops, progress, activeLessonId]);

  // Metrics driven primarily by width for consistent look across devices
  const metrics = useMemo(() => {
    const { width } = layout;
    if (!width) return null;

    const padX = Math.max(16, width * 0.08);
    const centerX = width / 2;
    const amplitude = Math.max(24, (width / 2 - padX) * 0.6); // horizontal wave amplitude
    const radius = Math.max(14, Math.min(28, Math.floor(width * 0.06)));
    const stepY = Math.max(radius * 3.5, Math.floor(width * 0.36)); // vertical spacing between candies
    const padBottom = radius + 28;
    const padTop = radius + 28;
    const contentHeight = padTop + padBottom + Math.max(0, totalStops - 1) * stepY;
    const trailThickness = Math.max(6, Math.floor(radius * 0.9)); // trail base thickness
    const trailInner = Math.max(3, Math.floor(trailThickness * 0.55)); // inner accent trail
    const fontSize = Math.max(11, Math.floor(radius * 0.7));

    return {
      padX,
      padTop,
      padBottom,
      centerX,
      amplitude,
      radius,
      stepY,
      contentHeight,
      trailThickness,
      trailInner,
      fontSize,
    };
  }, [layout, totalStops]);

  // Compute node positions along the trail (bottom -> top)
  const getPoint = (idx) => {
    if (!metrics) return { x: 0, y: 0 };
    const {
      centerX, amplitude, padBottom, contentHeight, stepY,
    } = metrics;
    // y from bottom upward
    const y = contentHeight - padBottom - idx * stepY;
    // x with smooth horizontal wave based on y (to make spacing consistent regardless of idx)
    const frequency = 2 * Math.PI / (stepY * 4); // number of oscillations per screenful
    const x = centerX + amplitude * Math.sin(y * frequency);
    return { x, y };
  };

  // Build a single smooth path (trail) that passes through all points
  const buildTrailPath = () => {
    if (!metrics) return '';
    let d = '';
    const total = totalStops;
    for (let i = 0; i < total; i++) {
      const p = getPoint(i);
      if (i === 0) {
        d += `M ${p.x} ${p.y}`;
      } else {
        const prev = getPoint(i - 1);
        // Control point: midpoint offset by small perpendicular vector for gentle waviness
        const dx = p.x - prev.x;
        const dy = p.y - prev.y;
        const len = Math.max(1, Math.hypot(dx, dy));
        const nx = -dy / len; // normal x
        const ny = dx / len;  // normal y
        const mx = (prev.x + p.x) / 2;
        const my = (prev.y + p.y) / 2;
        const wobble = Math.min(metrics.radius * 0.9, metrics.amplitude * 0.12);
        const cx = mx + nx * wobble;
        const cy = my + ny * wobble;
        d += ` Q ${cx} ${cy} ${p.x} ${p.y}`;
      }
    }
    return d;
  };

  const renderNodes = () => {
    if (!metrics) return null;
    const total = totalStops;
    const nodes = [];
    const isDark = colorScheme === 'dark';
    for (let i = 0; i < total; i++) {
      const { x, y } = getPoint(i);
      const r = metrics.radius;
      // Render quarter nodes, lesson nodes and goal node differently
      const node = nodesSequence[i];
      let label = '';
      let isQuarter = false;
      let isGoalNode = false;
      if (!node) {
        label = i + 1;
      } else if (node.type === 'quarter') {
        isQuarter = true;
        label = `Q${node.quarter}`;
      } else if (node.type === 'lesson') {
        label = node.lesson?.lesson_number ?? (i + 1);
      } else if (node.type === 'goal') {
        isGoalNode = true;
        label = '🏁';
      }
      const candyPalette = ['#fda4af', '#f9a8d4', '#c4b5fd', '#93c5fd', '#86efac', '#fde68a'];

      const isCurrent = i === currentIndex;
      const isFuture = i > currentIndex;

      const unfinishedFill = isDark ? '#4b5563' : '#e5e7eb';
      const unfinishedText = isDark ? '#e5e7eb' : '#6b7280';

      // pick color differently for quarter & goal nodes
      let baseFill = candyPalette[i % candyPalette.length];
      if (isQuarter) baseFill = lightenColor(accentColor, 0.6);
      if (isGoalNode) baseFill = accentColor;
      const fill = isFuture ? unfinishedFill : baseFill;

      const numberColor = isFuture ? unfinishedText : '#1f2937';
      const glowOpacity = isFuture ? 0.03 : isCurrent ? 0.22 : 0.08;
      const glowRadius = r + (isCurrent ? 12 : 8);

      nodes.push(
        <React.Fragment key={`node-${i}`}>
          {/* Glow under candy for trail feel */}
          <Circle cx={x} cy={y} r={glowRadius} fill={accentColor} opacity={glowOpacity} />
          {/* Candy base */}
          <Circle cx={x} cy={y} r={r} fill={fill} stroke="#ffffff" strokeWidth={2} />
          {/* Extra outline for current node */}
          {isCurrent && (
            <Circle cx={x} cy={y} r={r + 2} stroke={accentColor} strokeWidth={3} fill="none" opacity={0.9} />
          )}
          {/* Highlight */}
          <Circle cx={x - r * 0.35} cy={y - r * 0.35} r={Math.max(3, Math.floor(r * 0.22))} fill="rgba(255,255,255,0.6)" />
          {/* Label / Number - for quarter nodes display Q#; for goal node show marker */}
          {!(isCurrent && avatarExists && avatarUri) && (
            <SvgText x={x} y={y + metrics.fontSize / 3} fontSize={isQuarter || isGoalNode ? Math.max(12, Math.floor(metrics.fontSize * 0.9)) : metrics.fontSize} fill={numberColor} fontWeight="700" textAnchor="middle">
              {label}
            </SvgText>
          )}

          {/* If current node and avatar exists, show the avatar (clipped to circle); else show initials placeholder */}
          {isCurrent && avatarExists && avatarUri && !isQuarter && !isGoalNode && (
            <React.Fragment>
              <Defs>
                <ClipPath id={`clip-${i}`}>
                  <Circle cx={x} cy={y} r={r} />
                </ClipPath>
              </Defs>
              <SvgImage
                x={x - r}
                y={y - r}
                width={r * 2}
                height={r * 2}
                preserveAspectRatio="xMidYMid slice"
                href={{ uri: avatarUri }}
                clipPath={`url(#clip-${i})`}
              />
              {/* ring on top of avatar to sit above image */}
              <Circle cx={x} cy={y} r={r + 1.5} stroke="#ffffff" strokeWidth={2} fill="none" opacity={0.9} />
              <Circle cx={x} cy={y} r={r + 4} stroke={accentColor} strokeWidth={2.2} fill="none" opacity={0.9} />
            </React.Fragment>
          )}

          {isCurrent && !avatarExists && currentUserName && !isQuarter && !isGoalNode && (
            // initials placeholder
            <React.Fragment>
              <Circle cx={x} cy={y} r={r} fill={accentColor} stroke="#fff" strokeWidth={2} />
              <SvgText x={x} y={y + metrics.fontSize / 4} fontSize={metrics.fontSize} fill="#fff" fontWeight="700" textAnchor="middle">
                {getInitials(currentUserName)}
              </SvgText>
            </React.Fragment>
          )}

          {isCurrent && !avatarExists && !currentUserName && !isQuarter && !isGoalNode && (
            // default visual: small white inner circle to indicate current
            <Circle cx={x} cy={y} r={r * 0.85} fill="#ffffff" opacity={0.9} />
          )}

          {/* No title text per request (only numbers / avatar). Quarter nodes appear as labeled nodes in the sequence. */}
        </React.Fragment>
      );
    }
    return nodes;
  };

  const renderMarker = () => {
    if (!metrics) return null;
    const { x, y } = getPoint(currentIndex);
    const r = metrics.radius;
    return (
      <>
        {/* Stronger outer glow to highlight current progress */}
        <Circle cx={x} cy={y} r={r + 22} fill={accentColor} opacity={0.10} />
        <Circle cx={x} cy={y} r={r + 14} fill={accentColor} opacity={0.24} />
        {/* Thicker primary ring */}
        <Circle cx={x} cy={y} r={r + 7} stroke={accentColor} strokeWidth={7} fill="none" />
        {/* Inner white ring for contrast */}
        <Circle cx={x} cy={y} r={r + 2} stroke="#ffffff" strokeWidth={2} fill="none" opacity={0.9} />
      </>
    );
  };

  const renderLabels = () => {
    if (!metrics) return null;
    const start = getPoint(0);
    const goal = getPoint(Math.max(0, totalStops - 1));
    const f = Math.max(10, Math.floor(metrics.fontSize * 0.9));
    const rectW = 72;
    const rectH = 26;

    // Start: place below the first node and offset horizontally so it doesn't overlay node
    const startSide = start.x < metrics.centerX ? 'left' : 'right';
    const startX = startSide === 'left' ? Math.max(metrics.padX, start.x - metrics.radius - 12 - rectW) : Math.min(metrics.centerX * 2 - metrics.padX - rectW, start.x + metrics.radius + 19);
    const startY = start.y + metrics.radius + -5;

    // Goal: place above the last node and offset horizontally
    const goalSide = goal.x < metrics.centerX ? 'left' : 'right';
    const goalX = goalSide === 'left' ? Math.max(metrics.padX, goal.x - metrics.radius - 12 - rectW) : Math.min(metrics.centerX * 2 - metrics.padX - rectW, goal.x + metrics.radius + 12);
    const goalY = goal.y - metrics.radius - -5 - rectH;

    return (
      <>
        <Rect x={startX} y={startY} rx={8} ry={8} width={rectW} height={rectH} fill={accentColor} opacity={0.95} />
        <SvgText x={startX + rectW / 2} y={startY + rectH / 2 + 4} fontSize={f} fill="#fff" textAnchor="middle" fontWeight="700">Start</SvgText>

        <Rect x={goalX} y={goalY} rx={8} ry={8} width={rectW} height={rectH} fill={accentColor} opacity={0.95} />
        <SvgText x={goalX + rectW / 2} y={goalY + rectH / 2 + 4} fontSize={f} fill="#fff" textAnchor="middle" fontWeight="700">Goal</SvgText>
      </>
    );
  };

  // Quarter separators removed — quarter nodes are inserted into the nodesSequence

  // Optionally scroll to the bottom (start) once measured, so the trail starts in view
  useEffect(() => {
    if (scrollRef.current && metrics) {
      // small timeout to ensure content size registered
      const id = setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: false });
      }, 0);
      return () => clearTimeout(id);
    }
  }, [metrics]);

  // Observe currentAvatar path to determine whether local file exists. If not, fallback to null.
  useEffect(() => {
    let mounted = true;
    async function check() {
      if (!currentAvatar) {
        if (mounted) {
          setAvatarUri(null);
          setAvatarExists(false);
        }
        return;
      }

      try {
        const info = await FileSystem.getInfoAsync(currentAvatar);
        if (mounted && info && info.exists) {
          setAvatarUri(currentAvatar);
          setAvatarExists(true);
        } else if (mounted) {
          setAvatarUri(null);
          setAvatarExists(false);
        }
      } catch (e) {
        if (mounted) {
          setAvatarUri(null);
          setAvatarExists(false);
        }
      }
    }

    check();
    return () => { mounted = false; };
  }, [currentAvatar]);

  return (
    <View style={[styles.container, style]}>
      <View
        style={[styles.viewport, { backgroundColor: 'transparent' }]}
        onLayout={({ nativeEvent: { layout: l } }) => setLayout({ width: l.width, height: l.height })}
      >
        {metrics && (
          <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
            <Svg width={layout.width} height={metrics.contentHeight}>
              {/* Trail base (soft) */}
              <Path d={buildTrailPath()} stroke={accentColor} strokeWidth={metrics.trailThickness} strokeLinecap="round" strokeLinejoin="round" opacity={0.16} fill="none" />
              {/* Trail accent */}
              <Path d={buildTrailPath()} stroke={accentColor} strokeWidth={metrics.trailInner} strokeLinecap="round" strokeLinejoin="round" opacity={0.65} fill="none" />

              {/* Labels */}
              {renderLabels()}

              {/* Marker */}
              {renderMarker()}

              {/* Nodes */}
              {renderNodes()}
            </Svg>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

export default CandyMap;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  viewport: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0,
  },
});