import React from "react";
import Animated from "react-native-reanimated";
import { Rect } from "react-native-svg";
import type { VariantAnimatedProps } from "../types";

const AnimatedRect = Animated.createAnimatedComponent( Rect );

export const BODY_PIVOT = { x: 100, y: 175 };

interface Props {
  fill: string;
  animatedProps?: VariantAnimatedProps;
}

const Body = ({ fill, animatedProps }: Props): React.JSX.Element => {
  return (
    <AnimatedRect
      x={ 55 }
      y={ 105 }
      width={ 90 }
      height={ 70 }
      rx={ 35 }
      fill={ fill }
      origin={ `${BODY_PIVOT.x}, ${BODY_PIVOT.y}` }
      animatedProps={ animatedProps }
    />
  );
};

export default Body;
