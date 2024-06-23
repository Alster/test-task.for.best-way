import { TRoomId, TRoomName, TUserId } from '../../../../constants/base-types';

export class RoomDto {
    id: TRoomId;
    name: TRoomName;
    players: TUserId[];
    playersCount: number;
    isCreatedByMe: boolean;
    isMeJoined: boolean;
    isAvailableForJoin: boolean;
}
