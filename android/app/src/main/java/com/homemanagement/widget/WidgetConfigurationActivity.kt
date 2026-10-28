package com.homemanagement.widget

import com.reactnativeandroidwidget.RNWidgetConfigurationActivity

// 위젯을 길게 눌러 "위젯 설정"으로 들어오는 화면. JS 쪽은
// registerWidgetConfigurationScreen(WidgetConfigScreen)으로 등록한다 (index.js).
// widgetFeatures="configuration_optional"이라 위젯을 추가할 때는 뜨지 않는다.
class WidgetConfigurationActivity : RNWidgetConfigurationActivity()
