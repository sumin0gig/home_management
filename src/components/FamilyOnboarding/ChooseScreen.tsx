import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { signOutUser } from "../../../actions";
import OnboardingScaffold from "../Onboarding/OnboardingScaffold";
import OnboardingButton from "../Onboarding/OnboardingButton";
import Icon from "../common/Icon";
import { colors, commonColor } from "../../styles/commonStyle";
import { CREATE_TOTAL_STEPS, type FamilyOnboardingScreenProps } from "./types";

function ChoiceCard( {
  title,
  description,
  onPress,
}: {
  title: string;
  description: string;
  onPress: () => void;
} ): React.JSX.Element {
  return (
    <Pressable
      style={ ({ pressed }) => [styles.card, pressed && styles.cardPressed] }
      onPress={ onPress }
      accessibilityRole="button"
      accessibilityLabel={ `${title}, ${description}` }
    >
      <View style={ styles.cardBody }>
        <Text style={ styles.cardTitle }> { title } </Text>
        <Text style={ styles.cardDescription }> { description } </Text>
      </View>
      <Icon name="ChevronRight" size={ 16 } color={ commonColor.textSecondary } />
    </Pressable>
  );
}

function ChooseScreen( {
  navigation,
}: FamilyOnboardingScreenProps<"Choose"> ): React.JSX.Element {
  return (
    <OnboardingScaffold
      progress={ { step: 0, total: CREATE_TOTAL_STEPS, label: "시작하기" } }
      title="어떻게 시작할까요?"
      description="가족 한 명이 우리집을 만들고, 나머지는 초대받아 들어와요."
      footer={
        <OnboardingButton
          text="다른 계정으로 로그인"
          variant="link"
          onPress={ () => signOutUser() }
        />
      }
    >
      <View style={ styles.cards }>
        <ChoiceCard
          title="새로 시작하기"
          description="우리집을 만들고 가족을 초대해요"
          onPress={ () => navigation.navigate( "FamilyName" ) }
        />
        <ChoiceCard
          title="초대받았어요"
          description="가족이 보낸 코드나 QR로 참여해요"
          onPress={ () => navigation.navigate( "InviteCode" ) }
        />
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create( {
  cards: {
    gap: 10,
  },
  card: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    backgroundColor: colors.white,
  },
  cardPressed: {
    backgroundColor: colors.lightGray,
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: commonColor.textDefault,
  },
  cardDescription: {
    fontSize: 13,
    color: commonColor.textMuted,
  },
} );

export default ChooseScreen;
