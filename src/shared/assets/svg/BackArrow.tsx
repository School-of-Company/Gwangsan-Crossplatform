import { Svg, Path, G, Defs, ClipPath, Rect } from 'react-native-svg';

interface BackArrowProps {
  color?: string;
  width?: number;
  height?: number;
}

const BackArrow = ({ color = '#8F9094', width = 24, height = 24 }: BackArrowProps) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <G clip-path="url(#clip0_3028_3906)">
        <Path
          d="M15 6L9.70711 11.2929C9.31658 11.6834 9.31658 12.3166 9.70711 12.7071L15 18"
          stroke={color}
          stroke-width="2"
          stroke-linecap="round"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_3028_3906">
          <Rect width="8" height="14" fill="white" transform="translate(8 5)" />
        </ClipPath>
      </Defs>
    </Svg>
  );
};

export default BackArrow;
