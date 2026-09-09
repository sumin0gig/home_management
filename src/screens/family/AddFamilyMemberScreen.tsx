import React from "react";
import {
  ActivityIndicator,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import Clipboard from "@react-native-clipboard/clipboard";
import QRCode from "react-native-qrcode-svg";
import type { FamilyStackParamList } from "../../navigation/types";
import { useFamilyStore } from "../../store/useFamilyStore";
import { commonColor } from "../../styles/commonStyle";

type Props = NativeStackScreenProps<FamilyStackParamList, "AddFamilyMember">;

function AddFamilyMemberScreen( { navigation }: Props ): React.JSX.Element {
  const family = useFamilyStore( state => state.family );

  const [copied, setCopied] = React.useState( false );

  React.useEffect( () => {
    navigation.setOptions( { title: "가족 구성원 추가" } );
  }, [navigation] );

  if (!family) {
    return (
      <View style={ [styles.container, styles.centered] }>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const onCopy = () => {
    Clipboard.setString( family.inviteCode );
    setCopied( true );
  };

  const onShare = () => {
    Share.share( {
      message: `${family.name} 가족에 참여해보세요! 초대 코드: ${family.inviteCode}`,
    } );
  };

  return (
    <View style={ styles.container }>
      <View style={ styles.qrWrapper }>
        <QRCode value={ family.inviteCode } size={ 200 } />
      </View>

      <View style={ styles.codeSection }>
        <View style={ styles.codeLabelRow }>

          <Text style={ styles.codeLabel }> 가족 초대 코드 </Text>
          <View style={ styles.codeActions }>
            <Pressable onPress={ onCopy } style={ styles.iconButton }>
              <Text style={ styles.iconButtonText }>
                📋 { copied ? "복사됨" : "복사" }
              </Text>
            </Pressable>
            <Pressable onPress={ onShare } style={ styles.iconButton }>
              <Text style={ styles.iconButtonText }> 📤 공유 </Text>
            </Pressable>
          </View>

        </View>
        <Text style={ styles.codeValue }> { family.inviteCode } </Text>
      </View>

      <AddFamilySection navigation={ navigation } />
    </View>
  );
}

type AddFamilySectionProps = {
  navigation: Props["navigation"];
};

function AddFamilySection({ navigation, }: AddFamilySectionProps): React.JSX.Element {
  return (
    <View style={ styles.addFamilySection }>
      <Text style={ styles.sectionTitle }> 가족 추가 </Text>
      <Pressable
        style={ styles.optionButton }
        onPress={ () => navigation.navigate( "ScanFamilyQr" ) }
      >
        <Text style={ styles.optionButtonText }> QR 코드를 스캔한다 </Text>
      </Pressable>
      <Pressable
        style={ styles.optionButton }
        onPress={ () => navigation.navigate( "EnterFamilyCode" ) }
      >
        <Text style={ styles.optionButtonText }> 가족 코드 입력 </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create( {
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: commonColor.backgroundColor,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  qrWrapper: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  codeSection: {
    marginBottom: 40,
  },
  codeLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  codeLabel: {
    fontSize: 14,
    color: "#555",
  },
  codeActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    borderWidth: 1,
    borderColor: commonColor.touchable,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  iconButtonText: {
    color: commonColor.touchable,
    fontSize: 13,
    fontWeight: "600",
  },
  codeValue: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 4,
    marginTop: 12,
    textAlign: "center",
  },
  addFamilySection: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
} );

export default AddFamilyMemberScreen;
