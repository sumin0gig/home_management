import React from "react";
import { BackHandler, Pressable, StyleSheet, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useFamilyStore } from "../../store/useFamilyStore";
import {
  useRoomStore,
  ROOM_TYPE_LABELS,
  ROOM_TYPE_DEFAULT_DIMENSIONS,
  findNextRoomPlacement,
  type RoomType,
  type DraftableFloorPlanRoom,
} from "../../store/useRoomStore";
import {
  HOUSE_PRESETS,
  HOUSE_PRESET_KEYS,
  type HousePresetKey,
} from "../../store/housePresets";
import { randomRoomColor } from "../../utils/commonUtils";
import CustomRoomModal from "./CustomRoomModal";
import FloorPlanCanvas from "../FloorPlan/FloorPlanCanvas";
import RoomEditModal from "../FloorPlan/RoomEditModal";
import OnboardingScaffold from "../Onboarding/OnboardingScaffold";
import OnboardingButton from "../Onboarding/OnboardingButton";
import FloorPlanIllustration from "../Onboarding/FloorPlanIllustration";
import TemplateChoreList, {
  useTaskTemplates,
} from "../Onboarding/TemplateChoreList";
import { colors, commonColor } from "../../styles/commonStyle";

type Step = "shape" | "edit" | "chores";
type ShapeChoice = HousePresetKey | "blank";

// 도면 위에 두는 방 추가 칩 (도면이 길어져도 버튼을 찾으러 내려가지 않게)
const ADD_CHIPS: Array<NonNullable<RoomType>> = [
  "GENERAL_ROOM",
  "LIVING_ROOM",
  "BATHROOM",
  "KITCHEN",
  "BEDROOM",
];

const TOTAL_STEPS = 3;

function blocksFromPreset( choice: ShapeChoice ): DraftableFloorPlanRoom[] {
  if (choice === "blank") {
    return [];
  }
  return HOUSE_PRESETS[choice].rooms.map( (room, index) => ( {
    id: `${choice}-${index}`,
    roomType: room.roomType,
    label: room.label ?? "",
    color: randomRoomColor(),
    x: room.x,
    y: room.y,
    width: room.width,
    height: room.height,
  } ) );
}

function ShapeCard( {
  choice,
  isSelected,
  onPress,
}: {
  choice: ShapeChoice;
  isSelected: boolean;
  onPress: () => void;
} ): React.JSX.Element {
  const isBlank = choice === "blank";
  const title = isBlank ? "빈 도면" : HOUSE_PRESETS[choice].label;
  const description = isBlank ? "처음부터 직접 그리기" : HOUSE_PRESETS[choice].description;
  // 카드 그림은 매번 색이 바뀌지 않게 한 번만 정한다.
  const [rooms] = React.useState( () =>
    isBlank ? [] : HOUSE_PRESETS[choice].rooms.map( room => ( { ...room, color: randomRoomColor() } ) ),
  );
  return (
    <Pressable
      style={ [styles.shapeCard, isSelected && styles.shapeCardSelected] }
      onPress={ onPress }
      accessibilityRole="radio"
      accessibilityState={ { selected: isSelected } }
      accessibilityLabel={ `${title}, ${description}` }
      testID={ `house-shape-${choice}` }
    >
      <View style={ styles.shapePicture }>
        {
          isBlank
          ? <Text style={ styles.blankPlus }> + </Text>
          : <FloorPlanIllustration rooms={ rooms } fill="room" showLabels={ false } />
        }
      </View>
      <Text style={ styles.shapeTitle }> { title } </Text>
      <Text style={ styles.shapeDescription } numberOfLines={ 2 }> { description } </Text>
    </Pressable>
  );
}

