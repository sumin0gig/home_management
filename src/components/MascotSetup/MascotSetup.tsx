import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Mascot from "../Mascot/Mascot";
import type { EarVariant, TailVariant } from "../Mascot/types";
import { signOutUser } from "../../api/auth";
import type { MascotInput } from "../../api/mascot";
import { useMascotStore } from "../../store/useMascotStore";
import { colors, commonColor } from "../../styles/commonStyle";

type Tab = "ear" | "tail" | "color";

const EAR_OPTIONS: Array<{
  value: MascotInput["earStyle"];
  label: string;
  variant: EarVariant;
}> = [
  { value: "ROUND", label: "둥근 귀", variant: "round" },
  { value: "POINTY", label: "뾰족한 귀", variant: "pointy" },
  { value: "FLOPPY", label: "늘어진 귀", variant: "floppy" },
];

const TAIL_OPTIONS: Array<{
  value: MascotInput["tailStyle"];
  label: string;
  variant: TailVariant;
}> = [
  { value: "STRAIGHT", label: "일자 꼬리", variant: "straight" },
  { value: "CURLY", label: "말린 꼬리", variant: "curly" },
];

const COLOR_OPTIONS = [
  colors.red,
  colors.yellow,
  colors.yellowGreen,
  colors.green,
  colors.teal,
  colors.blue,
];

function MascotSetup(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const error = useMascotStore( state => state.error );
  const createMascot = useMascotStore( state => state.createMascot );

  const [activeTab, setActiveTab] = React.useState<Tab>( "ear" );
  const [earStyle, setEarStyle] =
    React.useState<MascotInput["earStyle"]>( "ROUND" );
  const [tailStyle, setTailStyle] =
    React.useState<MascotInput["tailStyle"]>( "STRAIGHT" );
  const [fillColor, setFillColor] = React.useState<string>( colors.yellow );
  const [isSaving, setIsSaving] = React.useState( false );

  const earVariant =
    EAR_OPTIONS.find( option => option.value === earStyle )?.variant ??
    "round";
  const tailVariant =
    TAIL_OPTIONS.find( option => option.value === tailStyle )?.variant ??
    "straight";

  const handleSubmit = async () => {
    setIsSaving( true );
    try {
      await createMascot( { earStyle, tailStyle, fillColor } );
    } catch {
      // 에러는 store의 error 상태로 표시됨
    } finally {
      setIsSaving( false );
    }
  };

  return (
    <View style={ styles.container }>
      <Pressable
        style={ [styles.logoutLink, { top: insets.top + 16 }] }
        onPress={ () => signOutUser() }
      >
        <Text style={ styles.logoutLinkText }> 로그아웃 </Text>
      </Pressable>

      <Text style={ styles.title }> 마스코트를 만들어보세요 </Text>

      <View style={ styles.previewContainer }>
        <Mascot
          config={ { earStyle: earVariant, tailStyle: tailVariant, fillColor } }
          action="idle"
          size={ 180 }
        />
      </View>

      {
        error
        ? <Text style={ styles.error }> { error } </Text>
        : null
      }

      <View style={ styles.tabRow }>
        <Pressable
          style={ [styles.tab, activeTab === "ear" && styles.tabActive] }
          onPress={ () => setActiveTab( "ear" ) }
        >
          <Text
            style={ [
              styles.tabText,
              activeTab === "ear" && styles.tabTextActive,
            ] }
          >
            귀 모양
          </Text>
        </Pressable>
        <Pressable
          style={ [styles.tab, activeTab === "tail" && styles.tabActive] }
          onPress={ () => setActiveTab( "tail" ) }
        >
          <Text
            style={ [
              styles.tabText,
              activeTab === "tail" && styles.tabTextActive,
            ] }
          >
            꼬리 모양
          </Text>
        </Pressable>
        <Pressable
          style={ [styles.tab, activeTab === "color" && styles.tabActive] }
          onPress={ () => setActiveTab( "color" ) }
        >
          <Text
            style={ [
              styles.tabText,
              activeTab === "color" && styles.tabTextActive,
            ] }
          >
            색상
          </Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={ false }
        style={ styles.optionScroll }
        contentContainerStyle={ styles.optionRow }
      >
        {
          activeTab === "ear"
          ? EAR_OPTIONS.map( option => (
            <Pressable
              key={ option.value }
              style={ [
                styles.optionChip,
                earStyle === option.value && styles.optionChipSelected,
              ] }
              onPress={ () => setEarStyle( option.value ) }
            >
              <Text
                style={ [
                  styles.optionChipText,
                  earStyle === option.value && styles.optionChipTextSelected,
                ] }
              >
                { option.label }
              </Text>
            </Pressable>
          ) )
          : null
        }
        {
          activeTab === "tail"
          ? TAIL_OPTIONS.map( option => (
            <Pressable
              key={ option.value }
              style={ [
                styles.optionChip,
                tailStyle === option.value && styles.optionChipSelected,
              ] }
              onPress={ () => setTailStyle( option.value ) }
            >
              <Text
                style={ [
                  styles.optionChipText,
                  tailStyle === option.value && styles.optionChipTextSelected,
                ] }
              >
                { option.label }
              </Text>
            </Pressable>
          ) )
          : null
        }
        {
          activeTab === "color"
          ? COLOR_OPTIONS.map( color => (
            <Pressable
              key={ color }
              style={ [
                styles.colorSwatch,
                { backgroundColor: color },
                fillColor === color && styles.colorSwatchSelected,
              ] }
              onPress={ () => setFillColor( color ) }
            />
          ) )
          : null
        }
      </ScrollView>

      <Pressable
        style={ styles.submitButton }
        onPress={ handleSubmit }
        disabled={ isSaving }
      >
        {
          isSaving
          ? <ActivityIndicator color="#fff" />
          : <Text style={ styles.submitButtonText }> 마스코트 만들기 </Text>
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
  logoutLink: {
    position: "absolute",
    right: 16,
  },
  logoutLinkText: {
    color: "#555",
    fontSize: 13,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 40,
    marginBottom: 16,
    textAlign: "center",
  },
  previewContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  error: {
    color: "#d32f2f",
    marginBottom: 12,
    textAlign: "center",
  },
  tabRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#eee",
  },
  tabActive: {
    borderBottomColor: commonColor.touchable,
  },
  tabText: {
    fontSize: 14,
    color: "#999",
    fontWeight: "600",
  },
  tabTextActive: {
    color: commonColor.touchable,
  },
  optionScroll: {
    flexGrow: 0,
    marginBottom: 32,
  },
  optionRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 4,
  },
  optionChip: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  optionChipSelected: {
    borderColor: commonColor.touchable,
    backgroundColor: commonColor.touchable,
  },
  optionChipText: {
    color: "#555",
    fontWeight: "600",
  },
  optionChipTextSelected: {
    color: "#fff",
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorSwatchSelected: {
    borderColor: commonColor.touchable,
  },
  submitButton: {
    backgroundColor: commonColor.touchable,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: "auto",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
} );

export default MascotSetup;
