export const Friends = ({locationContext}) => {
    const imports = [];

    const template = `
    <div>
        <h1 style="color: white">Friends</h1>
        <button onClick={goToLogin}>Login</button>
    </div>`;

    const attach = {
        goToLogin: () => locationContext.setPathname('/login'),
    };

    return {imports, template, attach};
}