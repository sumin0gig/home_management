import React from "react";
import Animated from "react-native-reanimated";
import { Path } from "react-native-svg";
import type { EarVariantProps, Pivot } from "../../types";

const AnimatedPath = Animated.createAnimatedComponent( Path );

// Unlike the perky round/pointy ears (which fill the box pointing away from
// the head), this one deliberately hangs PAST the attachment point — the
// small rounded "hinge" near y=28-40 sits where a perky ear's base would be,
// then the shape swings outward (negative x) and down to y~76, clear of
// Face's circle (EAR_L_ORIGIN.x in Mascot.tsx sits tangent to that circle),
// so it visually drapes down alongside the head instead of getting swallowed
// by it.
export const pivot: Pivot = { x: 15, y: 26 };

const FloppyEar = ({
  fill,
  animatedProps,
}: EarVariantProps): React.JSX.Element => {
  return (
    <AnimatedPath
      d="M15,26 C10,32 -8,44 -16,62 C-20,78 -8,92 8,92 C22,90 28,74 22,60 C18,46 20,32 15,26 Z"
      fill={ fill }
      { ...(animatedProps && { animatedProps }) }
    />
  );
};

export default FloppyEar;
