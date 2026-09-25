import React from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../navigation/types";
import {
  ACTION_CATALOG,
  getNextUnlock,
  getUnlockedActions,
  isActionUnlocked,
} from "../../components/Mascot/actionCatalog";
import { useMascotLevel } from "../../components/Mascot/useMascotLevel";
import { colors, commonColor } from "../../styles/commonStyle";

type Props = NativeStackScreenProps<MainStackParamList, "MascotCollection">;

// 추억 도감 — 추억 레벨로 개방된 행동과 앞으로 개방할 행동을 보여준다.
// 기본 행동(happy)은 처음부터 가능하므로 목록에 없다.
function MascotCollectionScreen( _props: Props ): React.JSX.Element {
  const mascotLevel = useMascotLevel();

  if (!mascotLevel) {
    return (
      <View style={ styles.centerContainer }>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const { level } = mascotLevel;
  const unlockedCount = getUnlockedActions( level ).length;
  const nextUnlock = getNextUnlock( level );

  return (
    <View style={ styles.container }>
      <View style={ styles.summary }>
        <Text style={ styles.levelLabel }> 추억 Lv. { level } </Text>
        <Text style={ styles.progressLabel }>
          개방한 행동 { unlockedCount } / { ACTION_CATALOG.length }
        </Text>
        <Text style={ styles.nextUnlockLabel }>
          {nextUnlock
            ? `Lv. ${nextUnlock.unlockLevel}에 새 행동이 열려요`
            : "모든 행동을 개방했어요"}
        </Text>
      </View>

      <FlatList
        data={ ACTION_CATALOG }
        keyExtractor={ item => item.action }
        renderItem={ ({ item }) => {
          const unlocked = isActionUnlocked( item, level );
          return (
            <View
              testID={ `collection-item-${item.action}` }
              style={ [styles.item, !unlocked && styles.itemLocked] }
            >
              <Text style={ [styles.itemLabel, !unlocked && styles.textLocked] }>
                { unlocked ? item.label : "???" }
              </Text>
              <Text style={ [styles.itemLevel, !unlocked && styles.textLocked] }>
                {unlocked
                  ? `Lv. ${item.unlockLevel} 개방`
                  : `추억 Lv. ${item.unlockLevel} 달성 시 개방`}
              </Text>
            </View>
          );
        } }
      />
    </View>
  );
}

const styles = StyleSheet.create( {
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: commonColor.backgroundColor,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: commonColor.backgroundColor,
  },
  summary: {
    alignItems: "center",
    marginBottom: 24,
  },
  levelLabel: {
    fontSize: 22,
    fontWeight: "700",
    color: commonColor.touchable,
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 14,
    color: commonColor.textDefault,
    marginBottom: 4,
  },
  nextUnlockLabel: {
    fontSize: 12,
    color: commonColor.textSecondary,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: commonColor.touchableSoft,
  },
  itemLocked: {
    backgroundColor: colors.lightGray,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: commonColor.textDefault,
  },
  itemLevel: {
    fontSize: 12,
    color: commonColor.touchable,
  },
  textLocked: {
    color: commonColor.textSecondary,
  },
} );

export default MascotCollectionScreen;
