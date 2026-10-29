import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, commonColor } from "../../styles/commonStyle";
import OnboardingProgress from "./OnboardingProgress";

interface Props {
  progress?: { step: number; total: number; label: string };
  title: string;
  description?: string;
  children?: React.ReactNode;
  // 화면 아래 고정 (주 버튼 등)
  footer?: React.ReactNode;
  // 도면처럼 직접 스크롤을 다루는 내용이면 false
  scroll?: boolean;
  titleAlign?: "left" | "center";
}

// 처음 시작하는 흐름의 화면 공통 모양: 배경 colors.default, 좌우 18,
// 제목 22 굵게 + 설명 13 보조색, 주 버튼은 아래 고정(안전 영역 + 16).
function OnboardingScaffold( {
  progress,
  title,
  description,
  children,
  footer,
  scroll = true,
  titleAlign = "left",
}: Props ): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const heading = (
    <View style={ styles.heading }>
      <Text
        style={ [styles.title, { textAlign: titleAlign }] }
        accessibilityRole="header"
      >
        { title }
      </Text>
      {
        description
        ? <Text style={ [styles.description, { textAlign: titleAlign }] }>
            { description }
          </Text>
        : null
      }
    </View>
  );

  return (
    <View style={ [styles.screen, { paddingTop: insets.top + 16 }] }>
      {
        progress
        ? <View style={ styles.progress }>
            <OnboardingProgress { ...progress } />
          </View>
        : null
      }
      {
        scroll
        ? <ScrollView
            style={ styles.body }
            contentContainerStyle={ styles.scrollContent }
            keyboardShouldPersistTaps="handled"
          >
            { heading }
            { children }
          </ScrollView>
        : <View style={ styles.body }>
            { heading }
            { children }
          </View>
      }
      {
        footer
        ? <View style={ [styles.footer, { paddingBottom: insets.bottom + 16 }] }>
            { footer }
          </View>
        : null
      }
    </View>
  );
}

const styles = StyleSheet.create( {
  screen: {
    flex: 1,
    paddingHorizontal: 18,
    backgroundColor: colors.default,
  },
  progress: {
    marginBottom: 24,
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  heading: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 30,
    color: commonColor.textDefault,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: commonColor.textMuted,
    marginTop: 6,
  },
  footer: {
    paddingTop: 12,
    gap: 8,
  },
} );

export default OnboardingScaffold;
