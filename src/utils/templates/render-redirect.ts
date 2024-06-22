export function renderRedirect(href: string, force: boolean = false) {
    return `
<script>
    if (${force} || window.location.pathname !== "${href}") {
        window.location.href = "${href}";
    }
</script>`;
}
