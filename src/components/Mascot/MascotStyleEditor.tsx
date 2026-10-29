import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { MascotInput } from "../../store/useMascotStore";
import { colors, commonColor } from "../../styles/commonStyle";
import { COLOR_OPTIONS, EAR_OPTIONS, TAIL_OPTIONS } from "./optionMaps";

type Tab = "ear" | "tail" | "color";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "ear", label: "귀 모양" },
  { key: "tail", label: "꼬리 모양" },
  { key: "color", label: "색상" },
];

interface Props {
  earStyle: MascotInput["earStyle"];
  tailStyle: MascotInput["tailStyle"];
  fillColor: string;
  onChangeEarStyle: (value: MascotInput["earStyle"]) => void;
  onChangeTailStyle: (value: MascotInput["tailStyle"]) => void;
  onChangeFillColor: (value: string) => void;
}

const MascotStyleEditor = ( {
  earStyle,
  tailStyle,
  fillColor,
  onChangeEarStyle,
  onChangeTailStyle,
  onChangeFillColor,
}: Props ): React.JSX.Element => {
  const [activeTab, setActiveTab] = React.useState<Tab>( "ear" );

  return (
    <View>
      { /* 회색 바탕 안에 흰 알약이 선택된 탭을 표시하는 분할 버튼 */ }
      <View style={ styles.tabRow } accessibilityRole="tablist">
        { TABS.map( tab => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={ tab.key }
              style={ [styles.tab, isActive && styles.tabActive] }
              onPress={ () => setActiveTab( tab.key ) }
              accessibilityRole="tab"
              accessibilityState={ { selected: isActive } }
            >
              <Text style={ [styles.tabText, isActive && styles.tabTextActive] }>
                { tab.label }
              </Text>
            </Pressable>
          );
        } ) }
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={ false }
        style={ styles.optionScroll }
        contentContainerStyle={ styles.optionRow }
      >
        {
          activeTab === "ear"
          ? EAR_OPTIONS.map( option => (
            <Pressable
              key={ option.value }
              style={ [
                styles.optionChip,
                earStyle === option.value && styles.optionChipSelected,
              ] }
              onPress={ () => onChangeEarStyle( option.value ) }
              accessibilityRole="radio"
              accessibilityState={ { selected: earStyle === option.value } }
            >
              <Text
                style={ [
                  styles.optionChipText,
                  earStyle === option.value && styles.optionChipTextSelected,
                ] }
              >
                { option.label }
              </Text>
            </Pressable>
          ) )
          : null
        }
        {
          activeTab === "tail"
          ? TAIL_OPTIONS.map( option => (
            <Pressable
              key={ option.value }
              style={ [
                styles.optionChip,
                tailStyle === option.value && styles.optionChipSelected,
              ] }
              onPress={ () => onChangeTailStyle( option.value ) }
              accessibilityRole="radio"
              accessibilityState={ { selected: tailStyle === option.value } }
            >
              <Text
                style={ [
                  styles.optionChipText,
                  tailStyle === option.value && styles.optionChipTextSelected,
                ] }
              >
                { option.label }
              </Text>
            </Pressable>
          ) )
          : null
        }
        {
          activeTab === "color"
          ? COLOR_OPTIONS.map( color => (
            <Pressable
              key={ color }
              style={ [
                styles.colorSwatch,
                { backgroundColor: color },
                fillColor === color && styles.colorSwatchSelected,
              ] }
              onPress={ () => onChangeFillColor( color ) }
              accessibilityRole="radio"
              accessibilityLabel={ `색 ${color}` }
              accessibilityState={ { selected: fillColor === color } }
            />
          ) )
          : null
        }
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create( {
  tabRow: {
    flexDirection: "row",
    padding: 3,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.06)",
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
  },
  tabActive: {
    backgroundColor: colors.white,
    shadowColor: colors.pureBlack,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 13.5,
    color: commonColor.textMuted,
    fontWeight: "600",
  },
  tabTextActive: {
    color: commonColor.textDefault,
    fontWeight: "700",
  },
  optionScroll: {
    flexGrow: 0,
  },
  optionRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  optionChip: {
    minHeight: 44,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.12)",
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
  },
  optionChipSelected: {
    borderWidth: 2,
    borderColor: commonColor.textDefault,
    paddingHorizontal: 15,
  },
  optionChipText: {
    color: commonColor.textMuted,
    fontWeight: "600",
  },
  optionChipTextSelected: {
    color: commonColor.textDefault,
    fontWeight: "700",
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorSwatchSelected: {
    borderColor: commonColor.textDefault,
  },
} );

export default MascotStyleEditor;
