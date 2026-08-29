import React from "react";
import Animated from "react-native-reanimated";
import { Ellipse } from "react-native-svg";
import type { VariantAnimatedProps } from "../types";

const AnimatedEllipse = Animated.createAnimatedComponent( Ellipse );

interface Props {
  cx: number;
  cy: number;
  fill: string;
  animatedProps?: VariantAnimatedProps;
}

const Eye = ({ cx, cy, fill, animatedProps }: Props): React.JSX.Element => {
  return (
    <AnimatedEllipse
      cx={ cx }
      cy={ cy }
      rx={ 7 }
      ry={ 7 }
      fill={ fill }
      animatedProps={ animatedProps }
    />
  );
};

export default Eye;
