
declare module '@react-native-community/slider' {
  import { ViewStyle } from 'react-native';

  export interface SliderProps {
    value?: number;
    minimumValue?: number;
    maximumValue?: number;
    step?: number;
    minimumTrackTintColor?: string;
    maximumTrackTintColor?: string;
    onValueChange?: (value: number) => void;
    style?: ViewStyle;
  }

  export default function Slider(props: SliderProps): JSX.Element;
}
