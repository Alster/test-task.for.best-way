import { Room } from '@prisma/client';

import { getClsUserId } from '../../../utils/cls/get-cls-user-id';
import { TUserId } from '../../user/constants/base-types';
import { TRoomId, TRoomName } from '../constants/base-types';
import { RoomDto } from './room.dto';

export function mapRoomToDto(room: Room): RoomDto {
    return {
        id: room.id as TRoomId,
        name: room.name as TRoomName,
        players: room.players as TUserId[],

        playersCount: room.players.length,
        isCreatedByMe: getClsUserId() === room.createdBy,

        isMeJoined: room.players.includes(getClsUserId()),
        isAvailableForJoin: room.players.length < 10,
    };
}
