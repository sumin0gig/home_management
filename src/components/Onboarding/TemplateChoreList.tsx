import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { Schema } from "../../../amplify/data/resource";
import { listTaskTemplatesForRoomType } from "../../../actions";
import { roomDisplayName, type RoomType } from "../../store/useRoomStore";
import { formatRecurrence } from "../../utils/date";
import { colors, commonColor } from "../../styles/commonStyle";
import Icon from "../common/Icon";

export type TaskTemplateRow = Schema["TaskTemplate"]["type"];
type ChoreRoomType = NonNullable<RoomType>;

// 방 종류별 템플릿은 한 번만 불러 둔다 (같은 종류 방이 여러 개여도, 다시 열어도).
const templateCache = new Map<ChoreRoomType, Promise<TaskTemplateRow[]>>();

function loadTemplates( roomType: ChoreRoomType ): Promise<TaskTemplateRow[]> {
  const cached = templateCache.get( roomType );
  if (cached) {
    return cached;
  }
  const request = listTaskTemplatesForRoomType( roomType );
  templateCache.set( roomType, request );
  // 실패한 요청은 캐시에 남기지 않아 다시 시도할 수 있게 한다.
  request.catch( () => templateCache.delete( roomType ) );
  return request;
}

// 테스트에서 캐시를 비운다.
export function clearTemplateCache(): void {
  templateCache.clear();
}

// 방 종류들의 템플릿을 불러온다. 모두 불러오면 templates가 채워진다.
export function useTaskTemplates( roomTypes: ChoreRoomType[] ): {
  templates: Partial<Record<ChoreRoomType, TaskTemplateRow[]>>;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
} {
  const key = [...new Set( roomTypes )].sort().join( "," );
  const [state, setState] = React.useState<{
    templates: Partial<Record<ChoreRoomType, TaskTemplateRow[]>>;
    isLoading: boolean;
    error: string | null;
  }>( { templates: {}, isLoading: true, error: null } );
  const [attempt, setAttempt] = React.useState( 0 );

  React.useEffect( () => {
    let active = true;
    const types = key ? ( key.split( "," ) as ChoreRoomType[] ) : [];
    setState( prev => ( { ...prev, isLoading: true, error: null } ) );
    Promise.all( types.map( type => loadTemplates( type ) ) )
    .then( results => {
      if (active) {
        const templates: Partial<Record<ChoreRoomType, TaskTemplateRow[]>> = {};
        types.forEach( (type, i) => {
          templates[type] = results[i];
        } );
        setState( { templates, isLoading: false, error: null } );
      }
    } )
    .catch( err => {
      if (active) {
        setState( prev => ( { ...prev, isLoading: false, error: (err as Error).message } ) );
      }
    } );
    return () => {
      active = false;
    };
  }, [key, attempt] );

  return { ...state, retry: () => setAttempt( a => a + 1 ) };
}

export interface ChoreRoom {
  id: string;
  roomType: ChoreRoomType;
  label?: string | null;
  color?: string | null;
}

interface Props {
  rooms: ChoreRoom[];
  templates: Partial<Record<ChoreRoomType, TaskTemplateRow[]>>;
  // 방 id → 고른 템플릿 id
  selection: Record<string, string[]>;
  onToggle: (roomId: string, templateId: string) => void;
}

// 방마다 묶음 제목(방 색 + 이름) 아래 그 방 종류의 기본 집안일을 체크 줄로 보여준다.
// 같은 종류 방이 여러 개면 각각 따로 고른다. (온보딩 집 만들기, 방 편집에서 공용)
function TemplateChoreList( {
  rooms,
  templates,
  selection,
  onToggle,
}: Props ): React.JSX.Element {
  return (
    <View style={ styles.list }>
      { rooms.map( room => {
        const roomTemplates = templates[room.roomType];
        const selected = selection[room.id] ?? [];
        return (
          <View key={ room.id } style={ styles.group }>
            <View style={ styles.groupHeader }>
              <View
                style={ [
                  styles.swatch,
                  { backgroundColor: room.color ?? colors.lightGray },
                ] }
              />
              <Text style={ styles.groupTitle } accessibilityRole="header">
                { roomDisplayName( room ) }
              </Text>
            </View>
            {
              roomTemplates === undefined
              ? <ActivityIndicator style={ styles.loading } />
              : roomTemplates.length === 0
                ? <Text style={ styles.empty }> 기본 집안일이 없어요. 나중에 직접 더할 수 있어요. </Text>
                : <View style={ styles.card }>
                    { roomTemplates.map( (template, index) => {
                      const isChecked = selected.includes( template.id );
                      return (
                        <Pressable
                          key={ template.id }
                          style={ [styles.row, index > 0 && styles.rowDivider] }
                          onPress={ () => onToggle( room.id, template.id ) }
                          accessibilityRole="checkbox"
                          accessibilityState={ { checked: isChecked } }
                          accessibilityLabel={ `${roomDisplayName( room )} ${template.title}` }
                          testID={ `chore-${room.id}-${template.id}` }
                        >
                          <View style={ [styles.checkbox, isChecked && styles.checkboxChecked] }>
                            {
                              isChecked
                              ? <Icon name="Check" size={ 12 } color={ colors.white } />
                              : null
                            }
                          </View>
                          <Text style={ styles.title } numberOfLines={ 1 }>
                            { template.title }
                          </Text>
                          <Text style={ styles.recurrence }> { formatRecurrence( template ) } </Text>
                        </Pressable>
                      );
                    } ) }
                  </View>
            }
          </View>
        );
      } ) }
    </View>
  );
}

const styles = StyleSheet.create( {
  list: {
    gap: 18,
  },
  group: {
    gap: 8,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: commonColor.textDefault,
  },
  loading: {
    alignSelf: "flex-start",
  },
  empty: {
    fontSize: 13,
    color: commonColor.textMuted,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: commonColor.subtleBorder,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  row: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: commonColor.subtleBorder,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: commonColor.textSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    borderColor: commonColor.textDefault,
    backgroundColor: commonColor.textDefault,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: commonColor.textDefault,
  },
  recurrence: {
    fontSize: 12.5,
    color: commonColor.textMuted,
  },
} );

export default TemplateChoreList;
