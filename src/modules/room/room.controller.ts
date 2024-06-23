import { Body, Controller, Get, Param, Patch, Post, Put, Req, Res, Sse } from '@nestjs/common';
import RoomService from './room.service';
import { concatMap, Observable, Subject, timer } from 'rxjs';
import HbsTemplatesService from '../hbsTemplate/hbs.templates.service';
import { TemplatesEnum } from '../hbsTemplate/templates.enum';
import { getClsUserId } from '../../utils/get-cls.user-id';
import { renderError } from '../../utils/templates/render-error';
import { renderRedirect } from '../../utils/templates/render-redirect';
import { FastifyReply, FastifyRequest } from 'fastify';
import RedisService from '../../services/redis.service';
import { ClsServiceManager } from 'nestjs-cls';
import { USER_ID_COOKIE_NAME } from '../../constants/cookie.constants';

@Controller('room')
export default class RoomController {
    constructor(
        private readonly roomService: RoomService,
        private readonly hbsTemplatesService: HbsTemplatesService,
        private readonly redisService: RedisService,
    ) {}

    @Sse('sse/list')
    async getSseList() {
        return timer(0, 2000).pipe(
            concatMap(async () => {
                const availableRooms = await this.roomService.getList();
                return this.hbsTemplatesService.render(TemplatesEnum.rooms_list, {
                    rooms: availableRooms,
                });
            }),
        );
    }

    @Get(':roomId')
    async getRoomPage(
        @Param('roomId') roomId: string,
        @Res({ passthrough: true }) response: FastifyReply,
    ) {
        const maybeRoom = await this.roomService.getById(roomId);
        response.header('Content-Type', 'text/html');
        return this.hbsTemplatesService.render(
            TemplatesEnum.page_room,
            maybeRoom instanceof Error ? { error: maybeRoom.message } : { room: maybeRoom },
        );
    }

    @Sse('sse/:roomId')
    async getSseRoom(
        @Param('roomId') roomId: string,
        @Req() request: FastifyRequest,
    ): Promise<Observable<string>> {
        const stream$ = new Subject<string>();
        const userId = getClsUserId();

        const pushUpdate = async () => {
            const cls = ClsServiceManager.getClsService();
            return cls.run(async () => {
                cls.set(USER_ID_COOKIE_NAME, userId);

                const maybeRoom = await this.roomService.getById(roomId);
                const message = this.hbsTemplatesService.render(
                    TemplatesEnum.room,
                    maybeRoom instanceof Error
                        ? { room: null, joined: false }
                        : {
                              room: maybeRoom,
                              joined: maybeRoom.players.includes(userId),
                          },
                );
                stream$.next(message);
            });
        };

        await this.redisService.subscribe(roomId, pushUpdate);

        request.socket.on('close', async () => {
            await this.redisService.unsubscribe(roomId, pushUpdate);
            stream$.complete();
        });

        setTimeout(pushUpdate);

        return stream$.asObservable();
    }

    @Post()
    async create() {
        const createResult = await this.roomService.tryCreate();
        if (createResult instanceof Error) {
            return renderError(createResult);
        }

        return renderRedirect(`/room/${createResult.id}`);
    }

    @Put(':roomId/join')
    async join(@Param('roomId') roomId: string) {
        const joinResult = await this.roomService.join(roomId);
        if (joinResult instanceof Error) {
            return renderError(joinResult);
        }

        return renderRedirect(`/room/${roomId}`);
    }

    @Put(':roomId/leave')
    async leave(@Param('roomId') roomId: string) {
        const leaveResult = await this.roomService.leave(roomId);
        if (leaveResult instanceof Error) {
            return renderError(leaveResult);
        }

        if (leaveResult === null) {
            return renderRedirect(`/`);
        }
    }

    @Patch(':roomId/rename')
    async rename(@Param('roomId') roomId: string, @Body('value') value: string) {
        if (!value.trim()) {
            return renderError(new Error('Value is empty'));
        }

        const renameResult = await this.roomService.rename(roomId, value);
        if (renameResult instanceof Error) {
            return renderError(renameResult);
        }
    }
}
