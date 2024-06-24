import { TRoomId, TRoomName } from '../constants/base-types';
import { TUserId } from '../../user/constants/base-types';

export class RoomDto {
    id: TRoomId;
    name: TRoomName;
    players: TUserId[];
    playersCount: number;
    isCreatedByMe: boolean;
    isMeJoined: boolean;
    isAvailableForJoin: boolean;
}
