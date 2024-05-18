export const NotFound = () => {
    const imports = [];

    const template = `
    <div>
        <h1>404: Page not found</h1>
    </div>`;

    const attach = {};

    return {imports, template, attach};
}