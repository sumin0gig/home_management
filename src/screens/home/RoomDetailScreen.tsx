import React from "react";
import {
  ActivityIndicator,
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
import { roomDisplayName } from "../../store/useRoomStore";
import { colors, commonColor } from "../../styles/commonStyle";
import DefaultButton from "../../components/common/DefaultButton";
import TaskCard from "../../components/TaskCard/TaskCard";

type Props = NativeStackScreenProps<HomeStackParamList, "RoomDetail">;

function RoomDetailScreen( { navigation, route }: Props ): React.JSX.Element {
  const { roomId } = route.params;

  const room = useRoomStore( state =>
    state.rooms.find( r => r.id === roomId ),
  );
  const tasks = useTaskStore( state => state.tasks );
  const taskStatus = useTaskStore( state => state.status );
  const taskError = useTaskStore( state => state.error );

  React.useEffect( () => {
    navigation.setOptions( { title: room ? roomDisplayName( room ) : "방" } );
  }, [navigation, room] );

  const today = toDateString( new Date() );
  const roomTasks = tasks
    .filter( t => t.roomId === roomId )
    .sort( (a, b) => a.nextDueDate.localeCompare( b.nextDueDate ) );

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
        {roomTasks.length === 0 ? (
          <Text style={ styles.emptySection }> 집안일이 없습니다. </Text>
        ) : (
          roomTasks.map( task => (
            <TaskCard
              key={ task.id }
              task={ task }
              today={ today }
              onPress={ () =>
                navigation.navigate( "TaskDetail", { taskId: task.id } )
              }
            />
          ) )
        )}
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
    color: colors.gray,
    marginBottom: 16,
  },
  error: {
    color: commonColor.error,
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
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
} );

export default RoomDetailScreen;
