import React, { useEffect } from "react";
import Animated, { useAnimatedProps } from "react-native-reanimated";
import Svg, { G } from "react-native-svg";
import { colors } from "../../styles/commonStyle";
import { ACTIONS } from "./actions";
import { useMascotSharedValues } from "./animations/useMascotSharedValues";
import Body from "./parts/Body";
import Eye from "./parts/Eye";
import Face from "./parts/Face";
import Leg from "./parts/Leg";
import type { MascotAction, MascotConfig } from "./types";
import { EAR_PIVOTS, EAR_VARIANTS } from "./variants/ears";
import { TAIL_PIVOTS, TAIL_VARIANTS } from "./variants/tails";

const AnimatedG = Animated.createAnimatedComponent( G );

const HEAD_BASE_Y = 70;
const EAR_BOX = { width: 34, height: 46 };
const EAR_L_ORIGIN = { x: -40, y: -63 };
const EAR_R_ORIGIN = { x: 6, y: -63 };
const TAIL_BOX = { width: 50, height: 30 };
const TAIL_ATTACH = { x: 145, y: 140 };
const FRONT_LEG_Y = 155;
const BACK_LEG_Y = 150;
const ROOT_PIVOT = { x: 100, y: 210 };

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
      ACTIONS.idle.run( values );
    }, duration );
    return () => clearTimeout( timer );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action] );

  const rootAnimatedProps = useAnimatedProps( () => ({
    y: values.jumpY.value,
    transform: [
      { scaleX: values.squashX.value },
      { scaleY: values.squashY.value },
    ],
  }) );

  const headAnimatedProps = useAnimatedProps( () => ({
    y: HEAD_BASE_Y + values.headBob.value,
  }) );

  const bodyAnimatedProps = useAnimatedProps( () => ({
    transform: [{ scaleY: values.bodyBreath.value }],
  }) );

  const earLAnimatedProps = useAnimatedProps( () => ({
    rotation: values.earLTwitch.value,
  }) );

  const earRAnimatedProps = useAnimatedProps( () => ({
    rotation: values.earRTwitch.value,
  }) );

  const eyeLAnimatedProps = useAnimatedProps( () => ({
    ry: values.eyeLBlink.value,
  }) );

  const eyeRAnimatedProps = useAnimatedProps( () => ({
    ry: values.eyeRBlink.value,
  }) );

  const tailAnimatedProps = useAnimatedProps( () => ({
    rotation: values.tailWag.value,
  }) );

  const frontLegsAnimatedProps = useAnimatedProps( () => ({
    y: FRONT_LEG_Y + values.frontLegsBounce.value,
  }) );

  const backLegsAnimatedProps = useAnimatedProps( () => ({
    y: BACK_LEG_Y + values.backLegsBounce.value,
  }) );

  return (
    <Svg width={ size } height={ size * 1.1 } viewBox="0 0 200 220">
      <AnimatedG
        origin={ `${ROOT_PIVOT.x}, ${ROOT_PIVOT.y}` }
        animatedProps={ rootAnimatedProps }
      >
        <Leg
          x={ 45 }
          y={ BACK_LEG_Y }
          width={ 18 }
          height={ 30 }
          fill={ fill }
          animatedProps={ backLegsAnimatedProps }
        />
        <Leg
          x={ 137 }
          y={ BACK_LEG_Y }
          width={ 18 }
          height={ 30 }
          fill={ fill }
          animatedProps={ backLegsAnimatedProps }
        />
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
          x={ 62 }
          y={ FRONT_LEG_Y }
          width={ 20 }
          height={ 32 }
          fill={ fill }
          animatedProps={ frontLegsAnimatedProps }
        />
        <Leg
          x={ 118 }
          y={ FRONT_LEG_Y }
          width={ 20 }
          height={ 32 }
          fill={ fill }
          animatedProps={ frontLegsAnimatedProps }
        />
        <G x={ 100 }>
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
