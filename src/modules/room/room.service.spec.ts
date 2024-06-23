import RoomService from './room.service';
import { Test, TestingModule } from '@nestjs/testing';
import { RoomModule } from './room.module';
import PrismaService from '../../services/prisma.service';
import RedisService from '../../services/redis.service';
import { actAsClsUser } from '../../utils/act-as-cls-user';
import { mock, MockProxy, mockReset } from 'jest-mock-extended';
import { generateUserId } from '../user/src/generate-user.id';
import * as assert from 'node:assert';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AlreadyJoinedError } from './src/already-joined.error';
import { isRoomDto } from './src/dto/is-room-dto';
import { isNil } from '@nestjs/common/utils/shared.utils';
import { generateRoomName } from './src/generate-room-name';

import { TRoomId } from '../../constants/base-types';
import { ROOM_UPDATED } from './src/constants';

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
            actAsClsUser(generateUserId(), async () => {
                const { roomService, module } = await createContext();

                const createResult = await roomService.tryCreate();
                assert.ok(isRoomDto(createResult));

                await module.close();
            }));

        it(`cannot create: already joined`, async () =>
            actAsClsUser(generateUserId(), async () => {
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

            const roomToJoin = await actAsClsUser(generateUserId(), () => roomService.tryCreate());
            assert.ok(isRoomDto(roomToJoin));

            const joinResult = await actAsClsUser(generateUserId(), () =>
                roomService.join(roomToJoin.id),
            );
            assert.ok(isRoomDto(joinResult));
            expect(redisService.publish).toHaveBeenCalledWith(roomToJoin.id, ROOM_UPDATED);

            await module.close();
        });

        it(`cannot join: room not found`, async () =>
            actAsClsUser(generateUserId(), async () => {
                const { roomService, module } = await createContext();

                const joinResult = await roomService.join('not-found-room-id' as TRoomId);
                assert.ok(joinResult instanceof NotFoundException);

                await module.close();
            }));
    });
    describe('leave', () => {
        it(`leave: should leave a room`, async () =>
            actAsClsUser(generateUserId(), async () => {
                const { roomService, module } = await createContext();

                const roomToLeave = await roomService.tryCreate();
                assert.ok(isRoomDto(roomToLeave));

                const roomBeforeLeave = await roomService.getById(roomToLeave.id);
                assert.ok(isRoomDto(roomBeforeLeave));

                const leaveResult = await roomService.leave(roomToLeave.id);
                assert.ok(isNil(leaveResult));

                const roomAfterLeave = await roomService.getById(roomToLeave.id);
                assert.ok(roomAfterLeave instanceof NotFoundException);

                await module.close();
            }));

        it(`cannot leave: you is not a member`, async () => {
            const { roomService, module } = await createContext();

            const roomToLeave = await actAsClsUser(generateUserId(), () => roomService.tryCreate());
            assert.ok(isRoomDto(roomToLeave));

            const leaveResult = await actAsClsUser(generateUserId(), () =>
                roomService.leave(roomToLeave.id),
            );
            assert.ok(leaveResult instanceof Error);

            await module.close();
        });

        it(`cannot leave: room not found`, async () =>
            actAsClsUser(generateUserId(), async () => {
                const { roomService, module } = await createContext();

                const leaveResult = await roomService.leave('not-found-room-id' as TRoomId);
                assert.ok(leaveResult instanceof Error);

                await module.close();
            }));
    });
    describe('rename', () => {
        it(`should rename a room`, async () =>
            actAsClsUser(generateUserId(), async () => {
                const { roomService, module } = await createContext();

                const roomToRename = await roomService.tryCreate();
                assert.ok(isRoomDto(roomToRename));

                const modifiedName = generateRoomName();
                const renameResult = await roomService.rename(roomToRename.id, modifiedName);
                assert.ok(isRoomDto(renameResult));
                assert.strictEqual(renameResult.name, modifiedName);

                await module.close();
            }));
        it(`cannot rename: permission denied`, async () => {
            const { roomService, module } = await createContext();

            const roomToRename = await actAsClsUser(generateUserId(), () =>
                roomService.tryCreate(),
            );
            assert.ok(isRoomDto(roomToRename));

            const renameResult = await actAsClsUser(generateUserId(), () =>
                roomService.rename(roomToRename.id, generateRoomName()),
            );
            assert.ok(renameResult instanceof ForbiddenException);

            await module.close();
        });
        it(`cannot rename: already taken`, async () => {
            const { roomService, module } = await createContext();

            const roomWithTakenName = await actAsClsUser(generateUserId(), () =>
                roomService.tryCreate(),
            );
            assert.ok(isRoomDto(roomWithTakenName));

            await actAsClsUser(generateUserId(), async () => {
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
