import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFamilyStore } from "../../store/useFamilyStore";
import {
  useRoomStore,
  ROOM_TYPES,
  ROOM_TYPE_LABELS,
  ROOM_TYPE_DEFAULT_DIMENSIONS,
  findNextRoomPlacement,
  canResizeRoom,
  type FloorPlanRoom,
  type RoomType,
} from "../../store/useRoomStore";
import { signOutUser } from "../../api/auth";
import { randomRoomColor } from "../../utils/commonUtils";
import CustomRoomModal from "./CustomRoomModal";
import FloorPlanCanvas from "../FloorPlan/FloorPlanCanvas";
import RoomFormFields from "../FloorPlan/RoomFormFields";
import ModalView from "../common/ModalView";
import DefaultButton from "../common/DefaultButton";
import { colors, commonColor } from "../../styles/commonStyle";

// 이 화면에서 만드는 draft는 항상 roomType/label/color를 직접 채워서 만들기
// 때문에, EditRoomModal 등과 공유하는 느슨한 FloorPlanRoom보다 더 구체적으로
// 좁혀 쓴다.
type DraftRoom = FloorPlanRoom & {
  roomType: NonNullable<RoomType>;
  label: string;
  color: string;
};

function RoomSetupScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const family = useFamilyStore( state => state.family );
  const error = useRoomStore( state => state.error );
  const addRoom = useRoomStore( state => state.addRoom );

  const [blocks, setBlocks] = React.useState<DraftRoom[]>( [] );
  const [editingBlock, setEditingBlock] = React.useState<DraftRoom | null>(
    null,
  );
  const [isSaving, setIsSaving] = React.useState( false );
  const [submitError, setSubmitError] = React.useState<string | null>( null );
  const [isCustomModalVisible, setIsCustomModalVisible] = React.useState( false );

  // 아직 저장되지 않은 draft들을 온보딩 단계에서부터 실제 배치될 모양 그대로
  // 미리보기로 보여준다 — Home 화면의 평면도와 같은 findNextRoomPlacement를
  // 써서, 실제로 저장될 때(addRoom)와 같은 자리에 놓이도록 맞춘다.
  const onAddBlock = (roomType: NonNullable<RoomType>) => {
    const { width, height } = ROOM_TYPE_DEFAULT_DIMENSIONS[roomType];
    setBlocks( prev => {
      const { x, y } = findNextRoomPlacement( prev, width, height );
      return [
        ...prev,
        {
          id: `${roomType}-${Date.now()}-${prev.length}`,
          roomType,
          label: "",
          color: randomRoomColor(),
          x,
          y,
          width,
          height,
        },
      ];
    } );
  };

  const onAddCustomBlock = (name: string) => {
    const { width, height } = ROOM_TYPE_DEFAULT_DIMENSIONS.GENERAL_ROOM;
    setBlocks( prev => {
      const { x, y } = findNextRoomPlacement( prev, width, height );
      return [
        ...prev,
        {
          id: `GENERAL_ROOM-${Date.now()}-${prev.length}`,
          roomType: "GENERAL_ROOM",
          label: name,
          color: randomRoomColor(),
          x,
          y,
          width,
          height,
        },
      ];
    } );
    setIsCustomModalVisible( false );
  };

  const onRemoveBlock = (id: string) => {
    setBlocks( prev => prev.filter( b => b.id !== id ) );
  };

  const onMoveBlock = (id: string, x: number, y: number) => {
    setBlocks( prev => prev.map( b => ( b.id === id ? { ...b, x, y } : b ) ) );
  };

  const onUpdateBlock = (
    id: string,
    updates: Omit<DraftRoom, "id" | "x" | "y">,
  ) => {
    setBlocks( prev =>
      prev.map( b => ( b.id === id ? { ...b, ...updates } : b ) ),
    );
  };

  const onSubmit = async () => {
    if (!family || blocks.length === 0) {
      return;
    }
    setIsSaving( true );
    setSubmitError( null );
    try {
      // 아직 저장되지 않은 draft들이라, addRoom이 겹치지 않는 좌표를 매길 수 있도록
      // 순서대로 하나씩 저장한다(Promise.all로 동시에 보내면 서로의 좌표를 모른 채
      // 겹치는 위치를 계산하게 된다).
      for (const block of blocks) {
        await addRoom(
          family.id,
          block.roomType,
          block.label.trim() || undefined,
          {
            x: block.x,
            y: block.y,
            width: block.width,
            height: block.height,
            color: block.color,
          },
        );
      }
    } catch (err) {
      setSubmitError( (err as Error).message );
    } finally {
      setIsSaving( false );
    }
  };

  return (
    <View style={ styles.container }>
      <Pressable
        style={ [styles.logoutLink, { top: insets.top + 16 }] }
        onPress={ () => signOutUser() }
      >
        <Text style={ styles.logoutLinkText }> 로그아웃 </Text>
      </Pressable>

      <Text style={ styles.stepIndicator }> 2 / 3 단계 · 집 만들기 </Text>
      <Text style={ styles.title }> 집의 형태는 어떻게 생겼나요? </Text>
      <Text style={ styles.description }>
        방을 추가해서 우리 집 도면을 만들어보세요. 나중에 언제든 바꿀 수 있어요.
      </Text>

      {
        error || submitError
        ? <Text style={ styles.error }> { submitError ?? error } </Text>
        : null
      }

      <View style={ styles.paletteRow }>
        { ROOM_TYPES.map( roomType => (
          <Pressable
            key={ roomType }
            style={ styles.paletteChip }
            onPress={ () => onAddBlock( roomType ) }
          >
            <Text style={ styles.paletteChipText }>
              + { ROOM_TYPE_LABELS[roomType] }
            </Text>
          </Pressable>
        ) ) }
        <Pressable
          style={ styles.customChip }
          onPress={ () => setIsCustomModalVisible( true ) }
        >
          <Text style={ styles.customChipText }> + 다른 방 만들기 </Text>
        </Pressable>
      </View>

      {
        blocks.length === 0
        ? <Text style={ styles.emptyText }> 위에서 방을 탭해 추가해보세요. </Text>
        : <>
          <Text style={ styles.hintText }>
            방을 탭하면 수정하고, 끌면 위치를 옮길 수 있어요.
          </Text>
          <ScrollView
            style={ styles.floorPlanScroll }
            showsVerticalScrollIndicator={ false }
          >
            <FloorPlanCanvas
              rooms={ blocks }
              editable
              onRoomPress={ block => setEditingBlock( block as DraftRoom ) }
              onRoomMove={ onMoveBlock }
            />
          </ScrollView>
        </>
      }

      <Pressable
        style={ styles.submitButton }
        onPress={ onSubmit }
        disabled={ isSaving || blocks.length === 0 }
      >
        {
          isSaving
          ? <ActivityIndicator color={ colors.white } />
          : <Text style={ styles.submitButtonText }> 집 만들기 </Text>
        }
      </Pressable>

      <CustomRoomModal
        visible={ isCustomModalVisible }
        onClose={ () => setIsCustomModalVisible( false ) }
        onSubmit={ onAddCustomBlock }
      />

      {
        editingBlock
        ? <EditDraftModal
          block={ editingBlock }
          blocks={ blocks }
          onSave={ onUpdateBlock }
          onRemove={ onRemoveBlock }
          onClose={ () => setEditingBlock( null ) }
        />
        : null
      }
    </View>
  );
}

