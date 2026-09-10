import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  MAX_ROOM_DIMENSION,
  MIN_ROOM_DIMENSION,
  ROOM_TYPES,
  ROOM_TYPE_LABELS,
  type RoomType,
} from "../../store/useRoomStore";
import { ROOM_COLOR_PALETTE, commonColor } from "../../styles/commonStyle";

interface Props {
  roomType: NonNullable<RoomType>;
  onRoomTypeChange: (roomType: NonNullable<RoomType>) => void;
  label: string;
  onLabelChange: (label: string) => void;
  width: number;
  height: number;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
  color: string;
  onColorChange: (color: string) => void;
}

// EditRoomModal(RoomEditScreen)과 온보딩 draft 수정 모달(RoomSetupScreen)이
// 완전히 같은 입력 UI(방 종류/이름/크기/색상)를 쓰기 때문에 공용으로 뺀 것 —
// 저장/삭제는 각 화면 사정이 달라서(비동기 DB 호출 vs 로컬 state) 여기서
// 다루지 않고 호출부에서 처리한다.
function RoomFormFields( {
  roomType,
  onRoomTypeChange,
  label,
  onLabelChange,
  width,
  height,
  onWidthChange,
  onHeightChange,
  color,
  onColorChange,
}: Props ): React.JSX.Element {
  return (
    <>
      <View style={ styles.chipRow }>
        { ROOM_TYPES.map( type => (
          <Pressable
            key={ type }
            style={ [styles.chip, roomType === type && styles.chipSelected] }
            onPress={ () => onRoomTypeChange( type ) }
          >
            <Text
              style={
                roomType === type ? styles.chipTextSelected : styles.chipText
              }
            >
              { ROOM_TYPE_LABELS[type] }
            </Text>
          </Pressable>
        ) ) }
      </View>

      <TextInput
        style={ styles.input }
        placeholder="이름(선택)"
        value={ label }
        onChangeText={ onLabelChange }
      />

      <View style={ styles.stepperGroup }>
        <View style={ styles.stepperRow }>
          <Text style={ styles.stepperLabel }> 가로 </Text>
          <Pressable
            style={ styles.stepperButton }
            onPress={ () =>
              onWidthChange( Math.max( MIN_ROOM_DIMENSION, width - 1 ) )
            }
          >
            <Text style={ styles.stepperButtonText }> - </Text>
          </Pressable>
          <Text style={ styles.stepperValue }> { width }칸 </Text>
          <Pressable
            style={ styles.stepperButton }
            onPress={ () =>
              onWidthChange( Math.min( MAX_ROOM_DIMENSION, width + 1 ) )
            }
          >
            <Text style={ styles.stepperButtonText }> + </Text>
          </Pressable>
        </View>
        <View style={ styles.stepperRow }>
          <Text style={ styles.stepperLabel }> 세로 </Text>
          <Pressable
            style={ styles.stepperButton }
            onPress={ () =>
              onHeightChange( Math.max( MIN_ROOM_DIMENSION, height - 1 ) )
            }
          >
            <Text style={ styles.stepperButtonText }> - </Text>
          </Pressable>
          <Text style={ styles.stepperValue }> { height }칸 </Text>
          <Pressable
            style={ styles.stepperButton }
            onPress={ () =>
              onHeightChange( Math.min( MAX_ROOM_DIMENSION, height + 1 ) )
            }
          >
            <Text style={ styles.stepperButtonText }> + </Text>
          </Pressable>
        </View>
      </View>

      <View style={ styles.colorRow }>
        { ROOM_COLOR_PALETTE.map( swatch => (
          <Pressable
            key={ swatch }
            style={ [
              styles.swatch,
              { backgroundColor: swatch },
              color === swatch && styles.swatchSelected,
            ] }
            onPress={ () => onColorChange( swatch ) }
          />
        ) ) }
      </View>
    </>
  );
}

const styles = StyleSheet.create( {
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chipSelected: {
    backgroundColor: commonColor.touchable,
    borderColor: commonColor.touchable,
  },
  chipText: {
    color: "#333",
  },
  chipTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  stepperGroup: {
    gap: 8,
    marginBottom: 12,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepperLabel: {
    width: 36,
    fontSize: 14,
    color: "#555",
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: commonColor.touchable,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonText: {
    color: commonColor.touchable,
    fontSize: 16,
    fontWeight: "700",
  },
  stepperValue: {
    minWidth: 40,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchSelected: {
    borderColor: commonColor.touchable,
  },
} );

export default RoomFormFields;
