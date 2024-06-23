import { Body, Controller, Get, Param, Patch, Post, Put, Req, Res, Sse } from '@nestjs/common';
import RoomService from './room.service';
import { concatMap, Observable, Subject, timer } from 'rxjs';
import HbsTemplatesService from '../hbsTemplate/hbs.templates.service';
import { TemplatesEnum } from '../hbsTemplate/templates.enum';
import { getClsUserId } from '../../utils/get-cls.user-id';
import { isPrismaError, PrismaErrorEnum } from '../../utils/prisma-errors';
import { renderNotification } from '../../utils/templates/render-notification';
import { renderRedirect } from '../../utils/templates/render-redirect';
import { renderAlreadyJoined } from '../../utils/templates/render-already-joined';
import { FastifyReply, FastifyRequest } from 'fastify';
import RedisService from '../../services/redis.service';
import { ClsServiceManager } from 'nestjs-cls';
import { USER_ID_COOKIE_NAME } from '../../constants/cookie.constants';
import PrismaService from '../../services/prisma.service';

@Controller('room')
export default class RoomController {
    constructor(
        private readonly roomService: RoomService,
        private readonly hbsTemplatesService: HbsTemplatesService,
        private readonly redisService: RedisService,
        private readonly prisma: PrismaService,
    ) {}

    @Sse('sse/list')
    async getSseList() {
        return timer(0, 2000).pipe(
            concatMap(async () => {
                const availableRooms = await this.roomService.getRooms();
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
        const room = await this.roomService.getRoomById(roomId);
        response.header('Content-Type', 'text/html');
        return this.hbsTemplatesService.render(
            TemplatesEnum.page_room,
            room ? { room } : { error: 'Not found' },
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

                const room = await this.roomService.getRoomById(roomId);
                const message = this.hbsTemplatesService.render(TemplatesEnum.room, {
                    room,
                    joined: room ? room.players.includes(userId) : false,
                });
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
        const userId = getClsUserId();

        return this.prisma.$transaction(async (tx) => {
            const activeRoom = await this.roomService.getRoomForUser(userId, tx);

            if (activeRoom) {
                return renderAlreadyJoined(activeRoom);
            }

            const createdRoom = await this.roomService.createRoom(
                { players: [userId], createdBy: userId },
                tx,
            );

            return renderRedirect(`/room/${createdRoom.id}`);
        });
    }

    @Put(':roomId/join')
    async join(@Param('roomId') roomId: string) {
        const userId = getClsUserId();

        await this.prisma.$transaction(async (tx) => {
            const activeRoom = await this.roomService.getRoomForUser(userId, tx);

            if (activeRoom) {
                return renderAlreadyJoined(activeRoom);
            }

            const room = await this.roomService.getRoomById(roomId, tx);
            if (!room) {
                return renderNotification('error', 'Room is not found');
            }

            if (!room.isAvailableForJoin) {
                return renderNotification('error', 'Reached maximum members limit');
            }

            await this.roomService.updateRoom(roomId, { players: [...room.players, userId] }, tx);
        });

        return renderRedirect(`/room/${roomId}`);
    }

    @Put(':roomId/leave')
    async leave(@Param('roomId') roomId: string) {
        const userId = getClsUserId();

        return this.prisma.$transaction(async (tx) => {
            const activeRoom = await this.roomService.getRoomForUser(userId, tx);

            if ((activeRoom && activeRoom.id !== roomId) || !activeRoom) {
                return renderNotification('error', 'You is not a member');
            }

            const updatedPlayersList = activeRoom.players.filter((player) => player != userId);
            const playersListIsEmpty = updatedPlayersList.length === 0;

            if (playersListIsEmpty) {
                await this.roomService.deleteRoom(roomId, tx);
                return renderRedirect(`/`);
            }

            await this.roomService.updateRoom(roomId, { players: { set: updatedPlayersList } }, tx);
        });
    }

    @Patch(':roomId/rename')
    async rename(@Param('roomId') roomId: string, @Body('value') value: string) {
        if (!value.trim()) {
            return renderNotification('error', 'Value is empty');
        }

        return this.prisma.$transaction(async (tx) => {
            const room = await this.roomService.getRoomById(roomId, tx);
            if (!room) {
                return renderNotification('error', 'Room is not found');
            }

            if (!room.isCreatedByMe) {
                return renderNotification('error', 'Permission denied');
            }

            if (value.toLowerCase() === room.name.toLowerCase()) {
                return;
            }

            try {
                await this.roomService.updateRoom(roomId, { name: value.toLowerCase() }, tx);
            } catch (error: unknown) {
                if (isPrismaError(error, PrismaErrorEnum.P2002)) {
                    return renderNotification('error', 'This name already taken');
                }

                throw error;
            }
        });
    }
}
