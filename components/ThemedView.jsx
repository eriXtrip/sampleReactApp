import {
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';

const ThemedView = ({ style, children }) => {
  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme ?? 'light'].background;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={true}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'android' ? 'height' : undefined}
          keyboardVerticalOffset={0} // For Android, usually 0 is fine
        >
          <View style={[{ flex: 1, backgroundColor }, style]}>
            {children}
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default ThemedView;
