import React from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../navigation/types";
import { useTaskStore } from "../../store/useTaskStore";
import { dueDateOnSave, toDateString } from "../../utils/date";
import { listTaskItems, listTaskLogs } from "../../../actions";
import {
  type TaskInput,
  type TaskItemInput,
  type TaskLogRow,
} from "../../store/useTaskStore";
import { colors, commonColor } from "../../styles/commonStyle";
import DefaultButton from "../../components/common/DefaultButton";
import TaskItemListEditor from "../../components/TaskItemListEditor/TaskItemListEditor";
import RecurrencePicker from "../../components/RecurrencePicker/RecurrencePicker";
import RecurrencePreview from "../../components/RecurrencePicker/RecurrencePreview";
import {
  buildRecurrence,
  draftFromTask,
  type RecurrenceDraft,
} from "../../components/RecurrencePicker/recurrenceDraft";

type Props = NativeStackScreenProps<MainStackParamList, "TaskForm">;

// 빈 칸으로 남겨둔 항목은 저장하지 않는다.
function toTaskItemInputs(
  contents: string[],
  type: TaskItemInput["type"],
): TaskItemInput[] {
  return contents
    .map( content => content.trim() )
    .filter( content => content.length > 0 )
    .map( content => ( { type, content } ) );
}

function TaskFormScreen( { navigation, route }: Props ): React.JSX.Element {
  const taskId = route.params?.taskId;
  const isEditMode = Boolean( taskId );

  const tasks = useTaskStore( state => state.tasks );
  const createTask = useTaskStore( state => state.createTask );
  const updateTask = useTaskStore( state => state.updateTask );
  const deleteTask = useTaskStore( state => state.deleteTask );

  const existingTask = React.useMemo(
    () => tasks.find( t => t.id === taskId ),
    [tasks, taskId],
  );

  const roomId = existingTask?.roomId ?? route.params?.roomId ?? null;
  const [title, setTitle] = React.useState( existingTask?.title ?? "" );
  const [recurrenceDraft, setRecurrenceDraft] = React.useState<RecurrenceDraft>(
    () => draftFromTask( existingTask ),
  );
  const [isSaving, setIsSaving] = React.useState( false );
  const [error, setError] = React.useState<string | null>( null );
  const [logs, setLogs] = React.useState<TaskLogRow[]>( [] );
  const [steps, setSteps] = React.useState<string[]>( [] );
  const [tips, setTips] = React.useState<string[]>( [] );
  // 수정 모드에서 기존 안내 항목을 다 불러오기 전에 저장하면 빈 목록으로 덮어쓰게 되므로,
  // 불러오기 전에는 items를 보내지 않는다(= 기존 항목 유지).
  const [itemsLoaded, setItemsLoaded] = React.useState( !taskId );

  React.useEffect( () => {
    navigation.setOptions( {
      title: isEditMode ? "집안일 수정" : "집안일 추가",
    } );
  }, [navigation, isEditMode] );

  React.useEffect( () => {
    if (taskId) {
      listTaskLogs( taskId )
      .then( setLogs )
      .catch( err => setError( (err as Error).message ) );
    }
  }, [taskId] );

  React.useEffect( () => {
    if (taskId) {
      listTaskItems( taskId )
      .then( loaded => {
        setSteps(
          loaded.filter( i => i.type === "DEFAULT" ).map( i => i.content ),
        );
        setTips( loaded.filter( i => i.type === "TIP" ).map( i => i.content ) );
        setItemsLoaded( true );
      } )
      .catch( err => setError( (err as Error).message ) );
    }
  }, [taskId] );

  // 저장할 반복 설정. 아직 저장할 수 없는 입력이면 recurrence 대신 안내 문구(error)
  const built = buildRecurrence( recurrenceDraft );

  // 다음 예정 미리보기: 추가는 오늘 포함 첫 차례, 수정은 저장될 기한
  // (반복 설정을 바꿨을 때만 새 기한, 아니면 지금 기한 그대로)
  const newDueDate = built.recurrence
    ? dueDateOnSave( existingTask, built.recurrence, new Date() )
    : null;
  const previewDueDate = built.recurrence
    ? newDueDate ?? existingTask?.nextDueDate ?? null
    : null;
  const willChangeDueDate =
    existingTask !== undefined &&
    newDueDate !== null &&
    newDueDate !== existingTask.nextDueDate;

  // 저장/삭제 결과: 성공하면 이전 화면으로, 실패하면 store에 남은 에러를 보여준다
  const goBackOrShowError = (ok: boolean) =>
    ok ? navigation.goBack() : setError( useTaskStore.getState().error );

  const onSubmit = () => {
    if (!roomId) {
      setError( "방을 선택해주세요." );
      return;
    }
    if (!title.trim()) {
      setError( "집안일 명을 입력해주세요." );
      return;
    }
    if (!built.recurrence) {
      setError( built.error );
      return;
    }
    const input: TaskInput = {
      title: title.trim(),
      ...built.recurrence,
      items: itemsLoaded
        ? [
            ...toTaskItemInputs( steps, "DEFAULT" ),
            ...toTaskItemInputs( tips, "TIP" ),
          ]
        : undefined,
    };

    setIsSaving( true );
    setError( null );
    const save =
      isEditMode && taskId
        ? updateTask( taskId, input, roomId )
        : createTask( roomId, input );
    return save.then( goBackOrShowError ).finally( () => setIsSaving( false ) );
  };

  const onDelete = () => {
    if (!taskId) {
      return;
    }
    Alert.alert(
      "집안일 삭제",
      `'${title}' 항목을 삭제할까요? 이 집안일의 완료 기록도 모두 함께 삭제되며, 되돌릴 수 없습니다.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: () => deleteTask( taskId ).then( goBackOrShowError ),
        },
      ],
    );
  };

  return (
    <ScrollView
      style={ styles.screen }
      contentContainerStyle={ styles.container }
    >
      {
        error
        ? <Text style={ styles.error }> { error } </Text>
        : null
      }

      <Text style={ styles.label }> 집안일 명 </Text>
      <TextInput
        style={ styles.input }
        value={ title }
        onChangeText={ setTitle }
      />

      <RecurrencePicker
        draft={ recurrenceDraft }
        onChange={ setRecurrenceDraft }
      />
      <RecurrencePreview
        recurrence={ built.recurrence }
        dueDate={ previewDueDate }
        willChangeDueDate={ willChangeDueDate }
      />

      <TaskItemListEditor
        label="방법"
        placeholder="방법 제목을 적어주세요 (줄바꿈 후 설명 입력)"
        addText="+ 방법 추가"
        items={ steps }
        numbered
        onChange={ setSteps }
      />

      <TaskItemListEditor
        label="TIP"
        icon="Lightbulb"
        placeholder="알아두면 좋은 팁을 적어주세요"
        addText="+ TIP 추가"
        items={ tips }
        onChange={ setTips }
      />

      <Pressable
        style={ styles.saveButton }
        onPress={ onSubmit }
        disabled={ isSaving }
      >
        {
          isSaving
          ? <ActivityIndicator color={ colors.white } />
          : <Text style={ styles.saveButtonText }> 저장 </Text>
        }
      </Pressable>

      {
        isEditMode
        ? <DefaultButton
            text="삭제"
            onPress={ onDelete }
            style={ styles.deleteButton }
            textStyle={ styles.deleteButtonText }
          />
        : null
      }

      {
        isEditMode
        ? <View style={ styles.logsSection }>
            <Text style={ styles.label }> 최근 완료 기록 </Text>
            {logs.length === 0 ? (
              <Text style={ styles.emptyLogs }> 완료 기록이 없습니다. </Text>
            ) : (
              logs.map( log => (
                <Text key={ log.id } style={ styles.logItem }>
                  { toDateString( new Date( log.completedAt ) ) } ·{ " " }
                  { log.completedByName }
                </Text>
              ) )
            )}
          </View>
        : null
      }
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
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: commonColor.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  error: {
    color: commonColor.error,
    marginBottom: 12,
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: commonColor.touchable,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 28,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: commonColor.negative,
  },
  deleteButtonText: {
    color: commonColor.negative,
    fontSize: 16,
    fontWeight: "600",
  },
  logsSection: {
    marginTop: 28,
  },
  emptyLogs: {
    fontSize: 14,
    color: colors.gray,
  },
  logItem: {
    fontSize: 14,
    color: colors.darkGray,
    paddingVertical: 4,
  },
} );

export default TaskFormScreen;
