import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { TaskRow } from "../../store/useTaskStore";
import { roomDisplayName, type FloorPlanRoom } from "../../store/useRoomStore";
import {
  formatDueStatus,
  formatRecurrence,
  getDueStatus,
} from "../../utils/date";
import {
  colors,
  commonColor,
  dueStatusColor,
} from "../../styles/commonStyle";
import Icon from "../common/Icon";

interface Props {
  task: TaskRow;
  room: FloorPlanRoom | undefined;
  today: string;
  onPress: () => void;
}

// 홈 목록의 집안일 한 줄. 행 전체가 버튼이고 완료 버튼은 없다 (완료는 모달에서만).
function HomeTaskRow( { task, room, today, onPress }: Props ): React.JSX.Element {
  const dueStatus = getDueStatus( task.nextDueDate, today );
  const dueLabel = formatDueStatus( dueStatus );
  const roomName = room ? roomDisplayName( room ) : "";

  return (
    <Pressable
      style={ ( { pressed } ) => [styles.row, pressed && styles.rowPressed] }
      onPress={ onPress }
      accessibilityRole="button"
      accessibilityLabel={ `${task.title}, ${roomName}, ${dueLabel}` }
      accessibilityHint="집안일 상세 열기"
      testID={ `home-task-${task.id}` }
    >
      <View style={ styles.body }>
        <Text style={ styles.title } numberOfLines={ 1 }> { task.title } </Text>
        <View style={ styles.metaRow }>
          {
            room
            ? <View
                style={ [
                  styles.roomSwatch,
                  { backgroundColor: room.color ?? colors.lightGray },
                ] }
              />
            : null
          }
          <Text style={ styles.meta } numberOfLines={ 1 }>
            { roomName ? `${roomName} · ` : "" }
            <Text style={ [styles.dueLabel, { color: dueStatusColor( dueStatus.kind ) }] }>
              { dueLabel }
            </Text>
            { ` · ${formatRecurrence( task )}` }
          </Text>
        </View>
      </View>
      <Icon name="ChevronRight" size={ 14 } color={ commonColor.textSecondary } />
    </Pressable>
  );
}

const styles = StyleSheet.create( {
  row: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  rowPressed: {
    backgroundColor: colors.lightGray,
  },
  body: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: commonColor.textDefault,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  roomSwatch: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  meta: {
    flexShrink: 1,
    fontSize: 13,
    color: commonColor.textMuted,
  },
  dueLabel: {
    fontWeight: "700",
  },
} );

export default HomeTaskRow;
