import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { TaskRow } from "../../store/useTaskStore";
import type { FloorPlanRoom } from "../../store/useRoomStore";
import { getDueStatus, isDueByToday } from "../../utils/date";
import { colors, commonColor } from "../../styles/commonStyle";
import HomeTaskRow from "./HomeTaskRow";

// "이번 주" 묶음은 1~6일 뒤. 7일 이후 일정은 홈에 나오지 않는다 (방 상세에서 본다).
const THIS_WEEK_MAX_DAYS = 6;

interface Props {
  tasks: TaskRow[];
  rooms: FloorPlanRoom[];
  today: string;
  onTaskPress: (task: TaskRow) => void;
}

// 기한 순(오래된 것 먼저), 같으면 이름 가나다순
function byDueThenTitle(a: TaskRow, b: TaskRow): number {
  return (
    a.nextDueDate.localeCompare( b.nextDueDate ) ||
    a.title.localeCompare( b.title, "ko" )
  );
}

export function groupHomeTasks(
  tasks: TaskRow[],
  today: string,
): { due: TaskRow[]; thisWeek: TaskRow[] } {
  const due = tasks.filter( t => isDueByToday( t.nextDueDate, today ) );
  const thisWeek = tasks.filter( t => {
    const status = getDueStatus( t.nextDueDate, today );
    return status.kind === "upcoming" && status.days <= THIS_WEEK_MAX_DAYS;
  } );
  return {
    due: due.sort( byDueThenTitle ),
    thisWeek: thisWeek.sort( byDueThenTitle ),
  };
}

function HomeTaskList( {
  tasks,
  rooms,
  today,
  onTaskPress,
}: Props ): React.JSX.Element {
  const { due, thisWeek } = groupHomeTasks( tasks, today );
  const roomById = new Map( rooms.map( room => [room.id, room] ) );

  const renderGroup = (title: string, groupTasks: TaskRow[]) => (
    <View style={ styles.group }>
      <Text style={ styles.groupTitle } accessibilityRole="header">
        { title }
      </Text>
      <View style={ styles.card }>
        { groupTasks.map( (task, index) => (
          <View key={ task.id } style={ index > 0 && styles.divider }>
            <HomeTaskRow
              task={ task }
              room={ roomById.get( task.roomId ) }
              today={ today }
              onPress={ () => onTaskPress( task ) }
            />
          </View>
        ) ) }
      </View>
    </View>
  );

  return (
    <View>
      <View
        style={ styles.summary }
        accessible
        accessibilityLabel={ `오늘까지 할 일 ${due.length}개` }
      >
        <Text style={ styles.summaryCount }> { due.length } </Text>
        <Text style={ styles.summaryLabel }> 오늘까지 할 일 </Text>
      </View>

      {
        due.length === 0
        ? <View style={ styles.emptyBox }>
            <Text style={ styles.emptyText }> 오늘 할 일을 모두 마쳤어요 </Text>
          </View>
        : renderGroup( "할 일", due )
      }
      { thisWeek.length > 0 ? renderGroup( "이번 주", thisWeek ) : null }
    </View>
  );
}

const styles = StyleSheet.create( {
  summary: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 16,
  },
  summaryCount: {
    fontSize: 32,
    fontWeight: "800",
    color: commonColor.textDefault,
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: commonColor.textMuted,
  },
  group: {
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: commonColor.textDefault,
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: commonColor.subtleBorder,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: commonColor.subtleBorder,
  },
  emptyBox: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: commonColor.subtleBorder,
    backgroundColor: colors.white,
    alignItems: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "600",
    color: commonColor.textMuted,
  },
} );

export default HomeTaskList;
