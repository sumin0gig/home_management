import React from "react";
import Animated from "react-native-reanimated";
import { Rect } from "react-native-svg";
import type { VariantAnimatedProps } from "../types";

const AnimatedRect = Animated.createAnimatedComponent( Rect );

export const BODY_BOX = { x: 110, y: 95, width: 110, height: 68 };
export const BODY_PIVOT = {
  x: BODY_BOX.x + BODY_BOX.width / 2,
  y: BODY_BOX.y + BODY_BOX.height,
};

interface Props {
  fill: string;
  animatedProps?: VariantAnimatedProps;
}

const Body = ({ fill, animatedProps }: Props): React.JSX.Element => {
  return (
    <AnimatedRect
      x={ BODY_BOX.x }
      y={ BODY_BOX.y }
      width={ BODY_BOX.width }
      height={ BODY_BOX.height }
      rx={ 12 }
      fill={ fill }
      origin={ `${BODY_PIVOT.x}, ${BODY_PIVOT.y}` }
      animatedProps={ animatedProps }
    />
  );
};

export default Body;
