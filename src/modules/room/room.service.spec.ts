import RoomService from './room.service';
import { Test, TestingModule } from '@nestjs/testing';
import { RoomModule } from './room.module';
import PrismaService from '../../services/prisma.service';
import RedisService from '../../services/redis.service';
import { runClsWithUser } from '../../utils/cls/run-cls-with-user';
import { mock, MockProxy, mockReset } from 'jest-mock-extended';
import { generateUserId } from '../user/utils/generate-user-id';
import * as assert from 'node:assert';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AlreadyJoinedError } from './utils/already-joined.error';
import { isRoomDto } from './dto/is.room.dto';
import { isNil } from '@nestjs/common/utils/shared.utils';
import { generateRoomName } from './utils/generate-room-name';

import { TRoomId } from './constants/base-types';
import { ROOM_UPDATED } from './constants/constants';

type TContext = {
    module: TestingModule;
    redisService: MockProxy<RedisService>;
    roomService: RoomService;
    prismaService: PrismaService;
};

async function createContext(): Promise<TContext> {
    const redisService = mock<RedisService>();

    const module = await Test.createTestingModule({ imports: [RoomModule] })
        .overrideProvider(RedisService)
        .useValue(redisService)
        .compile();

    return {
        module,
        redisService,
        roomService: module.get(RoomService),
        prismaService: module.get(PrismaService),
    };
}

describe(`The ${RoomService.name} service`, () => {
    describe('create', () => {
        it(`should create a room`, async () =>
            runClsWithUser(generateUserId(), async () => {
                const { roomService, module } = await createContext();

                const createResult = await roomService.tryCreate();
                assert.ok(isRoomDto(createResult));

                await module.close();
            }));

        it(`cannot create: already joined`, async () =>
            runClsWithUser(generateUserId(), async () => {
                const { roomService, module } = await createContext();

                const firstResult = await roomService.tryCreate();
                assert.ok(isRoomDto(firstResult));

                const secondResult = await roomService.tryCreate();
                assert.ok(secondResult instanceof AlreadyJoinedError);

                await module.close();
            }));
    });
    describe('join', () => {
        it(`should join a room`, async () => {
            const { roomService, module, redisService } = await createContext();
            mockReset(redisService);

            const roomToJoin = await runClsWithUser(generateUserId(), () =>
                roomService.tryCreate(),
            );
            assert.ok(isRoomDto(roomToJoin));

            const joinResult = await runClsWithUser(generateUserId(), () =>
                roomService.join(roomToJoin.id),
            );
            assert.ok(isRoomDto(joinResult));
            expect(redisService.publish).toHaveBeenCalledWith(roomToJoin.id, ROOM_UPDATED);

            await module.close();
        });

        it(`cannot join: room not found`, async () =>
            runClsWithUser(generateUserId(), async () => {
                const { roomService, module } = await createContext();

                const joinResult = await roomService.join('not-found-room-id' as TRoomId);
                assert.ok(joinResult instanceof NotFoundException);

                await module.close();
            }));
    });
    describe('leave', () => {
        it(`leave: should leave a room`, async () =>
            runClsWithUser(generateUserId(), async () => {
                const { roomService, module, redisService } = await createContext();
                mockReset(redisService);

                const roomToLeave = await roomService.tryCreate();
                assert.ok(isRoomDto(roomToLeave));

                const roomBeforeLeave = await roomService.getById(roomToLeave.id);
                assert.ok(isRoomDto(roomBeforeLeave));

                const leaveResult = await roomService.leave(roomToLeave.id);
                assert.ok(isNil(leaveResult));
                expect(redisService.publish).toHaveBeenCalledWith(roomToLeave.id, ROOM_UPDATED);

                const roomAfterLeave = await roomService.getById(roomToLeave.id);
                assert.ok(roomAfterLeave instanceof NotFoundException);

                await module.close();
            }));

        it(`cannot leave: you is not a member`, async () => {
            const { roomService, module } = await createContext();

            const roomToLeave = await runClsWithUser(generateUserId(), () =>
                roomService.tryCreate(),
            );
            assert.ok(isRoomDto(roomToLeave));

            const leaveResult = await runClsWithUser(generateUserId(), () =>
                roomService.leave(roomToLeave.id),
            );
            assert.ok(leaveResult instanceof Error);

            await module.close();
        });

        it(`cannot leave: room not found`, async () =>
            runClsWithUser(generateUserId(), async () => {
                const { roomService, module } = await createContext();

                const leaveResult = await roomService.leave('not-found-room-id' as TRoomId);
                assert.ok(leaveResult instanceof Error);

                await module.close();
            }));
    });
    describe('rename', () => {
        it(`should rename a room`, async () =>
            runClsWithUser(generateUserId(), async () => {
                const { roomService, module, redisService } = await createContext();
                mockReset(redisService);

                const roomToRename = await roomService.tryCreate();
                assert.ok(isRoomDto(roomToRename));

                const modifiedName = generateRoomName();
                const renameResult = await roomService.rename(roomToRename.id, modifiedName);
                assert.ok(isRoomDto(renameResult));
                assert.strictEqual(renameResult.name, modifiedName);
                expect(redisService.publish).toHaveBeenCalledWith(roomToRename.id, ROOM_UPDATED);

                await module.close();
            }));
        it(`cannot rename: permission denied`, async () => {
            const { roomService, module } = await createContext();

            const roomToRename = await runClsWithUser(generateUserId(), () =>
                roomService.tryCreate(),
            );
            assert.ok(isRoomDto(roomToRename));

            const renameResult = await runClsWithUser(generateUserId(), () =>
                roomService.rename(roomToRename.id, generateRoomName()),
            );
            assert.ok(renameResult instanceof ForbiddenException);

            await module.close();
        });
        it(`cannot rename: already taken`, async () => {
            const { roomService, module } = await createContext();

            const roomWithTakenName = await runClsWithUser(generateUserId(), () =>
                roomService.tryCreate(),
            );
            assert.ok(isRoomDto(roomWithTakenName));

            await runClsWithUser(generateUserId(), async () => {
                const roomToRename = await roomService.tryCreate();
                assert.ok(isRoomDto(roomToRename));

                const renameResult = await roomService.rename(
                    roomToRename.id,
                    roomWithTakenName.name,
                );
                assert.ok(renameResult instanceof ConflictException);
            });

            await module.close();
        });
    });
});
