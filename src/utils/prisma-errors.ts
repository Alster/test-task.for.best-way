import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export enum PrismaErrorEnum {
    /** Unique constraint failed */
    P2002 = 'P2002',
    /** Inconsistent input data */
    P2023 = 'P2023',
}

export function isPrismaError(
    error: unknown,
    code?: PrismaErrorEnum,
): error is PrismaClientKnownRequestError {
    return error instanceof PrismaClientKnownRequestError && (!code || error.code === code);
}
