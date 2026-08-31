import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { MascotInput } from "../../api/mascot";
import { commonColor } from "../../styles/commonStyle";
import { COLOR_OPTIONS, EAR_OPTIONS, TAIL_OPTIONS } from "./optionMaps";

type Tab = "ear" | "tail" | "color";

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
      <View style={ styles.tabRow }>
        <Pressable
          style={ [styles.tab, activeTab === "ear" && styles.tabActive] }
          onPress={ () => setActiveTab( "ear" ) }
        >
          <Text
            style={ [
              styles.tabText,
              activeTab === "ear" && styles.tabTextActive,
            ] }
          >
            귀 모양
          </Text>
        </Pressable>
        <Pressable
          style={ [styles.tab, activeTab === "tail" && styles.tabActive] }
          onPress={ () => setActiveTab( "tail" ) }
        >
          <Text
            style={ [
              styles.tabText,
              activeTab === "tail" && styles.tabTextActive,
            ] }
          >
            꼬리 모양
          </Text>
        </Pressable>
        <Pressable
          style={ [styles.tab, activeTab === "color" && styles.tabActive] }
          onPress={ () => setActiveTab( "color" ) }
        >
          <Text
            style={ [
              styles.tabText,
              activeTab === "color" && styles.tabTextActive,
            ] }
          >
            색상
          </Text>
        </Pressable>
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
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#eee",
  },
  tabActive: {
    borderBottomColor: commonColor.touchable,
  },
  tabText: {
    fontSize: 14,
    color: "#999",
    fontWeight: "600",
  },
  tabTextActive: {
    color: commonColor.touchable,
  },
  optionScroll: {
    flexGrow: 0,
  },
  optionRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 4,
  },
  optionChip: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  optionChipSelected: {
    borderColor: commonColor.touchable,
    backgroundColor: commonColor.touchable,
  },
  optionChipText: {
    color: "#555",
    fontWeight: "600",
  },
  optionChipTextSelected: {
    color: "#fff",
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorSwatchSelected: {
    borderColor: commonColor.touchable,
  },
} );

export default MascotStyleEditor;
