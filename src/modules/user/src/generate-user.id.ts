import { TUserId } from '../../../constants/base-types';

export function generateUserId(): TUserId {
    return Math.random().toString(36).slice(2) as TUserId;
}
