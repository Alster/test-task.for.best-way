import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export default class UserService {
    private readonly logger: Logger = new Logger(UserService.name);

    constructor() {}

    generateUserId(): Lowercase<string> {
        return Math.random().toString(36).slice(2) as Lowercase<string>;
    }
}
