import { Module } from '@nestjs/common';

import HbsTemplatesService from './hbs.templates.service';

@Module({
    imports: [],
    controllers: [],
    providers: [HbsTemplatesService],
    exports: [HbsTemplatesService],
})
export class HbsTemplatesModule {}
