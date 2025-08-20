import { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { ProfileContext } from '../contexts/ProfileContext';
import { Colors } from '../constants/Colors';

const ThemedHeader = ({ options, navigation }) => {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <View
      style={{
        height: 60,
        backgroundColor: theme.navBackground,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
      }}
    >
      {navigation.canGoBack() && (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.title} />
        </TouchableOpacity>
      )}
      <Text
        style={{
          color: theme.title,
          fontSize: 20,
          fontWeight: 'bold',
          flex: 1,
          textAlign: 'left',
          paddingLeft: navigation.canGoBack() ? 16 : 0,
        }}
      >
        {options?.title ?? ''}
      </Text>
      {options?.title === 'Subject' ? (
        <TouchableOpacity onPress={() => setMenuVisible((v) => !v)}>
          <Ionicons name="download-outline" size={24} color={theme.title} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 24 }} />
      )}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={{ flex: 1 }} onPress={() => setMenuVisible(false)}>
          <View
            style={{
              position: 'absolute',
              top: 56,
              right: 8,
              backgroundColor: theme.navBackground,
              borderWidth: 1,
              borderColor: theme.title + '33',
              borderRadius: 8,
              paddingVertical: 6,
              paddingHorizontal: 10,
              zIndex: 999,
              elevation: 8,
            }}
          >
            <TouchableOpacity onPress={() => setMenuVisible(false)} style={{ paddingVertical: 6 }}>
              <Text style={{ color: theme.title }}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMenuVisible(false)} style={{ paddingVertical: 6 }}>
              <Text style={{ color: theme.title }}>Unfinish</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMenuVisible(false)} style={{ paddingVertical: 6 }}>
              <Text style={{ color: theme.title }}>Not Downloaded</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default ThemedHeader;