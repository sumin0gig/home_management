import React, { useEffect, useRef } from "react";
import { useAnimatedProps } from "react-native-reanimated";
import Svg, { G } from "react-native-svg";
import { colors } from "../../styles/commonStyle";
import { ACTIONS } from "./actions";
import { resetMascotValues } from "./animations/resetMascotValues";
import { rotateDeg, scaleXY, translateY } from "./animations/svgTransforms";
import { useMascotSharedValues } from "./animations/useMascotSharedValues";
import Body, { BODY_BOX } from "./parts/Body";
import MascotHead from "./MascotHead";
import AnimatedG from "./parts/AnimatedG";
import { EYE_RADIUS } from "./parts/Eye";
import Leg from "./parts/Leg";
import type { MascotAction, MascotConfig } from "./types";
import { TAIL_PIVOTS, TAIL_VARIANTS } from "./variants/tails";

const DEFAULT_ACTION: MascotAction = "idle";

// Side-view quadruped layout: head sits beside the body (not stacked on top
// of it), 4 legs run in a row along the body's underside, and the tail
// attaches near the body's rear-top corner — see mascot_rig_demo.html.
const VIEW_BOX = { width: 280, height: 200 };
const HEAD_X = 100;
const HEAD_BASE_Y = 90;
const TAIL_BOX = { width: 50, height: 30 };
const TAIL_ATTACH = { x: BODY_BOX.x + BODY_BOX.width + 2, y: BODY_BOX.y + 5 };
const GROUND_Y = 185;
const FRONT_LEG_HEIGHT = 32;
const BACK_LEG_HEIGHT = 30;
const FRONT_LEG_Y = GROUND_Y - FRONT_LEG_HEIGHT;
const BACK_LEG_Y = GROUND_Y - BACK_LEG_HEIGHT;
// 4 legs spread evenly under the body, front-to-back (nearest the head first).
const LEG_X = [0.105, 0.342, 0.579, 0.803].map(
  ratio => BODY_BOX.x + ratio * BODY_BOX.width,
);
const ROOT_PIVOT = { x: VIEW_BOX.width / 2, y: GROUND_Y };

interface Props {
  config: MascotConfig;
  action: MascotAction;
  size?: number;
  /**
   * One-shot 행동(duration이 있는 행동)이 끝났을 때 호출된다. 넘기면 다음
   * 행동은 부모가 `action`을 바꿔서 정하고, 넘기지 않으면 idle로 돌아간다.
   * 반복 행동(idle/walk)에서는 호출되지 않는다.
   */
  onActionEnd?: () => void;
}

