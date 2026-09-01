import React, { PropsWithChildren, useEffect, useRef } from 'react';
import { Animated, Dimensions, Modal, PanResponder, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type BottomSheetProps = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
}>;

const BottomSheet = ({ visible, onClose, children }: BottomSheetProps) => {
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get('screen').height;
  const panY = useRef(new Animated.Value(screenHeight)).current;

  // Resets the position of the bottom sheet to the initial state (fully visible)
  const resetPosition = () => {
    Animated.timing(panY, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  // Closes the bottom sheet by animating it downwards and then calling the onClose callback
  const closeSheet = () => {
    Animated.timing(panY, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(onClose);
  };

  // When the visibility of the bottom sheet changes, reset its position to ensure it appears correctly
  useEffect(() => {
    if (visible) resetPosition();
  }, [visible]);

  // Interpolates the panY value to create a translateY transformation for the bottom sheet
  const translateY = panY.interpolate({
    inputRange: [-1, 0, screenHeight],
    outputRange: [0, 0, screenHeight],
  });

  // Creates a PanResponder to handle touch gestures for dragging the bottom sheet
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 5,

      onPanResponderMove: Animated.event([null, { dy: panY }], {
        useNativeDriver: false,
      }),

      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 100 || gesture.vy > 1.5) {
          closeSheet();
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={closeSheet} statusBarTranslucent>
      <Pressable className="flex-1 justify-end bg-black/60" onPress={closeSheet}>
        <Animated.View
          {...panResponder.panHandlers}
          style={{
            transform: [{ translateY }],
            maxHeight: screenHeight * 0.85 - insets.bottom,
          }}
          className="elevation-xl rounded-t-3xl bg-white px-5 pb-8 pt-3">
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="mb-4 h-1 w-10 self-center rounded-full bg-gray-300" />
            {children}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

export default BottomSheet;
