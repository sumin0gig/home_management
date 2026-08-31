import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";
import Mascot from "../../components/Mascot/Mascot";
import MascotStyleEditor from "../../components/Mascot/MascotStyleEditor";
import { EAR_OPTIONS, TAIL_OPTIONS } from "../../components/Mascot/optionMaps";
import type { MascotInput } from "../../api/mascot";
import { useMascotStore } from "../../store/useMascotStore";
import { computeHappinessLevel } from "../../utils/happiness";
import { commonColor } from "../../styles/commonStyle";

type Props = NativeStackScreenProps<HomeStackParamList, "MascotDetail">;

function MascotDetailScreen( { navigation }: Props ): React.JSX.Element {
  const mascot = useMascotStore( state => state.mascot );
  const error = useMascotStore( state => state.error );
  const updateMascot = useMascotStore( state => state.updateMascot );

  const [earStyle, setEarStyle] = React.useState<MascotInput["earStyle"]>(
    mascot?.earStyle ?? "ROUND",
  );
  const [tailStyle, setTailStyle] = React.useState<MascotInput["tailStyle"]>(
    mascot?.tailStyle ?? "STRAIGHT",
  );
  const [fillColor, setFillColor] = React.useState<string>(
    mascot?.fillColor ?? "",
  );
  const [isSaving, setIsSaving] = React.useState( false );

  React.useEffect( () => {
    navigation.setOptions( { title: "내 마스코트" } );
  }, [navigation] );

  if (!mascot) {
    return (
      <View style={ styles.centerContainer }>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const earVariant =
    EAR_OPTIONS.find( option => option.value === earStyle )?.variant ??
    "round";
  const tailVariant =
    TAIL_OPTIONS.find( option => option.value === tailStyle )?.variant ??
    "straight";

  const { level, gaugeValue, gaugeMax } = computeHappinessLevel(
    mascot.happiness ?? 0,
  );

  const handleSave = async () => {
    setIsSaving( true );
    try {
      await updateMascot( { earStyle, tailStyle, fillColor } );
    } catch {
      // 에러는 store의 error 상태로 표시됨
    } finally {
      setIsSaving( false );
    }
  };

  return (
    <View style={ styles.container }>
      <View style={ styles.previewContainer }>
        <Mascot
          config={ { earStyle: earVariant, tailStyle: tailVariant, fillColor } }
          action="idle"
          size={ 160 }
        />
      </View>

      <View style={ styles.happinessContainer }>
        <Text style={ styles.levelLabel }> Lv. { level } </Text>
        <View style={ styles.gaugeTrack }>
          <View
            style={ [
              styles.gaugeFill,
              { width: `${(gaugeValue / gaugeMax) * 100}%` },
            ] }
          />
        </View>
        <Text style={ styles.gaugeLabel }>
          { gaugeValue } / { gaugeMax }
        </Text>
      </View>

      {
        error
        ? <Text style={ styles.error }> { error } </Text>
        : null
      }

      <View style={ styles.editorContainer }>
        <MascotStyleEditor
          earStyle={ earStyle }
          tailStyle={ tailStyle }
          fillColor={ fillColor }
          onChangeEarStyle={ setEarStyle }
          onChangeTailStyle={ setTailStyle }
          onChangeFillColor={ setFillColor }
        />
      </View>

      <Pressable
        style={ styles.saveButton }
        onPress={ handleSave }
        disabled={ isSaving }
      >
        {
          isSaving
          ? <ActivityIndicator color="#fff" />
          : <Text style={ styles.saveButtonText }> 저장 </Text>
        }
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create( {
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: commonColor.backgroundColor,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: commonColor.backgroundColor,
  },
  previewContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  happinessContainer: {
    marginBottom: 24,
    alignItems: "center",
  },
  levelLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: commonColor.touchable,
    marginBottom: 8,
  },
  gaugeTrack: {
    width: "100%",
    height: 12,
    borderRadius: 6,
    backgroundColor: "#eee",
    overflow: "hidden",
  },
  gaugeFill: {
    height: "100%",
    borderRadius: 6,
    backgroundColor: commonColor.touchable,
  },
  gaugeLabel: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
  },
  error: {
    color: "#d32f2f",
    marginBottom: 12,
    textAlign: "center",
  },
  editorContainer: {
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: commonColor.touchable,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
} );

export default MascotDetailScreen;
