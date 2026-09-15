import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  MAX_ROOM_DIMENSION,
  MIN_ROOM_DIMENSION,
  ROOM_TYPES,
  ROOM_TYPE_LABELS,
  canResizeRoom,
  type FloorPlanRoom,
  type RoomType,
} from "../../store/useRoomStore";
import {
  ROOM_COLOR_PALETTE,
  colors,
  commonColor,
} from "../../styles/commonStyle";
import { randomRoomColor } from "../../utils/commonUtils";
import ModalView from "../common/ModalView";
import DefaultButton from "../common/DefaultButton";

export interface RoomEditModalSaveValues {
  roomType: NonNullable<RoomType>;
  label: string;
  width: number;
  height: number;
  color: string;
}

interface Props {
  room: FloorPlanRoom;
  rooms: FloorPlanRoom[];
  onSave: (updates: RoomEditModalSaveValues) => void | Promise<void>;
  onClose: () => void;
}

// RoomEditScreen(서버에 저장된 방을 DB에서 수정)과 RoomSetupScreen(온보딩 중
// 아직 저장되지 않은 draft를 로컬 state로만 수정)이 완전히 같은 입력
// UI(방 종류/이름/크기/색상)를 쓰기 때문에 하나로 합쳤다 — 저장이 비동기 DB
// 호출이냐 동기 로컬 state 변경이냐는 onSave로 호출부에 맡기고, 여기서는 두
// 경우 모두 같은 로딩/에러 처리로 감싼다.
function RoomEditModal( {
  room,
  rooms,
  onSave,
  onClose,
}: Props ): React.JSX.Element {
  const [roomType, setRoomType] = React.useState<NonNullable<RoomType>>(
    room.roomType ?? "GENERAL_ROOM",
  );
  const [label, setLabel] = React.useState( room.label ?? "" );
  const [width, setWidth] = React.useState( room.width );
  const [height, setHeight] = React.useState( room.height );
  const [color, setColor] = React.useState( room.color ?? randomRoomColor() );
  const [formError, setFormError] = React.useState<string | null>( null );
  const [isSaving, setIsSaving] = React.useState( false );

  const isWidthAtMin = width <= MIN_ROOM_DIMENSION;
  const isWidthAtMax = width >= MAX_ROOM_DIMENSION;
  const isHeightAtMin = height <= MIN_ROOM_DIMENSION;
  const isHeightAtMax = height >= MAX_ROOM_DIMENSION;

  const onSubmit = () => {
    const siblings = rooms.filter( r => r.id !== room.id );
    const candidate = { x: room.x, y: room.y, width, height };
    if (!canResizeRoom( candidate, siblings )) {
      setFormError( "다른 방과 겹치거나 캔버스를 벗어나요." );
      return;
    }
    setFormError( null );
    const result = onSave( {
      roomType,
      label: label.trim(),
      width,
      height,
      color,
    } );
    // onSave는 RoomEditScreen(비동기 DB 호출)과 RoomSetupScreen(동기 로컬
    // state 변경) 양쪽에서 쓰인다 — 실제로 Promise를 반환할 때만 로딩 표시를
    // 띄우고 기다린다. 동기 호출을 억지로 await하면 로컬 draft 수정에도
    // 불필요한 한 틱의 지연이 생겨, 그 직후 상태를 확인하는 테스트가 act()
    // 밖에서 불안정하게 타이밍을 맞춰야 하는 문제가 있었다.
    if (!result) {
      onClose();
      return;
    }
    setIsSaving( true );
    result
      .then( onClose )
      .catch( () => {
        // 에러는 store의 error 상태로 표시됨
      } )
      .finally( () => setIsSaving( false ) );
  };

  return (
    <ModalView visible onRequestClose={ onClose }>
      <Text style={ styles.modalTitle }> 방 수정 </Text>

      <View style={ styles.chipRow }>
        { ROOM_TYPES.map( type => (
          <Pressable
            key={ type }
            style={ [styles.chip, roomType === type && styles.chipSelected] }
            onPress={ () => setRoomType( type ) }
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
        onChangeText={ setLabel }
      />

      <View style={ styles.stepperGroup }>
        <View style={ styles.stepperRow }>
          <Text style={ styles.stepperLabel }> 가로 </Text>
          <Pressable
            style={ [
              styles.stepperButton,
              isWidthAtMin && styles.stepperButtonDisabled,
            ] }
            disabled={ isWidthAtMin }
            onPress={ () =>
              setWidth( Math.max( MIN_ROOM_DIMENSION, width - 1 ) )
            }
          >
            <Text
              style={ [
                styles.stepperButtonText,
                isWidthAtMin && styles.stepperButtonTextDisabled,
              ] }
            >
              -
            </Text>
          </Pressable>
          <Text style={ styles.stepperValue }> { width }칸 </Text>
          <Pressable
            style={ [
              styles.stepperButton,
              isWidthAtMax && styles.stepperButtonDisabled,
            ] }
            disabled={ isWidthAtMax }
            onPress={ () =>
              setWidth( Math.min( MAX_ROOM_DIMENSION, width + 1 ) )
            }
          >
            <Text
              style={ [
                styles.stepperButtonText,
                isWidthAtMax && styles.stepperButtonTextDisabled,
              ] }
            >
              +
            </Text>
          </Pressable>
        </View>
        <View style={ styles.stepperRow }>
          <Text style={ styles.stepperLabel }> 세로 </Text>
          <Pressable
            style={ [
              styles.stepperButton,
              isHeightAtMin && styles.stepperButtonDisabled,
            ] }
            disabled={ isHeightAtMin }
            onPress={ () =>
              setHeight( Math.max( MIN_ROOM_DIMENSION, height - 1 ) )
            }
          >
            <Text
              style={ [
                styles.stepperButtonText,
                isHeightAtMin && styles.stepperButtonTextDisabled,
              ] }
            >
              -
            </Text>
          </Pressable>
          <Text style={ styles.stepperValue }> { height }칸 </Text>
          <Pressable
            style={ [
              styles.stepperButton,
              isHeightAtMax && styles.stepperButtonDisabled,
            ] }
            disabled={ isHeightAtMax }
            onPress={ () =>
              setHeight( Math.min( MAX_ROOM_DIMENSION, height + 1 ) )
            }
          >
            <Text
              style={ [
                styles.stepperButtonText,
                isHeightAtMax && styles.stepperButtonTextDisabled,
              ] }
            >
              +
            </Text>
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
            onPress={ () => setColor( swatch ) }
          />
        ) ) }
      </View>

      {
        formError
        ? <Text style={ styles.error }> { formError } </Text>
        : null
      }

      <View style={ styles.modalButtonRow }>
        <DefaultButton
          text="취소"
          onPress={ onClose }
          style={ styles.cancelButton }
          textStyle={ styles.cancelButtonText }
        />
        <Pressable
          style={ styles.saveButton }
          onPress={ onSubmit }
          disabled={ isSaving }
        >
          {
            isSaving
            ? <ActivityIndicator color={ colors.white } />
            : <Text style={ styles.saveButtonText }> 저장 </Text>
          }
        </Pressable>
      </View>
    </ModalView>
  );
}

const styles = StyleSheet.create( {
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 16,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    borderWidth: 1,
    borderColor: commonColor.border,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chipSelected: {
    backgroundColor: commonColor.touchable,
    borderColor: commonColor.touchable,
  },
  chipText: {
    color: colors.darkGray,
  },
  chipTextSelected: {
    color: colors.white,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: commonColor.border,
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
    color: colors.darkGray,
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
  stepperButtonDisabled: {
    borderColor: commonColor.border,
  },
  stepperButtonTextDisabled: {
    color: commonColor.border,
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
  error: {
    color: commonColor.error,
    marginBottom: 12,
    textAlign: "center",
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "transparent",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: commonColor.border,
  },
  cancelButtonText: {
    color: colors.darkGray,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    backgroundColor: commonColor.touchable,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: "600",
  },
} );

export default RoomEditModal;
