import { useColorScheme } from 'react-native';
import { colors, darkColors } from '@/constants/theme';

export function useThemeColors() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : colors;
}
