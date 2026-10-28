import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, commonColor } from "../../styles/commonStyle";

interface Props {
  visible: boolean;
  // 막·뒤로 가기로 닫으려 할 때. canClose가 false면 무시한다.
  onRequestClose: () => void;
  canClose?: boolean;
  children: React.ReactNode;
  testID?: string;
}

// 아래에서 올라오는 시트 (공통 디자인 값: 위쪽 모서리 20, 배경 colors.default,
// 끌기 손잡이 36×4, 아래 여백 안전 영역 + 16). RN Modal 위에 그리므로 이 시트
// 위에 다른 모달을 겹치지 않는 곳에서만 쓴다.
function BottomSheetModal( {
  visible,
  onRequestClose,
  canClose = true,
  children,
  testID,
}: Props ): React.JSX.Element | null {
  const insets = useSafeAreaInsets();
  if (!visible) {
    return null;
  }
  const requestClose = () => {
    if (canClose) {
      onRequestClose();
    }
  };
  return (
    <Modal
      visible
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={ requestClose }
    >
      <View style={ styles.root }>
        <Pressable
          style={ styles.overlay }
          onPress={ requestClose }
          accessibilityRole="button"
          accessibilityLabel="닫기"
          testID={ testID ? `${testID}-overlay` : "sheet-overlay" }
        />
        <View
          style={ [styles.sheet, { paddingBottom: insets.bottom + 16 }] }
          testID={ testID }
        >
          <View style={ styles.handleArea }>
            <View style={ styles.handle } />
          </View>
          { children }
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create( {
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: commonColor.overlay,
  },
  sheet: {
    maxHeight: "92%",
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: colors.default,
  },
  handleArea: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: commonColor.border,
  },
} );

export default BottomSheetModal;
