import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, commonColor } from "../../styles/commonStyle";

interface Props {
  label: string;
  placeholder: string;
  addText: string;
  items: string[];
  numbered?: boolean;
  onChange: (items: string[]) => void;
}

function TaskItemListEditor( {
  label,
  placeholder,
  addText,
  items,
  numbered = false,
  onChange,
}: Props ): React.JSX.Element {
  const onChangeItem = (index: number, content: string) => {
    onChange( items.map( (item, i) => ( i === index ? content : item ) ) );
  };

  const onRemoveItem = (index: number) => {
    onChange( items.filter( (_, i) => i !== index ) );
  };

  return (
    <View>
      <Text style={ styles.label }> { label } </Text>

      { items.map( (item, index) => (
        <View style={ styles.row } key={ index }>
          {
            numbered
            ? <Text style={ styles.number }> { index + 1 }. </Text>
            : null
          }
          <TextInput
            style={ styles.input }
            value={ item }
            onChangeText={ content => onChangeItem( index, content ) }
            placeholder={ placeholder }
            multiline
          />
          <Pressable
            style={ styles.removeButton }
            onPress={ () => onRemoveItem( index ) }
            accessibilityLabel={ `${label} ${index + 1} 삭제` }
            hitSlop={ 8 }
          >
            <Text style={ styles.removeButtonText }> ✕ </Text>
          </Pressable>
        </View>
      ) ) }

      <Pressable onPress={ () => onChange( [...items, ""] ) } hitSlop={ 8 }>
        <Text style={ styles.addText }> { addText } </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create( {
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  number: {
    fontSize: 15,
    fontWeight: "700",
    color: commonColor.touchable,
    marginRight: 6,
    marginTop: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: commonColor.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  removeButton: {
    marginLeft: 8,
    marginTop: 10,
  },
  removeButtonText: {
    fontSize: 16,
    color: colors.gray,
  },
  addText: {
    fontSize: 14,
    fontWeight: "600",
    color: commonColor.touchable,
    paddingVertical: 4,
  },
} );

export default TaskItemListEditor;
