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
  type FloorPlanRoom,
  type RoomType,
} from "../../store/useRoomStore";
import { signOutUser } from "../../api/auth";
import CustomRoomModal from "./CustomRoomModal";
import FloorPlanCanvas from "../FloorPlan/FloorPlanCanvas";
import { commonColor } from "../../styles/commonStyle";

// 이 화면에서 만드는 draft는 항상 roomType/label을 직접 채워서 만들기 때문에,
// EditRoomModal 등과 공유하는 느슨한 FloorPlanRoom보다 더 구체적으로 좁혀 쓴다.
type DraftRoom = FloorPlanRoom & {
  roomType: NonNullable<RoomType>;
  label: string;
};

function RoomSetupScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const family = useFamilyStore( state => state.family );
  const error = useRoomStore( state => state.error );
  const addRoom = useRoomStore( state => state.addRoom );

  const [blocks, setBlocks] = React.useState<DraftRoom[]>( [] );
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
          <Text style={ styles.hintText }> 방을 탭하면 뺄 수 있어요. </Text>
          <ScrollView
            style={ styles.floorPlanScroll }
            showsVerticalScrollIndicator={ false }
          >
            <FloorPlanCanvas
              rooms={ blocks }
              onRoomPress={ block => onRemoveBlock( block.id ) }
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
          ? <ActivityIndicator color="#fff" />
          : <Text style={ styles.submitButtonText }> 집 만들기 </Text>
        }
      </Pressable>

      <CustomRoomModal
        visible={ isCustomModalVisible }
        onClose={ () => setIsCustomModalVisible( false ) }
        onSubmit={ onAddCustomBlock }
      />
    </View>
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
    color: "#555",
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
    color: "#666",
    marginBottom: 20,
  },
  error: {
    color: "#d32f2f",
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
    borderColor: "#999",
    borderStyle: "dashed",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  customChipText: {
    color: "#555",
    fontWeight: "600",
  },
  hintText: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
  },
  floorPlanScroll: {
    flex: 1,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
} );

export default RoomSetupScreen;
