import React, { useEffect } from "react";
import Animated, { useAnimatedProps } from "react-native-reanimated";
import Svg, { G } from "react-native-svg";
import { colors } from "../../styles/commonStyle";
import { ACTIONS } from "./actions";
import { useMascotSharedValues } from "./animations/useMascotSharedValues";
import Body, { BODY_BOX } from "./parts/Body";
import Eye, { EYE_RADIUS } from "./parts/Eye";
import Face from "./parts/Face";
import Leg from "./parts/Leg";
import type { MascotAction, MascotConfig } from "./types";
import { EAR_PIVOTS, EAR_VARIANTS } from "./variants/ears";
import { TAIL_PIVOTS, TAIL_VARIANTS } from "./variants/tails";

const AnimatedG = Animated.createAnimatedComponent( G );

const DEFAULT_ACTION: MascotAction = "idle";

// Side-view quadruped layout: head sits beside the body (not stacked on top
// of it), 4 legs run in a row along the body's underside, and the tail
// attaches near the body's rear-top corner — see mascot_rig_demo.html.
const VIEW_BOX = { width: 280, height: 200 };
const HEAD_X = 100;
const HEAD_BASE_Y = 90;
const EAR_BOX = { width: 34, height: 46 };
const EAR_L_ORIGIN = { x: -40, y: -63 };
const EAR_R_ORIGIN = { x: 6, y: -63 };
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
}

const Mascot = ({ config, action, size = 200 }: Props): React.JSX.Element => {
  const fill = config.fillColor ?? colors.yellow;
  const EarComponent = EAR_VARIANTS[config.earStyle];
  const earPivot = EAR_PIVOTS[config.earStyle];
  const TailComponent = TAIL_VARIANTS[config.tailStyle];
  const tailPivot = TAIL_PIVOTS[config.tailStyle];

  const values = useMascotSharedValues();

  useEffect( () => {
    const { run, duration } = ACTIONS[action];
    run( values );
    if (duration == null) {
      return;
    }
    const timer = setTimeout( () => {
      ACTIONS[DEFAULT_ACTION].run( values );
    }, duration );
    return () => clearTimeout( timer );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action] );

  // G only exposes x/y/rotation as JS-render-time convenience props (they get
  // baked into a matrix by react-native-svg's own render pass) — Reanimated's
  // per-frame native updates bypass that render pass entirely, so setting
  // them via animatedProps silently no-ops. `transform` (RN-style array or an
  // SVG transform string) is a real native prop and animates correctly; use
  // that for every G/Rect/Ellipse animatedProps below instead of the y/
  // rotation shorthand.
  const rootAnimatedProps = useAnimatedProps( () => ({
    transform: [
      { translateY: values.jumpY.value },
      { scaleX: 1 + values.squashX.value },
      { scaleY: 1 + values.squashY.value },
    ],
  }) );

  const headAnimatedProps = useAnimatedProps( () => ({
    transform: [{ translateY: values.headBob.value }],
  }) );

  const bodyAnimatedProps = useAnimatedProps( () => ({
    transform: [{ scaleY: 1 + values.bodyBreath.value }],
  }) );

  const earLAnimatedProps = useAnimatedProps( () => ({
    transform: [{ rotate: `${values.earLTwitch.value}deg` }],
  }) );

  const earRAnimatedProps = useAnimatedProps( () => ({
    transform: [{ rotate: `${values.earRTwitch.value}deg` }],
  }) );

  const eyeLAnimatedProps = useAnimatedProps( () => ({
    ry: EYE_RADIUS + values.eyeLBlink.value,
  }) );

  const eyeRAnimatedProps = useAnimatedProps( () => ({
    ry: EYE_RADIUS + values.eyeRBlink.value,
  }) );

  const tailAnimatedProps = useAnimatedProps( () => ({
    transform: [{ rotate: `${values.tailWag.value}deg` }],
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
            <G x={ EAR_L_ORIGIN.x } y={ EAR_L_ORIGIN.y }>
              <AnimatedG
                origin={ `${earPivot.x}, ${earPivot.y}` }
                animatedProps={ earLAnimatedProps }
              >
                <EarComponent
                  width={ EAR_BOX.width }
                  height={ EAR_BOX.height }
                  fill={ fill }
                />
              </AnimatedG>
            </G>
            <G x={ EAR_R_ORIGIN.x } y={ EAR_R_ORIGIN.y }>
              <AnimatedG
                origin={ `${earPivot.x}, ${earPivot.y}` }
                animatedProps={ earRAnimatedProps }
              >
                <EarComponent
                  width={ EAR_BOX.width }
                  height={ EAR_BOX.height }
                  fill={ fill }
                />
              </AnimatedG>
            </G>
            <Face fill={ fill } />
            <Eye
              cx={ -15 }
              cy={ -3 }
              fill={ colors.black }
              animatedProps={ eyeLAnimatedProps }
            />
            <Eye
              cx={ 15 }
              cy={ -3 }
              fill={ colors.black }
              animatedProps={ eyeRAnimatedProps }
            />
          </AnimatedG>
        </G>
      </AnimatedG>
    </Svg>
  );
};

export default Mascot;
