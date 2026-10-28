import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRoomStore } from "../../store/useRoomStore";
import { useMascotConfig } from "../Mascot/useMascotConfig";
import Mascot from "../Mascot/Mascot";
import OnboardingScaffold from "./OnboardingScaffold";
import OnboardingButton from "./OnboardingButton";
import FloorPlanIllustration from "./FloorPlanIllustration";
import { colors, commonColor } from "../../styles/commonStyle";

interface Props {
  isOwner: boolean;
  onStart: () => void;
  // 관리자만: 홈으로 들어간 뒤 가족 초대 화면을 연다
  onInvite?: () => void;
}

const TIPS = [
  { title: "집안일을 누르면 방법이 보여요", body: "다 하면 맨 아래 “완료”를 눌러요." },
  { title: "오늘 할 일을 모두 끝내면", body: "마스코트가 크게 축하해줘요." },
];
const OWNER_TIP = {
  title: "가족을 초대해서 나눠 해요",
  body: "설정 → 가족 관리에서도 할 수 있어요.",
};

// 마스코트를 처음 만든 직후 한 번 보여주는 "우리집 준비 완료" 화면.
function WelcomeScreen( { isOwner, onStart, onInvite }: Props ): React.JSX.Element {
  const rooms = useRoomStore( state => state.rooms );
  const mascotConfig = useMascotConfig();
  const tips = isOwner ? [...TIPS, OWNER_TIP] : TIPS;

  return (
    <OnboardingScaffold
      title="우리집 준비 완료!"
      titleAlign="center"
      footer={
        <>
          {
            isOwner && onInvite
            ? <OnboardingButton text="가족 초대하기" variant="secondary" onPress={ onInvite } />
            : null
          }
          <OnboardingButton text="시작하기" onPress={ onStart } />
        </>
      }
    >
      <View style={ styles.picture }>
        <FloorPlanIllustration
          rooms={ rooms.map( room => ( {
            roomType: room.roomType ?? "GENERAL_ROOM",
            label: room.label ?? undefined,
            color: room.color,
            x: room.x,
            y: room.y,
            width: room.width,
            height: room.height,
          } ) ) }
          fill="room"
        />
        {
          mascotConfig
          ? <View style={ styles.mascot } pointerEvents="none">
              <Mascot config={ mascotConfig } action="happy" size={ 120 } />
            </View>
          : null
        }
      </View>

      <View style={ styles.card }>
        { tips.map( (tip, index) => (
          <View key={ tip.title } style={ [styles.tip, index > 0 && styles.tipDivider] }>
            <View style={ styles.tipNumber }>
              <Text style={ styles.tipNumberText }> { index + 1 } </Text>
            </View>
            <View style={ styles.tipBody }>
              <Text style={ styles.tipTitle }> { tip.title } </Text>
              <Text style={ styles.tipText }> { tip.body } </Text>
            </View>
          </View>
        ) ) }
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create( {
  picture: {
    marginBottom: 24,
    justifyContent: "center",
  },
  mascot: {
    position: "absolute",
    alignSelf: "center",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: commonColor.subtleBorder,
    backgroundColor: colors.white,
  },
  tip: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  tipDivider: {
    borderTopWidth: 1,
    borderTopColor: commonColor.subtleBorder,
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: commonColor.touchableSoft,
  },
  tipNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: commonColor.touchable,
  },
  tipBody: {
    flex: 1,
    gap: 2,
  },
  tipTitle: {
    fontSize: 14.5,
    fontWeight: "700",
    color: commonColor.textDefault,
  },
  tipText: {
    fontSize: 13,
    color: commonColor.textMuted,
  },
} );

export default WelcomeScreen;
