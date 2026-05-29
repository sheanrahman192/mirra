// Line icons ported from screens-shared.jsx (24×24 viewBox, stroke-based).
import React from 'react';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { colors } from '@/theme/tokens';

interface IconProps {
  size?: number;
  color?: string;
}

const base = (color: string) => ({
  stroke: color,
  fill: 'none' as const,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const MicIcon = ({ size = 22, color = colors.ink }: IconProps) => (
  <Svg viewBox="0 0 24 24" width={size} height={size}>
    <Rect x={9} y={3} width={6} height={12} rx={3} strokeWidth={1.5} {...base(color)} />
    <Path d="M5 11a7 7 0 0 0 14 0" strokeWidth={1.5} {...base(color)} />
    <Path d="M12 18v3" strokeWidth={1.5} {...base(color)} />
  </Svg>
);

export const SparkIcon = ({ size = 22, color = colors.ink }: IconProps) => (
  <Svg viewBox="0 0 24 24" width={size} height={size}>
    <Path d="M3 15l4-4 3 3 5-7 4 5 2-2" strokeWidth={1.5} {...base(color)} />
    <Circle cx={20} cy={10} r={0.8} fill={color} />
  </Svg>
);

export const TrendIcon = ({ size = 22, color = colors.ink }: IconProps) => (
  <Svg viewBox="0 0 24 24" width={size} height={size}>
    <Path d="M4 18c3-4 5-6 8-4s5 0 8-6" strokeWidth={1.5} {...base(color)} />
    <Circle cx={20} cy={8} r={1.4} fill={color} />
  </Svg>
);

export const PersonIcon = ({ size = 22, color = colors.ink }: IconProps) => (
  <Svg viewBox="0 0 24 24" width={size} height={size}>
    <Circle cx={12} cy={9} r={3.5} strokeWidth={1.5} {...base(color)} />
    <Path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" strokeWidth={1.5} {...base(color)} />
  </Svg>
);

export const ChevronIcon = ({ size = 16, color = colors.ink }: IconProps) => (
  <Svg viewBox="0 0 24 24" width={size} height={size}>
    <Path d="M9 6l6 6-6 6" strokeWidth={1.5} {...base(color)} />
  </Svg>
);

export const BackIcon = ({ size = 20, color = colors.ink }: IconProps) => (
  <Svg viewBox="0 0 24 24" width={size} height={size}>
    <Path d="M15 6l-6 6 6 6" strokeWidth={1.5} {...base(color)} />
  </Svg>
);

export const DotsIcon = ({ size = 20, color = colors.ink }: IconProps) => (
  <Svg viewBox="0 0 24 24" width={size} height={size}>
    <Circle cx={6} cy={12} r={1.2} fill={color} />
    <Circle cx={12} cy={12} r={1.2} fill={color} />
    <Circle cx={18} cy={12} r={1.2} fill={color} />
  </Svg>
);

export const Icon = {
  mic: MicIcon,
  spark: SparkIcon,
  trend: TrendIcon,
  person: PersonIcon,
  chevron: ChevronIcon,
  back: BackIcon,
  dots: DotsIcon,
};
