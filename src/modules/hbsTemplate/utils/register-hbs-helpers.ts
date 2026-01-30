import Handlebars from 'handlebars';

export function registerHbsHelpers() {
    Handlebars.registerHelper('randomHash', () => Math.random().toString(36).slice(2));

    Handlebars.registerHelper('increment', (value: string) => Number.parseInt(value) + 1);
}
