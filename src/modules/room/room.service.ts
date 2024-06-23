import { Injectable, Logger } from '@nestjs/common';
import PrismaService, { PrismaTX } from '../../services/prisma.service';
import { TUserId } from '../../constants/cookie.constants';
import { Prisma } from '@prisma/client';
import { RoomDto } from './dto/room.dto';
import { mapRoomToDto } from './dto/room.dto-mapper';
import { isPrismaError, PrismaErrorEnum } from '../../utils/prisma-errors';
import RedisService from '../../services/redis.service';

@Injectable()
export default class RoomService {
    private readonly logger: Logger = new Logger(RoomService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly redisService: RedisService,
    ) {}

    async createRoom(
        data: Omit<Prisma.RoomCreateInput, 'name'> & Partial<Pick<Prisma.RoomCreateInput, 'name'>>,
        tx: PrismaTX = this.prisma,
    ): Promise<RoomDto> {
        const room = await tx.room.create({
            data: {
                ...data,
                name: data.name || this.generateRoomName(),
            },
        });
        return mapRoomToDto(room);
    }

    async getRoomById(id: string, tx: PrismaTX = this.prisma): Promise<RoomDto | null> {
        try {
            const maybeRoom = await tx.room.findUnique({ where: { id } });
            return maybeRoom ? mapRoomToDto(maybeRoom) : null;
        } catch (error: unknown) {
            if (isPrismaError(error, PrismaErrorEnum.P2023)) {
                this.logger.error(error);
                return null;
            }

            throw error;
        }
    }

    async getRooms(): Promise<RoomDto[]> {
        const rooms = await this.prisma.room.findMany();
        return rooms.map((room) => mapRoomToDto(room));
    }

    async updateRoom(
        id: string,
        data: Prisma.RoomUpdateInput,
        tx: PrismaTX = this.prisma,
    ): Promise<RoomDto> {
        const room = await tx.room.update({ where: { id }, data });
        void this.redisService.publish(id, 'update');
        return mapRoomToDto(room);
    }

    async deleteRoom(id: string, tx: PrismaTX = this.prisma): Promise<void> {
        await tx.room.delete({ where: { id } });
        void this.redisService.publish(id, 'update');
    }

    async getRoomForUser(userId: TUserId, tx: PrismaTX = this.prisma): Promise<RoomDto | null> {
        const maybeRoom = await tx.room.findFirst({
            where: {
                players: { has: userId },
            },
        });
        return maybeRoom ? mapRoomToDto(maybeRoom) : null;
    }

    private generateRoomName(): string {
        return Math.random().toString(36).slice(2);
    }
}
