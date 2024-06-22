import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient } from '@redis/client';
import * as process from 'node:process';

type TCallback = (message: string) => void;

@Injectable()
export default class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger: Logger = new Logger(RedisService.name);

    private readonly client: ReturnType<typeof createClient>;
    private readonly subscriber: ReturnType<typeof createClient>;

    constructor() {
        this.client = createClient({ url: process.env.REDIS_URL }).on('error', (error) =>
            this.logger.error('Redis Client Error', error),
        );
        this.subscriber = this.client
            .duplicate()
            .on('error', (error) => this.logger.error('Redis Subscriber Error', error));
    }

    async subscribe(channel: string, callback: TCallback) {
        await this.subscriber.subscribe(channel, callback);
    }

    async unsubscribe(channel: string, callback: TCallback) {
        await this.subscriber.unsubscribe(channel, callback);
    }

    async publish(channel: string, message: string) {
        await this.client.publish(channel, message);
    }

    async onModuleInit() {
        await Promise.all([this.client.connect(), this.subscriber.connect()]);
    }

    async onModuleDestroy() {
        await Promise.all([this.client.disconnect(), this.subscriber.disconnect()]);
    }
}
