import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../navigation/types";
import { useTaskStore } from "../../store/useTaskStore";
import { computeHappinessGain } from "../../utils/happiness";
import Mascot from "../../components/Mascot/Mascot";
import type { MascotAction } from "../../components/Mascot/types";
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

// happy 점프 사이에 잠깐 쉬는 시간 — 쉬지 않고 뛰면 들뜬 게 아니라 떨리는 것처럼 보인다.
const HAPPY_PAUSE_MS = 500;
const MASCOT_SIZE = 220;

function CompleteCheckScreen( { navigation, route }: Props ): React.JSX.Element {
  const { taskId } = route.params;
  const insets = useSafeAreaInsets();
  const task = useTaskStore( state =>
    state.tasks.find( t => t.id === taskId ),
  );
  const mascotConfig = useMascotConfig();

  const [praise] = React.useState(
    () => PRAISE_MESSAGES[Math.floor( Math.random() * PRAISE_MESSAGES.length )],
  );
  const [action, setAction] = React.useState<MascotAction>( "happy" );

  // happy가 끝나면(onActionEnd) idle로 잠깐 쉬었다가 다시 happy — 화면에 있는 동안 계속 기뻐한다.
  React.useEffect( () => {
    if (action !== "idle") {
      return;
    }
    const timer = setTimeout( () => setAction( "happy" ), HAPPY_PAUSE_MS );
    return () => clearTimeout( timer );
  }, [action] );

  return (
    <View
      style={ [
        styles.screen,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 },
      ] }
    >
      <View style={ styles.content }>
        <View style={ styles.mascotCircle }>
          {
            mascotConfig
            ? <Mascot
                config={ mascotConfig }
                action={ action }
                size={ MASCOT_SIZE }
                onActionEnd={ () => setAction( "idle" ) }
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
          task && mascotConfig
          ? <View style={ styles.gainChip }>
              <Text style={ styles.gainText }>
                { `추억 +${computeHappinessGain( task )}` }
              </Text>
            </View>
          : null
        }
      </View>

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
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
