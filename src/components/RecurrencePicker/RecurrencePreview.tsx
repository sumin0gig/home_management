import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  formatDateWithWeekday,
  formatRecurrence,
  type TaskRecurrence,
} from "../../utils/date";
import { commonColor } from "../../styles/commonStyle";

interface Props {
  // 아직 저장할 수 없는 입력이면 null
  recurrence: TaskRecurrence | null;
  // 'YYYY-MM-DD'
  dueDate: string | null;
  // 수정 화면에서 저장하면 기한이 바뀌는지
  willChangeDueDate: boolean;
}

// "매주 화·금 / 다음 예정: 11월 3일 (화)"
function RecurrencePreview( {
  recurrence,
  dueDate,
  willChangeDueDate,
}: Props ): React.JSX.Element {
  const dueText = dueDate ? formatDateWithWeekday( dueDate, new Date() ) : "-";
  return (
    <View style={ styles.box }>
      {
        recurrence
        ? <Text style={ styles.summary }> { formatRecurrence( recurrence ) } </Text>
        : null
      }
      <Text style={ styles.due }> 다음 예정: { dueText } </Text>
      {
        willChangeDueDate
        ? <Text style={ styles.note }> 저장하면 기한이 이 날짜로 바뀌어요 </Text>
        : null
      }
    </View>
  );
}

const styles = StyleSheet.create( {
  box: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    backgroundColor: commonColor.touchableSoft,
    gap: 4,
  },
  summary: {
    fontSize: 15,
    fontWeight: "700",
    color: commonColor.textDefault,
  },
  due: {
    fontSize: 14,
    color: commonColor.textDefault,
  },
  note: {
    fontSize: 12,
    color: commonColor.touchable,
    fontWeight: "600",
  },
} );

export default RecurrencePreview;
