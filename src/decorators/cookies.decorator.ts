import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { parseCookieString } from '../utils/parse-cookie-string';

export const Cookies = createParamDecorator((data: string, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const cookies = parseCookieString(request.headers.cookie);
    return data ? cookies[data] : cookies;
});
