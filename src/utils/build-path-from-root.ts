import * as path from 'node:path';
import { getRootDirectory } from './get-root-directory';

export const buildPathFromRoot = (...paths: string[]): string =>
    path.join(getRootDirectory(), ...paths);
