import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../navigation/types";
import type { TaskRow } from "../../store/useTaskStore";
import {
  formatDueStatus,
  getDueStatus,
  isDueByToday,
  toDateString,
} from "../../utils/date";
import {
  colors,
  commonColor,
  dueStatusColor,
} from "../../styles/commonStyle";

interface Props {
  task: TaskRow;
}

const TaskCard = ( { task }: Props ): React.JSX.Element => {
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const today = toDateString( new Date() );
  const isDue = isDueByToday( task.nextDueDate, today );
  const dueStatus = getDueStatus( task.nextDueDate, today );

  return (
    <Pressable
      style={ [styles.card, isDue ? styles.dueCard : styles.notDueCard] }
      onPress={ () => navigation.navigate( "TaskSheet", { taskId: task.id } ) }
    >
      <Text style={ styles.title }> { task.title } </Text>
      <Text style={ [styles.due, { color: dueStatusColor( dueStatus.kind ) }] }>
        { formatDueStatus( dueStatus ) }
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create( {
  card: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: commonColor.divider,
    backgroundColor: colors.white,
    marginBottom: 8,
  },
  dueCard: {
    borderLeftWidth: 4,
    borderLeftColor: commonColor.touchable,
    // 왼쪽 테두리가 3px 두꺼워진 만큼 줄여서 제목 위치를 notDueCard와 맞춘다.
    paddingLeft: 9,
  },
  notDueCard: {
    opacity: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  due: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
} );

export default TaskCard;
