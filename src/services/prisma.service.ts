import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as runtime from '@prisma/client/runtime/library';

export type PrismaTX = Omit<PrismaClient, runtime.ITXClientDenyList>;

@Injectable()
export default class PrismaService extends PrismaClient implements OnModuleInit {
    async onModuleInit(): Promise<void> {
        await this['$connect']();
    }

    async disconnect(): Promise<void> {
        await this['$disconnect']();
    }
}
