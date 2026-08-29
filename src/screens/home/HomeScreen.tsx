import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";
import { useFamilyStore } from "../../store/useFamilyStore";
import { useChoreStore } from "../../store/useChoreStore";
import { useRoomStore } from "../../store/useRoomStore";
import { toDateString } from "../../api/chore";
import { commonColor } from "../../styles/commonStyle";
import ModalView from "../../components/common/ModalView";
import Button from "../../components/common/Button";
import RoomBlockTile from "../../components/RoomSetupScreen/RoomBlockTile";
import {
  ROOM_TYPES,
  ROOM_TYPE_LABELS,
  ROOM_SIZES,
  ROOM_SIZE_LABELS,
  DEFAULT_ROOM_SIZE,
  ROOM_TYPE_DEFAULT_SIZE,
  roomDisplayName,
  type RoomRow,
  type RoomType,
  type RoomSize,
} from "../../api/room";

type Props = NativeStackScreenProps<HomeStackParamList, "HomeMain">;

type AddRoomModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (
    roomType: NonNullable<RoomType>,
    size: NonNullable<RoomSize>,
    label: string,
  ) => Promise<void>;
};

function HomeScreen( { navigation }: Props ): React.JSX.Element {
  const family = useFamilyStore( state => state.family );

  const rooms = useRoomStore( state => state.rooms );
  const roomStatus = useRoomStore( state => state.status );
  const roomError = useRoomStore( state => state.error );
  const fetchRooms = useRoomStore( state => state.fetchRooms );
  const addRoom = useRoomStore( state => state.addRoom );

  const chores = useChoreStore( state => state.chores );
  const choreStatus = useChoreStore( state => state.status );
  const choreError = useChoreStore( state => state.error );
  const fetchChoresForFamily = useChoreStore(
    state => state.fetchChoresForFamily,
  );

  const [isAddingRoom, setIsAddingRoom] = React.useState( false );

  React.useEffect( () => {
    if (family?.id) {
      fetchRooms( family.id );
    }
  }, [family?.id, fetchRooms] );

  const roomIds = rooms.map( r => r.id ).join( "," );
  React.useEffect( () => {
    if (family?.id) {
      fetchChoresForFamily( family.id );
    }
  }, [family?.id, roomIds, fetchChoresForFamily] );

  if (roomStatus === "loading" || choreStatus === "loading") {
    return (
      <View style={ styles.centerContainer }>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const today = toDateString( new Date() );
  const sortedRooms = [...rooms].sort( (a, b) => {
    const typeOrder =
      ROOM_TYPES.indexOf( a.roomType ?? "GENERAL_ROOM" ) -
      ROOM_TYPES.indexOf( b.roomType ?? "GENERAL_ROOM" );
    if (typeOrder !== 0) {
      return typeOrder;
    }
    return roomDisplayName( a ).localeCompare( roomDisplayName( b ) );
  } );

  const hasDueToday = (room: RoomRow): boolean =>
    chores.some( c => c.roomId === room.id && c.nextDueDate <= today );

  const handleAddRoom = async (
    roomType: NonNullable<RoomType>,
    size: NonNullable<RoomSize>,
    label: string,
  ) => {
    if (!family) {
      return;
    }
    await addRoom( family.id, roomType, size, label.trim() || undefined );
    setIsAddingRoom( false );
  };

  return (
    <View style={ styles.container }>
      { roomError && <Text style={ styles.error }> { roomError } </Text> }
      { choreError && <Text style={ styles.error }> { choreError } </Text> }

      <Pressable
        style={ styles.addRoomLink }
        onPress={ () => setIsAddingRoom( true ) }
      >
        <Text style={ styles.addRoomLinkText }> + 방 추가 </Text>
      </Pressable>

      <AddRoomModal
        visible={ isAddingRoom }
        onClose={ () => setIsAddingRoom( false ) }
        onSubmit={ handleAddRoom }
      />

      <ScrollView contentContainerStyle={ styles.roomGrid }>
        {
          sortedRooms.length === 0
          ? <Text style={ styles.emptySection }>
            등록된 방이 없습니다. 방을 추가해주세요.
          </Text>
          : sortedRooms.map( room => (
            <RoomBlockTile
              key={ room.id }
              block={ {
                key: room.id,
                roomType: room.roomType ?? "GENERAL_ROOM",
                size: room.size ?? DEFAULT_ROOM_SIZE,
                label: room.label ?? "",
              } }
              onPress={ () =>
                navigation.navigate( "RoomDetail", { roomId: room.id } )
              }
              hasDueToday={ hasDueToday( room ) }
            />
          ) )
        }
      </ScrollView>
    </View>
  );
}

const AddRoomModal = ( {
  visible,
  onClose,
  onSubmit,
}: AddRoomModalProps ): React.JSX.Element => {
  const [newRoomType, setNewRoomType] =
    React.useState<NonNullable<RoomType> | null>( null );
  const [newRoomSize, setNewRoomSize] =
    React.useState<NonNullable<RoomSize>>( DEFAULT_ROOM_SIZE );
  const [newRoomLabel, setNewRoomLabel] = React.useState( "" );
  const [isSaving, setIsSaving] = React.useState( false );

  const resetForm = () => {
    setNewRoomType( null );
    setNewRoomSize( DEFAULT_ROOM_SIZE );
    setNewRoomLabel( "" );
  };

  const handleSelectRoomType = (roomType: NonNullable<RoomType>) => {
    setNewRoomType( roomType );
    setNewRoomSize( ROOM_TYPE_DEFAULT_SIZE[roomType] );
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!newRoomType) {
      return;
    }
    setIsSaving( true );
    try {
      await onSubmit( newRoomType, newRoomSize, newRoomLabel );
      resetForm();
    } catch {
      // 에러는 store의 error 상태로 표시됨
    } finally {
      setIsSaving( false );
    }
  };

  return (
    <ModalView visible={ visible } onRequestClose={ handleClose }>
      <Text style={ styles.modalTitle }> 방 추가 </Text>
      <View style={ styles.chipRow }>
        { ROOM_TYPES.map( roomType => (
          <Pressable
            key={ roomType }
            style={ [
              styles.chip,
              newRoomType === roomType && styles.chipSelected,
            ] }
            onPress={ () => handleSelectRoomType( roomType ) }
          >
            <Text
              style={
                newRoomType === roomType
                  ? styles.chipTextSelected
                  : styles.chipText
              }
            >
              { ROOM_TYPE_LABELS[roomType] }
            </Text>
          </Pressable>
        ) ) }
      </View>
      <View style={ styles.chipRow }>
        { ROOM_SIZES.map( size => (
          <Pressable
            key={ size }
            style={ [
              styles.chip,
              newRoomSize === size && styles.chipSelected,
            ] }
            onPress={ () => setNewRoomSize( size ) }
          >
            <Text
              style={
                newRoomSize === size
                  ? styles.chipTextSelected
                  : styles.chipText
              }
            >
              { ROOM_SIZE_LABELS[size] }
            </Text>
          </Pressable>
        ) ) }
      </View>
      <TextInput
        style={ styles.input }
        placeholder="이름(선택, 예: 안방)"
        value={ newRoomLabel }
        onChangeText={ setNewRoomLabel }
      />
      <View style={ styles.addRoomButtonRow }>
        <Button
          text="취소"
          onPress={ handleClose }
          style={ styles.cancelButton }
          textStyle={ styles.cancelButtonText }
        />
        <Pressable
          style={ styles.saveRoomButton }
          onPress={ handleSave }
          disabled={ isSaving || !newRoomType }
        >
          {
            isSaving
            ? <ActivityIndicator color="#fff" />
            : <Text style={ styles.addButtonText }> 추가 </Text>
          }
        </Pressable>
      </View>
    </ModalView>
  );
};

const styles = StyleSheet.create( {
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: commonColor.backgroundColor,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: commonColor.backgroundColor,
  },
  emptyText: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
  },
  emptySection: {
    fontSize: 14,
    color: "#999",
    marginBottom: 16,
  },
  error: {
    color: "#d32f2f",
    marginBottom: 12,
    textAlign: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  addRoomLink: {
    alignItems: "flex-end",
    marginBottom: 20,
  },
  addRoomLinkText: {
    color: commonColor.touchable,
    fontWeight: "600",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 16,
  },
  addRoomButtonRow: {
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
    borderColor: "#ccc",
  },
  cancelButtonText: {
    color: "#555",
    fontWeight: "600",
  },
  saveRoomButton: {
    flex: 1,
    backgroundColor: commonColor.touchable,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
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
  roomGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
} );

export default HomeScreen;
