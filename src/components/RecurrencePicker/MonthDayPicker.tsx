import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LAST_DAY_OF_MONTH } from "../../utils/date";
import { commonColor } from "../../styles/commonStyle";
import Chip from "./Chip";

const DAYS = Array.from( { length: 31 }, (_, i) => i + 1 );

interface Props {
  // 1~31, 말일은 -1
  selected: number | null;
  onSelect: (monthDay: number) => void;
}

// 1~31일을 7열 격자로, 그 아래 "말일". 하나만 고를 수 있다.
function MonthDayPicker( { selected, onSelect }: Props ): React.JSX.Element {
  return (
    <View>
      <View style={ styles.grid }>
        { DAYS.map( day => (
          <View key={ day } style={ styles.cell }>
            <Chip
              role="radio"
              label={ String( day ) }
              accessibilityLabel={ `${day}일` }
              selected={ selected === day }
              onPress={ () => onSelect( day ) }
              style={ styles.dayChip }
            />
          </View>
        ) ) }
      </View>
      <Chip
        role="radio"
        label="말일"
        selected={ selected === LAST_DAY_OF_MONTH }
        onPress={ () => onSelect( LAST_DAY_OF_MONTH ) }
        style={ styles.lastDayChip }
      />
      {
        selected !== null && selected >= 29
        ? <Text style={ styles.hint }> 날짜가 없는 달은 그 달 말일에 해요 </Text>
        : null
      }
    </View>
  );
}

const styles = StyleSheet.create( {
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%`,
    padding: 2,
  },
  dayChip: {
    height: 36,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  lastDayChip: {
    alignSelf: "flex-start",
    marginTop: 6,
    marginLeft: 2,
  },
  hint: {
    fontSize: 12,
    color: commonColor.textMuted,
    marginTop: 8,
  },
} );

export default MonthDayPicker;
