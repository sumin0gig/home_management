import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { throwIfErrors } from './chore';

const client = generateClient<Schema>();

export type ChoreTemplateRow = Schema['ChoreTemplate']['type'];
export type RoomType = ChoreTemplateRow['roomType'];

export async function listChoreTemplatesForRoomType(
  roomType: NonNullable<RoomType>,
): Promise<ChoreTemplateRow[]> {
  const { data: templates, errors } = await client.models.ChoreTemplate.listChoreTemplateByRoomType(
    { roomType },
  );
  throwIfErrors(errors, '집안일 템플릿을 불러오지 못했습니다.');
  return templates;
}
