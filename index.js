/**
 * @format
 */

import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import {registerWidgetTaskHandler} from 'react-native-android-widget';
import App from './App';
import {name as appName} from './app.json';
import {widgetTaskHandler} from './src/widget/widgetTaskHandler';

AppRegistry.registerComponent(appName, () => App);
registerWidgetTaskHandler(widgetTaskHandler);
