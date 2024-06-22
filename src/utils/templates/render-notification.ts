export function renderNotification(severity: 'ok' | 'error', body: string) {
    return `<div class="notification ${severity}">${body}</div>`;
}
