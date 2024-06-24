import Handlebars from 'handlebars';

export function registerHbsHelpers() {
    Handlebars.registerHelper('randomHash', function () {
        return Math.random().toString(36).slice(2);
    });

    Handlebars.registerHelper('increment', function (value: string) {
        return Number.parseInt(value) + 1;
    });
}
