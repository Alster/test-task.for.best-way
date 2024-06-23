export function renderError(error: Error) {
    const body = error.message;
    return `<div class="notification error">${body}</div>`;
}
