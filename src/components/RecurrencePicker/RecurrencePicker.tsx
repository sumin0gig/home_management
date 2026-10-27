import React from "react";
import { StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { colors, commonColor } from "../../styles/commonStyle";
import Chip from "./Chip";
import WeekdayPicker from "./WeekdayPicker";
import MonthDayPicker from "./MonthDayPicker";
import {
  FREQUENCY_OPTIONS,
  selectFrequency,
  showsMonthDayPicker,
  showsWeekdayPicker,
  type IntervalUnit,
  type RecurrenceDraft,
} from "./recurrenceDraft";

const INTERVAL_UNIT_LABELS: Record<IntervalUnit, string> = {
  DAY: "일",
  WEEK: "주",
  MONTH: "개월",
};
const INTERVAL_UNITS = Object.keys( INTERVAL_UNIT_LABELS ) as IntervalUnit[];

const MONTHS = Array.from( { length: 12 }, (_, i) => i + 1 );

function toggled(values: number[], value: number): number[] {
  return values.includes( value )
    ? values.filter( v => v !== value )
    : [...values, value].sort( (a, b) => a - b );
}

interface ToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

function ToggleRow( {
  label,
  value,
  onValueChange,
}: ToggleRowProps ): React.JSX.Element {
  return (
    <View style={ styles.toggleRow }>
      <Text style={ styles.toggleLabel }> { label } </Text>
      <Switch
        accessibilityLabel={ label }
        value={ value }
        onValueChange={ onValueChange }
        trackColor={ { false: commonColor.border, true: commonColor.touchable } }
        thumbColor={ colors.white }
      />
    </View>
  );
}

interface Props {
  draft: RecurrenceDraft;
  onChange: (draft: RecurrenceDraft) => void;
}

// ① 얼마나 자주 → ② (선택) 요일·날짜 정하기
function RecurrencePicker( { draft, onChange }: Props ): React.JSX.Element {
  const update = (changes: Partial<RecurrenceDraft>) =>
    onChange( { ...draft, ...changes } );

  return (
    <View>
      <Text style={ styles.label }> 얼마나 자주 </Text>
      <View style={ styles.chipRow }>
        { FREQUENCY_OPTIONS.map( option => (
          <Chip
            key={ option.value }
            role="radio"
            label={ option.label }
            selected={ draft.frequency === option.value }
            onPress={ () => onChange( selectFrequency( draft, option.value ) ) }
          />
        ) ) }
      </View>

      {
        draft.frequency === "MONTHS"
        ? <View>
            <Text style={ styles.label }> 해당 달 </Text>
            <View style={ styles.chipRow }>
              { MONTHS.map( month => (
                <Chip
                  key={ month }
                  role="checkbox"
                  label={ `${month}월` }
                  selected={ draft.months.includes( month ) }
                  onPress={ () =>
                    update( { months: toggled( draft.months, month ) } )
                  }
                  style={ styles.monthChip }
                />
              ) ) }
            </View>
          </View>
        : null
      }

      {
        draft.frequency === "CUSTOM"
        ? <View>
            <Text style={ styles.label }> 간격 </Text>
            <View style={ styles.intervalRow }>
              <TextInput
                accessibilityLabel="간격"
                style={ styles.intervalInput }
                value={ draft.customValue }
                onChangeText={ customValue => update( { customValue } ) }
                keyboardType="number-pad"
              />
              { INTERVAL_UNITS.map( unit => (
                <Chip
                  key={ unit }
                  role="radio"
                  label={ INTERVAL_UNIT_LABELS[unit] }
                  selected={ draft.customUnit === unit }
                  onPress={ () => update( { customUnit: unit } ) }
                />
              ) ) }
            </View>
          </View>
        : null
      }

      {
        showsWeekdayPicker( draft )
        ? <View>
            <ToggleRow
              label="요일 정하기"
              value={ draft.weekdaysOn }
              onValueChange={ weekdaysOn => update( { weekdaysOn } ) }
            />
            {
              draft.weekdaysOn
              ? <WeekdayPicker
                  selected={ draft.weekdays }
                  onToggle={ weekday =>
                    update( { weekdays: toggled( draft.weekdays, weekday ) } )
                  }
                />
              : null
            }
          </View>
        : null
      }

      {
        showsMonthDayPicker( draft )
        ? <View>
            <ToggleRow
              label="날짜 정하기"
              value={ draft.monthDayOn }
              onValueChange={ monthDayOn => update( { monthDayOn } ) }
            />
            {
              draft.monthDayOn
              ? <MonthDayPicker
                  selected={ draft.monthDay }
                  onSelect={ monthDay => update( { monthDay } ) }
                />
              : null
            }
          </View>
        : null
      }
    </View>
  );
}

const styles = StyleSheet.create( {
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  monthChip: {
    paddingHorizontal: 12,
    minWidth: 52,
  },
  intervalRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  intervalInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: commonColor.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 8,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
} );

export default RecurrencePicker;
