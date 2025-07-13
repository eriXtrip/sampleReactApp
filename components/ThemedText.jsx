import { Text, useColorScheme } from 'react-native'
import { Colors } from "../constants/Colors"
import { ProfileContext } from '../contexts/ProfileContext';
import { useContext } from 'react';

const ThemedText = ({ style, title = false, ...props }) => {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[theme === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors]; 

  const textColor = title ? theme.title : theme.text

  return (
    <Text 
    style={[{ color: textColor }, style]}
    {...props}
    />
  )
}

export default ThemedText