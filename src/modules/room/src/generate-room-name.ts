import { TRoomName } from '../../../constants/base-types';

export function generateRoomName(): TRoomName {
    return Math.random().toString(36).slice(2) as TRoomName;
}
