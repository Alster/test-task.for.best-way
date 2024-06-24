import { Body, Controller, Patch, Res } from '@nestjs/common';
import UserService from './user.service';
import { renderError } from '../../utils/templates/render-error';
import { FastifyReply } from 'fastify';
import { setCookieUserId } from '../../utils/cookie/set-cookie-user-id';
import { renderRedirect } from '../../utils/templates/render-redirect';
import { generateUserId } from './utils/generate-user-id';

@Controller('user')
export default class UserController {
    constructor(private readonly userService: UserService) {}

    @Patch('rename')
    async userRename(
        @Body('value') value: string,
        @Res({ passthrough: true }) response: FastifyReply,
    ) {
        if (!value.trim()) {
            return renderError(new Error('Value is empty'));
        }

        setCookieUserId(response, value);
    }

    @Patch('random')
    async userRandom(@Res({ passthrough: true }) response: FastifyReply) {
        setCookieUserId(response, generateUserId());

        return renderRedirect('/', true);
    }
}
