import { Linking } from 'react-native';
import type { LinkingOptions } from '@react-navigation/native';
import type { MainStackParamList } from './types';
import { markOpenedFromWidget } from '../widget/widgetPromptState';

// 홈 화면 위젯의 링크.
// - `homemanagement://tasks`: 홈(HomeMain)
// - `homemanagement://task/{id}`: 그 집안일 모달(TaskSheet). 스택의 첫 화면을
//   HomeMain으로 두어서, 앱이 꺼져 있다가 위젯으로 열려도 홈 위에 모달이 뜨고
//   닫으면 홈이 보인다.
export const linking: LinkingOptions<MainStackParamList> = {
  prefixes: ['homemanagement://'],
  config: {
    initialRouteName: 'HomeMain',
    screens: {
      HomeMain: 'tasks',
      TaskSheet: 'task/:taskId',
    },
  },
  // 위젯으로 앱이 열렸으면 이번 실행에서는 위젯 설치 안내를 띄우지 않는다.
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    if (url) {
      markOpenedFromWidget();
    }
    return url;
  },
};
