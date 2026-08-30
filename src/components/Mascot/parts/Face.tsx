import React from "react";
import { Circle } from "react-native-svg";

interface Props {
  fill: string;
}

const Face = ({ fill }: Props): React.JSX.Element => {
  return <Circle
    cx={ 0 }
    cy={ 0 }
    r={ 40 }
    fill={ fill }
  />;
};

export default Face;
