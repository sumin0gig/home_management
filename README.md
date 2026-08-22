# HomeManagement

가정 살림 관리를 위한 React Native 앱. 계정 시스템(Google 소셜 로그인), 가족 그룹 관리, 방(Room) 단위 집안일(Chore) 관리가 구현되어 있다.

## 지금까지 구현된 기능

### 계정 시스템
- **로그인**: Google 계정으로 로그인 (OAuth, Cognito Hosted UI 경유)
- **로그인 상태 분기**: 앱 실행 시 로그인 여부를 확인해 로그인 화면과 메인(홈/가족/설정 탭) 화면을 자동으로 분기
- **로그아웃**

아이디/비밀번호를 직접 만드는 절차 없이 Google 계정으로만 가입·로그인한다. Cognito 특성상 User Pool 자체에는 email 로그인 설정이 남아있지만(외부 프로바이더를 쓰더라도 Cognito가 email 또는 phone 중 하나를 요구), 앱은 로컬 회원가입/로그인 화면을 노출하지 않고 "Google로 로그인" 버튼만 제공한다.

### 가족(Family) 관리
- **가족 생성**: 이름을 정하고, 함께 등록할 방을 하나 이상 고르면 초대 코드가 자동 발급된다.
- **초대 코드로 참여**: 이미 있는 가족에 코드를 입력해 합류.
- **멤버 관리**: 멤버 목록 확인, 소유자는 다른 멤버 제거 가능.
- **가족 이름 변경**: 소유자만 가능.
- **가족 떠나기**: 소유자가 유일한 멤버일 때만 떠날 수 있으며(=사실상 가족 삭제), 이때 가족에 속한 모든 방·집안일·완료 기록이 함께 정리된다.

### 집안일(Chore) 관리
- **방(Room) 단위 구성**: 가족은 여러 개의 방을 가지며, 방 종류는 거실/화장실/부엌/현관/침실/방(일반) 중에서 고른다. 같은 종류의 방을 여러 개 만들 수 있고(예: 침실 2개), 각 방에 구분용 이름(예: "안방")을 붙일 수 있다. 방은 가족 생성 시뿐 아니라 이후에도 자유롭게 추가·삭제 가능.
- **방 종류별 기본 집안일 자동 생성**: 방을 추가하면 그 방 종류에 맞는 기본 집안일 목록이 관리자가 미리 정의해둔 템플릿(`ChoreTemplate`)을 기반으로 자동 생성된다.
- **집안일 목록**: 홈 화면에서 방별로 묶어서 표시하며, 각 항목은 오늘 할 일 / 기한 지남 / 예정(날짜)으로 구분된다.
- **완료 처리**: 완료 버튼을 누르면 완료 로그가 남고, 다음 주기의 기한이 자동으로 계산된다(완료를 안 하면 계속 "오늘 할 일"로 남아 이월됨).
- **반복 방식 2종**: 간격 반복(N일/N주/N개월마다) 또는 특정 달 반복(예: 매년 4월, 혹은 3월·9월처럼 1년에 여러 번).
- **집안일 직접 추가/수정/삭제**: 템플릿에 없는 항목도 방을 지정해 자유롭게 추가·수정·삭제 가능.

### 관리자(Admin) 지원 (백엔드까지만 구현됨)
- Cognito User Pool에 `Admin` 그룹이 있고, 전체 모델(Family/FamilyMember/Room/Chore/ChoreLog/ChoreTemplate)에 대해 Admin 그룹은 전체 CRUD 권한을 가진다.
- 방 종류별 기본 집안일 템플릿(`ChoreTemplate`)은 일반 사용자는 읽기만 가능하고, Admin 그룹만 만들고 고칠 수 있다.
- 아직 관리자 전용 화면(웹페이지)은 없다 — 현재는 AWS CLI로 DynamoDB에 직접 접근해 템플릿을 관리하고 있고, Admin 그룹에 실제로 들어간 사용자도 없다. 별도 Next.js 랜딩페이지/관리자페이지 프로젝트로 확장할 계획.

## 기술 스택

| 영역 | 선택 |
|---|---|
| 프레임워크 | React Native 0.79 + React 19 + TypeScript |
| 상태관리 | zustand |
| 내비게이션 | React Navigation (bottom-tabs + native-stack) |
| 인증 | AWS Amplify Gen2 (Cognito + Google OAuth) |
| DB | AWS Amplify Data (DynamoDB, GraphQL/AppSync) |
| 테스트 | Jest + React Native Testing Library |

