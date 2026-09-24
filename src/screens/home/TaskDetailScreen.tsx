import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import Toast from "react-native-root-toast";
import type { MainStackParamList } from "../../navigation/types";
import {
  listTaskItems,
  useTaskStore,
  type TaskItemRow,
} from "../../store/useTaskStore";
import { roomDisplayName, useRoomStore } from "../../store/useRoomStore";
import { formatDueLabel, toDateString } from "../../utils/date";
import { splitTaskItemContent } from "../../utils/taskItem";
import { colors, commonColor } from "../../styles/commonStyle";
import Icon from "../../components/common/Icon";

type Props = NativeStackScreenProps<MainStackParamList, "TaskDetail">;

function renderEditButton(onPress: () => void): React.JSX.Element {
  return (
    <Pressable onPress={ onPress } hitSlop={ 12 }>
      <Text style={ styles.editButtonText }> 수정 </Text>
    </Pressable>
  );
}

function TaskDetailScreen( { navigation, route }: Props ): React.JSX.Element {
  const { taskId } = route.params;
  const insets = useSafeAreaInsets();
  const task = useTaskStore( state =>
    state.tasks.find( t => t.id === taskId ),
  );
  const room = useRoomStore( state =>
    state.rooms.find( r => r.id === task?.roomId ),
  );
  const completeTask = useTaskStore( state => state.completeTask );

  const [items, setItems] = React.useState<TaskItemRow[]>( [] );
  const [isLoading, setIsLoading] = React.useState( true );
  const [isCompleting, setIsCompleting] = React.useState( false );
  const [error, setError] = React.useState<string | null>( null );

  React.useEffect( () => {
    navigation.setOptions( {
      headerRight: () =>
        renderEditButton( () => navigation.navigate( "TaskForm", { taskId } ) ),
    } );
  }, [navigation, taskId] );

  React.useEffect( () => {
    setIsLoading( true );
    listTaskItems( taskId )
      .then( setItems )
      .catch( err => setError( (err as Error).message ) )
      .finally( () => setIsLoading( false ) );
  }, [taskId] );

  if (!task) {
    return (
      <View style={ styles.centerContainer }>
        <Text style={ styles.emptyText }> 집안일을 찾을 수 없습니다. </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={ styles.centerContainer }>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const today = toDateString( new Date() );
  const dueLabel = formatDueLabel( task.nextDueDate, today );
  const steps = items.filter( item => item.type === "DEFAULT" );
  const tips = items.filter( item => item.type === "TIP" );

  const onComplete = async () => {
    setIsCompleting( true );
    try {
      await completeTask( task );
      Toast.show( "완료되었습니다", { duration: Toast.durations.SHORT } );
      navigation.goBack();
    } catch (err) {
      setError( (err as Error).message );
    } finally {
      setIsCompleting( false );
    }
  };

  return (
    <View style={ styles.screen }>
      <ScrollView
        style={ styles.scroll }
        contentContainerStyle={ styles.container }
      >
        <View style={ styles.topRow }>
          {
            room
            ? <View
                testID="room-badge"
                style={ [
                  styles.roomBadge,
                  { backgroundColor: room.color ?? colors.lightGray },
                ] }
              >
                <Text style={ styles.roomBadgeText }>
                  { `${roomDisplayName( room )} 청소` }
                </Text>
              </View>
            : null
          }
          {
            dueLabel
            ? <Text style={ styles.dueLabel }> { dueLabel } </Text>
            : null
          }
        </View>

        <Text style={ styles.title }> { task.title } </Text>

        {
          error
          ? <Text style={ styles.error }> { error } </Text>
          : null
        }

        {
          steps.length === 0 && tips.length === 0
          ? <Text style={ styles.emptyText }> 등록된 안내가 없습니다. </Text>
          : null
        }

        { steps.map( (step, index) => {
          const { title, description } = splitTaskItemContent( step.content );
          return (
            <View style={ styles.stepCard } key={ step.id }>
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
      </ScrollView>
      <View style={ [styles.bottomBar, { paddingBottom: insets.bottom + 16 }] }>
        <Pressable
          style={ styles.completeButton }
          onPress={ onComplete }
          disabled={ isCompleting }
        >
          {
            isCompleting
            ? <ActivityIndicator color={ colors.white } />
            : <View style={ styles.completeContent }>
                <Icon name="CheckCircle" size={ 20 } color={ colors.white } />
                <Text style={ styles.completeButtonText }> 완료했어요 </Text>
              </View>
          }
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create( {
  screen: {
    flex: 1,
    backgroundColor: commonColor.backgroundColor,
  },
  scroll: {
    flex: 1,
  },
  container: {
    padding: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: commonColor.backgroundColor,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  roomBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  roomBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: commonColor.textDefault,
  },
  dueLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: commonColor.info,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: commonColor.textDefault,
    marginBottom: 20,
  },
  error: {
    color: commonColor.error,
    marginBottom: 12,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray,
  },
  stepCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: commonColor.divider,
    borderRadius: 16,
    backgroundColor: colors.white,
    marginBottom: 12,
  },
  stepBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: commonColor.touchableSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeText: {
    fontSize: 16,
    fontWeight: "700",
    color: commonColor.touchable,
  },
  stepBody: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: commonColor.textDefault,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: commonColor.textMuted,
    marginTop: 4,
  },
  tipBox: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.tipBackground,
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
  editButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: commonColor.touchable,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: commonColor.backgroundColor,
  },
  completeButton: {
    backgroundColor: commonColor.touchable,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  completeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  completeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
} );

export default TaskDetailScreen;
