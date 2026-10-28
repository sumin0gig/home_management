# 10. 관리자 넘기기 백엔드 함수 (배포 필요)

> 공통 규칙과 결정된 사항은 `00-README.md`를 따른다. 선행 작업: 없음. **이 작업은 백엔드 배포가 필요하다. Claude Code는 배포하지 않고, 배포 전 확인할 것을 보고한다.**

## 문제

- 다른 구성원이 있으면 관리자는 가족을 떠날 수도(`leaveFamily`), 회원 탈퇴를 할 수도(`deleteAccount`) 없다. 탈퇴 오류 문구는 "구성원을 먼저 내보내 주세요"라서, 관리자가 나가려면 가족을 모두 내보내고 집 전체를 지우는 수밖에 없다.
- 지금 권한 규칙상 관리자는 다른 사람의 `FamilyMember` 기록을 수정할 수 없고(`ownersDefinedIn('familyOwnerId')`은 read·delete만), `Family`는 만든 사람(`owner`)만 수정할 수 있다. 앱에서 바로 고칠 수 없으므로 서버 함수가 필요하다.

## 범위 밖

- 화면 (11, 12에서 붙인다)
- 3단계(권한 좁히기)는 이번에 **설계와 영향 분석만** 하고, 코드 변경은 하지 않는다.

---

## 1단계. `transferFamilyOwnership` 커스텀 뮤테이션

### 변경 파일
- 새 함수 `amplify/functions/transferFamilyOwnership/resource.ts`, `handler.ts`
- `amplify/backend.ts`
- `amplify/data/resource.ts` (뮤테이션 정의, `allow.resource(...)` 추가)

### 정의
```ts
transferFamilyOwnership: a
  .mutation()
  .arguments({ familyId: a.id().required(), newOwnerMemberId: a.id().required() })
  .returns(a.ref('Family'))
  .authorization(allow => [allow.authenticated()])
  .handler(a.handler.function(transferFamilyOwnership)),
```
- 함수의 데이터 접근은 `createUserOnLogin`과 같은 방식(`allow.resource(fn).to(['query', 'mutate'])`, 핸들러에서 `getAmplifyDataClientConfig`)으로 한다.

### 핸들러 동작
1. 호출한 사람: `event.identity.sub`.
2. 검증 (실패하면 사용자에게 보여줄 한국어 메시지로 오류):
   - 호출한 사람의 `FamilyMember`가 그 `familyId`에 있고 `role === 'OWNER'` → 아니면 "관리자만 넘길 수 있어요."
   - `newOwnerMemberId`가 같은 가족의 다른 구성원 → 아니면 "같은 가족의 구성원에게만 넘길 수 있어요."
3. 바꾸는 순서 (중간에 실패해도 다시 호출하면 끝까지 갈 수 있게, 각 단계는 이미 된 상태면 건너뛴다):
   1. 새 관리자 `FamilyMember.role = 'OWNER'`
   2. `Family.ownerId = 새 관리자 userId`, 그리고 `Family`의 소유자 필드(`owner`, Amplify가 만든 필드)도 새 관리자 기준으로 바꾼다. 실제 필드 이름과 값 형식(`sub` 또는 `sub::username`)은 스키마 생성 결과와 기존 데이터에서 확인한다.
   3. 그 가족 모든 `FamilyMember.familyOwnerId = [새 관리자 userId]`
   4. 호출한 사람 `FamilyMember.role = 'MEMBER'`
4. 바뀐 `Family`를 돌려준다.

### 앱 쪽
- `src/store/useFamilyStore.ts`에 `transferOwnership(newOwnerMemberId): Promise<boolean>` 추가. 성공하면 `fetchMyFamily()`로 다시 읽는다.
- `src/constants/app.ts`에 `OWNER_TRANSFER_ENABLED`를 `false`로 둔다. 배포 후 사용자가 `true`로 바꾼다. 11·12는 이 값으로 넘기기 기능을 보이거나 숨긴다.

### 완료 조건
- 핸들러 단위 테스트(데이터 클라이언트 모킹): 관리자가 아니면 오류, 다른 가족 구성원이면 오류, 정상이면 위 4가지 갱신이 순서대로 불린다, 이미 일부 갱신된 상태에서 다시 불러도 끝까지 맞춰진다.
- `npx ampx` 타입 생성이 필요하면 보고에 적는다.

---

## 2단계. (권장) 서버에서 참여하기 `joinFamilyByCode`

### 이유
지금 `FamilyMember`는 로그인한 누구나 만들 수 있고(`allow.authenticated().to(['read', 'create'])`), `role`과 `familyOwnerId`를 앱이 보내는 값 그대로 저장한다. 가족 id만 알면 다른 가족에 관리자로 들어갈 수 있는 구조다. 01에서 앱 쪽으로 막았지만 서버에서도 막아야 한다.

### 요구사항
- 커스텀 뮤테이션 `joinFamilyByCode(inviteCode)`: 서버에서 코드를 찾고, 호출한 사람에게 이미 가족이 있으면 거절하고, `role: 'MEMBER'`, 올바른 `familyOwnerId`, `displayName`으로 구성원을 만든다.
- 앱의 `joinFamily`가 이 뮤테이션을 쓰게 바꾼다. 07을 이미 했다면 `lookupFamilyByCode`는 그대로 두고 참여만 바꾼다.

---

## 3단계. (설계만) 권한 좁히기

- `FamilyMember`의 `allow.authenticated().to(['create'])`를 없애려면 `createFamily`의 관리자 구성원 생성도 서버로 옮겨야 한다. `deleteAccount`, `leaveFamily`, `removeMember`가 지금 권한에 기대는 부분도 함께 확인해야 한다.
- 이번에는 **바꾸지 않고**, 무엇을 옮겨야 하는지와 순서를 보고에 정리한다.

---

## 보고에 꼭 넣을 것

- 배포가 필요한 변경 목록과 배포 순서 (스키마 → 함수 → 앱)
- `Family`의 소유자 필드 실제 이름과 값 형식을 어떻게 확인했는지
- 배포 후 사용자가 직접 할 일: `OWNER_TRANSFER_ENABLED`를 `true`로, 테스트 계정 두 개로 넘기기 확인