const Mascot = ({
  config,
  action,
  size = 200,
  onActionEnd,
}: Props): React.JSX.Element => {
  const fill = config.fillColor ?? colors.yellow;
  const TailComponent = TAIL_VARIANTS[config.tailStyle];
  const tailPivot = TAIL_PIVOTS[config.tailStyle];

  const values = useMascotSharedValues();

  // 부모가 매 렌더마다 새 콜백을 넘겨도 액션이 다시 시작되지 않도록 ref로 보관.
  const onActionEndRef = useRef( onActionEnd );
  onActionEndRef.current = onActionEnd;

  useEffect( () => {
    const { run, duration } = ACTIONS[action];
    resetMascotValues( values );

    if (duration == null) {
      run( values );
      return;
    }

    // One-shot 행동은 idle을 바탕에 깔고 그 위에 덮어쓴다 — 행동이 건드리지
    // 않는 부위(눈 깜빡임, 다리 등)는 idle처럼 계속 살아 움직인다.
    ACTIONS[DEFAULT_ACTION].run( values );
    run( values );

    const timer = setTimeout( () => {
      if (onActionEndRef.current) {
        onActionEndRef.current();
        return;
      }
      resetMascotValues( values );
      ACTIONS[DEFAULT_ACTION].run( values );
    }, duration );
    return () => clearTimeout( timer );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action] );

  // See animations/svgTransforms.ts for why every G/Rect/Ellipse animatedProps
  // below uses `transform` instead of the x/y/rotation shorthand.
  const rootAnimatedProps = useAnimatedProps( () => ({
    transform: [
      ...translateY( values.jumpY.value ),
      ...scaleXY( 1 + values.squashX.value, 1 + values.squashY.value ),
    ],
  }) );

  const headAnimatedProps = useAnimatedProps( () => ({
    transform: translateY( values.headBob.value ),
  }) );

  const bodyAnimatedProps = useAnimatedProps( () => ({
    transform: scaleXY( 1, 1 + values.bodyBreath.value ),
  }) );

  const earLAnimatedProps = useAnimatedProps( () => ({
    transform: rotateDeg( values.earLTwitch.value ),
  }) );

  const earRAnimatedProps = useAnimatedProps( () => ({
    transform: rotateDeg( values.earRTwitch.value ),
  }) );

  const eyeLAnimatedProps = useAnimatedProps( () => ({
    ry: EYE_RADIUS + values.eyeLBlink.value,
  }) );

  const eyeRAnimatedProps = useAnimatedProps( () => ({
    ry: EYE_RADIUS + values.eyeRBlink.value,
  }) );

  const tailAnimatedProps = useAnimatedProps( () => ({
    transform: rotateDeg( values.tailWag.value ),
  }) );

  // The 4 legs run in a row front-to-back (LEG_X[0] nearest the head,
  // LEG_X[3] nearest the tail). Alternating legs bounce together (0&2 vs
  // 1&3) so the row ripples like a resting quadruped's weight shift,
  // instead of all 4 (or each front/back row) moving in unison.
  const legAAnimatedProps = useAnimatedProps( () => ({
    y: FRONT_LEG_Y + values.legPairABounce.value,
  }) );

  const legBAnimatedProps = useAnimatedProps( () => ({
    y: FRONT_LEG_Y + values.legPairBBounce.value,
  }) );

  const legCAnimatedProps = useAnimatedProps( () => ({
    y: BACK_LEG_Y + values.legPairABounce.value,
  }) );

  const legDAnimatedProps = useAnimatedProps( () => ({
    y: BACK_LEG_Y + values.legPairBBounce.value,
  }) );

  return (
    <Svg
      width={ size }
      height={ size * (VIEW_BOX.height / VIEW_BOX.width) }
      viewBox={ `0 0 ${VIEW_BOX.width} ${VIEW_BOX.height}` }
    >
      <AnimatedG
        origin={ `${ROOT_PIVOT.x}, ${ROOT_PIVOT.y}` }
        animatedProps={ rootAnimatedProps }
      >
        <G x={ TAIL_ATTACH.x } y={ TAIL_ATTACH.y - tailPivot.y }>
          <AnimatedG
            origin={ `${tailPivot.x}, ${tailPivot.y}` }
            animatedProps={ tailAnimatedProps }
          >
            <TailComponent
              width={ TAIL_BOX.width }
              height={ TAIL_BOX.height }
              fill={ fill }
            />
          </AnimatedG>
        </G>
        <Body fill={ fill } animatedProps={ bodyAnimatedProps } />
        <Leg
          x={ LEG_X[0] }
          y={ FRONT_LEG_Y }
          width={ 20 }
          height={ FRONT_LEG_HEIGHT }
          fill={ fill }
          animatedProps={ legAAnimatedProps }
        />
        <Leg
          x={ LEG_X[1] }
          y={ FRONT_LEG_Y }
          width={ 20 }
          height={ FRONT_LEG_HEIGHT }
          fill={ fill }
          animatedProps={ legBAnimatedProps }
        />
        <Leg
          x={ LEG_X[2] }
          y={ BACK_LEG_Y }
          width={ 18 }
          height={ BACK_LEG_HEIGHT }
          fill={ fill }
          animatedProps={ legCAnimatedProps }
        />
        <Leg
          x={ LEG_X[3] }
          y={ BACK_LEG_Y }
          width={ 18 }
          height={ BACK_LEG_HEIGHT }
          fill={ fill }
          animatedProps={ legDAnimatedProps }
        />
        <G x={ HEAD_X } y={ HEAD_BASE_Y }>
          <AnimatedG animatedProps={ headAnimatedProps }>
            <MascotHead
              fill={ fill }
              earStyle={ config.earStyle }
              earLAnimatedProps={ earLAnimatedProps }
              earRAnimatedProps={ earRAnimatedProps }
              eyeLAnimatedProps={ eyeLAnimatedProps }
              eyeRAnimatedProps={ eyeRAnimatedProps }
            />
          </AnimatedG>
        </G>
      </AnimatedG>
    </Svg>
  );
};

export default Mascot;
