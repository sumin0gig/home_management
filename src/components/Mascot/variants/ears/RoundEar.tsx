import React from "react";
import Animated from "react-native-reanimated";
import { Ellipse } from "react-native-svg";
import type { EarVariantProps, Pivot } from "../../types";

const AnimatedEllipse = Animated.createAnimatedComponent( Ellipse );

export const pivot: Pivot = { x: 17, y: 44 };

const RoundEar = ({
  fill,
  animatedProps,
}: EarVariantProps): React.JSX.Element => {
  return (
    <AnimatedEllipse
      cx={ 17 }
      cy={ 20 }
      rx={ 15 }
      ry={ 18 }
      fill={ fill }
      animatedProps={ animatedProps }
    />
  );
};

export default RoundEar;
