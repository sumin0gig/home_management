import Animated from "react-native-reanimated";
import { G } from "react-native-svg";

// Mascot과 MascotHead가 함께 쓰는 애니메이션 가능한 <G>.
const AnimatedG = Animated.createAnimatedComponent( G );

export default AnimatedG;
