import * as fs from 'node:fs';
import * as path from 'node:path';
import Handlebars from 'handlebars';
import { Logger } from '@nestjs/common';

const logger = new Logger('HBSPartialTemplateLoader');

export function loadHbsPartials(rootPath: string) {
    const files = fs.readdirSync(rootPath, {
        withFileTypes: true,
        recursive: false,
        encoding: 'utf8',
    });
    for (const file of files) {
        const filePath = path.join(file.parentPath, file.name);
        const content = fs.readFileSync(filePath, 'utf8');
        const templateName = path.basename(file.name, '.hbs');
        Handlebars.registerPartial(templateName, content);
        logger.log(`+ ${templateName}`);
    }
}
