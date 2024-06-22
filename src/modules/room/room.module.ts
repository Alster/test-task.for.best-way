import { Module } from '@nestjs/common';
import PrismaService from '../../services/prisma.service';
import RoomService from './room.service';
import RoomController from './room.controller';
import { HbsTemplatesModule } from '../hbsTemplate/hbs.templates.module';
import RedisService from '../../services/redis.service';

@Module({
    imports: [HbsTemplatesModule],
    controllers: [RoomController],
    providers: [PrismaService, RedisService, RoomService],
    exports: [RoomService],
})
export class RoomModule {}
