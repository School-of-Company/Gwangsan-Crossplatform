import { Svg, Path } from 'react-native-svg';

interface CheckIconProps {
  color?: string;
  width?: number;
  height?: number;
}

export default function CheckIcon({ color = '#0075C2', width = 16, height = 16 }: CheckIconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 16 16" fill="none">
      <Path
        d="M13.3332 4L5.99984 11.3333L2.6665 8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
