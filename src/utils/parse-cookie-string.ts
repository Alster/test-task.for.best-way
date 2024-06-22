export function parseCookieString(cookieString: string | undefined): Record<string, string> {
    if (!cookieString) {
        return {};
    }

    return cookieString.split(';').reduce((accumulator, cookie) => {
        const [key, value] = cookie.split('=');
        return { ...accumulator, [key.trim()]: value.trim() };
    }, {});
}
