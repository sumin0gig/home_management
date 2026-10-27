import React from "react";
import { StyleSheet, View } from "react-native";
import { WEEKDAY_LABELS, WEEKDAYS_FROM_MONDAY } from "../../utils/date";
import Chip from "./Chip";

interface Props {
  // 0=일 … 6=토
  selected: number[];
  onToggle: (weekday: number) => void;
}

// 월·화·수·목·금·토·일 칩. 여러 개 고를 수 있다.
function WeekdayPicker( { selected, onToggle }: Props ): React.JSX.Element {
  return (
    <View style={ styles.row }>
      { WEEKDAYS_FROM_MONDAY.map( weekday => (
        <Chip
          key={ weekday }
          role="checkbox"
          label={ WEEKDAY_LABELS[weekday] }
          accessibilityLabel={ `${WEEKDAY_LABELS[weekday]}요일` }
          selected={ selected.includes( weekday ) }
          onPress={ () => onToggle( weekday ) }
          style={ styles.chip }
        />
      ) ) }
    </View>
  );
}

const styles = StyleSheet.create( {
  row: {
    flexDirection: "row",
    gap: 6,
  },
  chip: {
    flex: 1,
    paddingHorizontal: 0,
  },
} );

export default WeekdayPicker;
