import { TemplatesEnum } from './templates.enum';
import { RoomDto } from '../../room/dto/room.dto';

type TContextTypeMap = {
    [TemplatesEnum.page_index]: { userId: string };
    [TemplatesEnum.page_room]: { room: RoomDto } | { error: string };
    [TemplatesEnum.page_not_found]: object;
    [TemplatesEnum.rooms_list]: { rooms: RoomDto[] };
    [TemplatesEnum.room]: { room: RoomDto | null; joined: boolean };
};

type TTemplates = typeof TemplatesEnum;
type TExpected = Record<TTemplates[keyof TTemplates], object>;

export type THbsContextMap = Extract<TContextTypeMap, TExpected>;
