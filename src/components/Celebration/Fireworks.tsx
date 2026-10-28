import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { commonColor, ROOM_COLOR_PALETTE } from "../../styles/commonStyle";

const BURST_DURATION_MS = 900;
const BURST_DELAYS_MS = [0, 220, 440];
const BURST_PARTICLES = 14;
const LEVEL_UP_DELAY_MS = 1000;
const LEVEL_UP_PARTICLES = 20;

// 밝기(0~1). 팔레트에서 진한 쪽을 고를 때 쓴다.
function luminance( hex: string ): number {
  const value = parseInt( hex.slice( 1 ), 16 );
  const r = Math.floor( value / 65536 ) % 256;
  const g = Math.floor( value / 256 ) % 256;
  const b = value % 256;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// ROOM_COLOR_PALETTE의 진한 쪽 4개 + touchable. 방 색과 같은 색은 뺀다.
export function fireworkColors( roomColor?: string | null ): string[] {
  const darkest = [...ROOM_COLOR_PALETTE]
  .sort( (a, b) => luminance( a ) - luminance( b ) )
  .slice( 0, 4 );
  const all = [...darkest, commonColor.touchable];
  const room = roomColor?.toLowerCase();
  return all.filter( color => color.toLowerCase() !== room );
}

interface ParticleSpec {
  angle: number;
  distance: number;
  color: string;
  // 원(지름 5~7) 또는 길이 10의 짧은 선
  shape: "dot" | "line";
  size: number;
}

function makeParticles(
  count: number,
  colors: string[],
  spread: number,
  seed: number,
): ParticleSpec[] {
  return Array.from( { length: count } ).map( (_, i) => {
    // 각도는 고르게, 거리·크기는 seed로 조금씩 흔든다 (렌더마다 같은 모양)
    const wobble = ((i * 37 + seed * 11) % 10) / 10;
    return {
      angle: (2 * Math.PI * i) / count + wobble * 0.3,
      distance: spread * (0.7 + wobble * 0.3),
      color: colors[(i + seed) % colors.length],
      shape: i % 3 === 0 ? "line" : "dot",
      size: 5 + ((i + seed) % 3),
    };
  } );
}

function Particle( {
  spec,
  progress,
}: {
  spec: ParticleSpec;
  progress: SharedValue<number>;
} ): React.JSX.Element {
  const style = useAnimatedStyle( () => {
    const p = progress.value;
    return {
      opacity: p === 0 ? 0 : 1 - p,
      transform: [
        { translateX: Math.cos( spec.angle ) * spec.distance * p },
        { translateY: Math.sin( spec.angle ) * spec.distance * p },
        { rotate: `${spec.angle}rad` },
        { scale: 1 - 0.6 * p },
      ],
    };
  } );
  // 터지는 점이 입자 한가운데에 오도록 크기의 절반만큼 당긴다.
  const shapeStyle =
    spec.shape === "line"
      ? { width: 10, height: 2, borderRadius: 1, left: -5, top: -1 }
      : {
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
          left: -spec.size / 2,
          top: -spec.size / 2,
        };
  return (
    <Animated.View
      style={ [styles.particle, shapeStyle, { backgroundColor: spec.color }, style] }
    />
  );
}

interface BurstProps {
  x: number;
  y: number;
  delay: number;
  particles: ParticleSpec[];
}

function Burst( { x, y, delay, particles }: BurstProps ): React.JSX.Element {
  const progress = useSharedValue( 0 );
  React.useEffect( () => {
    progress.value = withDelay(
      delay,
      withTiming( 1, {
        duration: BURST_DURATION_MS,
        easing: Easing.out( Easing.quad ),
      } ),
    );
  }, [delay, progress] );
  return (
    <View style={ [styles.burst, { left: x, top: y }] } testID="firework-burst">
      { particles.map( (spec, i) => (
        <Particle key={ i } spec={ spec } progress={ progress } />
      ) ) }
    </View>
  );
}

interface Props {
  // 폭죽을 그릴 영역 (초상보다 넓게, 초상 위에 절대 위치로 겹친다)
  size: number;
  // 가운데 초상 원의 지름
  circleSize: number;
  roomColor?: string | null;
  leveledUp?: boolean;
}

// 오늘의 마지막 할 일 축하용 폭죽. 원의 왼쪽 위, 오른쪽 위, 오른쪽 아래 근처에서
// 0·220·440ms에 터지고, 레벨이 올랐으면 1초 뒤 가운데서 한 번 더 크게 터진다.
function Fireworks( {
  size,
  circleSize,
  roomColor,
  leveledUp = false,
}: Props ): React.JSX.Element {
  const reduceMotion = useReducedMotion();
  const colors = React.useMemo( () => fireworkColors( roomColor ), [roomColor] );
  const center = size / 2;
  const radius = circleSize / 2;
  // 원 둘레 대각선 위치 (45°)
  const diagonal = radius * Math.SQRT1_2;
  const origins = [
    { x: center - diagonal, y: center - diagonal },
    { x: center + diagonal, y: center - diagonal },
    { x: center + diagonal, y: center + diagonal },
  ];

  if (reduceMotion) {
    // 움직이지 않는 작은 반짝임 몇 개만 원 둘레에
    const sparkles = Array.from( { length: 6 } ).map( (_, i) => {
      const angle = (2 * Math.PI * i) / 6 - Math.PI / 2;
      return {
        x: center + Math.cos( angle ) * (radius + 14),
        y: center + Math.sin( angle ) * (radius + 14),
        color: colors[i % colors.length],
      };
    } );
    return (
      <View
        style={ [styles.container, { width: size, height: size }] }
        pointerEvents="none"
        testID="fireworks"
      >
        { sparkles.map( (sparkle, i) => (
          <View
            key={ i }
            testID="firework-sparkle"
            style={ [
              styles.sparkle,
              {
                left: sparkle.x - 3,
                top: sparkle.y - 3,
                backgroundColor: sparkle.color,
              },
            ] }
          />
        ) ) }
      </View>
    );
  }

  return (
    <View
      style={ [styles.container, { width: size, height: size }] }
      pointerEvents="none"
      testID="fireworks"
    >
      { origins.map( (origin, i) => (
        <Burst
          key={ i }
          x={ origin.x }
          y={ origin.y }
          delay={ BURST_DELAYS_MS[i] }
          particles={ makeParticles( BURST_PARTICLES, colors, 46, i ) }
        />
      ) ) }
      {
        leveledUp
        ? <Burst
            x={ center }
            y={ center }
            delay={ LEVEL_UP_DELAY_MS }
            particles={ makeParticles( LEVEL_UP_PARTICLES, colors, radius + 40, 7 ) }
          />
        : null
      }
    </View>
  );
}

const styles = StyleSheet.create( {
  container: {
    position: "absolute",
  },
  burst: {
    position: "absolute",
    width: 0,
    height: 0,
  },
  particle: {
    position: "absolute",
  },
  sparkle: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
  },
} );

export default Fireworks;
