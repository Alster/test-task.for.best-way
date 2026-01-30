export function renderRedirect(href: string, force = false) {
    return `
<script>
    if (${force} || window.location.pathname !== "${href}") {
        window.location.href = "${href}";
    }
</script>`;
}
