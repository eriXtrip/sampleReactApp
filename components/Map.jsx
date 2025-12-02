// filepath: c:\Users\USER\Desktop\sampleReactApp\components\Map.jsx
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import Svg, { Circle, Path, Text as SvgText, Image as SvgImage, Rect, Defs, ClipPath, Line } from 'react-native-svg';
import * as FileSystem from 'expo-file-system';

function CandyMap({ stops = 20, cols = 5, progress = 0, accentColor = '#48cae4', style, lessons = null, currentAvatar = null, currentUserName = null }) {
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

  const totalStops = useMemo(() => {
    if (Array.isArray(lessons) && lessons.length > 0) return lessons.length;
    return Math.max(1, stops);
  }, [lessons, stops]);

  const currentIndex = useMemo(() => {
    const total = totalStops;
    const clamped = Math.max(0, Math.min(100, Number(progress)));
    return Math.round((clamped / 100) * (total - 1));
  }, [totalStops, progress]);

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
      // Use lesson_number from lessons array when available (keeps numbering consistent with DB)
      const label = Array.isArray(lessons) && lessons[i] ? lessons[i].lesson_number : (i + 1);
      const candyPalette = ['#fda4af', '#f9a8d4', '#c4b5fd', '#93c5fd', '#86efac', '#fde68a'];

      const isCurrent = i === currentIndex;
      const isFuture = i > currentIndex;

      const unfinishedFill = isDark ? '#4b5563' : '#e5e7eb';
      const unfinishedText = isDark ? '#e5e7eb' : '#6b7280';

      const baseFill = candyPalette[i % candyPalette.length];
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
          {/* Number (hidden if avatar present on current node) */}
          {!(isCurrent && avatarExists && avatarUri) && (
            <SvgText x={x} y={y + metrics.fontSize / 3} fontSize={metrics.fontSize} fill={numberColor} fontWeight="700" textAnchor="middle">
              {label}
            </SvgText>
          )}

          {/* If current node and avatar exists, show the avatar (clipped to circle); else show initials placeholder */}
          {isCurrent && avatarExists && avatarUri && (
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

          {isCurrent && !avatarExists && currentUserName && (
            // initials placeholder
            <React.Fragment>
              <Circle cx={x} cy={y} r={r} fill={accentColor} stroke="#fff" strokeWidth={2} />
              <SvgText x={x} y={y + metrics.fontSize / 4} fontSize={metrics.fontSize} fill="#fff" fontWeight="700" textAnchor="middle">
                {getInitials(currentUserName)}
              </SvgText>
            </React.Fragment>
          )}

          {isCurrent && !avatarExists && !currentUserName && (
            // default visual: small white inner circle to indicate current
            <Circle cx={x} cy={y} r={r * 0.85} fill="#ffffff" opacity={0.9} />
          )}

          {/* No title text per request (only numbers / avatar) */}
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
    const startX = startSide === 'left' ? Math.max(metrics.padX, start.x - metrics.radius - 12 - rectW) : Math.min(metrics.centerX * 2 - metrics.padX - rectW, start.x + metrics.radius + 12);
    const startY = start.y + metrics.radius + 12;

    // Goal: place above the last node and offset horizontally
    const goalSide = goal.x < metrics.centerX ? 'left' : 'right';
    const goalX = goalSide === 'left' ? Math.max(metrics.padX, goal.x - metrics.radius - 12 - rectW) : Math.min(metrics.centerX * 2 - metrics.padX - rectW, goal.x + metrics.radius + 12);
    const goalY = goal.y - metrics.radius - 12 - rectH;

    return (
      <>
        <Rect x={startX} y={startY} rx={8} ry={8} width={rectW} height={rectH} fill={accentColor} opacity={0.95} />
        <SvgText x={startX + rectW / 2} y={startY + rectH / 2 + 4} fontSize={f} fill="#fff" textAnchor="middle" fontWeight="700">Start</SvgText>

        <Rect x={goalX} y={goalY} rx={8} ry={8} width={rectW} height={rectH} fill={accentColor} opacity={0.95} />
        <SvgText x={goalX + rectW / 2} y={goalY + rectH / 2 + 4} fontSize={f} fill="#fff" textAnchor="middle" fontWeight="700">Goal</SvgText>
      </>
    );
  };

  // Render quarter-start badges (if lessons provided)
  const renderQuarterStarts = () => {
    if (!Array.isArray(lessons) || lessons.length === 0 || !metrics) return null;

    const items = [];
    let lastQ = null;
    lessons.forEach((lesson, idx) => {
      if (lesson.Quarter !== lastQ) {
        lastQ = lesson.Quarter;
        const { x, y } = getPoint(idx);
        // place the separator slightly below the node so it reads: Quarter N -> lessons below
        const yLine = y + metrics.radius + 12;
        // draw a dashed horizontal line across the viewport
        const leftX = metrics.padX;
        const rightX = Math.max(metrics.centerX * 2 - metrics.padX, metrics.centerX + metrics.amplitude + metrics.padX);

        // center the quarter label on the line
        const label = `Quarter ${String(lastQ)}`;
        const labelW = Math.min(160, Math.max(80, label.length * 8));
        const labelH = 22;
        const labelX = metrics.centerX - labelW / 2;
        const labelY = yLine - labelH / 2;

        items.push(
          <React.Fragment key={`q-${lastQ}-${idx}`}>
            {/* dashed separator line */}
            <Line x1={leftX} y1={yLine} x2={labelX - 8} y2={yLine} stroke={accentColor} strokeWidth={1.2} strokeDasharray={[8, 6]} opacity={0.9} />
            <Line x1={labelX + labelW + 8} y1={yLine} x2={rightX} y2={yLine} stroke={accentColor} strokeWidth={1.2} strokeDasharray={[8, 6]} opacity={0.9} />
            {/* label box centered on the line */}
            <Rect x={labelX} y={labelY} rx={10} ry={10} width={labelW} height={labelH} fill={theme.background} stroke={accentColor} strokeWidth={1} />
            <SvgText x={labelX + labelW / 2} y={labelY + labelH / 2 + 4} fontSize={12} fill={accentColor} fontWeight="700" textAnchor="middle">{label}</SvgText>
          </React.Fragment>
        );
      }
    });
    return items;
  };

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
              {/* Quarter badges (start of quarters) */}
              {renderQuarterStarts()}
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