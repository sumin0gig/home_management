import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Clipboard from "@react-native-clipboard/clipboard";
import QRCode from "react-native-qrcode-svg";
import Toast from "react-native-root-toast";
import type { MainStackParamList } from "../../navigation/types";
import { useFamilyStore } from "../../store/useFamilyStore";
import { buildInviteMessage } from "../../utils/invite";
import { colors, commonColor } from "../../styles/commonStyle";

type Props = NativeStackScreenProps<MainStackParamList, "AddFamilyMember">;

const MONOSPACE = Platform.select( { ios: "Menlo", default: "monospace" } );

function AddFamilyMemberScreen( { navigation }: Props ): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const family = useFamilyStore( state => state.family );

  React.useEffect( () => {
    navigation.setOptions( { title: "가족 초대" } );
  }, [navigation] );

  if (!family) {
    return (
      <View style={ [styles.screen, styles.centered] }>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const message = buildInviteMessage( family.name, family.inviteCode );

  const onCopy = () => {
    Clipboard.setString( family.inviteCode );
    Toast.show( "복사했어요", { duration: Toast.durations.SHORT } );
  };

  const onShare = () => Share.share( { message } );

  return (
    <View style={ styles.screen }>
      <ScrollView contentContainerStyle={ styles.content }>
        <Text style={ styles.title } accessibilityRole="header">
          함께 집안일을 나눌 가족을 초대하세요
        </Text>

        <View style={ styles.qrCard }>
          <QRCode value={ family.inviteCode } size={ 150 } />
        </View>

        <Text
          style={ [styles.code, { fontFamily: MONOSPACE }] }
          accessibilityLabel={
            `초대 코드 ${family.inviteCode.split( "" ).join( " " )}`
          }
        >
          { family.inviteCode }
        </Text>
        <Pressable
          onPress={ onCopy }
          hitSlop={ 10 }
          style={ styles.copyButton }
          accessibilityRole="button"
        >
          <Text style={ styles.copyText }> 코드 복사 </Text>
        </Pressable>

        <View style={ styles.previewBox }>
          <Text style={ styles.previewLabel }> 보내는 메시지 </Text>
          <Text style={ styles.previewText } testID="invite-message-preview">
            { message }
          </Text>
        </View>
      </ScrollView>

      <View style={ [styles.footer, { paddingBottom: insets.bottom + 16 }] }>
        <Pressable
          style={ ({ pressed }) => [
            styles.shareButton,
            pressed && styles.shareButtonPressed,
          ] }
          onPress={ onShare }
          accessibilityRole="button"
        >
          <Text style={ styles.shareText }> 초대 메시지 보내기 </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create( {
  screen: {
    flex: 1,
    backgroundColor: colors.default,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: commonColor.textDefault,
    textAlign: "center",
    marginBottom: 20,
  },
  qrCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: commonColor.subtleBorder,
    backgroundColor: colors.white,
    marginBottom: 20,
  },
  code: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 6,
    color: commonColor.textDefault,
  },
  copyButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  copyText: {
    fontSize: 14,
    fontWeight: "700",
    color: commonColor.touchable,
  },
  previewBox: {
    alignSelf: "stretch",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: commonColor.subtleBorder,
    backgroundColor: colors.white,
    gap: 6,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: commonColor.textSecondary,
  },
  previewText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: commonColor.textDefault,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  shareButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: commonColor.touchable,
  },
  shareButtonPressed: {
    opacity: 0.85,
  },
  shareText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },
} );

export default AddFamilyMemberScreen;
