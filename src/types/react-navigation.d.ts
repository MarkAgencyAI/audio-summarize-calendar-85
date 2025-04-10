
declare module '@react-navigation/native' {
  export function useNavigation(): any;
  export function NavigationContainer(props: any): JSX.Element;
}

declare module '@react-navigation/native-stack' {
  export function createNativeStackNavigator(): any;
}
