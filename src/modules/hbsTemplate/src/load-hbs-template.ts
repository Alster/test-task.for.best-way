import * as fs from 'node:fs';
import Handlebars from 'handlebars';

export async function loadHbsTemplate(filePath: string): Promise<Handlebars.TemplateDelegate> {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Cannot load HBS template at "${filePath}"`);
    }
    return Handlebars.compile(await fs.promises.readFile(filePath, 'utf8'));
}
