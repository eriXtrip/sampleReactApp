import { View, useColorScheme } from 'react-native'
import { Colors } from "../constants/Colors"
import { ProfileContext } from '../contexts/ProfileContext';
import { useContext } from 'react';

const ThemedCard = ({ style, ...props }) => {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[theme === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors]; 

  return (
    <View 
    style={[{backgroundColor: theme.uibackground}, styles.card, style]}
    {...props}
    />
  )
}

export default ThemedCard

const styles = StyleSheet.create({

    card:{
        borderRadius: 5,
        padding: 20,
    }
})