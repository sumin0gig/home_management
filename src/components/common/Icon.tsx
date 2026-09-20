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
} as const;

export type IconName = keyof typeof IconSet;

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const SimpleIcon = ({
  name,
  size = 20,
  color = colors.black,
  style,
}: Omit<Props, "onPress">): React.JSX.Element => {
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
  style,
  ...rest
}: Props): React.JSX.Element => {
  return (
    <Pressable onPress={ onPress } hitSlop={ 12 } style={ style }>
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
