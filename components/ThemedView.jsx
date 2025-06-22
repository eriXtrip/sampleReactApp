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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ThemedView = ({ style, safe = false, ...props }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;

  if (!safe) return (
    <View 
      style = {[{backgroundColor: theme.background}, style]}
      {...props}
    />
  )

  const insets = useSafeAreaInsets()

  return (
    <View 
      style = {[{backgroundColor: theme.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }, style]}
      {...props}
    />
  )

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: theme.background }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={true}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'android' ? 'height' : undefined}
          keyboardVerticalOffset={0}
        >
          <View style={[{ flex: 1, backgroundColor: theme.background, 
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          }, style]}
           {...props}
          />
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default ThemedView;
