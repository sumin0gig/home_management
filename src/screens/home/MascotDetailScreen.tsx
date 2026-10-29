import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-root-toast";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../navigation/types";
import Mascot from "../../components/Mascot/Mascot";
import MascotStyleEditor from "../../components/Mascot/MascotStyleEditor";
import { EAR_OPTIONS, TAIL_OPTIONS } from "../../components/Mascot/optionMaps";
import { useMascotStore, type MascotInput } from "../../store/useMascotStore";
import { computeHappinessLevel } from "../../utils/happiness";
import { colors, commonColor } from "../../styles/commonStyle";

type Props = NativeStackScreenProps<MainStackParamList, "MascotDetail">;

export const AUTO_SAVE_DELAY_MS = 400;

function MascotDetailScreen( { navigation }: Props ): React.JSX.Element {
  const mascot = useMascotStore( state => state.mascot );
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
  const [saveError, setSaveError] = React.useState<string | null>( null );

  // 고를 때마다 저장한다. 빠르게 여러 번 바꾸면 마지막 값만 400ms 뒤에 저장하고,
  // 실패하면 마지막으로 저장된 값으로 되돌린다.
  const lastSaved = React.useRef<MascotInput>( {
    earStyle: mascot?.earStyle ?? "ROUND",
    tailStyle: mascot?.tailStyle ?? "STRAIGHT",
    fillColor: mascot?.fillColor ?? "",
  } );
  const pending = React.useRef<MascotInput | null>( null );
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>( null );
  const isMounted = React.useRef( true );

  const save = React.useCallback( ( values: MascotInput ) => {
    pending.current = null;
    return updateMascot( values ).then( ok => {
      if (ok) {
        lastSaved.current = values;
        if (isMounted.current) {
          setSaveError( null );
          Toast.show( "저장했어요", { duration: Toast.durations.SHORT } );
        }
        return;
      }
      if (isMounted.current) {
        setEarStyle( lastSaved.current.earStyle );
        setTailStyle( lastSaved.current.tailStyle );
        setFillColor( lastSaved.current.fillColor ?? "" );
        setSaveError( useMascotStore.getState().error ?? "저장하지 못했어요." );
      }
    } );
  }, [updateMascot] );

  const scheduleSave = ( values: MascotInput ) => {
    pending.current = values;
    if (timer.current) {
      clearTimeout( timer.current );
    }
    timer.current = setTimeout( () => {
      timer.current = null;
      if (pending.current) {
        save( pending.current );
      }
    }, AUTO_SAVE_DELAY_MS );
  };

  // 화면을 떠날 때 저장 대기 중인 값이 있으면 바로 저장한다.
  React.useEffect( () => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (timer.current) {
        clearTimeout( timer.current );
      }
      if (pending.current) {
        save( pending.current );
      }
    };
  }, [save] );

  const onChangeEarStyle = ( value: MascotInput["earStyle"] ) => {
    setEarStyle( value );
    scheduleSave( { earStyle: value, tailStyle, fillColor } );
  };
  const onChangeTailStyle = ( value: MascotInput["tailStyle"] ) => {
    setTailStyle( value );
    scheduleSave( { earStyle, tailStyle: value, fillColor } );
  };
  const onChangeFillColor = ( value: string ) => {
    setFillColor( value );
    scheduleSave( { earStyle, tailStyle, fillColor: value } );
  };

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

  const earVariant = EAR_OPTIONS.find( option => option.value === earStyle )?.variant ?? "round";
  const tailVariant = TAIL_OPTIONS.find( option => option.value === tailStyle )?.variant ?? "straight";

  const { level, gaugeValue, gaugeMax } = computeHappinessLevel(
    mascot.happiness ?? 0,
  );

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
        <Pressable
          testID="memory-level-link"
          style={ styles.levelLink }
          onPress={ () => navigation.navigate( "MascotCollection" ) }
        >
          <Text style={ styles.levelLabel }> 추억 Lv. { level } </Text>
          <Text style={ styles.levelChevron }> › </Text>
        </Pressable>
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
        saveError
        ? <Text style={ styles.error }> { saveError } </Text>
        : null
      }

      <View style={ styles.editorContainer }>
        <MascotStyleEditor
          earStyle={ earStyle }
          tailStyle={ tailStyle }
          fillColor={ fillColor }
          onChangeEarStyle={ onChangeEarStyle }
          onChangeTailStyle={ onChangeTailStyle }
          onChangeFillColor={ onChangeFillColor }
        />
      </View>
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
  levelLink: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  levelLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: commonColor.touchable,
  },
  levelChevron: {
    fontSize: 20,
    fontWeight: "700",
    color: commonColor.touchable,
  },
  gaugeTrack: {
    width: "100%",
    height: 12,
    borderRadius: 6,
    backgroundColor: commonColor.divider,
    overflow: "hidden",
  },
  gaugeFill: {
    height: "100%",
    borderRadius: 6,
    backgroundColor: commonColor.touchable,
  },
  gaugeLabel: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 6,
  },
  error: {
    color: commonColor.error,
    marginBottom: 12,
    textAlign: "center",
  },
  editorContainer: {
    marginBottom: 24,
  },
} );

export default MascotDetailScreen;
