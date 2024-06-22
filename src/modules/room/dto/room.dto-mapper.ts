import { RoomDto } from './room.dto';
import { Room } from '@prisma/client';
import { getClsUserId } from '../../../utils/get-cls.user-id';

export function mapRoomToDto(room: Room): RoomDto {
    return {
        id: room.id,
        name: room.name,
        players: room.players,

        playersCount: room.players.length,
        isCreatedByMe: getClsUserId() === room.createdBy,

        isMeJoined: room.players.includes(getClsUserId()),
        isAvailableForJoin: room.players.length < 10,
    };
}
