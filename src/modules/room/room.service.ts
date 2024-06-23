import {
    ConflictException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import PrismaService, { PrismaTX } from '../../services/prisma.service';
import { Prisma } from '@prisma/client';
import { RoomDto } from './src/dto/room.dto';
import { mapRoomToDto } from './src/dto/room.dto-mapper';
import { isPrismaError, PrismaErrorEnum } from '../../utils/prisma-errors';
import RedisService from '../../services/redis.service';
import { AlreadyJoinedError } from './src/already-joined.error';
import { getClsUserId } from '../../utils/get-cls.user-id';
import { generateRoomName } from './src/generate-room-name';
import { TRoomId, TRoomName, TUserId } from '../../constants/base-types';
import { ROOM_UPDATED } from './src/constants';
import { isRoomDto } from './src/dto/is-room-dto';

@Injectable()
export default class RoomService {
    private readonly logger: Logger = new Logger(RoomService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly redisService: RedisService,
    ) {}

    async getById(id: TRoomId, tx: PrismaTX = this.prisma): Promise<RoomDto | Error> {
        try {
            const maybeRoom = await tx.room.findUnique({ where: { id } });
            return maybeRoom ? mapRoomToDto(maybeRoom) : new NotFoundException(`Room not found`);
        } catch (error: unknown) {
            if (isPrismaError(error, PrismaErrorEnum.P2023)) {
                return new NotFoundException(`Invalid room id`);
            }

            throw error;
        }
    }

    async getByName(name: TRoomName, tx: PrismaTX = this.prisma): Promise<RoomDto | Error> {
        const maybeRoom = await tx.room.findUnique({ where: { name } });
        return maybeRoom ? mapRoomToDto(maybeRoom) : new NotFoundException(`Room not found`);
    }

    async getList(): Promise<RoomDto[]> {
        const rooms = await this.prisma.room.findMany();
        return rooms.map((room) => mapRoomToDto(room));
    }

    async tryCreate(): Promise<RoomDto | Error> {
        return this.prisma.$transaction(async (tx) => {
            const userId = getClsUserId();
            const activeRoom = await this.findActive(userId, tx);
            if (activeRoom) {
                return new AlreadyJoinedError(activeRoom);
            }

            return this.create({ players: [userId], createdBy: userId }, tx);
        });
    }

    async join(roomId: TRoomId): Promise<RoomDto | Error> {
        return this.prisma.$transaction(async (tx) => {
            const userId = getClsUserId();
            const activeRoom = await this.findActive(userId, tx);
            if (activeRoom) {
                return new AlreadyJoinedError(activeRoom);
            }

            const maybeRoom = await this.getById(roomId, tx);
            if (maybeRoom instanceof Error) {
                return maybeRoom;
            }
            if (!maybeRoom.isAvailableForJoin) {
                return new Error('Reached maximum members limit');
            }

            await this.update(roomId, { players: [...maybeRoom.players, userId] }, tx);

            return maybeRoom;
        });
    }

    async leave(roomId: TRoomId): Promise<RoomDto | null | Error> {
        return this.prisma.$transaction(async (tx) => {
            const userId = getClsUserId();
            const activeRoom = await this.findActive(userId, tx);

            if ((activeRoom && activeRoom.id !== roomId) || !activeRoom) {
                return new Error('You is not a member');
            }

            const updatedPlayersList = activeRoom.players.filter((player) => player != userId);
            const playersListIsEmpty = updatedPlayersList.length === 0;

            if (playersListIsEmpty) {
                await this.delete(roomId, tx);
                return null;
            } else {
                return await this.update(roomId, { players: { set: updatedPlayersList } }, tx);
            }
        });
    }

    async rename(roomId: TRoomId, value: TRoomName): Promise<RoomDto | Error> {
        return this.prisma.$transaction(async (tx) => {
            const [roomToRename, roomWithSameName] = await Promise.all([
                this.getById(roomId, tx),
                this.getByName(value),
            ]);
            if (roomToRename instanceof Error) {
                return roomToRename;
            }
            if (isRoomDto(roomWithSameName) && roomWithSameName.id !== roomToRename.id) {
                return new ConflictException('This name already taken');
            }
            if (!roomToRename.isCreatedByMe) {
                return new ForbiddenException('Permission denied');
            }

            if (value === roomToRename.name) {
                return roomToRename;
            }

            return await this.update(roomId, { name: value }, tx);
        });
    }

    private async create(
        data: Omit<Prisma.RoomCreateInput, 'name'> & Partial<Pick<Prisma.RoomCreateInput, 'name'>>,
        tx: PrismaTX = this.prisma,
    ): Promise<RoomDto> {
        const room = await tx.room.create({
            data: {
                ...data,
                name: data.name || generateRoomName(),
            },
        });
        return mapRoomToDto(room);
    }

    private async update(
        id: TRoomId,
        data: Prisma.RoomUpdateInput,
        tx: PrismaTX = this.prisma,
    ): Promise<RoomDto> {
        const room = await tx.room.update({ where: { id }, data });
        void this.redisService.publish(id, ROOM_UPDATED);
        return mapRoomToDto(room);
    }

    private async delete(id: TRoomId, tx: PrismaTX = this.prisma): Promise<void> {
        await tx.room.delete({ where: { id } });
        void this.redisService.publish(id, ROOM_UPDATED);
    }

    private async findActive(userId: TUserId, tx: PrismaTX = this.prisma): Promise<RoomDto | null> {
        const maybeRoom = await tx.room.findFirst({
            where: {
                players: { has: userId },
            },
        });
        return maybeRoom ? mapRoomToDto(maybeRoom) : null;
    }
}
