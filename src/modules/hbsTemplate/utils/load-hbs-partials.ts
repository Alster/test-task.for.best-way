import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import Handlebars from 'handlebars';
import { Logger } from '@nestjs/common';

const logger = new Logger('HBSPartialTemplateLoader');

export async function loadHbsPartials(rootPath: string) {
    const files = await fs.readdir(rootPath, {
        withFileTypes: true,
        recursive: false,
        encoding: 'utf8',
    });
    await Promise.all(
        files.map(async (file) => {
            const filePath = path.join(file.parentPath, file.name);
            const content = await fs.readFile(filePath, 'utf8');
            const templateName = path.basename(file.name, '.hbs');
            Handlebars.registerPartial(templateName, content);
            logger.log(`+ ${templateName}`);
        }),
    );
}
