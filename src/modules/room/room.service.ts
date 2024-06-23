import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import PrismaService, { PrismaTX } from '../../services/prisma.service';
import { TUserId } from '../../constants/cookie.constants';
import { Prisma } from '@prisma/client';
import { RoomDto } from './dto/room.dto';
import { mapRoomToDto } from './dto/room.dto-mapper';
import { isPrismaError, PrismaErrorEnum } from '../../utils/prisma-errors';
import RedisService from '../../services/redis.service';
import { AlreadyJoinedError } from './already-joined.error';
import { getClsUserId } from '../../utils/get-cls.user-id';

@Injectable()
export default class RoomService {
    private readonly logger: Logger = new Logger(RoomService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly redisService: RedisService,
    ) {}

    async getById(id: string, tx: PrismaTX = this.prisma): Promise<RoomDto | Error> {
        try {
            const maybeRoom = await tx.room.findUnique({ where: { id } });
            return maybeRoom ? mapRoomToDto(maybeRoom) : new NotFoundException(`Room not found`);
        } catch (error: unknown) {
            if (isPrismaError(error, PrismaErrorEnum.P2023)) {
                this.logger.error(error);
                return new BadRequestException(`Invalid room id`);
            }

            throw error;
        }
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

    async join(roomId: string): Promise<RoomDto | Error> {
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

    async leave(roomId: string): Promise<RoomDto | null | Error> {
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

    async rename(roomId: string, value: string): Promise<RoomDto | Error> {
        return await this.prisma.$transaction(async (tx) => {
            const maybeRoom = await this.getById(roomId, tx);

            if (maybeRoom instanceof Error) {
                return maybeRoom;
            }

            if (!maybeRoom.isCreatedByMe) {
                return new ForbiddenException('Permission denied');
            }

            if (value.toLowerCase() === maybeRoom.name.toLowerCase()) {
                return maybeRoom;
            }

            try {
                return await this.update(roomId, { name: value.toLowerCase() }, tx);
            } catch (error: unknown) {
                if (isPrismaError(error, PrismaErrorEnum.P2002)) {
                    return new ConflictException('This name already taken');
                }

                throw error;
            }
        });
    }

    private async create(
        data: Omit<Prisma.RoomCreateInput, 'name'> & Partial<Pick<Prisma.RoomCreateInput, 'name'>>,
        tx: PrismaTX = this.prisma,
    ): Promise<RoomDto> {
        const room = await tx.room.create({
            data: {
                ...data,
                name: data.name || this.generateName(),
            },
        });
        return mapRoomToDto(room);
    }

    private async update(
        id: string,
        data: Prisma.RoomUpdateInput,
        tx: PrismaTX = this.prisma,
    ): Promise<RoomDto> {
        const room = await tx.room.update({ where: { id }, data });
        void this.redisService.publish(id, 'update');
        return mapRoomToDto(room);
    }

    private async delete(id: string, tx: PrismaTX = this.prisma): Promise<void> {
        await tx.room.delete({ where: { id } });
        void this.redisService.publish(id, 'update');
    }

    private async findActive(userId: TUserId, tx: PrismaTX = this.prisma): Promise<RoomDto | null> {
        const maybeRoom = await tx.room.findFirst({
            where: {
                players: { has: userId },
            },
        });
        return maybeRoom ? mapRoomToDto(maybeRoom) : null;
    }

    private generateName(): string {
        return Math.random().toString(36).slice(2);
    }
}
