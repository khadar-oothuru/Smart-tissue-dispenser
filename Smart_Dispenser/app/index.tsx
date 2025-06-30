import { useEffect } from 'react';
import { View } from 'react-native';
import * as Font from 'expo-font';
import Entypo from '@expo/vector-icons/Entypo';
import CustomSplashScreen from '../components/CustomSplashScreen';
import { useThemeContext } from '../context/ThemeContext';
import { loadFonts } from '../utils/fonts';

export default function Index() {
  const { themeColors } = useThemeContext();

  useEffect(() => {
    async function initializeFonts() {
      try {
        await Font.loadAsync(Entypo.font);
        await loadFonts(); // Load Ubuntu fonts
      } catch (e) {
        console.warn('Error loading fonts:', e);
      }
    }

    initializeFonts();
  }, []);

  return (
    <View 
      style={{ 
        flex: 1, 
        backgroundColor: themeColors.background 
      }}
    >
      <CustomSplashScreen />
    </View>
  );
}
