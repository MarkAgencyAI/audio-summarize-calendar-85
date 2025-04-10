
declare module 'react-native-safe-area-context' {
  import { ReactNode } from 'react';
  import { ViewStyle } from 'react-native';

  export interface SafeAreaProviderProps {
    children?: ReactNode;
    style?: ViewStyle;
  }

  export function SafeAreaProvider(props: SafeAreaProviderProps): JSX.Element;
  export function useSafeAreaInsets(): { top: number, bottom: number, left: number, right: number };
}
