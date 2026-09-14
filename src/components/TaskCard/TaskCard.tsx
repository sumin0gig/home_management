import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import type { TaskRow } from "../../store/useTaskStore";
import { formatDueLabel } from "../../utils/date";
import { colors } from "../../styles/commonStyle";

interface Props {
  task: TaskRow;
  today: string;
  onPress: () => void;
}

const TaskCard = ( { task, today, onPress }: Props ): React.JSX.Element => {
  const isDue = task.nextDueDate <= today;
  const dueLabel = formatDueLabel( task.nextDueDate, today );

  return (
    <Pressable
      style={ [styles.card, isDue ? styles.dueCard : styles.notDueCard] }
      onPress={ onPress }
    >
      <Text style={ styles.title }> { task.title } </Text>
      {
        dueLabel
        ? <Text style={ styles.due }> { dueLabel } </Text>
        : null
      }
    </Pressable>
  );
}

const styles = StyleSheet.create( {
  card: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: "#eee",
    marginBottom: 8,
  },
  dueCard: {
    backgroundColor: colors.white,
  },
  notDueCard: {
    backgroundColor: "#f2f2f2",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  due: {
    fontSize: 12,
    color: "#2f6fed",
    marginTop: 4,
    fontWeight: "600",
  },
} );

export default TaskCard;
