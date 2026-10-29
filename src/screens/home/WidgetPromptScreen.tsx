import React from "react";
import {
  AppState,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { requestPinWidget } from "react-native-android-widget";
import type { MainStackParamList } from "../../navigation/types";
import { useTaskStore } from "../../store/useTaskStore";
import { useRoomStore } from "../../store/useRoomStore";
import { useMascotConfig } from "../../components/Mascot/useMascotConfig";
import WidgetPreviewCard from "../../components/WidgetPreview/WidgetPreviewCard";
import Icon from "../../components/common/Icon";
import { toDateString } from "../../utils/date";
import { APP_DISPLAY_NAME } from "../../constants/app";
import {
  WIDGET_NAME,
  buildWidgetSnapshot,
  selectTodayWidgetTasks,
  type WidgetTask,
} from "../../widget/widgetSnapshot";
import { checkWidgetInstalled } from "../../widget/useWidgetInstalled";
import {
  announceWidgetAdded,
  recordWidgetPromptDismissed,
} from "../../widget/widgetPromptState";
import { colors, commonColor } from "../../styles/commonStyle";

type Props = NativeStackScreenProps<MainStackParamList, "WidgetPrompt">;

// 오늘 할 일이 없을 때 미리보기에 채우는 예시
const EXAMPLE_TASKS: WidgetTask[] = [
  { id: "ex1", title: "설거지", roomColor: colors.yellow, nextDueDate: "" },
  { id: "ex2", title: "화장실 청소", roomColor: colors.blue, nextDueDate: "" },
  { id: "ex3", title: "바닥 청소기", roomColor: colors.yellowGreen, nextDueDate: "" },
];

const MANUAL_STEPS = [
  "홈 화면 빈 곳을 길게 누르기",
  "\"위젯\" 누르기",
  `"${APP_DISPLAY_NAME}"에서 "집안일 위젯"을 끌어다 놓기`,
];

// 위젯을 설치하지 않은 사람에게 띄우는 화면 전체 안내.
function WidgetPromptScreen( { navigation }: Props ): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const mascotConfig = useMascotConfig();
  const tasks = useTaskStore( state => state.tasks );
  const rooms = useRoomStore( state => state.rooms );

  // pinning: 런처 확인 창을 띄운 뒤 설치 확인을 기다리는 중 / manual: 직접 추가 방법
  const [mode, setMode] = React.useState<"intro" | "pinning" | "manual">(
    "intro",
  );

  const today = toDateString( new Date() );
  const todayTasks = selectTodayWidgetTasks(
    buildWidgetSnapshot( {
      tasks,
      rooms,
      mascot: null,
      showMascot: true,
      today,
    } ),
    today,
  );
  const previewTasks = todayTasks.length > 0 ? todayTasks : EXAMPLE_TASKS;

  const dismiss = React.useCallback( () => {
    recordWidgetPromptDismissed();
    navigation.goBack();
  }, [navigation] );

  // Android 뒤로 가기도 ✕와 같다.
  React.useEffect( () => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        dismiss();
        return true;
      },
    );
    return () => subscription.remove();
  }, [dismiss] );

  // 런처에 확인 창을 띄운 뒤 앱으로 돌아오면 실제로 추가됐는지 다시 확인한다.
  React.useEffect( () => {
    if (mode !== "pinning") {
      return;
    }
    const subscription = AppState.addEventListener( "change", state => {
      if (state !== "active") {
        return;
      }
      checkWidgetInstalled().then( installed => {
        if (installed) {
          announceWidgetAdded();
          navigation.goBack();
        }
      } );
    } );
    return () => subscription.remove();
  }, [mode, navigation] );

  const onAddWidget = () =>
    requestPinWidget( { widgetName: WIDGET_NAME } )
    .then( ok => setMode( ok ? "pinning" : "manual" ) )
    .catch( () => setMode( "manual" ) );

  return (
    <View
      style={ [
        styles.screen,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 },
      ] }
    >
      <View style={ styles.topBar }>
        <Icon
          name="Close"
          size={ 20 }
          color={ commonColor.textDefault }
          onPress={ dismiss }
          accessibilityLabel="닫기"
        />
      </View>

      <ScrollView contentContainerStyle={ styles.content }>
        <View style={ styles.homeScreenMock }>
          <WidgetPreviewCard tasks={ previewTasks } mascotConfig={ mascotConfig } />
        </View>

        <Text style={ styles.title } accessibilityRole="header">
          { "앱을 열지 않아도\n오늘 할 일이 보여요" }
        </Text>

        {
          mode === "manual"
          ? <View style={ styles.steps } testID="widget-manual-steps">
              { MANUAL_STEPS.map( (step, index) => (
                <View style={ styles.stepRow } key={ step }>
                  <View style={ styles.stepBadge }>
                    <Text style={ styles.stepBadgeText }> { index + 1 } </Text>
                  </View>
                  <Text style={ styles.stepText }> { step } </Text>
                </View>
              ) ) }
            </View>
          : <Text style={ styles.description }>
              { "홈 화면에 우리집 위젯을 놓으면\n해야 할 집안일이 바로 보여요." }
            </Text>
        }
      </ScrollView>

      <Pressable
        style={ styles.primaryButton }
        onPress={ mode === "manual" ? dismiss : onAddWidget }
        accessibilityRole="button"
      >
        <Text style={ styles.primaryButtonText }>
          { mode === "manual" ? "확인" : "위젯 추가하기" }
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create( {
  screen: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: colors.default,
  },
  topBar: {
    alignItems: "flex-end",
    paddingVertical: 12,
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingBottom: 24,
  },
  // 홈 화면 배경을 흉내 낸 상자
  homeScreenMock: {
    alignSelf: "stretch",
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderRadius: 28,
    backgroundColor: "#D9CFC5",
    marginBottom: 32,
  },
  title: {
    fontSize: 23,
    fontWeight: "700",
    lineHeight: 32,
    color: commonColor.textDefault,
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 13.5,
    lineHeight: 20,
    color: commonColor.textMuted,
    textAlign: "center",
  },
  steps: {
    alignSelf: "stretch",
    gap: 10,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: commonColor.touchableSoft,
  },
  stepBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: commonColor.touchable,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: commonColor.textDefault,
  },
  primaryButton: {
    backgroundColor: commonColor.touchable,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
} );

export default WidgetPromptScreen;
