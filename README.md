# HomeManagement

가정 살림 관리를 위한 React Native 앱. 현재는 계정 시스템(회원가입/로그인)이 구현되어 있으며, 이후 이 계정을 기반으로 살림 관련 기능들이 추가될 예정이다.

## 지금까지 구현된 기능

### 계정 시스템
- **회원가입**: 아이디 / 이메일 / 비밀번호 입력 → 이메일 인증 코드 확인 → 가입 완료
- **로그인**: 아이디 + 비밀번호로 로그인
- **로그인 상태 분기**: 앱 실행 시 로그인 여부를 확인해 로그인 화면군과 홈 화면을 자동으로 분기
- **로그아웃**

이메일이 아닌 **아이디로 로그인**한다. 인증 자체는 AWS Cognito가 이메일 기반으로 처리하지만(Cognito 제약상 email 또는 phone 중 하나가 반드시 필요), 가입 시 입력한 아이디를 DynamoDB에 `아이디 → 이메일` 매핑으로 저장해두고, 로그인 시 입력한 아이디로 이메일을 먼저 조회한 뒤 그 이메일로 Cognito 인증을 수행하는 방식이다.

## 기술 스택

| 영역 | 선택 |
|---|---|
| 프레임워크 | React Native 0.79 + React 19 + TypeScript |
| 상태관리 | zustand |
| 내비게이션 | React Navigation (native-stack) |
| 인증 | AWS Amplify Gen2 (Cognito) |
| DB | AWS Amplify Data (DynamoDB, GraphQL) |

DB 저장이 필요한 동작(회원가입, 아이디→이메일 조회 등)은 화면에서 직접 처리하지 않고, `src/api/`의 함수를 통해 API 호출로 처리한다.

## 프로젝트 구조

```
src/
  api/            Amplify 호출을 감싸는 함수들 (이 프로젝트에서 aws-amplify를 직접 import하는 유일한 위치)
    auth.ts         Cognito 가입/로그인/로그아웃/세션 확인
    userLogin.ts    아이디 ↔ 이메일 매핑 조회/생성 (DynamoDB)
  store/          zustand 스토어 (화면 상태 + api 호출 orchestration)
    useAuthStore.ts    로그인 세션 상태(loading/signedIn/signedOut), Amplify Hub 이벤트 구독
    useSignUpStore.ts  회원가입 폼 상태 및 절차
    useSignInStore.ts  로그인 폼 상태 및 절차
  navigation/     화면 전환 정의
    AuthNavigator.tsx  로그인 전: Login → SignUp → ConfirmSignUp
    MainNavigator.tsx  로그인 후: Home
  screens/        화면 컴포넌트
  utils/          순수 검증 함수 (validation.ts)

amplify/
  auth/resource.ts   Cognito 설정 (이메일 로그인, 커스텀 비밀번호 정책)
  data/resource.ts   DynamoDB 스키마 (Todo 예시 모델, UserLogin 아이디 매핑 모델)
  backend.ts         Amplify가 제공하지 않는 설정(비밀번호 정책 등)을 CDK 레벨에서 오버라이드
```

## 시작하기

### 1. 의존성 설치
```powershell
npm install
```

### 2. 백엔드 배포 (최초 1회 및 amplify/ 변경 시)
AWS 자격 증명이 설정되어 있어야 한다. 아래 명령은 워치 모드로 계속 실행되며, `amplify/` 변경 시 자동 재배포된다.
```powershell
npx ampx sandbox
```
완료되면 `amplify_outputs.json`이 자동으로 채워진다.

### 3. 앱 실행
```powershell
npm start
```
다른 터미널에서:
```powershell
npm run android
```
(iOS는 macOS + Xcode 환경에서 `cd ios && pod install` 이후 `npm run ios`)

## 알려진 제약 / 향후 개선 여지
- `UserLogin`(아이디 매핑) 테이블이 `allow.guest()`로 열려 있어, 로그인 전 아이디 조회를 위해 비로그인 접근을 허용한다. 개인용 앱 규모라 감수했지만, 더 엄격히 하려면 Lambda 리졸버로 대체 가능하다.
- 비밀번호 재설정, 소셜 로그인 등은 아직 없다.
