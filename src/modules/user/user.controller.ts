import { Body, Controller, Patch, Res } from '@nestjs/common';
import UserService from './user.service';
import { renderNotification } from '../../utils/templates/render-notification';
import { FastifyReply } from 'fastify';
import { setUserIdCookie } from '../../utils/set-user-id-cookie';
import { renderRedirect } from '../../utils/templates/render-redirect';

@Controller('user')
export default class UserController {
    constructor(private readonly userService: UserService) {}

    @Patch('rename')
    async userRename(
        @Body('value') value: string,
        @Res({ passthrough: true }) response: FastifyReply,
    ) {
        if (!value.trim()) {
            return renderNotification('error', 'Value is empty');
        }

        setUserIdCookie(response, value);
    }

    @Patch('random')
    async userRandom(@Res({ passthrough: true }) response: FastifyReply) {
        setUserIdCookie(response, this.userService.generateUserId());

        return renderRedirect('/', true);
    }
}
