import { Module } from '@nestjs/common';
import { AppController } from './controllers/app.controller';
import { RoomModule } from './modules/room/room.module';
import { UserModule } from './modules/user/user.module';
import { ClsModule } from 'nestjs-cls';
import { USER_ID_COOKIE_NAME } from './utils/cookie/constants';
import { HbsTemplatesModule } from './modules/hbsTemplate/hbs.templates.module';
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
