import { Animated, View, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from 'react';
import { useNavigationState } from '@react-navigation/native';

export default function AnimatedTabIcon({ focused, iconName, theme, routeName }) {
  const widthAnim = useRef(new Animated.Value(40)).current;
  const fillAnim = useRef(new Animated.Value(0)).current;
  const navigationState = useNavigationState(state => state);
  const prevRouteName = useRef(null);

  useEffect(() => {
    const currentRoute = navigationState.routes[navigationState.index]?.name;
    
    if (prevRouteName.current !== currentRoute) {
      widthAnim.setValue(40);
      fillAnim.setValue(0);
    }

    Animated.parallel([
      Animated.spring(widthAnim, {
        toValue: focused ? 65 : 40,
        tension: 10,
        friction: 100,
        useNativeDriver: false,
      }),
      Animated.timing(fillAnim, {
        toValue: focused ? 1 : 0,
        duration: 500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      })
    ]).start();

    prevRouteName.current = currentRoute;
  }, [focused, navigationState.index]);

  const bgColor = focused ? theme.iconBackground : 'transparent';

  return (
    <Animated.View style={{
      backgroundColor: bgColor,
      paddingVertical: 6,
      borderRadius: 20,
      width: widthAnim,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    }}>
      <View style={{ position: 'relative', width: 24, height: 24 }}>
        <Ionicons
          size={24}
          name={`${iconName}-outline`}
          color={theme.iconColor}
        />
        <Animated.View style={{
          position: 'absolute',
          opacity: fillAnim
        }}>
          <Ionicons
            size={24}
            name={iconName}
            color={theme.iconColorFocused}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}