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
import { StatusBar } from 'react-native';

const ThemedView = ({ style, safe = false, children, ...props }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const insets = useSafeAreaInsets()

  // Android-specific adjustments
  const androidSafeArea = {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : insets.top,
    paddingBottom: Platform.OS === 'android' ? 0 : insets.bottom,
  };

  if (!safe){
    return (
      <View 
          style={[{ backgroundColor: theme.background }, style]}
          {...props}
        >
          {children}
      </View>
    )
  }

  return (
    <View 
      style={[
        { backgroundColor: theme.background },
        Platform.OS === 'android' ? androidSafeArea : {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
        style
      ]}
      {...props}
    >
      {children}
    </View>
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
