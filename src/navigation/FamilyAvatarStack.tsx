import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFamilyStore, type FamilyMemberRow } from '../store/useFamilyStore';
import { colors, commonColor } from '../styles/commonStyle';
import { avatarColor, avatarInitials } from '../utils/avatar';

const AVATAR_SIZE = 26;
const AVATAR_BORDER = 2;
const AVATAR_OVERLAP = 7;
const MAX_AVATARS = 3;
// 헤더 배경과 같은 색 테두리로 겹친 원을 떼어 보이게 한다 (ScreenHeader container)
const HEADER_BACKGROUND = colors.white;

export { avatarColor, avatarInitials };

interface Props {
  onOpenFamily: () => void;
  onInvite: () => void;
}

// 홈 헤더 오른쪽(설정 아이콘 왼쪽)의 겹친 가족 원
export function FamilyAvatarStack({
  onOpenFamily,
  onInvite,
}: Props): React.JSX.Element | null {
  const members = useFamilyStore(state => state.members);
  if (members.length === 0) {
    return null;
  }

  const overflow = members.length > MAX_AVATARS;
  const shown: FamilyMemberRow[] = overflow
    ? members.slice(0, MAX_AVATARS - 1)
    : members;
  const isSolo = members.length === 1;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onOpenFamily}
        hitSlop={9}
        accessibilityRole="button"
        accessibilityLabel={`가족 ${members.length}명, 가족 화면 열기`}
        style={styles.stack}
        testID="family-avatar-stack"
      >
        {shown.map((member, index) => (
          <View
            key={member.id}
            style={[
              styles.avatar,
              index > 0 && styles.overlap,
              { backgroundColor: avatarColor(member.id) },
            ]}
          >
            <Text style={styles.initials} numberOfLines={1}>
              {avatarInitials(member.displayName)}
            </Text>
          </View>
        ))}
        {overflow ? (
          <View style={[styles.avatar, styles.overlap, styles.moreAvatar]}>
            <Text style={styles.moreText}>
              {`+${members.length - shown.length}`}
            </Text>
          </View>
        ) : null}
      </Pressable>
      {isSolo ? (
        <Pressable
          onPress={onInvite}
          hitSlop={9}
          accessibilityRole="button"
          accessibilityLabel="가족 초대하기"
          style={[styles.avatar, styles.overlap, styles.inviteAvatar]}
          testID="family-invite-avatar"
        >
          <Text style={styles.inviteText}>+</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  stack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: AVATAR_BORDER,
    borderColor: HEADER_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlap: {
    marginLeft: -AVATAR_OVERLAP,
  },
  initials: {
    fontSize: 10,
    fontWeight: '700',
    color: commonColor.textDefault,
  },
  moreAvatar: {
    backgroundColor: colors.lightGray,
  },
  moreText: {
    fontSize: 9,
    fontWeight: '700',
    color: commonColor.textMuted,
  },
  inviteAvatar: {
    backgroundColor: HEADER_BACKGROUND,
    borderStyle: 'dashed',
    borderColor: commonColor.textSecondary,
    borderWidth: 1.5,
    // 겹칠 때 앞 원을 가리지 않도록 테두리만 보이는 원은 조금 떨어뜨린다
    marginLeft: 2,
  },
  inviteText: {
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '600',
    color: commonColor.textMuted,
  },
});
