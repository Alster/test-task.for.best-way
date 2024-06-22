export class RoomDto {
    id: string;
    name: string;
    players: string[];
    playersCount: number;
    isCreatedByMe: boolean;
    isMeJoined: boolean;
    isAvailableForJoin: boolean;
}
