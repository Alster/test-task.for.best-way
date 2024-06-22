import * as fs from 'node:fs';
import Handlebars from 'handlebars';

export function loadHbsTemplate(filePath: string): Handlebars.TemplateDelegate {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Cannot load HBS template at "${filePath}"`);
    }
    return Handlebars.compile(fs.readFileSync(filePath, 'utf8'));
}
