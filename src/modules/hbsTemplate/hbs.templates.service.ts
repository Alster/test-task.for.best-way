import { Injectable, OnModuleInit } from '@nestjs/common';

import { buildPathFromRoot } from '../../utils/build-path-from-root';
import objectFromEntries from '../../utils/object.from-entries';
import { PARTIALS_FOLDER_NAME, TEMPLATES_FOLDER_NAME } from './constants/constants';
import { THbsContextMap } from './constants/hbs-context-map';
import { TemplatesEnum } from './constants/templates.enum';
import { loadHbsPartials } from './utils/load-hbs-partials';
import { loadHbsTemplate } from './utils/load-hbs-template';
import { registerHbsHelpers } from './utils/register-hbs-helpers';

@Injectable()
export default class HbsTemplatesService implements OnModuleInit {
    private templates: Record<TemplatesEnum, (context: object) => string> | null;

    constructor() {}

    async onModuleInit() {
        registerHbsHelpers();

        await loadHbsPartials(buildPathFromRoot(TEMPLATES_FOLDER_NAME, PARTIALS_FOLDER_NAME));

        this.templates = objectFromEntries(
            await Promise.all(
                Object.values(TemplatesEnum).map(async (value) => [
                    value,
                    await loadHbsTemplate(buildPathFromRoot(TEMPLATES_FOLDER_NAME, value)),
                ]),
            ),
        );
    }

    render<T extends TemplatesEnum, CTX extends THbsContextMap[T]>(
        template: T,
        context: CTX,
    ): string {
        if (!this.templates) {
            throw new Error('Templates are not loaded yet.');
        }

        return this.templates[template](context);
    }
}
