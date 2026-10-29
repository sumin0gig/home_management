import React from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import HouseIcon from "bootstrap-icons/icons/house.svg";
import PeopleIcon from "bootstrap-icons/icons/people.svg";
import GearIcon from "bootstrap-icons/icons/gear.svg";
import ChevronDownIcon from "bootstrap-icons/icons/chevron-down.svg";
import ChevronLeftIcon from "bootstrap-icons/icons/chevron-left.svg";
import ChevronRightIcon from "bootstrap-icons/icons/chevron-right.svg";
import PersonPlusIcon from "bootstrap-icons/icons/person-plus.svg";
import PlusIcon from "bootstrap-icons/icons/plus-lg.svg";
import LightbulbIcon from "bootstrap-icons/icons/lightbulb.svg";
import CheckCircleIcon from "bootstrap-icons/icons/check-circle-fill.svg";
import CloseIcon from "bootstrap-icons/icons/x-lg.svg";
import CheckIcon from "bootstrap-icons/icons/check-lg.svg";
import { colors } from "../../styles/commonStyle";

const IconSet = {
  Home: HouseIcon,
  Family: PeopleIcon,
  Settings: GearIcon,
  ChevronDown: ChevronDownIcon,
  ChevronLeft: ChevronLeftIcon,
  ChevronRight: ChevronRightIcon,
  PersonPlus: PersonPlusIcon,
  Plus: PlusIcon,
  Lightbulb: LightbulbIcon,
  CheckCircle: CheckCircleIcon,
  Close: CloseIcon,
  Check: CheckIcon,
} as const;

export type IconName = keyof typeof IconSet;

interface BaseProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

// 누를 수 있는 아이콘은 화면 읽기 프로그램이 읽을 이름이 꼭 있어야 한다.
type Props =
  | (BaseProps & { onPress?: undefined; accessibilityLabel?: undefined })
  | (BaseProps & { onPress: () => void; accessibilityLabel: string });

// 터치 영역이 최소 44가 되도록 아이콘 둘레에 더하는 여유 (최소 12)
const MIN_TOUCH_SIZE = 44;
function touchSlop(size: number): number {
  return Math.max( 12, Math.ceil( (MIN_TOUCH_SIZE - size) / 2 ) );
}

const SimpleIcon = ({
  name,
  size = 20,
  color = colors.black,
  style,
}: BaseProps): React.JSX.Element => {
  const IconComponent = IconSet[name];
  return (
    <IconComponent
      width={ size }
      height={ size }
      color={ color }
      style={ style }
    />
  );
};

const TouchableIcon = ({
  onPress,
  accessibilityLabel,
  style,
  ...rest
}: BaseProps & {
  onPress: () => void;
  accessibilityLabel: string;
}): React.JSX.Element => {
  return (
    <Pressable
      onPress={ onPress }
      hitSlop={ touchSlop( rest.size ?? 20 ) }
      style={ style }
      accessibilityRole="button"
      accessibilityLabel={ accessibilityLabel }
    >
      <SimpleIcon { ...rest } />
    </Pressable>
  );
};

const Icon = (props: Props): React.JSX.Element => {
  return (
    props.onPress
    ? <TouchableIcon { ...props } />
    : <SimpleIcon { ...props } />
  );
};

export default Icon;
