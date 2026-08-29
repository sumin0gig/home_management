import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";
import { useChoreStore } from "../../store/useChoreStore";
import { useRoomStore } from "../../store/useRoomStore";
import { toDateString, type ChoreRow } from "../../api/chore";
import { roomDisplayName } from "../../api/room";
import { commonColor } from "../../styles/commonStyle";
import Button from "../../components/common/Button";

type Props = NativeStackScreenProps<HomeStackParamList, "RoomDetail">;

function formatDueLabel( nextDueDate: string, today: string ): string {
  if (nextDueDate < today) {
    return "기한 지남";
  }
  if (nextDueDate === today) {
    return "오늘";
  }
  return `예정 (${nextDueDate})`;
}

function RoomDetailScreen( { navigation, route }: Props ): React.JSX.Element {
  const { roomId } = route.params;

  const room = useRoomStore( state => state.rooms.find( r => r.id === roomId ) );
  const chores = useChoreStore( state => state.chores );
  const choreStatus = useChoreStore( state => state.status );
  const choreError = useChoreStore( state => state.error );
  const completeChore = useChoreStore( state => state.completeChore );

  React.useEffect( () => {
    navigation.setOptions( { title: room ? roomDisplayName( room ) : "방" } );
  }, [navigation, room] );

  const today = toDateString( new Date() );
  const roomChores = chores
    .filter( c => c.roomId === roomId )
    .sort( (a, b) => a.nextDueDate.localeCompare( b.nextDueDate ) );

  const renderChore = (item: ChoreRow) => (
    <View style={ styles.choreRow } key={ item.id }>
      <Pressable
        style={ styles.choreInfo }
        onPress={ () => navigation.navigate( "ChoreForm", { choreId: item.id } ) }
      >
        <Text style={ styles.choreTitle }> { item.title } </Text>
        {
          item.description
          ? <Text style={ styles.choreDescription }> { item.description } </Text>
          : null
        }
        <Text style={ styles.choreDue }>
          { formatDueLabel( item.nextDueDate, today ) }
        </Text>
      </Pressable>
      <Button
        text="완료"
        onPress={ () => completeChore( item ) }
        style={ styles.completeButton }
        textStyle={ styles.completeButtonText }
      />
    </View>
  );

  if (choreStatus === "loading") {
    return (
      <View style={ styles.centerContainer }>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={ styles.container }>
      {
        choreError
        ? <Text style={ styles.error }> { choreError } </Text>
        : null
      }

      <Button
        text="+ 집안일 추가"
        onPress={ () => navigation.navigate( "ChoreForm", { roomId } ) }
        style={ styles.addButton }
        textStyle={ styles.addButtonText }
      />

      <ScrollView>
        {
          roomChores.length === 0
          ? <Text style={ styles.emptySection }> 집안일이 없습니다. </Text>
          : roomChores.map( renderChore )
        }
      </ScrollView>
    </View>
  );
}

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
  addButton: {
    backgroundColor: commonColor.touchable,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  choreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  choreInfo: {
    flex: 1,
    marginRight: 12,
  },
  choreTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  choreDescription: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  choreDue: {
    fontSize: 12,
    color: "#2f6fed",
    marginTop: 4,
    fontWeight: "600",
  },
  completeButton: {
    backgroundColor: commonColor.touchable,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  completeButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
} );

export default RoomDetailScreen;
