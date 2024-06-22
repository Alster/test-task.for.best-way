import { Injectable, Logger } from '@nestjs/common';
import PrismaService from '../../services/prisma.service';
import { Prisma } from '@prisma/client';
import { TUserId } from '../../constants/cookie.constants';
import { RoomDto } from './dto/room.dto';
import { mapRoomToDto } from './dto/room.dto-mapper';
import { isPrismaError, PrismaErrorEnum } from '../../utils/prisma-errors';

@Injectable()
export default class RoomService {
    private readonly logger: Logger = new Logger(RoomService.name);

    constructor(private readonly prisma: PrismaService) {}

    async createRoom(
        data: Omit<Prisma.RoomCreateInput, 'name'> & Partial<Pick<Prisma.RoomCreateInput, 'name'>>,
    ): Promise<RoomDto> {
        const room = await this.prisma.room.create({
            data: {
                ...data,
                name: data.name || this.generateRoomName(),
            },
        });
        return mapRoomToDto(room);
    }

    async getRoomById(id: string): Promise<RoomDto | null> {
        try {
            const maybeRoom = await this.prisma.room.findUnique({ where: { id } });
            return maybeRoom ? mapRoomToDto(maybeRoom) : null;
        } catch (error: unknown) {
            if (isPrismaError(error, PrismaErrorEnum.P2023)) {
                console.error(error);
                return null;
            }

            throw error;
        }
    }

    async getRooms(): Promise<RoomDto[]> {
        const rooms = await this.prisma.room.findMany();
        return rooms.map((room) => mapRoomToDto(room));
    }

    async updateRoom(id: string, data: Prisma.RoomUpdateInput): Promise<RoomDto> {
        const room = await this.prisma.room.update({ where: { id }, data });
        return mapRoomToDto(room);
    }

    async deleteRoom(id: string): Promise<void> {
        await this.prisma.room.delete({ where: { id } });
    }

    async getRoomForUser(userId: TUserId): Promise<RoomDto | null> {
        const maybeRoom = await this.prisma.room.findFirst({
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