DB 저장이 필요한 동작은 화면에서 직접 처리하지 않고, `src/api/`의 함수를 통해 API 호출로 처리한다.

## 프로젝트 구조

```
src/
  api/              Amplify 호출을 감싸는 함수들 (이 프로젝트에서 aws-amplify를 직접 import하는 유일한 위치)
    auth.ts           Google 로그인/로그아웃/세션 확인, 표시 이름 조회
    family.ts         가족 생성/참여/멤버 관리/떠나기(캐스케이드 삭제 포함)
    room.ts           방 생성(+템플릿 기반 집안일 시딩)/조회/삭제(캐스케이드 삭제 포함)
    chore.ts          집안일 CRUD, 완료 처리, 다음 기한 계산 로직
    choreTemplate.ts  방 종류별 기본 집안일 템플릿 조회
  store/            zustand 스토어 (화면 상태 + api 호출 orchestration)
    useAuthStore.ts     로그인 세션 상태(loading/signedIn/signedOut), Amplify Hub 이벤트 구독, 로그아웃 시 다른 스토어 초기화
    useFamilyStore.ts   내 가족 정보/멤버 상태
    useRoomStore.ts     가족의 방 목록 상태
    useChoreStore.ts    가족 전체(모든 방)의 집안일 상태
  navigation/       화면 전환 정의
    AuthNavigator.tsx        로그인 전: Login
    MainNavigator.tsx        로그인 후: 하단 탭(홈/가족/설정)
    HomeStackNavigator.tsx   홈 탭: 집안일 목록 ↔ 집안일 추가/수정
    FamilyStackNavigator.tsx 가족 탭: 온보딩(생성/참여) ↔ 가족 홈(멤버 관리)
  screens/          화면 컴포넌트 (화면마다 co-located *.test.tsx)
  test-utils/       테스트용 공용 헬퍼(스토어 초기화, navigation prop mock)

amplify/
  auth/resource.ts   Cognito 설정 (Google 외부 프로바이더, Hosted UI 도메인/콜백 URL, Admin 그룹)
  data/resource.ts   DynamoDB 스키마 (Family/FamilyMember/Room/Chore/ChoreLog/ChoreTemplate)
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
AWS 자격 증명이 설정되어 있어야 한다. 계속 켜두고 감시하려면:
```powershell
npx ampx sandbox
```
한 번만 반영하고 끝내려면:
```powershell
npx ampx sandbox --once
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

### 5. 테스트 실행
```powershell
npm test
```
특정 화면만 실행하거나(`npm test -- HomeScreen`), watch 모드(`npm test -- --watch`)도 가능.

## 딥링크 설정
Google 로그인 후 앱으로 돌아오기 위해 커스텀 URL 스킴 `homemanagement://`을 사용한다 (`android/app/src/main/AndroidManifest.xml`의 `intent-filter`, `ios/HomeManagement/Info.plist`의 `CFBundleURLTypes`). Cognito Hosted UI 도메인 프리픽스는 `homemanagement-auth`이며, 다른 사용자와 충돌 시 `amplify/auth/resource.ts`에서 값을 바꿔야 한다.

## 알려진 제약 / 향후 개선 여지
- 비밀번호 재설정, Google 외 다른 소셜 로그인(Kakao/Naver 등)은 아직 없다. Naver는 OIDC 표준을 지원하지 않아 Cognito에 직접 연동할 수 없고, Kakao는 OIDC 수동 연동이 필요해 추가 작업이 든다.
- **데이터 접근 권한은 의도적으로 단순화되어 있다**: `Family`/`Room`/`Chore`/`ChoreLog`는 인증된 사용자 전체에게 읽기·쓰기를 열어두고, 화면 단에서만 `familyId`/`roomId`로 걸러서 보여준다. 즉 다른 가족의 id를 안다면 이론적으로는 API 레벨에서 그 가족의 데이터에 접근할 수 있다(앱 UI에는 노출되지 않음). 사용 규모가 커지면 가족 단위로 실제 접근을 격리하는 인가 모델로 재설계가 필요하다.
- 관리자 전용 웹 화면이 아직 없어서, 방 종류별 기본 집안일 템플릿(`ChoreTemplate`) 관리와 Admin 그룹 멤버 추가를 AWS CLI로 수동 처리하고 있다.
- 랜딩페이지/관리자페이지(Next.js, 같은 백엔드 공유)는 계획 단계이며, 저장소를 모노레포(npm workspaces)로 재구성하는 작업이 선행되어야 한다.
