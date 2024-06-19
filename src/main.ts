import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
// eslint-disable-next-line unicorn/import-style
import * as path from 'node:path';
import { Logger } from '@nestjs/common';

const logger = new Logger('Main');

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

    app.setViewEngine({
        engine: {
            // eslint-disable-next-line unicorn/prefer-module
            handlebars: require('handlebars'),
        },
        // eslint-disable-next-line unicorn/prefer-module
        templates: path.join(__dirname, '..', 'views'),
    });

    await app.listen(3000);

    logger.log(`Application is running on: ${await app.getUrl()}`);
}

// eslint-disable-next-line unicorn/prefer-top-level-await
void bootstrap();
