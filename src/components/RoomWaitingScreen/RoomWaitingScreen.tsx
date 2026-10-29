import React from "react";
import { AppState, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useFamilyStore } from "../../store/useFamilyStore";
import { useRoomStore } from "../../store/useRoomStore";
import { useMascotStore } from "../../store/useMascotStore";
import OnboardingScaffold from "../Onboarding/OnboardingScaffold";
import OnboardingButton from "../Onboarding/OnboardingButton";
import { colors, commonColor } from "../../styles/commonStyle";

export const WAITING_POLL_INTERVAL_MS = 15000;

function Dot( { index }: { index: number } ): React.JSX.Element {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue( reduceMotion ? 0.6 : 0.25 );
  React.useEffect( () => {
    if (reduceMotion) {
      return;
    }
    opacity.value = withDelay(
      index * 180,
      withRepeat(
        withSequence( withTiming( 1, { duration: 400 } ), withTiming( 0.25, { duration: 400 } ) ),
        -1,
      ),
    );
  }, [index, opacity, reduceMotion] );
  const style = useAnimatedStyle( () => ( { opacity: opacity.value } ) );
  return <Animated.View style={ [styles.dot, style] } />;
}

interface Props {
  // 기다리는 동안 마스코트를 만들러 가기 (RootNavigator가 MascotSetup을 보여준다)
  onMakeMascot?: () => void;
}

// 참여자가 관리자의 집 만들기를 기다리는 화면. 15초마다, 그리고 앱이 다시
// 활성화될 때 방을 다시 불러오고, 방이 생기면 RootNavigator가 다음 단계로 넘긴다.
function RoomWaitingScreen( { onMakeMascot }: Props ): React.JSX.Element {
  const family = useFamilyStore( state => state.family );
  const members = useFamilyStore( state => state.members );
  const fetchRooms = useRoomStore( state => state.fetchRooms );
  const hasMascot = useMascotStore( state => state.mascot !== null );

  const ownerName = members.find( m => m.role === "OWNER" )?.displayName ?? "관리자";
  const familyId = family?.id;

  React.useEffect( () => {
    if (!familyId) {
      return;
    }
    const timer = setInterval( () => fetchRooms( familyId ), WAITING_POLL_INTERVAL_MS );
    const subscription = AppState.addEventListener( "change", state => {
      if (state === "active") {
        fetchRooms( familyId );
      }
    } );
    return () => {
      clearInterval( timer );
      subscription.remove();
    };
  }, [familyId, fetchRooms] );

  return (
    <OnboardingScaffold
      progress={ { step: 1, total: 2, label: "기다리는 중" } }
      title={ `${ownerName}님이\n집 구조를 만들고 있어요` }
      titleAlign="center"
    >
      <View style={ styles.status } accessibilityLiveRegion="polite">
        <Text style={ styles.statusText }> 다 되면 자동으로 넘어가요 </Text>
        <View style={ styles.dots } accessibilityElementsHidden>
          <Dot index={ 0 } />
          <Dot index={ 1 } />
          <Dot index={ 2 } />
        </View>
      </View>

      {
        !hasMascot && onMakeMascot
        ? <View style={ styles.card } testID="waiting-mascot-card">
            <Text style={ styles.cardTitle }> 기다리는 동안 마스코트를 만들어볼까요? </Text>
            <Text style={ styles.cardDescription }>
              집안일을 할 때마다 함께 추억을 쌓을 친구예요.
            </Text>
            <OnboardingButton text="마스코트 만들기" onPress={ onMakeMascot } />
          </View>
        : null
      }
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create( {
  status: {
    alignItems: "center",
    gap: 10,
    marginBottom: 32,
  },
  statusText: {
    fontSize: 13,
    color: commonColor.textMuted,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: commonColor.textDefault,
  },
  card: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    backgroundColor: colors.white,
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: commonColor.textDefault,
  },
  cardDescription: {
    fontSize: 13,
    color: commonColor.textMuted,
    marginBottom: 8,
  },
} );

export default RoomWaitingScreen;
