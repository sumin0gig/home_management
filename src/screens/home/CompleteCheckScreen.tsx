import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../navigation/types";
import { useTaskStore } from "../../store/useTaskStore";
import { useRoomStore } from "../../store/useRoomStore";
import { useMascotStore } from "../../store/useMascotStore";
import {
  computeHappinessGain,
  computeHappinessLevel,
} from "../../utils/happiness";
import { pickPraise } from "../../utils/praise";
import Mascot from "../../components/Mascot/Mascot";
import type { MascotAction } from "../../components/Mascot/types";
import {
  getActionsUnlockedBetween,
  type ActionCatalogEntry,
} from "../../components/Mascot/actionCatalog";
import { useMascotConfig } from "../../components/Mascot/useMascotConfig";
import Fireworks from "../../components/Celebration/Fireworks";
import HappinessGauge from "../../components/Celebration/HappinessGauge";
import { colors, commonColor } from "../../styles/commonStyle";

type Props = NativeStackScreenProps<MainStackParamList, "CompleteCheck">;

const REST_MS = 500;
const SHEET_OPEN_MS = 250;
const PRAISE_POP_MS = 300;
const DRAG_CLOSE_DISTANCE = 80;
const PORTRAIT_SIZE = 200;
const FIREWORKS_SIZE = 320;
// 동그란 초상에 마스코트 상반신(머리·귀·몸통 앞부분)만 보이게 자르는 영역.
// 다리와 꼬리가 보이지 않고 귀가 잘리지 않는지 에뮬레이터에서 확인한다.
const PORTRAIT_VIEW_BOX = { x: 40, y: 22, width: 150, height: 150 };

// 직전에 보여준 칭찬 문구 (연달아 완료할 때 같은 문구를 피한다)
let lastPraise: string | undefined;

function LevelUpCard( {
  levelBefore,
  levelAfter,
  unlockedActions,
}: {
  levelBefore: number;
  levelAfter: number;
  unlockedActions: ActionCatalogEntry[];
} ): React.JSX.Element {
  return (
    <View style={ styles.levelUpCard } testID="level-up">
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
  );
}

