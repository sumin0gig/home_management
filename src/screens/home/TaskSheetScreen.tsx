import React from "react";
import {
  ActivityIndicator,
  BackHandler,
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
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../navigation/types";
import { listTaskItems, listTaskLogs } from "../../../actions";
import {
  useTaskStore,
  type TaskItemRow,
  type TaskLogRow,
} from "../../store/useTaskStore";
import { roomDisplayName, useRoomStore } from "../../store/useRoomStore";
import { useMascotStore } from "../../store/useMascotStore";
import {
  formatDateWithWeekday,
  formatDueStatus,
  formatRecurrence,
  getDueStatus,
  isDueByToday,
  parseDateString,
  toDateString,
} from "../../utils/date";
import { splitTaskItemContent } from "../../utils/taskItem";
import {
  colors,
  commonColor,
  dueStatusColor,
} from "../../styles/commonStyle";
import Icon from "../../components/common/Icon";

type Props = NativeStackScreenProps<MainStackParamList, "TaskSheet">;

const SHEET_HEIGHT_RATIO = 0.9;
const OPEN_DURATION = 250;
// 손잡이·머리줄을 이만큼 이상 아래로 끌면 닫는다.
const DRAG_CLOSE_DISTANCE = 80;
const RECENT_LOG_LIMIT = 10;

// "10월 16일" (올해가 아니면 연도를 붙인다)
function formatMonthDay(value: string, today: Date): string {
  const date = parseDateString( value );
  const monthDay = `${date.getMonth() + 1}월 ${date.getDate()}일`;
  return date.getFullYear() === today.getFullYear()
    ? monthDay
    : `${date.getFullYear()}년 ${monthDay}`;
}

function logDate(log: TaskLogRow): string {
  return toDateString( new Date( log.completedAt ) );
}

function TaskSheetScreen( { navigation, route }: Props ): React.JSX.Element {
  const { taskId } = route.params;
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = windowHeight * SHEET_HEIGHT_RATIO;
  const reduceMotion = useReducedMotion();

  const task = useTaskStore( state =>
    state.tasks.find( t => t.id === taskId ),
  );
  const room = useRoomStore( state =>
    state.rooms.find( r => r.id === task?.roomId ),
  );
  const completeTask = useTaskStore( state => state.completeTask );

  const [items, setItems] = React.useState<TaskItemRow[]>( [] );
  const [logs, setLogs] = React.useState<TaskLogRow[]>( [] );
  const [isLoading, setIsLoading] = React.useState( true );
  const [isCompleting, setIsCompleting] = React.useState( false );
  const [error, setError] = React.useState<string | null>( null );
  // 상태 갱신 전에 두 번 눌러도 완료 요청은 한 번만 보낸다.
  const completingRef = React.useRef( false );

  // 시트가 아래에서 올라오는 움직임. 움직임 줄이기 설정이면 바로 표시한다.
  const translateY = useSharedValue( reduceMotion ? 0 : sheetHeight );
  React.useEffect( () => {
    translateY.value = reduceMotion
      ? 0
      : withTiming( 0, { duration: OPEN_DURATION } );
  }, [reduceMotion, translateY] );

  const close = React.useCallback( () => navigation.goBack(), [navigation] );

  // Android 뒤로 가기도 닫기. (화면이라 기본 동작도 goBack이지만, 완료 중에는
  // 막아서 요청이 끝나기 전에 시트가 사라지지 않게 한다.)
  React.useEffect( () => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => completingRef.current,
    );
    return () => subscription.remove();
  }, [] );

  React.useEffect( () => {
    setIsLoading( true );
    Promise.all( [listTaskItems( taskId ), listTaskLogs( taskId, RECENT_LOG_LIMIT )] )
    .then( ( [loadedItems, loadedLogs] ) => {
      setItems( loadedItems );
      setLogs( loadedLogs );
    } )
    .catch( err => setError( (err as Error).message ) )
    .finally( () => setIsLoading( false ) );
  }, [taskId] );

  const dragGesture = Gesture.Pan()
  .onUpdate( event => {
    translateY.value = Math.max( 0, event.translationY );
  } )
  .onEnd( event => {
    if (event.translationY >= DRAG_CLOSE_DISTANCE) {
      runOnJS( close )();
    } else {
      translateY.value = withTiming( 0, { duration: 150 } );
    }
  } );

  const sheetStyle = useAnimatedStyle( () => ( {
    transform: [{ translateY: translateY.value }],
  } ) );

  const now = new Date();
  const today = toDateString( now );

  const onComplete = () => {
    if (!task || completingRef.current) {
      return;
    }
    completingRef.current = true;
    const mascot = useMascotStore.getState().mascot;
    const happinessBefore = mascot ? mascot.happiness ?? 0 : undefined;
    const previousDueDate = task.nextDueDate;
    setError( null );
    setIsCompleting( true );
    return completeTask( task )
    .then( ok => {
      if (!ok) {
        completingRef.current = false;
        setIsCompleting( false );
        setError( useTaskStore.getState().error );
        return;
      }
      // 오늘 할 일이었고, 완료 후 가족 전체에 오늘까지 할 일이 하나도 안 남았으면
      // 오늘의 마지막 할 일. 기한 전(이번 주) 일을 미리 끝낸 건 마지막이 아니다.
      const remaining = useTaskStore.getState().tasks.filter( t =>
        isDueByToday( t.nextDueDate, today ),
      );
      const lastOfDay =
        isDueByToday( previousDueDate, today ) && remaining.length === 0;
      navigation.replace( "CompleteCheck", {
        taskId: task.id,
        happinessBefore,
        previousDueDate,
        variant: lastOfDay ? "full" : "light",
      } );
    } );
  };

  const steps = items.filter( item => item.type === "DEFAULT" );
  const tips = items.filter( item => item.type === "TIP" );
  const lastLog = logs[0];

  const renderBody = (): React.JSX.Element => {
    if (!task) {
      return <Text style={ styles.emptyText }> 집안일을 찾을 수 없습니다. </Text>;
    }
    const dueStatus = getDueStatus( task.nextDueDate, today );
    return (
      <>
        <View style={ styles.topRow }>
          {
            room
            ? <View testID="room-badge" style={ styles.roomBadge }>
                <View
                  style={ [
                    styles.roomSwatch,
                    { backgroundColor: room.color ?? colors.lightGray },
                  ] }
                />
                <Text style={ styles.roomBadgeText }> { roomDisplayName( room ) } </Text>
              </View>
            : null
          }
          <Text
            style={ [styles.dueLabel, { color: dueStatusColor( dueStatus.kind ) }] }
          >
            { formatDueStatus( dueStatus ) }
          </Text>
        </View>

        <Text style={ styles.title }> { task.title } </Text>
        <Text style={ styles.meta }>
          {
            `${formatRecurrence( task )} · ${
              lastLog
                ? `마지막 완료 ${formatMonthDay( logDate( lastLog ), now )} · ${lastLog.completedByName}`
                : "아직 완료 기록이 없어요"
            }`
          }
        </Text>

        {
          isLoading
          ? <ActivityIndicator style={ styles.loading } />
          : <>
              {
                steps.length === 0
                ? <Text style={ styles.emptyText }>
                    등록된 방법이 없어요. 수정에서 추가할 수 있어요.
                  </Text>
                : <View style={ styles.stepsCard }>
                    { steps.map( (step, index) => {
                      const { title, description } = splitTaskItemContent( step.content );
                      return (
                        <View
                          style={ [styles.stepRow, index > 0 && styles.stepDivider] }
                          key={ step.id }
                        >
                          <View style={ styles.stepBadge }>
                            <Text style={ styles.stepBadgeText }> { index + 1 } </Text>
                          </View>
                          <View style={ styles.stepBody }>
                            <Text style={ styles.stepTitle }> { title } </Text>
                            {
                              description
                              ? <Text style={ styles.stepDescription }> { description } </Text>
                              : null
                            }
                          </View>
                        </View>
                      );
                    } ) }
                  </View>
              }

              {
                tips.length > 0
                ? <View style={ styles.tipBox }>
                    <View style={ styles.tipLabelRow }>
                      <Icon name="Lightbulb" size={ 14 } />
                      <Text style={ styles.tipLabel }> TIP </Text>
                    </View>
                    { tips.map( tip => (
                      <Text style={ styles.tipContent } key={ tip.id }>
                        { tip.content }
                      </Text>
                    ) ) }
                  </View>
                : null
              }

              <Text style={ styles.sectionTitle }> 완료 기록 </Text>
              {
                logs.length === 0
                ? <Text style={ styles.emptyText }> 아직 완료 기록이 없어요 </Text>
                : logs.map( log => (
                    <Text key={ log.id } style={ styles.logItem }>
                      { `${formatDateWithWeekday( logDate( log ), now )} · ${log.completedByName}` }
                    </Text>
                  ) )
              }
            </>
        }
      </>
    );
  };

  return (
    <View style={ styles.root }>
      <Pressable
        style={ styles.overlay }
        onPress={ close }
        accessibilityRole="button"
        accessibilityLabel="닫기"
        testID="sheet-overlay"
      />
      <Animated.View
        style={ [styles.sheet, { height: sheetHeight }, sheetStyle] }
        accessibilityViewIsModal
      >
        <GestureDetector gesture={ dragGesture }>
          <View testID="sheet-drag-area">
            <View style={ styles.handleArea }>
              <View style={ styles.handle } />
            </View>
            <View style={ styles.header }>
              <Icon
                name="Close"
                size={ 20 }
                color={ commonColor.textDefault }
                onPress={ close }
                accessibilityLabel="닫기"
              />
              {
                task
                ? <Pressable
                    onPress={ () => navigation.replace( "TaskForm", { taskId } ) }
                    hitSlop={ 12 }
                    accessibilityRole="button"
                  >
                    <Text style={ styles.editText }> 수정 </Text>
                  </Pressable>
                : null
              }
            </View>
          </View>
        </GestureDetector>

        <ScrollView
          style={ styles.scroll }
          contentContainerStyle={ styles.scrollContent }
        >
          {
            error
            ? <Text style={ styles.error }> { error } </Text>
            : null
          }
          { renderBody() }
        </ScrollView>

        {
          task
          ? <View style={ [styles.bottomBar, { paddingBottom: insets.bottom + 16 }] }>
              <Pressable
                style={ [styles.completeButton, isCompleting && styles.completeButtonDisabled] }
                onPress={ onComplete }
                disabled={ isCompleting }
                accessibilityRole="button"
                accessibilityState={ { disabled: isCompleting } }
              >
                <Text style={ styles.completeButtonText }>
                  { isCompleting ? "완료 중…" : "완료" }
                </Text>
              </Pressable>
            </View>
          : null
        }
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create( {
  root: {
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
    overflow: "hidden",
  },
  handleArea: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: commonColor.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  editText: {
    fontSize: 15,
    fontWeight: "600",
    color: commonColor.touchable,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  loading: {
    marginTop: 24,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  roomBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  roomSwatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  roomBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: commonColor.textMuted,
  },
  dueLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: commonColor.textDefault,
    marginBottom: 6,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    color: commonColor.textMuted,
    marginBottom: 20,
  },
  error: {
    color: commonColor.error,
    marginBottom: 12,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: commonColor.textMuted,
    marginBottom: 16,
  },
  stepsCard: {
    borderWidth: 1,
    borderColor: commonColor.subtleBorder,
    borderRadius: 16,
    backgroundColor: colors.white,
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
  },
  stepDivider: {
    borderTopWidth: 1,
    borderTopColor: commonColor.subtleBorder,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: commonColor.touchableSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: commonColor.touchable,
  },
  stepBody: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: commonColor.textDefault,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: commonColor.textMuted,
    marginTop: 2,
  },
  tipBox: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.tipBackground,
    marginBottom: 12,
  },
  tipLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  tipLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.tipLabel,
  },
  tipContent: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.tipContent,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: commonColor.textDefault,
    marginTop: 12,
    marginBottom: 8,
  },
  logItem: {
    fontSize: 14,
    color: commonColor.textMuted,
    paddingVertical: 4,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: commonColor.subtleBorder,
    backgroundColor: colors.default,
  },
  completeButton: {
    backgroundColor: commonColor.touchable,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
} );

export default TaskSheetScreen;
