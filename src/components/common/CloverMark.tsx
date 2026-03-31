import React from 'react';
import Svg, { Circle } from 'react-native-svg';
import { CLOVER_FOREST, CLOVER_BG } from '../../constants/clover';

type CloverMarkProps = {
  /** Rendered width and height in points */
  size: number;
  /** Petal fill colour. Defaults to Forest #1e3d28 */
  color?: string;
  /** Centre cutout fill colour. Defaults to Soft Lavender #ede8ff */
  bg?: string;
};

/**
 * Clover logo mark: four overlapping circles at cardinal points
 * forming a clover shape, with a background-colour circle punched
 * through the centre. Flat, two-tone, no gradients.
 *
 * ViewBox: 80×80. Petals at top (40,23), right (57,40),
 * bottom (40,57), left (23,40) — radius 18 each.
 * Centre cutout at (40,40) — radius 10.
 */
export default function CloverMark({
  size,
  color = CLOVER_FOREST,
  bg = CLOVER_BG,
}: CloverMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      {/* Top petal */}
      <Circle cx={40} cy={23} r={18} fill={color} />
      {/* Right petal */}
      <Circle cx={57} cy={40} r={18} fill={color} />
      {/* Bottom petal */}
      <Circle cx={40} cy={57} r={18} fill={color} />
      {/* Left petal */}
      <Circle cx={23} cy={40} r={18} fill={color} />
      {/* Centre cutout */}
      <Circle cx={40} cy={40} r={10} fill={bg} />
    </Svg>
  );
}
