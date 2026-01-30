import { Module } from '@nestjs/common';

import PrismaService from '../../services/prisma.service';
import RedisService from '../../services/redis.service';
import { HbsTemplatesModule } from '../hbsTemplate/hbs.templates.module';
import RoomController from './room.controller';
import RoomService from './room.service';

@Module({
    imports: [HbsTemplatesModule],
    controllers: [RoomController],
    providers: [PrismaService, RedisService, RoomService],
    exports: [RoomService],
})
export class RoomModule {}
