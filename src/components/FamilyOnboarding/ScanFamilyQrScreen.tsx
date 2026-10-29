import React from "react";
import {
  ActivityIndicator,
  Linking,
  PermissionsAndroid,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Camera } from "react-native-camera-kit";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFamilyStore } from "../../store/useFamilyStore";
import Icon from "../common/Icon";
import { colors, commonColor } from "../../styles/commonStyle";
import { CODE_NOT_FOUND_MESSAGE } from "./InviteCodeScreen";
import type { FamilyOnboardingScreenProps } from "./types";

type Props = FamilyOnboardingScreenProps<"ScanFamilyQr">;

type PermissionStatus = "checking" | "granted" | "denied";
type ScanStatus = "scanning" | "checking" | "error";

type OnReadCodeEvent = {
  nativeEvent: {
    codeStringValue: string;
  };
};

// 온보딩의 "QR 코드로 참여하기". 스캔하면 바로 참여하지 않고 참여 확인으로 간다.
function ScanFamilyQrScreen( { navigation }: Props ): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const lookupFamilyByCode = useFamilyStore( state => state.lookupFamilyByCode );
  const [error, setError] = React.useState<string | null>( null );

  const [permissionStatus, setPermissionStatus] =
    React.useState<PermissionStatus>( "checking" );
  const [scanStatus, setScanStatus] = React.useState<ScanStatus>( "scanning" );

  React.useEffect( () => {
    PermissionsAndroid.request( PermissionsAndroid.PERMISSIONS.CAMERA ).then(
      result => {
        setPermissionStatus(
          result === PermissionsAndroid.RESULTS.GRANTED ? "granted" : "denied",
        );
      },
    );
  }, [] );

  const onReadCode = (event: OnReadCodeEvent) => {
    if (scanStatus !== "scanning") return;
    setScanStatus( "checking" );
    return lookupFamilyByCode( event.nativeEvent.codeStringValue ).then( lookup => {
      if (lookup) {
        setScanStatus( "scanning" );
        navigation.replace( "JoinConfirm", { lookup } );
        return;
      }
      setError( useFamilyStore.getState().error ?? CODE_NOT_FOUND_MESSAGE );
      setScanStatus( "error" );
    } );
  };

  const closeButton = (
    <View style={ [styles.closeButton, { top: insets.top + 12 }] }>
      <Icon
        name="Close"
        size={ 22 }
        color={ colors.white }
        onPress={ () => navigation.goBack() }
        accessibilityLabel="닫기"
      />
    </View>
  );

  if (permissionStatus === "checking") {
    return (
      <View style={ [styles.container, styles.centered] }>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (permissionStatus === "denied") {
    return (
      <View style={ [styles.container, styles.centered] }>
        <Text style={ styles.title }> 카메라 권한이 필요해요 </Text>
        <Text style={ styles.description }>
          설정에서 카메라 권한을 허용한 뒤 다시 시도해주세요.
        </Text>
        <Pressable
          style={ styles.retryButton }
          onPress={ () => Linking.openSettings() }
        >
          <Text style={ styles.retryButtonText }> 설정 열기 </Text>
        </Pressable>
        { closeButton }
      </View>
    );
  }

  return (
    <View style={ styles.container }>
      <Camera
        style={ styles.camera }
        scanBarcode
        onReadCode={ onReadCode }
        showFrame
        laserColor={ commonColor.touchable }
        frameColor={ colors.white }
      />
      {
        scanStatus === "checking"
        ? <View style={ [styles.overlay, styles.centered] }>
          <ActivityIndicator size="large" color={ colors.white } />
        </View>
        : null
      }
      {
        scanStatus === "error"
        ? <View style={ [styles.overlay, styles.centered] }>
          <Text style={ styles.overlayText }>
            { error ?? CODE_NOT_FOUND_MESSAGE }
          </Text>
          <Pressable
            style={ styles.retryButton }
            onPress={ () => setScanStatus( "scanning" ) }
          >
            <Text style={ styles.retryButtonText }> 다시 스캔하기 </Text>
          </Pressable>
        </View>
        : null
      }
      { closeButton }
    </View>
  );
}

const styles = StyleSheet.create( {
  container: {
    flex: 1,
    backgroundColor: colors.pureBlack,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  camera: {
    flex: 1,
  },
  closeButton: {
    position: "absolute",
    left: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: commonColor.overlayStrong,
    padding: 24,
  },
  overlayText: {
    color: colors.white,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
    color: colors.white,
  },
  description: {
    fontSize: 14,
    color: commonColor.border,
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: commonColor.touchable,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
} );

export default ScanFamilyQrScreen;
