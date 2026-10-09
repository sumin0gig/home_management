import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../navigation/types";
import { useTaskStore } from "../../store/useTaskStore";
import { useMascotStore } from "../../store/useMascotStore";
import { computeHappinessLevel } from "../../utils/happiness";
import Mascot from "../../components/Mascot/Mascot";
import type { MascotAction } from "../../components/Mascot/types";
import { getActionsUnlockedBetween } from "../../components/Mascot/actionCatalog";
import { useMascotConfig } from "../../components/Mascot/useMascotConfig";
import Icon from "../../components/common/Icon";
import { colors, commonColor } from "../../styles/commonStyle";

type Props = NativeStackScreenProps<MainStackParamList, "CompleteCheck">;

export const PRAISE_MESSAGES = [
  "정말 잘했어요!",
  "최고예요!",
  "덕분에 집이 반짝반짝해요!",
  "오늘도 해냈어요!",
] as const;

const REST_MS = 500;
const MASCOT_SIZE = 220;

function CompleteCheckScreen( { navigation, route }: Props ): React.JSX.Element {
  const { taskId, happinessBefore } = route.params;
  const insets = useSafeAreaInsets();
  const task = useTaskStore( state =>
    state.tasks.find( t => t.id === taskId ),
  );
  const mascotConfig = useMascotConfig();
  const happinessAfter = useMascotStore( state => state.mascot?.happiness ?? 0 );

  const [praise] = React.useState(
    () => PRAISE_MESSAGES[Math.floor( Math.random() * PRAISE_MESSAGES.length )],
  );
  const [performanceIndex, setPerformanceIndex] = React.useState( 0 );
  const [isResting, setIsResting] = React.useState( false );

  const gain =
    mascotConfig && happinessBefore != null
      ? happinessAfter - happinessBefore
      : 0;
  const levelBefore = computeHappinessLevel( happinessAfter - gain ).level;
  const levelAfter = computeHappinessLevel( happinessAfter ).level;
  const unlockedActions = getActionsUnlockedBetween( levelBefore, levelAfter );

  const performances: MascotAction[] = [
    "happy",
    ...unlockedActions.map( entry => entry.action ),
  ];
  const action: MascotAction = isResting
    ? "idle"
    : performances[performanceIndex % performances.length];

  React.useEffect( () => {
    if (!isResting) {
      return;
    }
    const timer = setTimeout( () => {
      setIsResting( false );
      setPerformanceIndex( index => index + 1 );
    }, REST_MS );
    return () => clearTimeout( timer );
  }, [isResting] );

  return (
    <View
      style={ [
        styles.screen,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 },
      ] }
    >
      <ScrollView contentContainerStyle={ styles.content }>
        <View style={ styles.mascotCircle }>
          {
            mascotConfig
            ? <Mascot
                config={ mascotConfig }
                action={ action }
                size={ MASCOT_SIZE }
                onActionEnd={ () => setIsResting( true ) }
              />
            : <Icon name="CheckCircle" size={ 96 } color={ commonColor.touchable } />
          }
        </View>

        <Text style={ styles.praise }> { praise } </Text>
        {
          task
          ? <Text style={ styles.taskTitle }> { `${task.title} 완료` } </Text>
          : null
        }
        {
          gain > 0
          ? <View style={ styles.gainChip }>
              <Text style={ styles.gainText }> { `추억 +${gain}` } </Text>
            </View>
          : null
        }

        {
          levelAfter > levelBefore
          ? <View style={ styles.levelUpCard } testID="level-up">
              <Text style={ styles.levelUpTitle }> 레벨 업! </Text>
              <Text style={ styles.levelUpLevel }>
                { `추억 Lv. ${levelBefore} → ${levelAfter}` }
              </Text>
              {
                unlockedActions.length > 0
                ? <View style={ styles.unlockSection }>
                    <Text style={ styles.unlockLabel }> 새로 열린 행동 </Text>
                    <View style={ styles.unlockList }>
                      { unlockedActions.map( entry => (
                        <View style={ styles.unlockChip } key={ entry.action }>
                          <Text style={ styles.unlockChipText }> { entry.label } </Text>
                        </View>
                      ) ) }
                    </View>
                  </View>
                : null
              }
            </View>
          : null
        }
      </ScrollView>

      <Pressable
        style={ styles.confirmButton }
        onPress={ () => navigation.goBack() }
      >
        <Text style={ styles.confirmButtonText }> 확인 </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create( {
  screen: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: commonColor.backgroundColor,
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 24,
  },
  mascotCircle: {
    width: MASCOT_SIZE + 40,
    height: MASCOT_SIZE + 40,
    borderRadius: (MASCOT_SIZE + 40) / 2,
    backgroundColor: commonColor.touchableSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  praise: {
    fontSize: 28,
    fontWeight: "700",
    color: commonColor.textDefault,
    textAlign: "center",
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    color: commonColor.textMuted,
    textAlign: "center",
    marginBottom: 20,
  },
  gainChip: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: commonColor.touchableSoft,
  },
  gainText: {
    fontSize: 15,
    fontWeight: "700",
    color: commonColor.touchable,
  },
  levelUpCard: {
    alignSelf: "stretch",
    alignItems: "center",
    marginTop: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: commonColor.touchable,
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  levelUpTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: commonColor.touchable,
    marginBottom: 4,
  },
  levelUpLevel: {
    fontSize: 15,
    fontWeight: "600",
    color: commonColor.textDefault,
  },
  unlockSection: {
    alignItems: "center",
    marginTop: 16,
  },
  unlockLabel: {
    fontSize: 13,
    color: commonColor.textMuted,
    marginBottom: 8,
  },
  unlockList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  unlockChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: commonColor.touchable,
  },
  unlockChipText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },
  confirmButton: {
    backgroundColor: commonColor.touchable,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
} );

export default CompleteCheckScreen;
