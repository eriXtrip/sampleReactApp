// filepath: c:\Users\USER\Desktop\sampleReactApp\components\Map.jsx
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

function CandyMap({ stops = 20, cols = 5, progress = 0, accentColor = '#48cae4', style }) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;

  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const scrollRef = useRef(null);

  const currentIndex = useMemo(() => {
    const total = Math.max(1, stops);
    const clamped = Math.max(0, Math.min(100, Number(progress)));
    return Math.round((clamped / 100) * (total - 1));
  }, [stops, progress]);

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
    const contentHeight = padTop + padBottom + Math.max(0, stops - 1) * stepY;
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
  }, [layout, stops]);

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
    const total = Math.max(1, stops);
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
    const nodes = [];
    const isDark = colorScheme === 'dark';
    for (let i = 0; i < stops; i++) {
      const { x, y } = getPoint(i);
      const r = metrics.radius;
      const label = i + 1;
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
          {/* Number */}
          <SvgText x={x} y={y + metrics.fontSize / 3} fontSize={metrics.fontSize} fill={numberColor} fontWeight="700" textAnchor="middle">
            {label}
          </SvgText>
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
    const goal = getPoint(Math.max(0, stops - 1));
    const f = Math.max(10, Math.floor(metrics.fontSize * 0.9));
    return (
      <>
        <SvgText x={start.x} y={start.y + (metrics.radius + f + 2)} fontSize={f} fill={theme.background} textAnchor="middle">Start</SvgText>
        <SvgText x={goal.x} y={goal.y - (metrics.radius + 6)} fontSize={f} fill={theme.background} textAnchor="middle">Goal</SvgText>
      </>
    );
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