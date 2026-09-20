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
import { toDateString } from "../../utils/date";
import {
  listTaskItems,
  listTaskLogs,
  type TaskInput,
  type TaskItemInput,
  type TaskLogRow,
  type IntervalUnit,
} from "../../store/useTaskStore";
import { colors, commonColor } from "../../styles/commonStyle";
import DefaultButton from "../../components/common/DefaultButton";
import TaskItemListEditor from "../../components/TaskItemListEditor/TaskItemListEditor";

type Props = NativeStackScreenProps<MainStackParamList, "TaskForm">;

const INTERVAL_UNIT_LABELS: Record<"DAY" | "WEEK" | "MONTH", string> = {
  DAY: "일",
  WEEK: "주",
  MONTH: "개월",
};

const MONTHS = Array.from( { length: 12 }, (_, i) => i + 1 );

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
  const [recurrenceType, setRecurrenceType] = React.useState<
    "INTERVAL" | "YEARLY_MONTHS"
  >( existingTask?.recurrenceType ?? "INTERVAL" );
  const [intervalValue, setIntervalValue] = React.useState(
    String( existingTask?.intervalValue ?? 1 ),
  );
  const [intervalUnit, setIntervalUnit] = React.useState<
    "DAY" | "WEEK" | "MONTH"
  >( (existingTask?.intervalUnit as IntervalUnit) ?? "WEEK" );
  const [months, setMonths] = React.useState<number[]>(
    existingTask?.months?.filter( (m): m is number => m !== null ) ?? [],
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

  const toggleMonth = (month: number) => {
    setMonths( prev =>
      prev.includes( month )
        ? prev.filter( m => m !== month )
        : [...prev, month].sort( (a, b) => a - b ),
    );
  };

  const onSubmit = async () => {
    if (!roomId) {
      setError( "방을 선택해주세요." );
      return;
    }
    if (!title.trim()) {
      setError( "제목을 입력해주세요." );
      return;
    }
    if (recurrenceType === "YEARLY_MONTHS" && months.length === 0) {
      setError( "최소 한 달을 선택해주세요." );
      return;
    }
    const parsedIntervalValue = Number( intervalValue );
    if (
      recurrenceType === "INTERVAL" &&
      (!Number.isInteger( parsedIntervalValue ) || parsedIntervalValue < 1)
    ) {
      setError( "간격은 1 이상의 정수로 입력해주세요." );
      return;
    }
    const input: TaskInput = {
      title: title.trim(),
      recurrenceType,
      intervalValue:
        recurrenceType === "INTERVAL" ? parsedIntervalValue : undefined,
      intervalUnit: recurrenceType === "INTERVAL" ? intervalUnit : undefined,
      months: recurrenceType === "YEARLY_MONTHS" ? months : undefined,
      items: itemsLoaded
        ? [
            ...toTaskItemInputs( steps, "DEFAULT" ),
            ...toTaskItemInputs( tips, "TIP" ),
          ]
        : undefined,
    };

    setIsSaving( true );
    setError( null );
    try {
      if (isEditMode && taskId) {
        await updateTask( taskId, input, roomId );
      } else {
        await createTask( roomId, input );
      }
      navigation.goBack();
    } catch (err) {
      setError( (err as Error).message );
    } finally {
      setIsSaving( false );
    }
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
          onPress: async () => {
            try {
              await deleteTask( taskId );
              navigation.goBack();
            } catch (err) {
              setError( (err as Error).message );
            }
          },
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

      <Text style={ styles.label }> 제목 </Text>
      <TextInput
        style={ styles.input }
        value={ title }
        onChangeText={ setTitle }
      />

      <Text style={ styles.label }> 반복 방식 </Text>
      <View style={ styles.chipRow }>
        <Pressable
          style={ [
            styles.chip,
            recurrenceType === "INTERVAL" && styles.chipSelected,
          ] }
          onPress={ () => setRecurrenceType( "INTERVAL" ) }
        >
          <Text
            style={
              recurrenceType === "INTERVAL"
                ? styles.chipTextSelected
                : styles.chipText
            }
          >
            간격 반복
          </Text>
        </Pressable>
        <Pressable
          style={ [
            styles.chip,
            recurrenceType === "YEARLY_MONTHS" && styles.chipSelected,
          ] }
          onPress={ () => setRecurrenceType( "YEARLY_MONTHS" ) }
        >
          <Text
            style={
              recurrenceType === "YEARLY_MONTHS"
                ? styles.chipTextSelected
                : styles.chipText
            }
          >
            특정 달 반복
          </Text>
        </Pressable>
      </View>

      {
        recurrenceType === "INTERVAL"
        ? <View>
            <Text style={ styles.label }> 간격 </Text>
            <TextInput
              style={ styles.input }
              value={ intervalValue }
              onChangeText={ setIntervalValue }
              keyboardType="number-pad"
            />
            <View style={ styles.chipRow }>
              { (
                Object.keys( INTERVAL_UNIT_LABELS ) as Array<
                  "DAY" | "WEEK" | "MONTH"
                >
              ).map( unit => (
                <Pressable
                  key={ unit }
                  style={ [
                    styles.chip,
                    intervalUnit === unit && styles.chipSelected,
                  ] }
                  onPress={ () => setIntervalUnit( unit ) }
                >
                  <Text
                    style={
                      intervalUnit === unit
                        ? styles.chipTextSelected
                        : styles.chipText
                    }
                  >
                    { INTERVAL_UNIT_LABELS[unit] }
                  </Text>
                </Pressable>
              ) ) }
            </View>
          </View>
        : <View>
            <Text style={ styles.label }> 해당 달 선택 </Text>
            <View style={ styles.chipRow }>
              { MONTHS.map( month => (
                <Pressable
                  key={ month }
                  style={ [
                    styles.monthChip,
                    months.includes( month ) && styles.chipSelected,
                  ] }
                  onPress={ () => toggleMonth( month ) }
                >
                  <Text
                    style={
                      months.includes( month )
                        ? styles.chipTextSelected
                        : styles.chipText
                    }
                  >
                    { month }월
                  </Text>
                </Pressable>
              ) ) }
            </View>
          </View>
      }

      <TaskItemListEditor
        label="방법"
        placeholder="이 집안일을 하는 방법을 적어주세요"
        addText="+ 방법 추가"
        items={ steps }
        numbered
        onChange={ setSteps }
      />

      <TaskItemListEditor
        label="💡 TIP"
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
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: commonColor.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  monthChip: {
    borderWidth: 1,
    borderColor: commonColor.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 52,
    alignItems: "center",
  },
  chipSelected: {
    backgroundColor: commonColor.touchable,
    borderColor: commonColor.touchable,
  },
  chipText: {
    color: colors.darkGray,
  },
  chipTextSelected: {
    color: colors.white,
    fontWeight: "600",
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
