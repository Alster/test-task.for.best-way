import { RoomDto } from './dto/room.dto';

export class AlreadyJoinedError extends Error {
    name = 'AlreadyJoinedError';

    constructor(public readonly room: RoomDto) {
        super(
            `You are already a member of room <a class="room-name" href="/room/${room.id}">${room.name}</a>`,
        );
    }
}