// 처음 집 만들기 (관리자): 집 모양 → 도면 다듬기 → 기본 집안일
function RoomSetupScreen(): React.JSX.Element {
  const family = useFamilyStore( state => state.family );
  const addRoom = useRoomStore( state => state.addRoom );
  const setHouseSetupPending = useRoomStore( state => state.setHouseSetupPending );

  const [step, setStep] = React.useState<Step>( "shape" );
  const [shape, setShape] = React.useState<ShapeChoice>( "two" );
  const [blocks, setBlocks] = React.useState<DraftableFloorPlanRoom[]>( [] );
  const [editingBlock, setEditingBlock] =
    React.useState<DraftableFloorPlanRoom | null>( null );
  const [isCustomModalVisible, setIsCustomModalVisible] = React.useState( false );
  // 방 id → 고른 템플릿 id. 템플릿을 처음 불러오면 모두 고른 상태로 채운다.
  const [selection, setSelection] = React.useState<Record<string, string[]>>( {} );
  // 이미 만든 방 (일부만 실패했을 때 다시 누르면 나머지만 만든다)
  const createdIds = React.useRef<Set<string>>( new Set() );
  const [isSaving, setIsSaving] = React.useState( false );
  const [submitError, setSubmitError] = React.useState<string | null>( null );

  const { templates, isLoading: isLoadingTemplates, error: templateError, retry } =
    useTaskTemplates( step === "chores" ? blocks.map( b => b.roomType ) : [] );

  React.useEffect( () => {
    if (step !== "chores" || isLoadingTemplates) {
      return;
    }
    setSelection( prev => {
      const next = { ...prev };
      blocks.forEach( block => {
        if (next[block.id] === undefined && templates[block.roomType]) {
          next[block.id] = templates[block.roomType]!.map( t => t.id );
        }
      } );
      return next;
    } );
  }, [step, isLoadingTemplates, templates, blocks] );

  // Android 뒤로 가기는 이전 하위 단계로
  React.useEffect( () => {
    const subscription = BackHandler.addEventListener( "hardwareBackPress", () => {
      if (isSaving) {
        return true;
      }
      if (step === "chores") {
        setStep( "edit" );
        return true;
      }
      if (step === "edit") {
        setStep( "shape" );
        return true;
      }
      return false;
    } );
    return () => subscription.remove();
  }, [step, isSaving] );

  const onStartWithShape = () => {
    setBlocks( blocksFromPreset( shape ) );
    setSelection( {} );
    setStep( "edit" );
  };

  const addBlock = ( roomType: NonNullable<RoomType>, label = "" ) => {
    const { width, height } = ROOM_TYPE_DEFAULT_DIMENSIONS[roomType];
    setBlocks( prev => {
      const { x, y } = findNextRoomPlacement( prev, width, height );
      return [
        ...prev,
        {
          id: `${roomType}-${Date.now()}-${prev.length}`,
          roomType,
          label,
          color: randomRoomColor(),
          x,
          y,
          width,
          height,
        },
      ];
    } );
  };

  const onMoveBlock = ( id: string, x: number, y: number ) => {
    setBlocks( prev => prev.map( b => ( b.id === id ? { ...b, x, y } : b ) ) );
  };

  const onUpdateBlock = (
    id: string,
    updates: Omit<DraftableFloorPlanRoom, "id" | "x" | "y">,
  ) => {
    setBlocks( prev => prev.map( b => ( b.id === id ? { ...b, ...updates } : b ) ) );
    // 방 종류가 바뀌면 그 방의 기본 집안일은 새 종류로 다시 고른다.
    setSelection( prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    } );
  };

  const onToggleChore = ( roomId: string, templateId: string ) => {
    setSelection( prev => {
      const current = prev[roomId] ?? [];
      return {
        ...prev,
        [roomId]: current.includes( templateId )
          ? current.filter( id => id !== templateId )
          : [...current, templateId],
      };
    } );
  };

  const selectedCount = blocks.reduce(
    (sum, block) => sum + (selection[block.id]?.length ?? 0),
    0,
  );

  const onSubmit = () => {
    if (!family || blocks.length === 0) {
      return;
    }
    setIsSaving( true );
    setSubmitError( null );
    setHouseSetupPending( true );

    const remaining = blocks.filter( block => !createdIds.current.has( block.id ) );
    return Promise.all(
      remaining.map( block =>
        addRoom(
          family.id,
          block.roomType,
          block.label.trim() || undefined,
          {
            x: block.x,
            y: block.y,
            width: block.width,
            height: block.height,
            color: block.color,
          },
          { templateIds: selection[block.id] ?? [] },
        )
        .then( ok => {
          if (ok) {
            createdIds.current.add( block.id );
          }
          return ok;
        } ),
      ),
    )
    .then( results => {
      if (results.includes( false )) {
        setSubmitError( useRoomStore.getState().error );
        return;
      }
      // 모두 만들었으면 다음 단계(마스코트)로 넘어간다.
      setHouseSetupPending( false );
    } )
    .finally( () => setIsSaving( false ) );
  };

  if (step === "shape") {
    const choices: ShapeChoice[] = [...HOUSE_PRESET_KEYS, "blank"];
    const startLabel =
      shape === "blank"
        ? "빈 도면으로 시작하기"
        : `${HOUSE_PRESETS[shape].label}으로 시작하기`;
    return (
      <OnboardingScaffold
        progress={ { step: 2, total: TOTAL_STEPS, label: "집 모양" } }
        title="어떤 집에 살고 있나요?"
        description="고른 모양에서 방을 옮기고 고칠 수 있어요."
        footer={ <OnboardingButton text={ startLabel } onPress={ onStartWithShape } /> }
      >
        <View style={ styles.shapeGrid } accessibilityRole="radiogroup">
          { choices.map( choice => (
            <ShapeCard
              key={ choice }
              choice={ choice }
              isSelected={ shape === choice }
              onPress={ () => setShape( choice ) }
            />
          ) ) }
        </View>
      </OnboardingScaffold>
    );
  }

  if (step === "edit") {
    return (
      <OnboardingScaffold
        progress={ { step: 2, total: TOTAL_STEPS, label: "집 모양" } }
        title="우리집에 맞게 고쳐주세요"
        description="방을 누르면 이름과 크기를 바꾸고, 끌면 옮겨요."
        scroll={ false }
        footer={
          <OnboardingButton
            text="다음"
            onPress={ () => setStep( "chores" ) }
            disabled={ blocks.length === 0 }
          />
        }
      >
        <View style={ styles.chipRow } testID="add-room-chips">
          { ADD_CHIPS.map( roomType => (
            <Pressable
              key={ roomType }
              style={ styles.chip }
              onPress={ () => addBlock( roomType ) }
              accessibilityRole="button"
            >
              <Text style={ styles.chipText }> { `+ ${ROOM_TYPE_LABELS[roomType]}` } </Text>
            </Pressable>
          ) ) }
          <Pressable
            style={ [styles.chip, styles.chipDashed] }
            onPress={ () => setIsCustomModalVisible( true ) }
            accessibilityRole="button"
          >
            <Text style={ styles.chipText }> + 다른 방 </Text>
          </Pressable>
        </View>

        <ScrollView style={ styles.floorPlanScroll } showsVerticalScrollIndicator={ false }>
          {
            blocks.length === 0
            ? <Text style={ styles.emptyText }> 위에서 방을 눌러 추가해보세요. </Text>
            : <FloorPlanCanvas
                rooms={ blocks }
                editable
                onRoomPress={ block => setEditingBlock( block as DraftableFloorPlanRoom ) }
                onRoomMove={ onMoveBlock }
              />
          }
        </ScrollView>

        <CustomRoomModal
          visible={ isCustomModalVisible }
          onClose={ () => setIsCustomModalVisible( false ) }
          onSubmit={ name => {
            addBlock( "GENERAL_ROOM", name );
            setIsCustomModalVisible( false );
          } }
        />
        {
          editingBlock
          ? <RoomEditModal
              room={ editingBlock }
              rooms={ blocks }
              onSave={ updates => onUpdateBlock( editingBlock.id, updates ) }
              onClose={ () => setEditingBlock( null ) }
            />
          : null
        }
      </OnboardingScaffold>
    );
  }

  return (
    <OnboardingScaffold
      progress={ { step: 3, total: TOTAL_STEPS, label: "기본 집안일" } }
      title="기본 집안일을 골라주세요"
      description="방마다 자주 하는 일을 골라뒀어요. 필요 없는 건 빼고, 나중에 언제든 더할 수 있어요."
      footer={
        <>
          {
            submitError
            ? <Text style={ styles.error }> { submitError } </Text>
            : null
          }
          <OnboardingButton
            text={ `우리집 만들기 · 집안일 ${selectedCount}개` }
            onPress={ onSubmit }
            loading={ isSaving }
            disabled={ isLoadingTemplates }
          />
        </>
      }
    >
      {
        templateError
        ? <View style={ styles.templateError }>
            <Text style={ styles.error }> { templateError } </Text>
            <OnboardingButton text="다시 불러오기" variant="secondary" onPress={ retry } />
          </View>
        : null
      }
      <TemplateChoreList
        rooms={ blocks }
        templates={ templates }
        selection={ selection }
        onToggle={ onToggleChore }
      />
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create( {
  shapeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  shapeCard: {
    width: "48%",
    flexGrow: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    backgroundColor: colors.white,
    gap: 4,
  },
  shapeCardSelected: {
    borderWidth: 2,
    borderColor: commonColor.textDefault,
    padding: 11,
  },
  shapePicture: {
    height: 72,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  blankPlus: {
    fontSize: 32,
    fontWeight: "300",
    color: commonColor.textSecondary,
  },
  shapeTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: commonColor.textDefault,
  },
  shapeDescription: {
    fontSize: 12,
    color: commonColor.textMuted,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.14)",
    backgroundColor: colors.white,
  },
  chipDashed: {
    borderStyle: "dashed",
    borderColor: commonColor.textSecondary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: commonColor.textDefault,
  },
  floorPlanScroll: {
    flex: 1,
  },
  emptyText: {
    fontSize: 14,
    color: commonColor.textMuted,
    paddingVertical: 16,
  },
  templateError: {
    gap: 8,
    marginBottom: 16,
  },
  error: {
    color: commonColor.error,
    textAlign: "center",
  },
} );

export default RoomSetupScreen;
