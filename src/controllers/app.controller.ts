import { Controller, Get, Res } from '@nestjs/common';
import { TemplatesEnum } from '../modules/hbsTemplate/templates.enum';
import UserService from '../services/user.service';
import { TUserId, USER_ID_COOKIE_NAME } from '../constants/cookie.constants';
import { Cookies } from '../decorators/cookies.decorator';
import HbsTemplatesService from '../modules/hbsTemplate/hbs.templates.service';
import { FastifyReply } from 'fastify';
import { setUserIdCookie } from '../utils/set-user-id-cookie';

@Controller()
export class AppController {
    constructor(
        private readonly userService: UserService,
        private readonly hbsTemplatesService: HbsTemplatesService,
    ) {}

    @Get()
    getIndex(
        @Cookies(USER_ID_COOKIE_NAME) userId: TUserId | undefined,
        @Res({ passthrough: true }) response: FastifyReply,
    ) {
        if (!userId) {
            userId = this.userService.generateUserId();
            setUserIdCookie(response, userId);
        }

        response.header('Content-Type', 'text/html');
        return this.hbsTemplatesService.render(TemplatesEnum.page_index, {
            userId,
        });
    }
}
