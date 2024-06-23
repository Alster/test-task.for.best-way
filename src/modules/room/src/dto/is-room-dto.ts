import { RoomDto } from './room.dto';

export function isRoomDto(data: unknown): data is RoomDto {
    const room = data as RoomDto;

    return (
        typeof room?.id === 'string' &&
        typeof room?.name === 'string' &&
        Array.isArray(room?.players) &&
        typeof room?.playersCount === 'number' &&
        typeof room?.isCreatedByMe === 'boolean' &&
        typeof room?.isMeJoined === 'boolean' &&
        typeof room?.isAvailableForJoin === 'boolean'
    );
}
