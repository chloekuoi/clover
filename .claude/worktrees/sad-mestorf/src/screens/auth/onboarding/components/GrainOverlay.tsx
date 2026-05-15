import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Filter, FeTurbulence, Rect } from 'react-native-svg';

/**
 * Subtle SVG-based film grain overlay.
 * Renders at full size over its container (absolute positioning).
 * Uses opacity ~0.035 so it's barely visible — adds texture without distraction.
 */
export function GrainOverlay() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Filter id="grain">
          <FeTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves={4}
            stitchTiles="stitch"
          />
        </Filter>
        <Rect
          width="100%"
          height="100%"
          filter="url(#grain)"
          opacity={0.035}
          fill="white"
        />
      </Svg>
    </View>
  );
}
