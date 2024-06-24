import { Controller, Get, Res } from '@nestjs/common';
import { TemplatesEnum } from '../modules/hbsTemplate/constants/templates.enum';
import UserService from '../modules/user/user.service';
import { USER_ID_COOKIE_NAME } from '../utils/cookie/constants';
import { Cookies } from '../utils/cookie/cookies.decorator';
import HbsTemplatesService from '../modules/hbsTemplate/hbs.templates.service';
import { FastifyReply } from 'fastify';
import { setCookieUserId } from '../utils/cookie/set-cookie-user-id';
import { generateUserId } from '../modules/user/utils/generate-user-id';

import { TUserId } from '../modules/user/constants/base-types';

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
            userId = generateUserId();
            setCookieUserId(response, userId);
        }

        response.header('Content-Type', 'text/html');
        return this.hbsTemplatesService.render(TemplatesEnum.page_index, {
            userId,
        });
    }
}
