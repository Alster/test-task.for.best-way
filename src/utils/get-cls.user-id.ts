import { USER_ID_COOKIE_NAME } from '../constants/cookie.constants';
import { ClsServiceManager } from 'nestjs-cls';
import { TUserId } from '../constants/base-types';

export const getClsUserId = (): TUserId => {
    const cls = ClsServiceManager.getClsService();
    if (!cls.isActive()) {
        throw new Error(`CLS store is not active`);
    }

    const store = cls.get();
    const userId = store[USER_ID_COOKIE_NAME];

    if (!userId) {
        const error = new Error(`User id is not found in cls store`);
        console.error(error);
        throw error;
    }

    return userId;
};
