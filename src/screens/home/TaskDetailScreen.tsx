import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import Toast from "react-native-root-toast";
import type { HomeStackParamList } from "../../navigation/types";
import {
  listTaskItems,
  useTaskStore,
  type TaskItemRow,
} from "../../store/useTaskStore";
import { formatDueLabel, toDateString } from "../../utils/date";
import { commonColor } from "../../styles/commonStyle";

type Props = NativeStackScreenProps<HomeStackParamList, "TaskDetail">;

function renderEditButton(onPress: () => void): React.JSX.Element {
  return (
    <Pressable onPress={ onPress } hitSlop={ 12 }>
      <Text style={ styles.editButtonText }> 수정 </Text>
    </Pressable>
  );
}

function TaskDetailScreen( { navigation, route }: Props ): React.JSX.Element {
  const { taskId } = route.params;
  const task = useTaskStore( state =>
    state.tasks.find( t => t.id === taskId ),
  );
  const completeTask = useTaskStore( state => state.completeTask );

  const [items, setItems] = React.useState<TaskItemRow[]>( [] );
  const [isLoading, setIsLoading] = React.useState( true );
  const [isCompleting, setIsCompleting] = React.useState( false );
  const [error, setError] = React.useState<string | null>( null );

  React.useEffect( () => {
    navigation.setOptions( {
      title: task?.title ?? "집안일",
      headerRight: () =>
        renderEditButton( () => navigation.navigate( "TaskForm", { taskId } ) ),
    } );
  }, [navigation, task, taskId] );

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
    <ScrollView style={ styles.screen } contentContainerStyle={ styles.container }>
      {
        dueLabel
        ? <Text style={ styles.dueLabel }> { dueLabel } </Text>
        : null
      }

      {
        error
        ? <Text style={ styles.error }> { error } </Text>
        : null
      }

      {
        isLoading
        ? <ActivityIndicator style={ styles.loading } />
        : null
      }

      {
        !isLoading && steps.length === 0 && tips.length === 0
        ? <Text style={ styles.emptyText }> 등록된 안내가 없습니다. </Text>
        : null
      }

      { steps.map( (step, index) => (
        <View style={ styles.stepRow } key={ step.id }>
          <Text style={ styles.stepNumber }> { index + 1 }. </Text>
          <Text style={ styles.stepContent }> { step.content } </Text>
        </View>
      ) ) }

      {
        tips.length > 0
        ? <View style={ styles.tipBox }>
            <Text style={ styles.tipLabel }> 💡 TIP </Text>
            { tips.map( tip => (
              <Text style={ styles.tipContent } key={ tip.id }>
                { tip.content }
              </Text>
            ) ) }
          </View>
        : null
      }

      <Pressable
        style={ styles.completeButton }
        onPress={ onComplete }
        disabled={ isCompleting }
      >
        {
          isCompleting
          ? <ActivityIndicator color="#fff" />
          : <Text style={ styles.completeButtonText }> 완료 </Text>
        }
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create( {
  screen: {
    flex: 1,
    backgroundColor: commonColor.backgroundColor,
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
  dueLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2f6fed",
    marginBottom: 16,
  },
  error: {
    color: "#d32f2f",
    marginBottom: 12,
    textAlign: "center",
  },
  loading: {
    marginTop: 24,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
  },
  stepRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  stepNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: commonColor.touchable,
    marginRight: 6,
  },
  stepContent: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: "#333",
  },
  tipBox: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff6e5",
  },
  tipLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#b8860b",
    marginBottom: 6,
  },
  tipContent: {
    fontSize: 14,
    lineHeight: 20,
    color: "#7a5c00",
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: commonColor.touchable,
  },
  completeButton: {
    backgroundColor: commonColor.touchable,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  completeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
} );

export default TaskDetailScreen;