function CompleteCheckScreen( { navigation, route }: Props ): React.JSX.Element {
  const { taskId, happinessBefore, variant } = route.params;
  const isFull = variant === "full";
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const task = useTaskStore( state =>
    state.tasks.find( t => t.id === taskId ),
  );
  const room = useRoomStore( state =>
    state.rooms.find( r => r.id === task?.roomId ),
  );
  const mascotConfig = useMascotConfig();
  const happinessAfter = useMascotStore( state => state.mascot?.happiness ?? 0 );

  const gain =
    mascotConfig && happinessBefore != null
      ? happinessAfter - happinessBefore
      : 0;
  const before = happinessAfter - gain;
  const levelBefore = computeHappinessLevel( before ).level;
  const levelAfter = computeHappinessLevel( happinessAfter ).level;
  const leveledUp = levelAfter > levelBefore;
  const unlockedActions = getActionsUnlockedBetween( levelBefore, levelAfter );

  const [praise] = React.useState( () => {
    const picked = pickPraise(
      {
        taskTitle: task?.title ?? "",
        roomType: room?.roomType ?? null,
        intervalDays: task ? computeHappinessGain( task ) : 0,
        lastOfDay: isFull,
        leveledUp,
      },
      Math.random,
      lastPraise,
    );
    lastPraise = picked;
    return picked;
  } );

  const close = React.useCallback( () => navigation.goBack(), [navigation] );

  const taskLine = task
    ? isFull
      ? `${task.title} 완료 · 오늘 할 일을 모두 끝냈어요`
      : `${task.title} 완료`
    : null;

  const gauge =
    gain > 0
      ? <HappinessGauge before={ before } after={ happinessAfter } />
      : null;

  const levelUpCard = leveledUp
    ? <LevelUpCard
        levelBefore={ levelBefore }
        levelAfter={ levelAfter }
        unlockedActions={ unlockedActions }
      />
    : null;

  // ─── 가벼운 시트 (기본) ──────────────────────────────────────────────
  const sheetY = useSharedValue( reduceMotion || isFull ? 0 : windowHeight );
  const praiseScale = useSharedValue( reduceMotion || isFull ? 1 : 0.85 );
  React.useEffect( () => {
    if (isFull || reduceMotion) {
      return;
    }
    sheetY.value = withTiming( 0, { duration: SHEET_OPEN_MS } );
    praiseScale.value = withDelay(
      SHEET_OPEN_MS,
      withTiming( 1, { duration: PRAISE_POP_MS } ),
    );
    // 처음 뜰 때 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [] );

  const dragGesture = Gesture.Pan()
  .onUpdate( event => {
    sheetY.value = Math.max( 0, event.translationY );
  } )
  .onEnd( event => {
    if (event.translationY >= DRAG_CLOSE_DISTANCE) {
      runOnJS( close )();
    } else {
      sheetY.value = withTiming( 0, { duration: 150 } );
    }
  } );

  const sheetStyle = useAnimatedStyle( () => ( {
    transform: [{ translateY: sheetY.value }],
  } ) );
  const praiseStyle = useAnimatedStyle( () => ( {
    transform: [{ scale: praiseScale.value }],
  } ) );

  // ─── 오늘의 마지막 할 일 (전체 화면) ──────────────────────────────────
  const [performanceIndex, setPerformanceIndex] = React.useState( 0 );
  const [isResting, setIsResting] = React.useState( false );
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

  const confirmButton = (
    <Pressable
      style={ styles.confirmButton }
      onPress={ close }
      accessibilityRole="button"
    >
      <Text style={ styles.confirmButtonText }> 확인 </Text>
    </Pressable>
  );

  if (!isFull) {
    return (
      <View style={ styles.lightRoot }>
        <Pressable
          style={ styles.overlay }
          onPress={ close }
          accessibilityRole="button"
          accessibilityLabel="닫기"
          testID="celebration-overlay"
        />
        <Animated.View
          style={ [
            styles.sheet,
            { paddingBottom: insets.bottom + 16, maxHeight: windowHeight * 0.9 },
            sheetStyle,
          ] }
          testID="celebration-sheet"
        >
          <GestureDetector gesture={ dragGesture }>
            <View>
              <View style={ styles.handleArea }>
                <View style={ styles.handle } />
              </View>
              <Animated.Text
                style={ [styles.lightPraise, praiseStyle] }
                accessibilityRole="header"
              >
                { praise }
              </Animated.Text>
              {
                taskLine
                ? <Text style={ styles.lightTaskLine }> { taskLine } </Text>
                : null
              }
            </View>
          </GestureDetector>
          <ScrollView bounces={ false } contentContainerStyle={ styles.lightBody }>
            { gauge }
            { levelUpCard }
          </ScrollView>
          { confirmButton }
        </Animated.View>
      </View>
    );
  }

  return (
    <View
      style={ [
        styles.fullRoot,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 },
      ] }
    >
      <ScrollView contentContainerStyle={ styles.fullContent }>
        <View style={ styles.portraitArea }>
          <View
            style={ [
              styles.portrait,
              { backgroundColor: room?.color ?? commonColor.touchableSoft },
            ] }
          >
            {
              mascotConfig
              ? <Mascot
                  config={ mascotConfig }
                  action={ action }
                  size={ PORTRAIT_SIZE }
                  viewBox={ PORTRAIT_VIEW_BOX }
                  onActionEnd={ () => setIsResting( true ) }
                />
              : null
            }
          </View>
          <Fireworks
            size={ FIREWORKS_SIZE }
            circleSize={ PORTRAIT_SIZE }
            roomColor={ room?.color }
            leveledUp={ leveledUp }
          />
        </View>

        <Text style={ styles.fullPraise } accessibilityRole="header">
          { praise }
        </Text>
        {
          taskLine
          ? <Text style={ styles.fullTaskLine }> { taskLine } </Text>
          : null
        }
        <View style={ styles.fullGauge }>
          { gauge }
        </View>
        { levelUpCard }
      </ScrollView>
      { confirmButton }
    </View>
  );
}

const styles = StyleSheet.create( {
  // 가벼운 시트
  lightRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: commonColor.overlay,
  },
  sheet: {
    backgroundColor: colors.default,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
  },
  handleArea: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: commonColor.border,
  },
  lightPraise: {
    fontSize: 20,
    fontWeight: "700",
    color: commonColor.textDefault,
    textAlign: "left",
    transformOrigin: "left center",
  },
  lightTaskLine: {
    fontSize: 12.5,
    color: commonColor.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  lightBody: {
    paddingBottom: 20,
  },
  // 오늘의 마지막 할 일
  fullRoot: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: colors.default,
  },
  fullContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 24,
  },
  portraitArea: {
    width: FIREWORKS_SIZE,
    height: FIREWORKS_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  portrait: {
    width: PORTRAIT_SIZE,
    height: PORTRAIT_SIZE,
    borderRadius: PORTRAIT_SIZE / 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  fullPraise: {
    fontSize: 28,
    fontWeight: "700",
    color: commonColor.textDefault,
    textAlign: "center",
    marginBottom: 8,
  },
  fullTaskLine: {
    fontSize: 15,
    color: commonColor.textMuted,
    textAlign: "center",
    marginBottom: 24,
  },
  fullGauge: {
    alignSelf: "stretch",
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
