import React from "react";
import {
  ActivityIndicator,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";
import { useFamilyStore } from "../../store/useFamilyStore";
import { useTaskStore } from "../../store/useTaskStore";
import { useRoomStore } from "../../store/useRoomStore";
import { useMascotStore } from "../../store/useMascotStore";
import { toDateString } from "../../utils/date";
import { colors, commonColor } from "../../styles/commonStyle";
import FloorPlanCanvas from "../../components/FloorPlan/FloorPlanCanvas";
import WanderingMascot from "../../components/Mascot/WanderingMascot";
import {
  EAR_OPTIONS,
  TAIL_OPTIONS,
} from "../../components/Mascot/optionMaps";
import { type FloorPlanRoom } from "../../store/useRoomStore";

type Props = NativeStackScreenProps<HomeStackParamList, "HomeMain">;

function HomeScreen( { navigation }: Props ): React.JSX.Element {
  const family = useFamilyStore( state => state.family );

  const rooms = useRoomStore( state => state.rooms );
  const roomStatus = useRoomStore( state => state.status );
  const roomError = useRoomStore( state => state.error );
  const fetchRooms = useRoomStore( state => state.fetchRooms );

  const tasks = useTaskStore( state => state.tasks );
  const taskStatus = useTaskStore( state => state.status );
  const taskError = useTaskStore( state => state.error );
  const fetchTasksForFamily = useTaskStore(
    state => state.fetchTasksForFamily,
  );

  const mascot = useMascotStore( state => state.mascot );

  const [wanderBounds, setWanderBounds] = React.useState( {
    width: 0,
    height: 0,
  } );

  const onOverlayLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setWanderBounds( { width, height } );
  };

  React.useEffect( () => {
    if (family?.id) {
      fetchRooms( family.id );
    }
  }, [family?.id, fetchRooms] );

  const roomIds = rooms.map( r => r.id ).join( "," );
  React.useEffect( () => {
    if (family?.id) {
      fetchTasksForFamily( family.id );
    }
  }, [family?.id, roomIds, fetchTasksForFamily] );

  if (roomStatus === "loading" || taskStatus === "loading") {
    return (
      <View style={ styles.centerContainer }>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const today = toDateString( new Date() );

  const hasDueToday = (room: FloorPlanRoom): boolean =>
    tasks.some( t => t.roomId === room.id && t.nextDueDate <= today );

  const mascotConfig = mascot
    ? {
        earStyle:
          EAR_OPTIONS.find( option => option.value === mascot.earStyle )
            ?.variant ?? "round",
        tailStyle:
          TAIL_OPTIONS.find( option => option.value === mascot.tailStyle )
            ?.variant ?? "straight",
        fillColor: mascot.fillColor ?? undefined,
      }
    : null;

  return (
    <View style={ styles.root }>
      <View style={ styles.container }>
        { roomError && <Text style={ styles.error }> { roomError } </Text> }
        { taskError && <Text style={ styles.error }> { taskError } </Text> }

        <Pressable
          style={ styles.editLink }
          onPress={ () => navigation.navigate( "RoomEdit" ) }
        >
          <Text style={ styles.editLinkText }> 편집 </Text>
        </Pressable>

        {
          rooms.length === 0
          ? <Text style={ styles.emptySection }>
            등록된 방이 없습니다. 편집에서 방을 추가해주세요.
          </Text>
          : <ScrollView
            style={ styles.floorPlanScroll }
            showsVerticalScrollIndicator={ false }
          >
            <FloorPlanCanvas
              rooms={ rooms }
              onRoomPress={ room =>
                navigation.navigate( "RoomDetail", { roomId: room.id } )
              }
              hasDueToday={ hasDueToday }
            />
          </ScrollView>
        }
      </View>

      <View
        style={ styles.wanderLayer }
        pointerEvents="box-none"
        onLayout={ onOverlayLayout }
      >
        {
          mascotConfig
          ? <WanderingMascot
            config={ mascotConfig }
            bounds={ wanderBounds }
            onPress={ () => navigation.navigate( "MascotDetail" ) }
          />
          : null
        }
      </View>
    </View>
  );
}

const styles = StyleSheet.create( {
  root: {
    flex: 1,
  },
  wanderLayer: {
    ...StyleSheet.absoluteFillObject,
  },
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
    color: colors.gray,
    marginBottom: 16,
  },
  error: {
    color: "#d32f2f",
    marginBottom: 12,
    textAlign: "center",
  },
  editLink: {
    alignItems: "flex-end",
    marginBottom: 20,
  },
  editLinkText: {
    color: commonColor.touchable,
    fontWeight: "600",
  },
  floorPlanScroll: {
    flex: 1,
  },
} );

export default HomeScreen;
