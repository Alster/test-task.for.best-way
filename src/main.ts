/* eslint-disable unicorn/prefer-module */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { fastifyCookie } from '@fastify/cookie';
import { Logger } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { buildPathFromRoot } from './utils/build-path-from-root';

const logger = new Logger('Main');

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

    // @ts-expect-error Maybe some mistypings in the fastify-cookie typings
    await app.register(fastifyCookie);

    app.useStaticAssets({
        root: buildPathFromRoot('assets'),
        prefix: '/assets/',
    });

    const port = Number.parseInt(process.env.APP_PORT ?? '');
    await app.listen(port, '0.0.0.0');
    logger.log(`Application is running on: ${await app.getUrl()}`);
}

// eslint-disable-next-line unicorn/prefer-top-level-await
void bootstrap();
