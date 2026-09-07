import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FamilyStackParamList } from "../../navigation/types";
import { commonColor } from "../../styles/commonStyle";

type Props = NativeStackScreenProps<FamilyStackParamList, "ScanFamilyQr">;

function ScanFamilyQrScreen( { navigation }: Props ): React.JSX.Element {
  React.useEffect( () => {
    navigation.setOptions( { title: "QR 코드 스캔" } );
  }, [navigation] );

  return (
    <View style={ styles.container }>
      <Text style={ styles.title }> 카메라 스캔 준비 중이에요 </Text>
      <Text style={ styles.description }>
        곧 지원할 예정이에요. 지금은 가족 코드 입력을 이용해주세요.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create( {
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: commonColor.backgroundColor,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
} );

export default ScanFamilyQrScreen;
