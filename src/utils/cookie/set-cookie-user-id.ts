import { FastifyReply } from 'fastify';
import { USER_ID_COOKIE_NAME } from './constants';

export function setCookieUserId(response: FastifyReply, userId: string) {
    response.setCookie(USER_ID_COOKIE_NAME, userId.toLowerCase(), {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/',
        httpOnly: true,
    });
}
