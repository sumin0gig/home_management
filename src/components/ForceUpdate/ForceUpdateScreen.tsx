import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { openPlayStore, startImmediateUpdate } from "../../../actions";
import { commonColor } from "../../styles/commonStyle";
import DefaultButton from "../common/DefaultButton";

function ForceUpdateScreen(): React.JSX.Element {
  const [error, setError] = React.useState<string | null>( null );

  const onUpdate = () => {
    setError( null );
    return startImmediateUpdate()
    .catch( () => openPlayStore() )
    .catch( () => setError( "Play 스토어를 열 수 없습니다." ) );
  };

  return (
    <View style={ styles.container }>
      <Text style={ styles.title }> 새 버전이 나왔어요 </Text>
      <Text style={ styles.description }>
        원활한 사용을 위해{ "\n" }
        최신 버전으로 업데이트해주세요.
      </Text>

      {
        error
        ? <Text style={ styles.error }> { error } </Text>
        : null
      }

      <DefaultButton
        text="업데이트"
        onPress={ onUpdate }
        style={ styles.button }
      />
    </View>
  );
}

const styles = StyleSheet.create( {
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: commonColor.backgroundColor,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: commonColor.textMuted,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  error: {
    color: commonColor.error,
    marginBottom: 12,
  },
  button: {
    paddingHorizontal: 32,
  },
} );

export default ForceUpdateScreen;
