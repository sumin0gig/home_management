import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import type { WidgetConfigurationScreenProps } from 'react-native-android-widget';
import { toDateString } from '../utils/date';
import { colors, commonColor } from '../styles/commonStyle';
import { TaskWidget } from './TaskWidget';
import { loadWidgetShowMascot, storeWidgetShowMascot } from './widgetSettings';

// 런처에서 위젯을 길게 눌러 "위젯 설정"으로 들어오는 화면 (Android 12 이상).
// 설정은 위젯별이 아니라 앱 전체에 하나다. 앱 데이터가 안 불러와졌을 수 있어서
// 저장된 스냅샷의 showMascot만 바꿔 다시 그린다.
export function WidgetConfigScreen({
  widgetInfo,
  renderWidget,
  setResult,
}: WidgetConfigurationScreenProps): React.JSX.Element {
  const [showMascot, setShowMascot] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    loadWidgetShowMascot().then(setShowMascot);
  }, []);

  const onChange = (value: boolean) => {
    setShowMascot(value);
    return storeWidgetShowMascot(value).then(snapshot =>
      renderWidget(
        <TaskWidget
          snapshot={snapshot}
          today={toDateString(new Date())}
          width={widgetInfo.width}
          height={widgetInfo.height}
        />,
      ),
    );
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>위젯 설정</Text>
      <View style={styles.row}>
        <Text style={styles.label}>위젯에 마스코트 보이기</Text>
        <Switch
          value={showMascot ?? true}
          disabled={showMascot === null}
          onValueChange={onChange}
          trackColor={{ true: commonColor.touchable }}
          accessibilityLabel="위젯에 마스코트 보이기"
        />
      </View>
      <Pressable
        style={styles.doneButton}
        onPress={() => setResult('ok')}
        accessibilityRole="button"
      >
        <Text style={styles.doneText}>완료</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.default,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: commonColor.textDefault,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: commonColor.subtleBorder,
  },
  label: {
    fontSize: 16,
    color: commonColor.textDefault,
  },
  doneButton: {
    marginTop: 'auto',
    backgroundColor: commonColor.touchable,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
