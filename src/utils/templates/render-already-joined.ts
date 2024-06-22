import { renderNotification } from './render-notification';
import { RoomDto } from '../../modules/room/dto/room.dto';

export function renderAlreadyJoined(room: RoomDto) {
    return renderNotification(
        'error',
        `You are already a member of room <a class="room-name" href="/room/${room.id}">${room.name}</a>`,
    );
}
