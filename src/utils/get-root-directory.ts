import * as process from 'node:process';

export const getRootDirectory = function (): string {
    return process.cwd();
};