interface EditDraftModalProps {
  block: DraftRoom;
  blocks: DraftRoom[];
  onSave: (id: string, updates: Omit<DraftRoom, "id" | "x" | "y">) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

// RoomEditScreen의 EditRoomModal과 거의 같은 입력 UI지만, 아직 서버에 없는
// draft라 저장/삭제가 전부 로컬 state 변경으로 끝난다(비동기 호출 없음).
function EditDraftModal( {
  block,
  blocks,
  onSave,
  onRemove,
  onClose,
}: EditDraftModalProps ): React.JSX.Element {
  const [roomType, setRoomType] = React.useState( block.roomType );
  const [label, setLabel] = React.useState( block.label );
  const [width, setWidth] = React.useState( block.width );
  const [height, setHeight] = React.useState( block.height );
  const [color, setColor] = React.useState( block.color );
  const [formError, setFormError] = React.useState<string | null>( null );

  const onSubmit = () => {
    const siblings = blocks.filter( b => b.id !== block.id );
    const candidate = { x: block.x, y: block.y, width, height };
    if (!canResizeRoom( candidate, siblings )) {
      setFormError( "다른 방과 겹치거나 캔버스를 벗어나요." );
      return;
    }
    onSave( block.id, { roomType, label, width, height, color } );
    onClose();
  };

  const onDelete = () => {
    onRemove( block.id );
    onClose();
  };

  return (
    <ModalView visible onRequestClose={ onClose }>
      <Text style={ styles.modalTitle }> 방 수정 </Text>
      <RoomFormFields
        roomType={ roomType }
        onRoomTypeChange={ setRoomType }
        label={ label }
        onLabelChange={ setLabel }
        width={ width }
        onWidthChange={ setWidth }
        height={ height }
        onHeightChange={ setHeight }
        color={ color }
        onColorChange={ setColor }
      />
      {
        formError
        ? <Text style={ styles.error }> { formError } </Text>
        : null
      }
      <View style={ styles.modalButtonRow }>
        <DefaultButton
          text="빼기"
          onPress={ onDelete }
          style={ styles.deleteButton }
          textStyle={ styles.deleteButtonText }
        />
        <Pressable style={ styles.saveButton } onPress={ onSubmit }>
          <Text style={ styles.saveButtonText }> 저장 </Text>
        </Pressable>
      </View>
    </ModalView>
  );
}

const styles = StyleSheet.create( {
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: commonColor.backgroundColor,
  },
  logoutLink: {
    position: "absolute",
    right: 16,
  },
  logoutLinkText: {
    color: colors.darkGray,
    fontSize: 13,
  },
  stepIndicator: {
    fontSize: 12,
    fontWeight: "700",
    color: commonColor.touchable,
    marginTop: 40,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: commonColor.textMuted,
    marginBottom: 20,
  },
  error: {
    color: commonColor.error,
    marginBottom: 12,
    textAlign: "center",
  },
  paletteRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  paletteChip: {
    borderWidth: 1,
    borderColor: commonColor.touchable,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  paletteChipText: {
    color: commonColor.touchable,
    fontWeight: "600",
  },
  customChip: {
    borderWidth: 1,
    borderColor: colors.gray,
    borderStyle: "dashed",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  customChipText: {
    color: colors.darkGray,
    fontWeight: "600",
  },
  hintText: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: 8,
  },
  floorPlanScroll: {
    flex: 1,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray,
    padding: 16,
  },
  submitButton: {
    backgroundColor: commonColor.touchable,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 16,
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 8,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "transparent",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: commonColor.negative,
  },
  deleteButtonText: {
    color: commonColor.negative,
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

export default RoomSetupScreen;
