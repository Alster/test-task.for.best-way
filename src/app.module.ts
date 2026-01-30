import { Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';

import { AppController } from './controllers/app.controller';
import { HbsTemplatesModule } from './modules/hbsTemplate/hbs.templates.module';
import { RoomModule } from './modules/room/room.module';
import { UserModule } from './modules/user/user.module';
import { USER_ID_COOKIE_NAME } from './utils/cookie/constants';
import { parseCookieString } from './utils/cookie/parse-cookie-string';

@Module({
    imports: [
        HbsTemplatesModule,
        RoomModule,
        UserModule,
        ClsModule.forRoot({
            middleware: {
                mount: true,
                generateId: true,
                setup: (cls, request) => {
                    const cookies = parseCookieString(request.headers.cookie);
                    const userId = cookies[USER_ID_COOKIE_NAME];
                    cls.set(USER_ID_COOKIE_NAME, userId);
                },
            },
        }),
    ],
    controllers: [AppController],
    providers: [],
})
export class AppModule {}
