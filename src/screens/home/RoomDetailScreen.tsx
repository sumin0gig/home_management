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
import type { HomeStackParamList } from "../../navigation/types";
import { useTaskStore } from "../../store/useTaskStore";
import { useRoomStore } from "../../store/useRoomStore";
import { toDateString } from "../../utils/date";
import { type TaskRow } from "../../store/useTaskStore";
import { roomDisplayName } from "../../store/useRoomStore";
import { commonColor } from "../../styles/commonStyle";
import DefaultButton from "../../components/common/DefaultButton";

type Props = NativeStackScreenProps<HomeStackParamList, "RoomDetail">;

function formatDueLabel( nextDueDate: string, today: string ): string {
  if (nextDueDate < today) {
    return "기한 지남";
  }
  if (nextDueDate === today) {
    return "오늘";
  }
  return `예정 (${nextDueDate})`;
}

function RoomDetailScreen( { navigation, route }: Props ): React.JSX.Element {
  const { roomId } = route.params;

  const room = useRoomStore( state => state.rooms.find( r => r.id === roomId ) );
  const tasks = useTaskStore( state => state.tasks );
  const taskStatus = useTaskStore( state => state.status );
  const taskError = useTaskStore( state => state.error );
  const completeTask = useTaskStore( state => state.completeTask );

  React.useEffect( () => {
    navigation.setOptions( { title: room ? roomDisplayName( room ) : "방" } );
  }, [navigation, room] );

  const today = toDateString( new Date() );
  const roomTasks = tasks
    .filter( t => t.roomId === roomId )
    .sort( (a, b) => a.nextDueDate.localeCompare( b.nextDueDate ) );

  const renderTask = (item: TaskRow) => (
    <View style={ styles.taskRow } key={ item.id }>
      <Pressable
        style={ styles.taskInfo }
        onPress={ () => navigation.navigate( "TaskForm", { taskId: item.id } ) }
      >
        <Text style={ styles.taskTitle }> { item.title } </Text>
        {
          item.description
          ? <Text style={ styles.taskDescription }> { item.description } </Text>
          : null
        }
        <Text style={ styles.taskDue }>
          { formatDueLabel( item.nextDueDate, today ) }
        </Text>
      </Pressable>
      <DefaultButton
        text="완료"
        onPress={ () => completeTask( item ) }
        style={ styles.completeButton }
        textStyle={ styles.completeButtonText }
      />
    </View>
  );

  if (taskStatus === "loading") {
    return (
      <View style={ styles.centerContainer }>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={ styles.container }>
      {
        taskError
        ? <Text style={ styles.error }> { taskError } </Text>
        : null
      }

      <DefaultButton
        text="+ 집안일 추가"
        onPress={ () => navigation.navigate( "TaskForm", { roomId } ) }
        style={ styles.addButton }
        textStyle={ styles.addButtonText }
      />

      <ScrollView>
        {
          roomTasks.length === 0
          ? <Text style={ styles.emptySection }> 집안일이 없습니다. </Text>
          : roomTasks.map( renderTask )
        }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create( {
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: commonColor.backgroundColor,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: commonColor.backgroundColor,
  },
  emptySection: {
    fontSize: 14,
    color: "#999",
    marginBottom: 16,
  },
  error: {
    color: "#d32f2f",
    marginBottom: 12,
    textAlign: "center",
  },
  addButton: {
    backgroundColor: commonColor.touchable,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  taskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  taskInfo: {
    flex: 1,
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  taskDescription: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  taskDue: {
    fontSize: 12,
    color: "#2f6fed",
    marginTop: 4,
    fontWeight: "600",
  },
  completeButton: {
    backgroundColor: commonColor.touchable,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  completeButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
} );

export default RoomDetailScreen;
