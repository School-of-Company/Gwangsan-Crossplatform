import Svg, { Path } from 'react-native-svg';

interface SearchIconProps {
  color?: string;
  width?: number;
  height?: number;
}

export const SearchIcon = ({ color = '#B4B5B7', width = 24, height = 24 }: SearchIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.9221 10.4603C17.9221 6.33991 14.5819 3 10.4611 3C6.34026 3 3 6.33991 3 10.4603C3 14.5806 6.34026 17.9205 10.4611 17.9205C12.0757 17.9205 13.5765 17.4036 14.8025 16.5229L18.9644 20.674C19.4001 21.1089 20.1058 21.1086 20.5411 20.6734L20.6733 20.5411C21.1094 20.105 21.1088 19.3978 20.6719 18.9625L16.5096 14.8217C17.3994 13.592 17.9221 12.0837 17.9221 10.4603ZM5.29571 10.4603C5.29571 13.3181 7.6029 15.6251 10.4611 15.6251C13.3192 15.6251 15.6264 13.3181 15.6264 10.4603C15.6264 7.60241 13.3192 5.29547 10.4611 5.29547C7.6029 5.29547 5.29571 7.60241 5.29571 10.4603Z"
        fill={color}
      />
    </Svg>
  );
};
