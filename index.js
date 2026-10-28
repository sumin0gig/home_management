/**
 * @format
 */

import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import {
  registerWidgetConfigurationScreen,
  registerWidgetTaskHandler,
} from 'react-native-android-widget';
import App from './App';
import {name as appName} from './app.json';
import {widgetTaskHandler} from './src/widget/widgetTaskHandler';
import {WidgetConfigScreen} from './src/widget/WidgetConfigScreen';

AppRegistry.registerComponent(appName, () => App);
registerWidgetTaskHandler(widgetTaskHandler);
registerWidgetConfigurationScreen(WidgetConfigScreen);
