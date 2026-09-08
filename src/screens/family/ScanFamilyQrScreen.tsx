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
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Camera } from "react-native-camera-kit";
import type { FamilyStackParamList } from "../../navigation/types";
import { useFamilyStore } from "../../store/useFamilyStore";
import { commonColor } from "../../styles/commonStyle";

type Props = NativeStackScreenProps<FamilyStackParamList, "ScanFamilyQr">;

type PermissionStatus = "checking" | "granted" | "denied";
type ScanStatus = "scanning" | "joining" | "error";

type OnReadCodeEvent = {
  nativeEvent: {
    codeStringValue: string;
  };
};

function ScanFamilyQrScreen( { navigation }: Props ): React.JSX.Element {
  const error = useFamilyStore( state => state.error );
  const joinFamily = useFamilyStore( state => state.joinFamily );

  const [permissionStatus, setPermissionStatus] =
    React.useState<PermissionStatus>( "checking" );
  const [scanStatus, setScanStatus] = React.useState<ScanStatus>( "scanning" );

  React.useEffect( () => {
    navigation.setOptions( { title: "QR 코드 스캔" } );
  }, [navigation] );

  React.useEffect( () => {
    PermissionsAndroid.request( PermissionsAndroid.PERMISSIONS.CAMERA ).then(
      result => {
        setPermissionStatus(
          result === PermissionsAndroid.RESULTS.GRANTED ? "granted" : "denied",
        );
      },
    );
  }, [] );

  const onReadCode = async (event: OnReadCodeEvent) => {
    if (scanStatus !== "scanning") return;
    setScanStatus( "joining" );
    try {
      await joinFamily( event.nativeEvent.codeStringValue.trim() );
      navigation.popToTop();
    } catch {
      setScanStatus( "error" );
    }
  };

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
        laserColor="#a36044"
        frameColor="#fff"
      />
      {
        scanStatus === "joining"
        ? <View style={ [styles.overlay, styles.centered] }>
          <ActivityIndicator size="large" color="#fff" />
        </View>
        : null
      }
      {
        scanStatus === "error"
        ? <View style={ [styles.overlay, styles.centered] }>
          <Text style={ styles.overlayText }>
            { error ?? "참여에 실패했어요." }
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
    </View>
  );
}

const styles = StyleSheet.create( {
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 24,
  },
  overlayText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
    color: "#fff",
  },
  description: {
    fontSize: 14,
    color: "#ccc",
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
} );

export default ScanFamilyQrScreen;
