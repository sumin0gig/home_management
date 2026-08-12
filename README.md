# HomeManagement

가정 살림 관리를 위한 React Native 앱. 현재는 계정 시스템(Google 소셜 로그인)이 구현되어 있으며, 이후 이 계정을 기반으로 살림 관련 기능들이 추가될 예정이다.

## 지금까지 구현된 기능

### 계정 시스템
- **로그인**: Google 계정으로 로그인 (OAuth, Cognito Hosted UI 경유)
- **로그인 상태 분기**: 앱 실행 시 로그인 여부를 확인해 로그인 화면과 홈 화면을 자동으로 분기
- **로그아웃**

아이디/비밀번호를 직접 만드는 절차 없이 Google 계정으로만 가입·로그인한다. Cognito 특성상 User Pool 자체에는 email 로그인 설정이 남아있지만(외부 프로바이더를 쓰더라도 Cognito가 email 또는 phone 중 하나를 요구), 앱은 로컬 회원가입/로그인 화면을 노출하지 않고 "Google로 로그인" 버튼만 제공한다.

## 기술 스택

| 영역 | 선택 |
|---|---|
| 프레임워크 | React Native 0.79 + React 19 + TypeScript |
| 상태관리 | zustand |
| 내비게이션 | React Navigation (native-stack) |
| 인증 | AWS Amplify Gen2 (Cognito + Google OAuth) |
| DB | AWS Amplify Data (DynamoDB, GraphQL) |

DB 저장이 필요한 동작은 화면에서 직접 처리하지 않고, `src/api/`의 함수를 통해 API 호출로 처리한다.

## 프로젝트 구조

```
src/
  api/            Amplify 호출을 감싸는 함수들 (이 프로젝트에서 aws-amplify를 직접 import하는 유일한 위치)
    auth.ts         Google 로그인/로그아웃/세션 확인
  store/          zustand 스토어 (화면 상태 + api 호출 orchestration)
    useAuthStore.ts    로그인 세션 상태(loading/signedIn/signedOut), Amplify Hub 이벤트 구독
  navigation/     화면 전환 정의
    AuthNavigator.tsx  로그인 전: Login
    MainNavigator.tsx  로그인 후: Home
  screens/        화면 컴포넌트

amplify/
  auth/resource.ts   Cognito 설정 (Google 외부 프로바이더, Hosted UI 도메인/콜백 URL)
  data/resource.ts   DynamoDB 스키마 (Todo 예시 모델)
  backend.ts         defineBackend 호출부
```

## 시작하기

### 1. 의존성 설치
```powershell
npm install
```

### 2. Google OAuth 클라이언트 준비 (최초 1회)
Google Cloud Console에서 OAuth 클라이언트(Client ID/Secret)를 발급받아 Amplify 시크릿으로 등록해야 한다.
```powershell
npx ampx sandbox secret set GOOGLE_CLIENT_ID
npx ampx sandbox secret set GOOGLE_CLIENT_SECRET
```

### 3. 백엔드 배포 (최초 1회 및 amplify/ 변경 시)
AWS 자격 증명이 설정되어 있어야 한다. 아래 명령은 워치 모드로 계속 실행되며, `amplify/` 변경 시 자동 재배포된다.
```powershell
npx ampx sandbox
```
완료되면 `amplify_outputs.json`이 자동으로 채워진다.

### 4. 앱 실행
```powershell
npm start
```
다른 터미널에서:
```powershell
npm run android
```
(iOS는 macOS + Xcode 환경에서 `cd ios && pod install` 이후 `npm run ios`)

## 딥링크 설정
Google 로그인 후 앱으로 돌아오기 위해 커스텀 URL 스킴 `homemanagement://`을 사용한다 (`android/app/src/main/AndroidManifest.xml`의 `intent-filter`, `ios/HomeManagement/Info.plist`의 `CFBundleURLTypes`). Cognito Hosted UI 도메인 프리픽스는 `homemanagement-auth`이며, 다른 사용자와 충돌 시 `amplify/auth/resource.ts`에서 값을 바꿔야 한다.

## 알려진 제약 / 향후 개선 여지
- 비밀번호 재설정, Google 외 다른 소셜 로그인(Kakao/Naver 등)은 아직 없다.
- Naver는 OIDC 표준을 지원하지 않아 Cognito에 직접 연동할 수 없고, Kakao는 OIDC 수동 연동이 필요해 추가 작업이 든다.
