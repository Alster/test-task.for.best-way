import { Injectable } from '@nestjs/common';
import { TemplatesEnum } from './templates.enum';
import { loadHbsTemplate } from './src/load-hbs-template';
import { THbsContextMap as THbsContextMap } from './src/hbs-context-map';
import objectFromEntries from '../../utils/object.from-entries';
import { buildPathFromRoot } from '../../utils/build-path-from-root';
import { PARTIALS_FOLDER_NAME, TEMPLATES_FOLDER_NAME } from './src/hbs.constants';
import { loadHbsPartials } from './src/load-hbs-partials';
import { registerHbsHelpers } from './src/register-hbs-helpers';

registerHbsHelpers();
loadHbsPartials(buildPathFromRoot(TEMPLATES_FOLDER_NAME, PARTIALS_FOLDER_NAME));

@Injectable()
export default class HbsTemplatesService {
    private readonly templates: Record<TemplatesEnum, (context: object) => string> =
        objectFromEntries(
            Object.values(TemplatesEnum).map((value) => [
                value,
                loadHbsTemplate(buildPathFromRoot(TEMPLATES_FOLDER_NAME, value)),
            ]),
        );

    constructor() {}

    render<T extends TemplatesEnum, CTX extends THbsContextMap[T]>(
        template: T,
        context: CTX,
    ): string {
        return this.templates[template](context);
    }
}
