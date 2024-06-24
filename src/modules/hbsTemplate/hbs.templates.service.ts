import { Injectable, OnModuleInit } from '@nestjs/common';
import { TemplatesEnum } from './constants/templates.enum';
import { loadHbsTemplate } from './utils/load-hbs-template';
import { THbsContextMap as THbsContextMap } from './constants/hbs-context-map';
import objectFromEntries from '../../utils/object.from-entries';
import { buildPathFromRoot } from '../../utils/build-path-from-root';
import { PARTIALS_FOLDER_NAME, TEMPLATES_FOLDER_NAME } from './constants/constants';
import { loadHbsPartials } from './utils/load-hbs-partials';
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
            throw new Error(`Templates are not loaded yet.`);
        }

        return this.templates[template](context);
    }
}
