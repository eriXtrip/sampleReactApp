import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useContext } from 'react';
import { Colors } from '../../constants/Colors';
import { ProfileContext } from '../../contexts/ProfileContext';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import Spacer from '../../components/Spacer';
import { Ionicons } from '@expo/vector-icons';

const Theme = () => {
  const colorScheme = useColorScheme();
  const { themeColors, updateTheme } = useContext(ProfileContext);
  const theme = Colors[theme === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];

  const handleThemeChange = (theme) => {
    updateTheme(theme);
    console.log(`Selected theme: ${theme}`);
  };

  return (
    <ThemedView style={styles.container} safe={true}>
      <View style={[styles.card, { backgroundColor: theme.navBackground, borderColor: theme.cardBorder, borderWidth: 1 }]}>
        {/* <TouchableOpacity
          style={styles.cardItem}
          onPress={() => handleThemeChange('system')}
        >
          <Ionicons name="contrast-outline" size={20} color={theme.text || '#000'} />
          <ThemedText style={styles.cardText}>Automatic</ThemedText>
          <Ionicons
            name={themeColors === 'system' ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color={theme.text || '#999'}
          />
        </TouchableOpacity> */}
        <TouchableOpacity
          style={styles.cardItem}
          onPress={() => handleThemeChange('light')}
        >
          <Ionicons name="sunny" size={20} color={theme.text || '#000'} />
          <ThemedText style={styles.cardText}>Light</ThemedText>
          <Ionicons
            name={themeColors === 'light' ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color={theme.text || '#999'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cardItem, { borderBottomWidth: 0 }]}
          onPress={() => handleThemeChange('dark')}
        >
          <Ionicons name="moon" size={20} color={theme.text || '#000'} />
          <ThemedText style={styles.cardText}>Dark</ThemedText>
          <Ionicons
            name={themeColors === 'dark' ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color={theme.text || '#999'}
          />
        </TouchableOpacity>
      </View>
      <Spacer height={20} />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  cardItem: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
    marginLeft: 10,
  },
});

export default Theme;