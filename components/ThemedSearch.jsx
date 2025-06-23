// components/ThemedSearch.jsx
import { View, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';

const ThemedSearch = ({
  value,
  onChangeText,
  placeholder = "Search...",
  style,
  inputStyle,
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;

  return (
    <View style={[styles.searchContainer, style]}>
      <Ionicons
        name="search-outline"
        size={20}
        color={theme.iconColor}
        style={styles.searchIcon}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        style={[
          styles.input,
          {
            backgroundColor: theme.uiBackground,
            color: theme.text,
            borderColor: theme.iconColor,
          },
          inputStyle,
        ]}
      />
    </View>
  );
};

export default ThemedSearch;

const styles = StyleSheet.create({
  searchContainer: {
    position: 'relative',
    width: '100%',
  },
  input: {
    height: 50,
    fontSize: 16,
    paddingLeft: 45,
    borderRadius: 150, // Default value
    paddingRight: 15,
  },
  searchIcon: {
    position: 'absolute',
    left: 15,
    top: 15,
    zIndex: 1,
  },
});