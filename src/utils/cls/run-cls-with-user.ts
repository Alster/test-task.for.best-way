import { ClsServiceManager } from 'nestjs-cls';

import { TUserId } from '../../modules/user/constants/base-types';
import { USER_ID_COOKIE_NAME } from '../cookie/constants';

export async function runClsWithUser<T>(
    userId: TUserId,
    callback: (userId: TUserId) => Promise<T>,
): Promise<T> {
    const cls = ClsServiceManager.getClsService();

    return cls.run(async () => {
        cls.set(USER_ID_COOKIE_NAME, userId);
        return await callback(userId);
    });
}
