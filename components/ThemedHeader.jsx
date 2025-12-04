import { useContext, useState } from 'react'; 
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { ProfileContext } from '../contexts/ProfileContext';
import { Colors } from '../constants/Colors';
import { useDownloadQueue } from '../contexts/DownloadContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const ThemedHeader = ({ options, navigation }) => {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];
  const [menuVisible, setMenuVisible] = useState(false);
  const { clearQueue, pauseDownload, resumeDownload, queue } = useDownloadQueue();


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
          <Ionicons name="chevron-back" size={30} color={theme.title} />
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

      {/* Subject menu trigger */}
      {/* {options?.title === 'Subject' && (
        <TouchableOpacity onPress={() => setMenuVisible((v) => !v)}>
          <Ionicons name="download-outline" size={24} color={theme.title} />
        </TouchableOpacity>
      )} */}

      {/* Download queue menu trigger */}
      {/* {options?.title === 'Download queue' && (
        <TouchableOpacity onPress={() => setMenuVisible((v) => !v)}>
          <Ionicons name="ellipsis-vertical-outline" size={24} color={theme.title} />
        </TouchableOpacity>
      )} */}

      {/* Popup Menu */}
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
              top: 60,
              right: 0,
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
            {options?.title === 'Subject' && (
              <>
                <TouchableOpacity onPress={() => setMenuVisible(false)} style={[style.menu]}>
                  <Text style={{ color: theme.title }}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMenuVisible(false)} style={[style.menu]}>
                  <Text style={{ color: theme.title }}>Unfinish</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMenuVisible(false)} style={[style.menu, { borderBottomWidth: 0 }]}>
                  <Text style={{ color: theme.title }}>Not Downloaded</Text>
                </TouchableOpacity>
              </>
            )}

            {options?.title === 'Download queue' && (
              <>
                <TouchableOpacity onPress={() => {
                  setMenuVisible(false);
                    queue.forEach(item => {
                      if (item.status === 'downloading') pauseDownload(item.id);
                    });
                  }} style={[style.menu]}>
                  <Text style={{ color: theme.title }}>Pause</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { 
                  setMenuVisible(false);
                    queue.forEach(item => {
                      if (item.status === 'paused') resumeDownload(item.id);
                    });
                  }} style={[style.menu]}>
                  <Text style={{ color: theme.title }}>Resume</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {setMenuVisible(false); clearQueue();}} style={[style.menu, { borderBottomWidth: 0 }]}>
                  <Text style={{ color: theme.title }}>Cancel All</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const style = {
  menu: {
    fontSize: 15,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
};

export default ThemedHeader;