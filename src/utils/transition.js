export function cssTransitionInOut(nodeRef, timeout, classes, onExit) {
    setTimeout(() => {
        nodeRef.current.classList.remove(classes + '_exit-active');
        nodeRef.current.classList.add(classes + '_enter');
    }, 0);
    setTimeout(() => {
        nodeRef.current.classList.remove(classes + '_enter');
        nodeRef.current.classList.add(classes + '_enter-active');
    }, 30);
    setTimeout(() => {
        nodeRef.current.classList.remove(classes + '_enter-active');
        nodeRef.current.classList.add(classes + '_exit');
    }, timeout + 30);
    setTimeout(() => {
        nodeRef.current.classList.remove(classes + '_exit');
        nodeRef.current.classList.add(classes + '_exit-active');
        onExit?.();
    }, timeout + 30);
}